/**
 * Capitalize the first letter of each word and lowercase the rest — for
 * displaying names and short titles that may have been entered in any case
 * ("evANGELINE kidd" → "Evangeline Kidd"). Hyphens and apostrophes count as
 * word boundaries so "mary-jane o'neil" → "Mary-Jane O'Neil".
 *
 * Deliberately simple: it does not preserve intentional mixed case (McDonald,
 * iOS), so use it for person names and plain titles, not arbitrary proper
 * nouns.
 */
export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(
      /(^|[\s'-])([a-z])/g,
      (_match, boundary: string, letter: string) =>
        boundary === undefined ? letter : boundary + letter.toUpperCase(),
    );
}
