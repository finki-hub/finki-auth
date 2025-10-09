export const buildCookieHeader = (
  cookies: Array<{ key: string; value: string }>,
) => cookies.map(({ key, value }) => `${key}=${value}`).join('; ');
