import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { NewsToast, type NewsItem } from './NewsPanel';

interface AlertPayload { item: NewsItem; theme: 'gta4' | 'gta6'; language: 'fr' | 'en' }

export function NewsWindow() {
  const [payload, setPayload] = useState<AlertPayload | null>(null);
  useEffect(() => {
    document.title = 'RRadio News';
    let disposed = false;
    let unlisten: (() => void) | undefined;
    let revision = 0;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const sync = async () => {
      const request = ++revision;
      try {
        const next = await invoke<AlertPayload | null>('get_news_alert');
        if (!disposed && request === revision) { clearTimeout(retry); setPayload(next); }
      } catch (error) {
        if (disposed || request !== revision) return;
        console.error('Could not read news alert:', error);
        clearTimeout(retry);
        retry = setTimeout(() => { void sync(); }, 2000);
      }
    };
    const connect = async () => {
      try {
        const stop = await listen('news-alert-changed', () => { void sync(); });
        const stopSafely = () => { void Promise.resolve(stop()).catch(error => console.error('Could not release news listener:', error)); };
        if (disposed) stopSafely();
        else { unlisten = stopSafely; void sync(); }
      } catch (error) {
        if (disposed) return;
        console.error('Could not listen for news alerts:', error);
        retry = setTimeout(() => { void connect(); }, 2000);
      }
    };
    void connect();
    return () => { disposed = true; clearTimeout(retry); unlisten?.(); };
  }, []);
  useEffect(() => { void invoke('sync_news_window').catch(console.error); }, [payload]);
  return payload ? <div data-theme={payload.theme}><NewsToast {...payload} /></div> : null;
}
