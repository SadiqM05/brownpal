/** Turns an unknown thrown value into a message that is safe to show to an RA. */
export function describeError(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.";
}
