import { useEffect, useState } from 'react';
import './NewsPanel.css';

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  sourceIcon: string;
  publishedAt: string;
}

type Theme = 'gta4' | 'gta6';
type Language = 'fr' | 'en';

const copy = {
  fr: {
    title: 'ACTUS', enabled: 'Alertes actualités', sound: 'Son des alertes', preview: 'Aperçu', previewLabel: 'Notification exemple',
    refresh: 'Actualiser', loading: 'Mise à jour...', empty: 'Aucune actualité reçue.',
    disabled: 'Les alertes sont désactivées.', error: 'Impossible de charger les actualités.',
    cadence: 'Recherche toutes les 15 min. Le son suit le mode muet. L’aperçu permet de tester le son.',
    open: 'Ouvrir l’article', latest: 'Dernières actualités', sourceFallback: 'Source inconnue'
  },
  en: {
    title: 'NEWS', enabled: 'News alerts', sound: 'Alert sound', preview: 'Preview', previewLabel: 'Example notification',
    refresh: 'Refresh', loading: 'Updating...', empty: 'No news received.',
    disabled: 'News alerts are off.', error: 'Could not load news.',
    cadence: 'Checks every 15 min. Alerts follow mute. Preview lets you test the sound.',
    open: 'Open article', latest: 'Latest news', sourceFallback: 'Unknown source'
  }
} as const;

const formatDate = (value: string, language: Language) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

const SourceIcon = ({ item, compact = false }: { item: NewsItem; compact?: boolean }) => {
  const [failed, setFailed] = useState(!item.sourceIcon);
  useEffect(() => setFailed(!item.sourceIcon), [item.sourceIcon]);
  const initials = item.source.trim().slice(0, 1).toUpperCase() || 'N';
  return (
    <span className={`rr-news-source-icon${compact ? ' rr-news-source-icon--compact' : ''}`} aria-hidden="true">
      {!failed && <img src={item.sourceIcon} alt="" onError={() => setFailed(true)} />}
      {failed && <span>{initials}</span>}
    </span>
  );
};

export const NewsToast = ({ item, theme, language }: { item: NewsItem; theme: Theme; language: Language }) => {
  const t = copy[language];
  return (
    <aside className={`rr-news-toast rr-news-toast--${theme}`} role="status" aria-live="polite" aria-label={`${t.title}: ${item.title}`}>
      <span className="rr-news-toast-marker" aria-hidden="true" />
      <SourceIcon item={item} />
      <div className="rr-news-toast-copy">
        <span className="rr-news-toast-kicker">{t.title} · {item.source || t.sourceFallback}</span>
        <strong>{item.title}</strong>
      </div>
    </aside>
  );
};

interface NewsPanelProps {
  items: NewsItem[];
  error: string | null;
  loading: boolean;
  enabled: boolean;
  soundEnabled: boolean;
  language: Language;
  onEnabledChange: (enabled: boolean) => void;
  onSoundChange: (enabled: boolean) => void;
  onRefresh: () => void;
  onPreview: () => void;
  onOpenArticle: (item: NewsItem) => void;
}

const Toggle = ({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) => (
  <button className="rr-news-toggle" type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}>
    <span className="rr-news-toggle-label">{label}</span>
    <span className="rr-news-toggle-track" aria-hidden="true"><span /></span>
  </button>
);

export const NewsPanel = ({
  items, error, loading, enabled, soundEnabled, language, onEnabledChange, onSoundChange, onRefresh, onPreview, onOpenArticle
}: NewsPanelProps) => {
  const t = copy[language];
  const visibleItems = items.slice(0, 12);
  return (
    <section className="rr-news-panel" aria-labelledby="rr-news-title">
      <header className="rr-news-panel-header">
        <div><span className="rr-news-panel-dot" aria-hidden="true" /><h3 id="rr-news-title">{t.title}</h3></div>
        <button type="button" className="rr-news-action" onClick={onRefresh} disabled={loading || !enabled} aria-label={t.refresh}>
          <span aria-hidden="true">↻</span> {loading ? t.loading : t.refresh}
        </button>
      </header>

      <p className="rr-news-help">{t.cadence}</p>
      <div className="rr-news-controls">
        <Toggle checked={enabled} label={t.enabled} onChange={onEnabledChange} />
        <Toggle checked={soundEnabled} label={t.sound} onChange={onSoundChange} />
      </div>
      <button type="button" className="rr-news-preview" onClick={onPreview} disabled={!enabled}>
        <span aria-hidden="true">▣</span> {t.preview} <small>{t.previewLabel}</small>
      </button>

      <div className="rr-news-list-heading">{t.latest}</div>
      {error ? <p className="rr-news-state rr-news-state--error">{error || t.error}</p> : null}
      {!error && !loading && !visibleItems.length ? <p className="rr-news-state">{enabled ? t.empty : t.disabled}</p> : null}
      {loading && !visibleItems.length ? <p className="rr-news-state">{t.loading}</p> : null}
      <ol className="rr-news-list" aria-label={t.latest}>
        {visibleItems.map((item) => (
          <li key={item.id}>
            <button type="button" className="rr-news-article" onClick={() => onOpenArticle(item)} aria-label={`${t.open}: ${item.title}`}>
              <SourceIcon item={item} compact />
              <span className="rr-news-article-copy"><strong>{item.title}</strong><small>{item.source || t.sourceFallback} · {formatDate(item.publishedAt, language)}</small></span>
              <span className="rr-news-open-mark" aria-hidden="true">↗</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
};
