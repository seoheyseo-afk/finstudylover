import type { ParsedOutlineRow } from "../types";

function cleanTitle(line: string) {
  return line
    .trim()
    .replace(/^\d{1,3}\s*[.)]\s*/, "")
    .replace(/^제\s*\d{1,3}\s*장\s*/i, "")
    .replace(/^chapter\s*\d{1,3}\s*/i, "")
    .replace(/^\d{1,3}\s*강\s*/, "")
    .trim();
}

export function parseOutline(input: string): ParsedOutlineRow[] {
  const rows: ParsedOutlineRow[] = [];
  let currentGroup: string | undefined;

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const groupMatch = line.match(/^\[(.+)]$/);
    if (groupMatch) {
      currentGroup = groupMatch[1].trim();
      continue;
    }

    const title = cleanTitle(line);
    if (!title) continue;
    rows.push({ group: currentGroup, title });
  }

  return rows;
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatOrder(order: number, title: string) {
  return `${String(order).padStart(2, "0")}. ${title}`;
}
