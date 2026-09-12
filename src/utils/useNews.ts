import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { isTauri } from './tauriBridge';
import { fetchNews, loadSeenNews, NEWS_INTERVAL, openNewsArticle, saveSeenNews, selectNewsAlert } from '../services/news';
import { playNewsSound } from '../audio/newsSound';
import type { NewsItem } from '../components/NewsPanel';
import type { AppSettings } from '../types/settings';

export function useNews(settings: AppSettings, muted: boolean, onboarding: boolean) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<NewsItem | null>(null);
  const seen = useRef(loadSeenNews());
  const busy = useRef(false);
  const mounted = useRef(false);
  const generation = useRef(0);
  const current = useRef({ settings, muted, onboarding });
  current.current = { settings, muted, onboarding };
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((item: NewsItem, preview = false) => {
    const state = current.current;
    if (state.onboarding || (!preview && !state.settings.news.enabled)) return;
    clearTimeout(timer.current);
    setAlert(item);
    timer.current = setTimeout(() => setAlert(null), 8000);
    if (state.settings.news.soundEnabled && (preview || !state.muted)) {
      void playNewsSound(state.settings.overlay.theme, state.settings.audio.sfxVolume / 100)
        .catch(() => setError(state.settings.language === 'fr' ? 'Le son de notification est indisponible.' : 'Notification sound is unavailable.'));
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!mounted.current || busy.current || !current.current.settings.news.enabled || current.current.onboarding) return;
    busy.current = true;
    const request = generation.current;
    setLoading(true);
    try {
      const result = await fetchNews();
      if (request !== generation.current) return;
      setItems(result);
      setError(null);
      const next = selectNewsAlert(result, seen.current);
      seen.current = saveSeenNews(result, seen.current);
      if (next) show(next);
    } catch (cause) {
      if (request !== generation.current) return;
      console.warn('News refresh failed:', cause);
      setError(current.current.settings.language === 'fr'
        ? 'Actualités indisponibles. Réessayez plus tard.'
        : 'News is unavailable. Try again later.');
    } finally {
      busy.current = false;
      if (mounted.current) {
        setLoading(false);
        if (request !== generation.current) void refresh();
      }
    }
  }, [show]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!settings.news.enabled || onboarding) { setAlert(null); return; }
    void refresh();
    const poll = setInterval(() => void refresh(), NEWS_INTERVAL);
    return () => { generation.current++; clearInterval(poll); };
  }, [settings.news.enabled, onboarding, refresh]);

  useEffect(() => () => { clearTimeout(timer.current); }, []);

  useEffect(() => {
    if (!isTauri()) return;
    void invoke('set_news_alert', { payload: alert ? {
      item: alert, theme: settings.overlay.theme, language: settings.language
    } : null }).catch(cause => { console.warn('News window failed:', cause); setError('News window is unavailable.'); });
  }, [alert, settings.overlay.theme, settings.language]);

  const preview = () => show({
    id: 'preview', source: 'RRadio', sourceIcon: '', url: '', publishedAt: new Date().toISOString(),
    title: settings.language === 'fr' ? 'Aperçu · Vos actualités GTA, Red Dead et Rockstar.' : 'Preview · Your GTA, Red Dead and Rockstar news.'
  }, true);

  return { items, error, loading, alert, refresh, preview, openArticle: (item: NewsItem) => {
    void openNewsArticle(item).catch(cause => {
      console.warn('Could not open news article:', cause);
      setError(current.current.settings.language === 'fr' ? 'Impossible d’ouvrir cet article.' : 'Could not open this article.');
    });
  } };
}
