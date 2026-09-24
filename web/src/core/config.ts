export function normalizeLandingUrl(raw?: string): string {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return 'https://cuan.fiqri.dev';
  }
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, '');
}

export const LANDING_BASE_URL = normalizeLandingUrl(
  import.meta.env.VITE_LANDING_URL ||
    import.meta.env.VITE_LANDING_DOMAIN ||
    import.meta.env.VITE_DOMAIN,
);

export const PRIVACY_URL = `${LANDING_BASE_URL}/privacy`;
export const TERMS_URL = `${LANDING_BASE_URL}/terms`;
