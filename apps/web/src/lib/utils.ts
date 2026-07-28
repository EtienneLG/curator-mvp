/**
 * General-purpose utility helpers shared across the app. Keep this file
 * framework-agnostic — no React imports here.
 */

/**
 * Cosmetic, client-side-only check for whether `content` looks like an
 * absolute http(s) URL, so the Inbox/Library card can auto-linkify it for
 * display. This has no stored field and no business meaning — the backend
 * is not re-detecting or persisting anything based on this (docs/PROJECT.md
 * → Inbox feature description, DEC-016).
 */
export function isUrlLike(content: string): boolean {
  try {
    const url = new URL(content);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
