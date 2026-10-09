import type { BusinessHours } from "@/lib/validation/settings";

const dayLabels: Array<[keyof BusinessHours, string]> = [
  ["monday", "Monday"],
  ["tuesday", "Tuesday"],
  ["wednesday", "Wednesday"],
  ["thursday", "Thursday"],
  ["friday", "Friday"],
  ["saturday", "Saturday"],
  ["sunday", "Sunday"],
];

export function formatBusinessHours(hours: BusinessHours | null): Array<{ day: string; value: string }> {
  if (!hours) return [];
  return dayLabels.map(([key, label]) => {
    const entry = hours[key];
    return { day: label, value: entry.closed ? "Closed" : `${entry.open}–${entry.close}` };
  });
}
