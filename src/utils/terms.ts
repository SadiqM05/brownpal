import { FIRST_TERM } from "./forum-constants";

/**
 * Academic terms, stored on posts and comments as "YEAR-N" where N is 1 (Spring), 2 (Summer) or
 * 3 (Fall), so term keys sort chronologically as plain strings.
 */
const TERMS: ReadonlyArray<{ number: number; label: string; startMonth: number }> = [
  { number: 1, label: "Spring", startMonth: 0 },
  { number: 2, label: "Summer", startMonth: 5 },
  { number: 3, label: "Fall", startMonth: 7 },
];

/** The term a date falls in, such as "2026-3" for October 2026. */
export function termOf(date: Date): string {
  const month = date.getMonth();
  const term = [...TERMS].reverse().find(({ startMonth }) => month >= startMonth) ?? TERMS[0];
  return `${date.getFullYear()}-${term.number}`;
}

/** Display name of a term key, such as "Fall 2026". */
export function termLabel(term: string): string {
  const [year, number] = term.split("-").map(Number);
  const label = TERMS.find((candidate) => candidate.number === number)?.label ?? "Term";
  return `${label} ${year}`;
}

/** Every term from the given one back to the first term ResLink was used, newest first. */
export function termsThrough(latest: string): string[] {
  const terms: string[] = [];
  let [year, number] = latest.split("-").map(Number);
  while (`${year}-${number}` >= FIRST_TERM) {
    terms.push(`${year}-${number}`);
    number -= 1;
    if (number < 1) {
      number = TERMS.length;
      year -= 1;
    }
  }
  return terms;
}
