export function localEmailMode() {
  if (process.env.NODE_ENV !== "development" || process.env.LEAD_EMAIL_MODE !== "local") return false;
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || "");
    return url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
      (process.env.LOCAL_EMAIL_PREVIEW_TOKEN?.length || 0) >= 32;
  } catch { return false; }
}
