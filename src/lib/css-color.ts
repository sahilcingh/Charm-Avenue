/**
 * Resolves a free-text variant color (e.g. "Red", "hotpink", "#E8828F") to a CSS color the
 * browser can actually render, falling back when it isn't valid CSS (e.g. "Rose Gold" — two
 * words aren't a real color keyword). Validated the same way in tests and in the browser: assign
 * it to a real element's `color` and see whether the CSS engine accepted it.
 */
export function resolveCssColor(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  if (typeof document === 'undefined') return fallback;

  const probe = document.createElement('div');
  probe.style.color = '';
  probe.style.color = value;
  return probe.style.color ? value : fallback;
}
