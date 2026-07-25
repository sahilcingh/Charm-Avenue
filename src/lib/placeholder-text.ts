// Some catalog data was entered before real copy was ready, using literal placeholder
// strings ("N/A", "Na", "-") instead of leaving the field empty. Rendered verbatim on the
// product page these read as broken content rather than "nothing to show here yet".
const PLACEHOLDER_PATTERN = /^(n\/?a|none|null|undefined|-|tbd|todo)$/i;

export function isPlaceholderText(value: string | null | undefined): boolean {
  const trimmed = value?.trim() ?? '';
  return trimmed.length === 0 || PLACEHOLDER_PATTERN.test(trimmed);
}
