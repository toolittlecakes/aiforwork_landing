import { mkdir } from "node:fs/promises";
import { join } from "node:path";

type PaidOrder = {
  id: string;
  projectId: string;
  status: string;
  paidAt?: string;
  amountMinor: number;
  currency: string;
  metadata: Record<string, string>;
};

export function conversionRows(orders: PaidOrder[], uploaded: string[]) {
  return orders.filter((order) =>
    order.projectId === "aiforwork" && order.status === "paid" &&
    order.metadata.experiment === "intro_video_v1" && !uploaded.includes(order.id),
  ).map((order) => {
    const { metrikaClientId, variant } = order.metadata;
    const timestamp = Date.parse(order.paidAt ?? "");
    if (!/^\d+$/.test(metrikaClientId ?? "") ||
        !["with_video", "without_video"].includes(variant) || !Number.isFinite(timestamp) ||
        !Number.isInteger(order.amountMinor) || order.amountMinor <= 0 || order.currency !== "RUB") {
      throw new Error(`Invalid experiment payment: ${order.id}`);
    }
    return {
      orderId: order.id,
      row: `${metrikaClientId},aiforwork_order_paid,${Math.floor(timestamp / 1000)},${(order.amountMinor / 100).toFixed(2)},RUB`,
    };
  });
}

if (import.meta.main) {
  const [command, uploadId] = Bun.argv.slice(2);
  if (!["prepare", "ack"].includes(command)) throw new Error("Usage: bun run scripts/export-experiment-payments.ts prepare | ack <Metrica upload ID>");
  const directory = join(import.meta.dir, "../tmp/intro-video-conversions");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const ledger = Bun.file(join(directory, "uploaded.json"));
  const history: { uploadId: string; orderIds: string[] }[] = await ledger.exists() ? await ledger.json() : [];
  const pending = Bun.file(join(directory, "pending.json"));
  if (command === "ack") {
    if (!uploadId || !/^\d+$/.test(uploadId)) throw new Error("Supply the successful Metrica upload ID, after checking processing status");
    const batch: { orderIds: string[] } = await pending.json();
    if (!batch.orderIds.length) throw new Error("Empty batch");
    await Bun.write(ledger, JSON.stringify([...history, { uploadId, orderIds: batch.orderIds }], null, 2));
    await pending.delete();
    console.log(`Acknowledged ${batch.orderIds.length} orders for upload ${uploadId}`);
  } else {
    if (await pending.exists()) throw new Error("A pending batch already exists. Upload its CSV and acknowledge it before preparing another batch.");
    const remote = `const r=await fetch("http://127.0.0.1:8710/ops/orders",{headers:{Authorization:"Bearer "+process.env.OPS_TOKEN},signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error("ops status "+r.status);const data=await r.json();console.log(JSON.stringify(data.orders.map(({id,projectId,status,paidAt,amountMinor,currency,metadata})=>({id,projectId,status,paidAt,amountMinor,currency,metadata}))));`;
    const quoted = "'" + remote.replaceAll("'", "'\\''") + "'";
    const process = Bun.spawn(["ssh", "-o", "ConnectTimeout=10", "racknerd-2", `cd ~/apps/payment-service && docker compose exec -T app bun -e ${quoted}`], { stdout: "pipe", stderr: "inherit" });
    const body = await new Response(process.stdout).text();
    if (await process.exited !== 0) throw new Error("Production order export failed");
    const orders: PaidOrder[] = JSON.parse(body);
    if (!Array.isArray(orders)) throw new Error("Invalid orders response");
    const rows = conversionRows(orders, history.flatMap((batch) => batch.orderIds));
    if (!rows.length) {
      console.log("No new confirmed experiment payments. No upload needed.");
    } else {
      const csv = join(directory, "pending.csv");
      await Bun.write(csv, "ClientID,Target,DateTime,Price,Currency\n" + rows.map(({ row }) => row).join("\n") + "\n");
      await Bun.write(pending, JSON.stringify({ orderIds: rows.map(({ orderId }) => orderId) }, null, 2));
      console.log(`Prepared ${rows.length} confirmed payments: ${csv}`);
    }
  }
}
