/** GraphQL errors as Amplify Data reports them. */
type DataErrors = ReadonlyArray<{ message: string }>;

/** One page of an Amplify Data list query. */
interface Page<T> {
  data: T[];
  nextToken?: string | null;
  errors?: DataErrors;
}

/** The result of an Amplify Data create, update or delete. */
interface Result<T> {
  data: T | null;
  errors?: DataErrors;
}

/** An Amplify Data live query, such as client.models.Post.onCreate(). */
interface LiveQuery<T> {
  subscribe(observer: { next: (value: T) => void; error: (error: unknown) => void }): { unsubscribe: () => void };
}

/** Throws one Error when an Amplify Data response carries GraphQL errors. */
export function assertNoErrors(errors?: DataErrors): void {
  if (errors && errors.length > 0) {
    throw new Error(errors.map((error) => error.message).join("; "));
  }
}

/** Reads every page of a list query. */
export async function collectPages<T>(fetchPage: (nextToken?: string) => Promise<Page<T>>): Promise<T[]> {
  const items: T[] = [];
  let nextToken: string | null | undefined;
  do {
    const page = await fetchPage(nextToken ?? undefined);
    assertNoErrors(page.errors);
    items.push(...page.data);
    nextToken = page.nextToken;
  } while (nextToken);
  return items;
}

/** Returns the record of a mutation, throwing on GraphQL errors or when no record came back. */
export function unwrap<T>({ data, errors }: Result<T>, failureMessage: string): T {
  assertNoErrors(errors);
  if (!data) throw new Error(failureMessage);
  return data;
}

/** Starts a live query. Returns a function that stops it. */
export function listen<T>(query: LiveQuery<T>, next: (value: T) => void, onError: (error: unknown) => void): () => void {
  const subscription = query.subscribe({ next, error: onError });
  return () => subscription.unsubscribe();
}

/** Combines several stop functions into one. */
export function stopAll(...stops: ReadonlyArray<() => void>): () => void {
  return () => stops.forEach((stop) => stop());
}
