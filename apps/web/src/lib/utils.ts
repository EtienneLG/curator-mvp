// Cosmetic client-side check only — nothing is stored or sent to the backend based on this.
export function isUrlLike(content: string): boolean {
  try {
    const url = new URL(content);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
