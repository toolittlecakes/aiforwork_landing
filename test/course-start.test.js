import { expect, test } from "bun:test";
import { nextCourseStart } from "../assets/course-start.js";

const cases = [
  ["Tuesday", "2026-10-13T12:00:00Z", "2026-10-14"],
  ["Wednesday", "2026-10-14T12:00:00Z", "2026-10-21"],
  ["Thursday", "2026-10-15T12:00:00Z", "2026-10-21"],
  ["before Moscow midnight in a US client", "2026-10-13T13:59:59-07:00", "2026-10-14"],
  ["at Moscow midnight in a US client", "2026-10-13T14:00:00-07:00", "2026-10-21"],
  ["before Thursday in Moscow", "2026-10-14T20:59:59Z", "2026-10-21"],
  ["Thursday midnight in Moscow", "2026-10-14T21:00:00Z", "2026-10-21"],
  ["month boundary", "2026-03-31T12:00:00Z", "2026-04-01"],
  ["Wednesday at month boundary", "2026-04-01T12:00:00Z", "2026-04-08"],
  ["Wednesday at year boundary", "2025-12-31T12:00:00Z", "2026-01-07"],
  ["Thursday at year boundary", "2026-12-31T12:00:00Z", "2027-01-06"],
];

for (const [label, input, expected] of cases) {
  test(`${label} selects Wednesday strictly after the Moscow activation date`, () => {
    const now = new Date(input);
    const timestamp = now.getTime();
    expect(nextCourseStart(now).toISOString()).toBe(`${expected}T00:00:00.000Z`);
    expect(now.getTime()).toBe(timestamp);
  });
}
