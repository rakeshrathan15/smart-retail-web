/** Only in-site paths, never another website or the sign-in pages. */
export function safeFrom(from: string | null): string {
  if (!from || !from.startsWith('/') || from.startsWith('//')) return '/'
  if (from.startsWith('/login') || from.startsWith('/register')) return '/'
  return from
}
