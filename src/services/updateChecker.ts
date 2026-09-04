export const RELEASES_URL = 'https://github.com/SofianeBel/RRadio/releases';
export const LATEST_API_URL = 'https://api.github.com/repos/SofianeBel/RRadio/releases/latest';

export type UpdateState = {
  status: 'disabled' | 'checking' | 'current' | 'available' | 'error';
  latestVersion: string | null;
  url: string;
};

export function compareVersions(a: string, b: string): number {
  const norm = (v: string) => v.trim().replace(/^v/i, '').split('.');
  const pa = norm(a);
  const pb = norm(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = parseInt(pa[i] ?? '0', 10);
    const nb = parseInt(pb[i] ?? '0', 10);
    const va = Number.isNaN(na) ? 0 : na;
    const vb = Number.isNaN(nb) ? 0 : nb;
    if (va !== vb) return va > vb ? 1 : -1;
  }
  return 0;
}

export async function fetchLatestRelease(signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(LATEST_API_URL, {
      headers: { Accept: 'application/vnd.github+json' },
      signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { tag_name?: unknown };
    return typeof data.tag_name === 'string' && data.tag_name.length > 0 ? data.tag_name : null;
  } catch {
    return null;
  }
}

export async function checkForUpdates(
  currentVersion: string,
  enabled: boolean,
  signal?: AbortSignal
): Promise<UpdateState> {
  if (!enabled) {
    return { status: 'disabled', latestVersion: null, url: RELEASES_URL };
  }
  const latest = await fetchLatestRelease(signal);
  if (!latest) {
    return { status: 'error', latestVersion: null, url: RELEASES_URL };
  }
  if (compareVersions(latest, currentVersion) > 0) {
    return { status: 'available', latestVersion: latest, url: RELEASES_URL };
  }
  return { status: 'current', latestVersion: latest, url: RELEASES_URL };
}
