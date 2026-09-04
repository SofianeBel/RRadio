import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';
import { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET } from '../config/googleOAuth';
import { STATION_LOGOS, GTA6_COVER_ART } from '../data/stations';
import {
  Tv,
  Sliders,
  Volume2,
  Radio,
  Clock,
  Sparkles,
  Layers,
  Gamepad2,
  Folder,
  HardDrive,
  Check,
  ChevronDown,
  X,
  RotateCcw,
  Youtube,
  Play,
  Globe,
  ExternalLink,
  Unlink,
  LogIn,
  LogOut,
  CheckCircle2,
  KeyRound,
  AlertCircle,
  Copy,
  Github,
  MessageSquare,
  Share2,
  Music
} from 'lucide-react';

const DiscordLogo: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);
import { startNativeGoogleOAuth, cancelNativeGoogleOAuth, listenToOAuthEvents } from '../utils/tauriBridge';
import { soundEngine } from '../audio/soundEngine';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

type TabType = 'audio' | 'overlay' | 'controls' | 'discord' | 'services' | 'library';

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('audio');
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  // Listen for Google OAuth callback from Rust loopback server
  React.useEffect(() => {
    let unlisten: (() => void) | null = null;
    listenToOAuthEvents(
      (data) => {
        setOauthLoading(false);
        setOauthError(null);
        soundEngine.playMechanicalClick();
        onUpdateSettings({
          ...settings,
          services: {
            ...settings.services,
            youtubeMusic: {
              ...settings.services.youtubeMusic,
              connected: true,
              clientId: GOOGLE_OAUTH_CLIENT_ID.trim(),
              clientSecret: GOOGLE_OAUTH_CLIENT_SECRET.trim(),
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              tokenExpiresAt: data.expiresAt,
              userName: data.userName || 'Compte Google',
              userEmail: data.userEmail || '',
              userAvatar: data.userAvatar || ''
            }
          }
        });
      },
      (err) => {
        setOauthLoading(false);
        setOauthError(err);
      },
      () => {
        setOauthLoading(false);
        setOauthError("Connexion annulée.");
      }
    ).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, [settings, onUpdateSettings]);

  const handleStartGoogleOAuth = async () => {
    soundEngine.playMechanicalClick();
    setOauthError(null);

    const cId = GOOGLE_OAUTH_CLIENT_ID.trim();
    const cSecret = GOOGLE_OAUTH_CLIENT_SECRET.trim();
    if (!cId) {
      setOauthError("Cette version de RRadio n'a pas d'ID client Google public configuré. Le mainteneur doit définir VITE_GOOGLE_CLIENT_ID avant la publication.");
      return;
    }

    setOauthLoading(true);
    try {
      await startNativeGoogleOAuth(cId, cSecret || undefined);
    } catch (e: unknown) {
      setOauthLoading(false);
      setOauthError(typeof e === 'string' ? e : e instanceof Error ? e.message : "Impossible de démarrer OAuth");
    }
  };

  const handleClose = () => {
    if (oauthLoading) {
      cancelNativeGoogleOAuth();
      setOauthLoading(false);
    }
    onClose();
  };

  const handleResetDefaults = () => {
    onUpdateSettings(DEFAULT_SETTINGS);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 md:p-8 bg-transparent select-none font-gta6 pointer-events-auto"
        >
          {/* Top Tabs Bar */}
          <div className="flex items-center gap-2 md:gap-4 mb-4 px-2 py-1 overflow-x-auto max-w-5xl z-10">
            {[
              { id: 'audio', label: 'AUDIO' },
              { id: 'overlay', label: 'AFFICHAGE' },
              { id: 'controls', label: 'COMMANDES' },
              { id: 'discord', label: 'DISCORD RPC' },
              { id: 'services', label: 'SERVICES STREAMING' },
              { id: 'library', label: 'FICHIERS PC' }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as TabType);
                    soundEngine.playMechanicalClick();
                  }}
                  className={`relative px-7 py-2 rounded-2xl font-black text-[16px] tracking-wide uppercase transition-all duration-200 ${
                    isActive
                      ? 'text-black shadow-[0_4px_25px_rgba(255,160,122,0.6)]'
                      : 'text-white/85 hover:text-white hover:bg-black/30'
                  }`}
                  style={
                    isActive
                      ? {
                          background: 'linear-gradient(90deg, #FFA07A 0%, #FF6584 50%, #B053F5 100%)'
                        }
                      : {}
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Main Card: Beige Glass with Animated Rotating Gradient (Beige / Violet / Bleu Clair Océan / Pêche) */}
          <div
            className="relative flex flex-col w-full max-w-5xl h-[640px] max-h-[88vh] rounded-3xl overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.9)]"
            style={{
              border: '1.5px solid rgba(245, 235, 224, 0.35)',
              boxShadow: '0 30px 90px rgba(0,0,0,0.9), inset 0 1px 2px rgba(245, 235, 224, 0.3)'
            }}
          >
            {/* 1. Base Layer: Translucent Warm Beige Glass */}
            <div className="absolute inset-0 bg-[#F5EDE4]/15 backdrop-blur-2xl pointer-events-none" />

            {/* 2. Rotating Gradient Mesh Layer: Beige -> Violet -> Bleu Océan -> Pêche */}
            <div
              className="absolute -inset-[70%] opacity-45 blur-3xl animate-spin-gradient pointer-events-none"
              style={{
                background: `conic-gradient(
                  from 0deg at 50% 50%,
                  #F5EBE0 0deg,
                  #8B5CF6 90deg,
                  #00D4FF 180deg,
                  #FFA07A 270deg,
                  #F5EBE0 360deg
                )`
              }}
            />

            {/* 3. Deep Balancing Veil: Preserves legibility while letting fluid rotating colors glow through */}
            <div className="absolute inset-0 bg-[#140E24]/75 backdrop-blur-md pointer-events-none" />

            {/* Right Accent Scrollbar Line (Beige -> Pêche -> Violet -> Bleu Océan) */}
            <div
              className="absolute right-3 top-6 bottom-6 w-1.5 rounded-full opacity-80 pointer-events-none z-20"
              style={{
                background: 'linear-gradient(180deg, #F5EBE0 0%, #FFA07A 35%, #8B5CF6 70%, #00D4FF 100%)'
              }}
            />

            {/* Close Button Top-Right */}
            <button
              onClick={onClose}
              className="absolute right-6 top-5 z-30 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/15 transition-colors active:scale-95"
              title="Fermer (Échap)"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Settings Rows List */}
            <div className="relative z-10 flex-1 overflow-y-auto px-6 md:px-10 py-6 space-y-1.5 pr-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                  className="space-y-1.5"
                >
              
              {/* ========================================================================= */}
              {/* TAB 1: AUDIO                                                              */}
              {/* ========================================================================= */}
              {activeTab === 'audio' && (
                <>
                  {/* Master Volume */}
                  <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <Volume2 className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        VOLUME PRINCIPAL <span className="text-[#FFD2A4] font-mono font-bold">[{settings.audio.masterVolume}%]</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.audio.masterVolume}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          onUpdateSettings({
                            ...settings,
                            audio: { ...settings.audio, masterVolume: val }
                          });
                        }}
                        className="w-52 md:w-64 h-2 rounded-lg appearance-none cursor-pointer bg-white/20 accent-[#FFA07A]"
                      />
                    </div>
                  </div>

                  {/* FM Frequency Static */}
                  <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <Radio className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        BRUITS DE FRÉQUENCE FM <span className="text-[#FFD2A4] font-mono font-bold">[{settings.audio.sfxVolume}%]</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.audio.sfxVolume}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          onUpdateSettings({
                            ...settings,
                            audio: { ...settings.audio, sfxVolume: val }
                          });
                        }}
                        className="w-52 md:w-64 h-2 rounded-lg appearance-none cursor-pointer bg-white/20 accent-[#FFA07A]"
                      />
                    </div>
                  </div>

                  {/* Audio Quality (Stepped Row) */}
                  <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <Sliders className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        QUALITÉ AUDIO <span className="text-[#FFD2A4] font-mono font-bold">[Ultra]</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-6 font-mono text-xs text-white/60 pr-1">
                      <span className="hover:text-white cursor-pointer">Faible</span>
                      <span className="hover:text-white cursor-pointer">Moyen</span>
                      <span className="hover:text-white cursor-pointer">Élevé</span>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFA07A] text-black font-extrabold shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Ultra</span>
                      </div>
                    </div>
                  </div>

                  {/* Tuning Analog Sound Effect (Glowing Neon Purple Toggle) */}
                  <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <Sparkles className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        EFFET TUNING ANALOGIQUE <span className="text-[#FFD2A4] font-mono font-bold">[{settings.audio.playTuningSound ? 'Activé' : 'Désactivé'}]</span>
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onUpdateSettings({
                          ...settings,
                          audio: { ...settings.audio, playTuningSound: !settings.audio.playTuningSound }
                        });
                        soundEngine.playMechanicalClick();
                      }}
                      className={`relative w-14 h-7 rounded-full transition-colors duration-200 p-1 ${
                        settings.audio.playTuningSound
                          ? 'bg-[#8B5CF6] shadow-[0_0_15px_#8B5CF6]'
                          : 'bg-white/20'
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.audio.playTuningSound ? 26 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-5 h-5 rounded-full bg-white shadow"
                      />
                    </button>
                  </div>

                  {/* Mute on Startup (Glowing Neon Purple Toggle) */}
                  <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <Clock className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        MUET AU DÉMARRAGE <span className="text-[#FFD2A4] font-mono font-bold">[{settings.audio.muteOnStartup ? 'Activé' : 'Désactivé'}]</span>
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onUpdateSettings({
                          ...settings,
                          audio: { ...settings.audio, muteOnStartup: !settings.audio.muteOnStartup }
                        });
                        soundEngine.playMechanicalClick();
                      }}
                      className={`relative w-14 h-7 rounded-full transition-colors duration-200 p-1 ${
                        settings.audio.muteOnStartup
                          ? 'bg-[#8B5CF6] shadow-[0_0_15px_#8B5CF6]'
                          : 'bg-white/20'
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.audio.muteOnStartup ? 26 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-5 h-5 rounded-full bg-white shadow"
                      />
                    </button>
                  </div>
                </>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: OVERLAY / HUD                                                      */}
              {/* ========================================================================= */}
              {activeTab === 'overlay' && (
                <>
                  {/* Selector Style (Pill Dropdown) */}
                  <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <Tv className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        MODE D'AFFICHAGE DU SÉLECTEUR
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const next = settings.overlay.uiStyle === 'gta6_ribbon' ? 'gta_arc' : 'gta6_ribbon';
                        onUpdateSettings({
                          ...settings,
                          overlay: { ...settings.overlay, uiStyle: next }
                        });
                        soundEngine.playMechanicalClick();
                      }}
                      className="flex items-center justify-between gap-4 px-6 py-2 rounded-xl bg-black/50 border border-white/20 text-[#FFD2A4] font-bold text-sm min-w-[200px] hover:border-white/40 transition-colors shadow-inner"
                    >
                      <span>{settings.overlay.uiStyle === 'gta6_ribbon' ? 'Bandeau GTA 6' : 'Roue en Arc'}</span>
                      <ChevronDown className="w-4 h-4 text-white/60" />
                    </button>
                  </div>

                  {/* HUD Scale */}
                  <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <Layers className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        ÉCHELLE DU HUD <span className="text-[#FFD2A4] font-mono font-bold">[{settings.overlay.hudScale}%]</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="80"
                        max="125"
                        step="5"
                        value={settings.overlay.hudScale}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          onUpdateSettings({
                            ...settings,
                            overlay: { ...settings.overlay, hudScale: val }
                          });
                        }}
                        className="w-52 md:w-64 h-2 rounded-lg appearance-none cursor-pointer bg-white/20 accent-[#FFA07A]"
                      />
                    </div>
                  </div>

                  {/* Dynamic Equalizer Spectrum */}
                  <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <Sparkles className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        VISUALISEUR ÉGALISEUR DYNAMIQUE <span className="text-[#FFD2A4] font-mono font-bold">[{settings.overlay.showEqualizer ? 'Activé' : 'Désactivé'}]</span>
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onUpdateSettings({
                          ...settings,
                          overlay: { ...settings.overlay, showEqualizer: !settings.overlay.showEqualizer }
                        });
                        soundEngine.playMechanicalClick();
                      }}
                      className={`relative w-14 h-7 rounded-full transition-colors duration-200 p-1 ${
                        settings.overlay.showEqualizer
                          ? 'bg-[#8B5CF6] shadow-[0_0_15px_#8B5CF6]'
                          : 'bg-white/20'
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.overlay.showEqualizer ? 26 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-5 h-5 rounded-full bg-white shadow"
                      />
                    </button>
                  </div>
                </>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: CONTROLS & GAMEPAD                                                 */}
              {/* ========================================================================= */}
              {activeTab === 'controls' && (
                <>
                  {/* Gamepad Cadence */}
                  <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <Gamepad2 className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        CADENCE DÉFILEMENT MANETTE <span className="text-[#FFD2A4] font-mono font-bold">[{settings.controls.gamepadCadenceMs} ms]</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="150"
                        max="400"
                        step="25"
                        value={settings.controls.gamepadCadenceMs}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          onUpdateSettings({
                            ...settings,
                            controls: { ...settings.controls, gamepadCadenceMs: val }
                          });
                        }}
                        className="w-52 md:w-64 h-2 rounded-lg appearance-none cursor-pointer bg-white/20 accent-[#FFA07A]"
                      />
                    </div>
                  </div>

                  {/* Toggle Hotkey */}
                  <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <Tv className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        RACCOURCI AFFICHER / MASQUER
                      </span>
                    </div>
                    <div className="px-6 py-2 rounded-xl bg-black/50 border border-white/20 text-[#FFD2A4] font-mono font-bold text-sm min-w-[180px] text-center shadow-inner">
                      {settings.controls.toggleHotkey}
                    </div>
                  </div>

                  {/* Mute Hotkey */}
                  <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <Volume2 className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        RACCOURCI MUTE / UNMUTE
                      </span>
                    </div>
                    <div className="px-6 py-2 rounded-xl bg-black/50 border border-white/20 text-[#FFD2A4] font-mono font-bold text-sm min-w-[180px] text-center shadow-inner">
                      {settings.controls.muteHotkey}
                    </div>
                  </div>

                  {/* Gamepad Mute Button */}
                  <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <Gamepad2 className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        BOUTONS MUTE MANETTE
                      </span>
                    </div>
                    <div className="px-6 py-2 rounded-xl bg-black/50 border border-white/20 text-[#FFD2A4] font-mono font-bold text-sm min-w-[180px] text-center shadow-inner">
                      {settings.controls.gamepadMuteButton}
                    </div>
                  </div>

                  {/* Hold Hotkey */}
                  <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <Clock className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        MAINTIEN GTA (HOLD TO PEEK)
                      </span>
                    </div>
                    <div className="px-6 py-2 rounded-xl bg-black/50 border border-white/20 text-[#FFD2A4] font-mono font-bold text-sm min-w-[180px] text-center shadow-inner">
                      {settings.controls.holdHotkey}
                    </div>
                  </div>
                </>
              )}

              {/* ========================================================================= */}
              {/* TAB 4: ON DEMAND & LIBRARY                                                */}
              {/* ========================================================================= */}
              {activeTab === 'library' && (
                <>
                  {/* Custom Music Directory */}
                  <div className="flex flex-col gap-2 py-3 px-3 border-b border-white/[0.12] hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <Folder className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        DOSSIER MUSIQUES PERSONNELLES
                      </span>
                    </div>
                    <input
                      type="text"
                      value={settings.library.customMusicPath}
                      onChange={(e) => {
                        onUpdateSettings({
                          ...settings,
                          library: { ...settings.library, customMusicPath: e.target.value }
                        });
                      }}
                      className="w-full px-5 py-2.5 mt-1 bg-black/50 border border-white/20 rounded-xl font-mono text-xs text-[#FFD2A4] focus:outline-none focus:border-[#FFA27F] shadow-inner"
                    />
                  </div>

                  {/* Scan Subfolders Toggle */}
                  <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <HardDrive className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        SCANNER LES SOUS-DOSSIERS <span className="text-[#FFD2A4] font-mono font-bold">[{settings.library.scanSubfolders ? 'Activé' : 'Désactivé'}]</span>
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onUpdateSettings({
                          ...settings,
                          library: { ...settings.library, scanSubfolders: !settings.library.scanSubfolders }
                        });
                        soundEngine.playMechanicalClick();
                      }}
                      className={`relative w-14 h-7 rounded-full transition-colors duration-200 p-1 ${
                        settings.library.scanSubfolders
                          ? 'bg-[#8B5CF6] shadow-[0_0_15px_#8B5CF6]'
                          : 'bg-white/20'
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.library.scanSubfolders ? 26 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-5 h-5 rounded-full bg-white shadow"
                      />
                    </button>
                  </div>
                </>
              )}
              {/* ========================================================================= */}
              {/* TAB: DISCORD RICH PRESENCE (RPC)                                         */}
              {/* ========================================================================= */}
              {activeTab === 'discord' && (
                <>
                  {/* 1. DISCORD BANNER */}
                  <div className="flex flex-col p-5 rounded-2xl bg-gradient-to-r from-[#5865F2]/25 via-black/60 to-black/80 border border-[#5865F2]/30 shadow-lg mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-[#5865F2] flex items-center justify-center shadow-[0_0_25px_rgba(88,101,242,0.6)]">
                          <DiscordLogo className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[19px] tracking-wide text-white uppercase leading-none">
                              DISCORD RICH PRESENCE
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              settings.discord.enabled
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-white/10 text-white/50 border border-white/20'
                            }`}>
                              {settings.discord.enabled ? 'ACTIF' : 'INACTIF'}
                            </span>
                          </div>
                          <span className="text-zinc-400 text-xs mt-1">
                            Affichez votre station, le morceau en cours et la barre de progression sur votre profil Discord.
                          </span>
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-zinc-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>IPC PIPE WINDOWS</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. DISCORD PROFILE LIVE PREVIEW */}
                  <div className="p-4 rounded-2xl bg-[#1e1f22]/90 border border-white/10 shadow-xl mb-4">
                    <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <DiscordLogo className="w-4 h-4 text-[#5865F2]" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                          Aperçu en direct de votre profil Discord
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">
                        ID App : {settings.discord.applicationId || '1346077556094009384'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#2b2d31] border border-[#35373c] flex flex-col md:flex-row items-start md:items-center gap-4">
                      {/* Large Music Cover + Station Badge */}
                      <div className="relative flex-shrink-0">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black/60 flex items-center justify-center shadow-lg border border-white/20">
                          <img
                            src="https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/32/4f/fd/324ffda2-9e51-8f6a-0c2d-c6fd2b41ac55/074643811224.jpg/600x600bb.jpg"
                            alt="Thriller Album Cover"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full overflow-hidden bg-[#1e1f22] p-0.5 flex items-center justify-center border border-white/20 shadow">
                          <img
                            src={STATION_LOGOS['flash_fm']}
                            alt="Flash FM"
                            className="w-full h-full object-cover rounded-full bg-pink-600"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {settings.discord.activityType === 'playing' ? (
                            <Gamepad2 className="w-3 h-3 text-[#5865F2]" />
                          ) : (
                            <Music className="w-3 h-3 text-[#5865F2]" />
                          )}
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5865F2]">
                            {settings.discord.activityType === 'playing' ? 'Joue à RRadio' : 'Écoute RRadio'}
                          </span>
                        </div>

                        {settings.discord.showTrack ? (
                          <div className="text-white font-extrabold text-sm md:text-base truncate">
                            Billie Jean
                            <span className="text-zinc-400 font-medium text-xs ml-2">Michael Jackson</span>
                          </div>
                        ) : (
                          <div className="text-zinc-500 italic text-xs">
                            (Titre et artiste masqués)
                          </div>
                        )}

                        {settings.discord.showStation ? (
                          <div className="text-zinc-300 text-xs font-bold mt-0.5">
                            📻 Flash FM (Vice City)
                          </div>
                        ) : (
                          <div className="text-zinc-500 italic text-xs">
                            (Station radio masquée)
                          </div>
                        )}

                        {settings.discord.showTimeRemaining && (
                          <div className="mt-2 flex flex-col gap-1 max-w-xs">
                            <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
                              <div className="w-2/5 h-full bg-[#5865F2] rounded-full" />
                            </div>
                            <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                              <span>01:42</span>
                              <span>04:54</span>
                            </div>
                          </div>
                        )}

                        {settings.discord.showGitHubButton && (
                          <div className="mt-2.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#4e5058]/50 border border-white/10 text-xs font-bold text-white">
                              <Github className="w-3 h-3 text-white" />
                              <span>Voir sur GitHub</span>
                              <ExternalLink className="w-3 h-3 text-zinc-400" />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. MAIN ENABLE TOGGLE */}
                  <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <DiscordLogo className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        ACTIVER DISCORD RICH PRESENCE <span className="text-[#FFD2A4] font-mono font-bold">[{settings.discord.enabled ? 'Activé' : 'Désactivé'}]</span>
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onUpdateSettings({
                          ...settings,
                          discord: { ...settings.discord, enabled: !settings.discord.enabled }
                        });
                        soundEngine.playMechanicalClick();
                      }}
                      className={`relative w-14 h-7 rounded-full transition-colors duration-200 p-1 ${
                        settings.discord.enabled
                          ? 'bg-[#5865F2] shadow-[0_0_15px_#5865F2]'
                          : 'bg-white/20'
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.discord.enabled ? 26 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-5 h-5 rounded-full bg-white shadow"
                      />
                    </button>
                  </div>

                  {/* 3.1 ACTIVITY TYPE SELECTOR (MUSIC 🎧 VS GAME 🎮) */}
                  <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <Music className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        ICÔNE ET TYPE D'ACTIVITÉ <span className="text-[#FFD2A4] font-mono font-bold">[{settings.discord.activityType === 'playing' ? 'Jeu 🎮' : 'Musique 🎧'}]</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
                      <button
                        onClick={() => {
                          onUpdateSettings({
                            ...settings,
                            discord: { ...settings.discord, activityType: 'listening' }
                          });
                          soundEngine.playMechanicalClick();
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          settings.discord.activityType !== 'playing'
                            ? 'bg-[#5865F2] text-white shadow-[0_0_10px_rgba(88,101,242,0.5)]'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Music className="w-3.5 h-3.5" />
                        <span>Musique [🎧]</span>
                      </button>
                      <button
                        onClick={() => {
                          onUpdateSettings({
                            ...settings,
                            discord: { ...settings.discord, activityType: 'playing' }
                          });
                          soundEngine.playMechanicalClick();
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          settings.discord.activityType === 'playing'
                            ? 'bg-[#5865F2] text-white shadow-[0_0_10px_rgba(88,101,242,0.5)]'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Gamepad2 className="w-3.5 h-3.5" />
                        <span>Jeu [🎮]</span>
                      </button>
                    </div>
                  </div>

                  {/* 4. SHOW STATION TOGGLE */}
                  <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <Radio className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        AFFICHER LA STATION / SERVICE <span className="text-[#FFD2A4] font-mono font-bold">[{settings.discord.showStation ? 'Oui' : 'Non'}]</span>
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onUpdateSettings({
                          ...settings,
                          discord: { ...settings.discord, showStation: !settings.discord.showStation }
                        });
                        soundEngine.playMechanicalClick();
                      }}
                      className={`relative w-14 h-7 rounded-full transition-colors duration-200 p-1 ${
                        settings.discord.showStation
                          ? 'bg-[#8B5CF6] shadow-[0_0_15px_#8B5CF6]'
                          : 'bg-white/20'
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.discord.showStation ? 26 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-5 h-5 rounded-full bg-white shadow"
                      />
                    </button>
                  </div>

                  {/* 5. SHOW TRACK TOGGLE */}
                  <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <Music className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        AFFICHER LE TITRE ET L'ARTISTE <span className="text-[#FFD2A4] font-mono font-bold">[{settings.discord.showTrack ? 'Oui' : 'Non'}]</span>
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onUpdateSettings({
                          ...settings,
                          discord: { ...settings.discord, showTrack: !settings.discord.showTrack }
                        });
                        soundEngine.playMechanicalClick();
                      }}
                      className={`relative w-14 h-7 rounded-full transition-colors duration-200 p-1 ${
                        settings.discord.showTrack
                          ? 'bg-[#8B5CF6] shadow-[0_0_15px_#8B5CF6]'
                          : 'bg-white/20'
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.discord.showTrack ? 26 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-5 h-5 rounded-full bg-white shadow"
                      />
                    </button>
                  </div>

                  {/* 6. SHOW TIMELINE TOGGLE */}
                  <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <Clock className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        AFFICHER LA BARRE TEMPORELLE <span className="text-[#FFD2A4] font-mono font-bold">[{settings.discord.showTimeRemaining ? 'Oui' : 'Non'}]</span>
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onUpdateSettings({
                          ...settings,
                          discord: { ...settings.discord, showTimeRemaining: !settings.discord.showTimeRemaining }
                        });
                        soundEngine.playMechanicalClick();
                      }}
                      className={`relative w-14 h-7 rounded-full transition-colors duration-200 p-1 ${
                        settings.discord.showTimeRemaining
                          ? 'bg-[#8B5CF6] shadow-[0_0_15px_#8B5CF6]'
                          : 'bg-white/20'
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.discord.showTimeRemaining ? 26 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-5 h-5 rounded-full bg-white shadow"
                      />
                    </button>
                  </div>

                  {/* 7. SHOW GITHUB BUTTON TOGGLE */}
                  <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center gap-3.5">
                      <Github className="w-5 h-5 text-white/80" />
                      <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                        AFFICHER LE BOUTON GITHUB <span className="text-[#FFD2A4] font-mono font-bold">[{settings.discord.showGitHubButton ? 'Oui' : 'Non'}]</span>
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onUpdateSettings({
                          ...settings,
                          discord: { ...settings.discord, showGitHubButton: !settings.discord.showGitHubButton }
                        });
                        soundEngine.playMechanicalClick();
                      }}
                      className={`relative w-14 h-7 rounded-full transition-colors duration-200 p-1 ${
                        settings.discord.showGitHubButton
                          ? 'bg-[#8B5CF6] shadow-[0_0_15px_#8B5CF6]'
                          : 'bg-white/20'
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.discord.showGitHubButton ? 26 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-5 h-5 rounded-full bg-white shadow"
                      />
                    </button>
                  </div>

                  {/* 8. GITHUB URL INPUT */}
                  <div className="flex flex-col gap-2 py-3 px-3 border-b border-white/[0.12] hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <Globe className="w-5 h-5 text-white/80" />
                        <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                          LIEN DU DÉPÔT GITHUB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateSettings({
                            ...settings,
                            discord: { ...settings.discord, githubUrl: 'https://github.com/sifly/RRadio' }
                          });
                          soundEngine.playMechanicalClick();
                        }}
                        className="text-[11px] text-[#FFA07A] hover:underline font-mono"
                      >
                        Réinitialiser l'URL
                      </button>
                    </div>
                    <input
                      type="text"
                      value={settings.discord.githubUrl}
                      onChange={(e) => {
                        onUpdateSettings({
                          ...settings,
                          discord: { ...settings.discord, githubUrl: e.target.value }
                        });
                      }}
                      placeholder="https://github.com/sifly/RRadio"
                      className="w-full px-5 py-2.5 mt-1 bg-black/50 border border-white/20 rounded-xl font-mono text-xs text-[#FFD2A4] focus:outline-none focus:border-[#5865F2] shadow-inner"
                    />
                  </div>

                  {/* 9. CUSTOM APPLICATION ID INPUT */}
                  <div className="flex flex-col gap-2 py-3 px-3 border-b border-white/[0.12] hover:bg-white/[0.05] transition-colors rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <KeyRound className="w-5 h-5 text-white/80" />
                        <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                          APPLICATION ID DISCORD (CLIENT ID)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateSettings({
                            ...settings,
                            discord: { ...settings.discord, applicationId: '1346077556094009384' }
                          });
                          soundEngine.playMechanicalClick();
                        }}
                        className="text-[11px] text-[#FFA07A] hover:underline font-mono"
                      >
                        ID Officiel par défaut
                      </button>
                    </div>
                    <input
                      type="text"
                      value={settings.discord.applicationId}
                      onChange={(e) => {
                        onUpdateSettings({
                          ...settings,
                          discord: { ...settings.discord, applicationId: e.target.value }
                        });
                      }}
                      placeholder="1346077556094009384"
                      className="w-full px-5 py-2.5 mt-1 bg-black/50 border border-white/20 rounded-xl font-mono text-xs text-[#FFD2A4] focus:outline-none focus:border-[#5865F2] shadow-inner"
                    />
                    <span className="text-zinc-400 text-[11px] mt-0.5">
                      L'ID par défaut (<strong className="text-white font-mono">1346077556094009384</strong>) est préconfiguré avec les logos officiels de Vice City et GTA 6. Vous pouvez utiliser votre propre application sur le Discord Developer Portal si vous le souhaitez.
                    </span>
                  </div>
                </>
              )}
              {/* ========================================================================= */}
              {/* TAB 5: STREAMING SERVICES (YOUTUBE MUSIC, SPOTIFY, DEEZER)                 */}
              {/* ========================================================================= */}
              {activeTab === 'services' && (
                <>
                  {/* 1. YOUTUBE MUSIC CONNECTION BANNER */}
                  <div className="flex flex-col p-5 rounded-2xl bg-gradient-to-r from-red-950/40 via-black/60 to-black/80 border border-red-500/30 shadow-lg mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.5)]">
                          <Youtube className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[19px] tracking-wide text-white uppercase leading-none">
                              YOUTUBE MUSIC
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                                settings.services.youtubeMusic.connected
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/40'
                              }`}
                            >
                              {settings.services.youtubeMusic.connected
                                ? 'CONNECTÉ'
                                : 'NON CONNECTÉ'}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-300 font-medium mt-1">
                            {settings.services.youtubeMusic.connected
                              ? `Compte actif : ${settings.services.youtubeMusic.userName || settings.services.youtubeMusic.userEmail || 'Google User'}`
                              : 'Connectez votre compte pour importer vos playlists, titres likés et supermixes'}
                          </span>
                        </div>
                      </div>

                      {/* Connect / Disconnect Action Button */}
                      {settings.services.youtubeMusic.connected ? (
                        <button
                          onClick={() => {
                            soundEngine.playMechanicalClick();
                            onUpdateSettings({
                              ...settings,
                              services: {
                                ...settings.services,
                                youtubeMusic: {
                                  ...settings.services.youtubeMusic,
                                  connected: false,
                                  accessToken: '',
                                  refreshToken: '',
                                  userName: '',
                                  userEmail: ''
                                }
                              }
                            });
                          }}
                          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-500/50 font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Déconnexion</span>
                        </button>
                      ) : oauthLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/90 border border-red-500/40 text-red-200 font-mono text-xs shadow-inner">
                            <RotateCcw className="w-3.5 h-3.5 animate-spin text-red-400" />
                            <span>En attente du navigateur (90s)...</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playMechanicalClick();
                              setOauthLoading(false);
                              setOauthError("Connexion annulée par l'utilisateur.");
                              cancelNativeGoogleOAuth();
                            }}
                            className="px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
                            title="Annuler l'attente et fermer le serveur local"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleStartGoogleOAuth}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-[0_0_20px_rgba(255,0,0,0.4)]"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Se connecter avec Google</span>
                        </button>
                      )}
                    </div>

                    {/* OAuth Error Feedback Alert */}
                    {oauthError && (
                      <div className="flex items-center gap-2.5 mt-3 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{oauthError}</span>
                      </div>
                    )}
                  </div>

                  {/* 2. YOUTUBE MUSIC CONFIGURATION OPTIONS */}
                  <div className="flex flex-col space-y-1">
                    {/* Auto Sync Mixes Toggle */}
                    <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                      <div className="flex items-center gap-3.5">
                        <Sparkles className="w-5 h-5 text-red-400" />
                        <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                          INCLURE LES MIXES OFFICIELS (SUPERMIX, 80S, ETC.) <span className="text-[#FFD2A4] font-mono font-bold">[{settings.services.youtubeMusic.autoSyncMixes ? 'Oui' : 'Non'}]</span>
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          onUpdateSettings({
                            ...settings,
                            services: {
                              ...settings.services,
                              youtubeMusic: {
                                ...settings.services.youtubeMusic,
                                autoSyncMixes: !settings.services.youtubeMusic.autoSyncMixes
                              }
                            }
                          });
                          soundEngine.playMechanicalClick();
                        }}
                        className={`relative w-14 h-7 rounded-full transition-colors duration-200 p-1 ${
                          settings.services.youtubeMusic.autoSyncMixes
                            ? 'bg-red-600 shadow-[0_0_15px_rgba(255,0,0,0.7)]'
                            : 'bg-white/20'
                        }`}
                      >
                        <motion.div
                          animate={{ x: settings.services.youtubeMusic.autoSyncMixes ? 26 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="w-5 h-5 rounded-full bg-white shadow"
                        />
                      </button>
                    </div>

                    {/* Audio Quality Selector */}
                    <div className="h-[54px] flex items-center justify-between border-b border-white/[0.12] px-3 hover:bg-white/[0.05] transition-colors rounded-xl">
                      <div className="flex items-center gap-3.5">
                        <Volume2 className="w-5 h-5 text-red-400" />
                        <span className="font-extrabold text-[16px] md:text-[17px] tracking-wide text-white uppercase">
                          QUALITÉ DE DIFFUSION YOUTUBE
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-black/50 border border-white/20 p-1 rounded-xl">
                        {(['high', 'medium', 'auto'] as const).map((q) => (
                          <button
                            key={q}
                            onClick={() => {
                              soundEngine.playMechanicalClick();
                              onUpdateSettings({
                                ...settings,
                                services: {
                                  ...settings.services,
                                  youtubeMusic: {
                                    ...settings.services.youtubeMusic,
                                    audioQuality: q
                                  }
                                }
                              });
                            }}
                            className={`px-3 py-1 rounded-lg font-mono text-xs uppercase font-bold transition-all ${
                              settings.services.youtubeMusic.audioQuality === q
                                ? 'bg-red-600 text-white shadow'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {q === 'high' ? 'HAUTE (256K)' : q === 'medium' ? 'MOYENNE' : 'AUTO'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* PUBLIC GOOGLE CLIENT CONFIGURATION */}
                    <div className="flex items-center gap-3 py-3 px-3 border-b border-white/[0.12] rounded-xl">
                      <KeyRound className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="text-xs text-zinc-300">
                        OAuth utilise l'ID client Google public configuré par le mainteneur dans cette version. Aucun Client ID ni Client Secret n'est demandé ici.
                      </span>
                    </div>

                    {/* Google Cloud Desktop App Guide Box */}
                    <div className="flex items-center justify-between p-3.5 mt-2 rounded-xl bg-red-950/20 border border-red-500/20 text-xs">
                      <div className="flex flex-col">
                        <span className="text-zinc-200 font-bold uppercase text-[11px]">
                          Configuration Google Cloud Console :
                        </span>
                        <span className="text-zinc-400 text-xs mt-0.5">
                          Type d'application : <strong className="text-emerald-400">Application de bureau (Desktop app)</strong> • Aucun domaine ni URL requis !
                        </span>
                      </div>
                      <div className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[11px] font-bold border border-emerald-500/30">
                        OAUTH 2.0 PKCE PRÊT
                      </div>
                    </div>
                  </div>

                  {/* 3. OTHER STREAMING SERVICES PREVIEWS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                    <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 flex flex-col justify-between">
                      <div>
                        <span className="font-black text-sm text-[#1DB954] uppercase">SPOTIFY</span>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Spotify Connect & Web API</p>
                      </div>
                      <span className="mt-3 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold text-center border border-emerald-500/30">
                        PROCHAINEMENT
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/20 flex flex-col justify-between">
                      <div>
                        <span className="font-black text-sm text-[#A238FF] uppercase">DEEZER</span>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Deezer REST & Flow</p>
                      </div>
                      <span className="mt-3 px-2 py-1 rounded bg-purple-500/10 text-purple-400 text-[10px] font-mono font-bold text-center border border-purple-500/30">
                        PROCHAINEMENT
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/40 border border-pink-500/20 flex flex-col justify-between">
                      <div>
                        <span className="font-black text-sm text-[#FA243C] uppercase">APPLE MUSIC</span>
                        <p className="text-[11px] text-zinc-400 mt-0.5">MusicKit Developer API</p>
                      </div>
                      <span className="mt-3 px-2 py-1 rounded bg-pink-500/10 text-pink-400 text-[10px] font-mono font-bold text-center border border-pink-500/30">
                        COMING SOON
                      </span>
                    </div>
                  </div>
                </>
              )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Minimal Action Bar */}
            <div className="relative z-10 flex items-center justify-between px-8 py-3.5 bg-black/40 border-t border-white/10">
              <button
                onClick={handleResetDefaults}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white font-bold uppercase tracking-wider text-xs transition-colors active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurer par défaut</span>
              </button>

              <button
                onClick={handleClose}
                className="flex items-center gap-2 px-6 py-1.5 rounded-full bg-[#FFA07A] text-black font-black uppercase tracking-wider text-xs shadow hover:bg-[#FFB494] transition-colors active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Confirmer [Échap]</span>
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
