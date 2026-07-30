/** Client-side environment helpers */
export function isDemoLoginAllowed(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_ALLOW_DEMO_LOGIN === 'true';
}
