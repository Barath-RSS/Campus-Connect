import { supabase } from '@/integrations/supabase/client';

export const ISSUE_IMAGES_BUCKET = 'issue-images';

/**
 * Extract the storage object path from either a stored public URL (legacy
 * records) or a bare path (new records). Handles both formats so we can roll
 * out private bucket + signed URLs without a data migration.
 */
export function extractStoragePath(urlOrPath: string | null | undefined): string | null {
  if (!urlOrPath) return null;
  const value = urlOrPath.trim();
  if (!value) return null;

  // Already a bare path (no protocol, no slashes prefix)
  if (!value.includes('://')) {
    // Strip a leading bucket prefix if present, e.g. "issue-images/abc.jpg"
    const prefix = `${ISSUE_IMAGES_BUCKET}/`;
    return value.startsWith(prefix) ? value.slice(prefix.length) : value;
  }

  // Try to find ".../object/public/<bucket>/<path>" or ".../object/sign/<bucket>/<path>"
  const match = value.match(/\/object\/(?:public|sign|authenticated)\/[^/]+\/(.+?)(?:\?.*)?$/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }

  // Fallback: last segment of pathname (best-effort)
  try {
    const u = new URL(value);
    const parts = u.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();
const SIGNED_URL_TTL_SECONDS = 3600;

/**
 * Returns a short-lived signed URL for an issue image. Accepts either a stored
 * public URL or a bare path. Cached in-memory for the lifetime of the page.
 */
export async function getSignedIssueImageUrl(urlOrPath: string | null | undefined): Promise<string | null> {
  const path = extractStoragePath(urlOrPath);
  if (!path) return null;

  const cached = signedUrlCache.get(path);
  const now = Date.now();
  if (cached && cached.expiresAt > now + 60_000) {
    return cached.url;
  }

  const { data, error } = await supabase.storage
    .from(ISSUE_IMAGES_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    console.error('Failed to sign image URL', error);
    return null;
  }

  signedUrlCache.set(path, {
    url: data.signedUrl,
    expiresAt: now + SIGNED_URL_TTL_SECONDS * 1000,
  });

  return data.signedUrl;
}
