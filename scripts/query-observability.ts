const [sql, hoursInput = "24"] = process.argv.slice(2);
const hours = Number(hoursInput);
if (!sql || !/^\s*(SELECT|WITH)\b/i.test(sql) || !Number.isFinite(hours) || hours <= 0 || hours > 168) {
  throw new Error("Usage: bun scripts/query-observability.ts '<SELECT SQL>' [hours: 0–168]");
}
const payload = Buffer.from(JSON.stringify({
  query: { sql, from: 0, size: 200 },
  timeout: 20,
})).toString("base64");
const script = `set -euo pipefail
cd ~/apps/openobserve
set -a
. ./.env
set +a
end=$(date +%s%6N)
start=$((end - ${Math.round(hours * 3600 * 1000000)}))
payload=$(printf '%s' '${payload}' | base64 -d | jq --argjson fromTime "$start" --argjson toTime "$end" '.query.start_time=$fromTime | .query.end_time=$toTime')
printf 'user = "%s:%s"\\n' "$ZO_ROOT_USER_EMAIL" "$ZO_ROOT_USER_PASSWORD" | curl --config - --fail-with-body --silent --show-error --max-time 25 -H 'Content-Type: application/json' --data-binary "$payload" 'http://127.0.0.1:5080/api/default/_search?type=logs'
`;
const child = Bun.spawn(["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=10", "racknerd-2", "bash", "-s"], {
  stdin: "pipe", stdout: "inherit", stderr: "inherit", timeout: 35000,
});
child.stdin.write(script);
child.stdin.end();
process.exit(await child.exited);
