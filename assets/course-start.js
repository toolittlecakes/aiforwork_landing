export function nextCourseStart(now) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const value = (type) => Number(parts.find((part) => part.type === type).value);
  const start = new Date(Date.UTC(value("year"), value("month") - 1, value("day")));
  const daysUntilWednesday = (3 - start.getUTCDay() + 7) % 7 || 7;
  start.setUTCDate(start.getUTCDate() + daysUntilWednesday);
  return start;
}
