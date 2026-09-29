/**
 * `Object.entries` for a `Record` whose keys are a string-literal union.
 *
 * The built-in signature widens keys to `string`, which is why every label map
 * in this codebase was being read back through an `as [Key, string][]` cast
 * just to build a list of options. This keeps the key type instead.
 *
 * Sound for the maps it is used on — `Record<K, V>` object literals written in
 * this repo, which have exactly the keys their type declares. It would be a lie
 * for a value that merely *satisfies* the record (an API response could carry
 * extra keys), so it is for our own constants only.
 */
export function entriesOf<K extends string, V>(record: Record<K, V>): [K, V][] {
  return Object.entries(record) as [K, V][];
}
