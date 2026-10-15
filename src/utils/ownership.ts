/**
 * The user id of whoever created a record. The backend stamps the owner field from the creator's
 * token as "<sub>::<username>"; the sub is the same id getCurrentUser() returns as userId.
 */
export function authorIdOf(record: { owner?: string | null }): string {
  return record.owner?.split("::")[0] ?? "";
}

/** True when the given RA created the record. */
export function isOwnedBy(record: { owner?: string | null }, userId: string): boolean {
  return authorIdOf(record) === userId;
}
