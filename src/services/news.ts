import { invoke } from '@tauri-apps/api/core';
import { isTauri } from '../utils/tauriBridge';
import type { NewsItem } from '../components/NewsPanel';

export const NEWS_INTERVAL = 15 * 60 * 1000;
const SEEN_KEY = 'rradio_news_seen_v1';

export async function fetchNews(): Promise<NewsItem[]> {
  if (!isTauri()) throw new Error('News is available in the desktop app.');
  return invoke<NewsItem[]>('fetch_rockstar_news');
}

// Keep a bounded seen list across launches. First use shows only the newest item.
export function selectNewsAlert(items: NewsItem[], seen: string[] | null): NewsItem | null {
  return items.find(item => !seen?.includes(item.id)) ?? null;
}

export function loadSeenNews(): string[] | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SEEN_KEY) ?? 'null');
    return Array.isArray(value) && value.every(id => typeof id === 'string') ? value.slice(0, 200) : null;
  } catch { return null; }
}

export function saveSeenNews(items: NewsItem[], seen: string[] | null): string[] {
  const ids = [...new Set([...items.map(item => item.id), ...(seen ?? [])])].slice(0, 200);
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(ids)); }
  catch (error) { console.warn('Could not save news history:', error); }
  return ids;
}

export async function openNewsArticle(item: NewsItem): Promise<void> {
  if (isTauri()) await invoke('open_news_article', { url: item.url });
  else if (item.url.startsWith('https://')) window.open(item.url, '_blank', 'noopener,noreferrer');
}
