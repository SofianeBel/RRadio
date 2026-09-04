import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings, Language } from '../types/settings';
import { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET } from '../config/googleOAuth';
import { useTranslation } from '../i18n/useTranslation';
import {
  setNativeLanguage,
  startNativeGoogleOAuth,
  cancelNativeGoogleOAuth,
  listenToOAuthEvents,
  restoreWindowFocus
} from '../utils/tauriBridge';
import { soundEngine } from '../audio/soundEngine';
import {
  Globe,
  Volume2,
  VolumeX,
  Youtube,
  Tv,
  Gamepad2,
  Sliders,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Music,
  Radio,
  RadioTower,
  Play
} from 'lucide-react';

interface OnboardingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

type OnboardingStep = 'language' | 'volume' | 'google' | 'controls';

export const OnboardingDialog: React.FC<OnboardingDialogProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('language');
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [isPlayingSample, setIsPlayingSample] = useState(false);

  const { t } = useTranslation(settings.language);

  const stepsOrder: OnboardingStep[] = ['language', 'volume', 'google', 'controls'];
  const currentStepIndex = stepsOrder.indexOf(currentStep);

  // Reset to step 1 whenever onboarding dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('language');
      setOauthError(null);
      setOauthLoading(false);
    }
  }, [isOpen]);

  // Listen to Google OAuth events
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    listenToOAuthEvents(
      (data) => {
        setOauthLoading(false);
        setOauthError(null);
        restoreWindowFocus();
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
        restoreWindowFocus();
      },
      () => {
        setOauthLoading(false);
        setOauthError(settings.language === 'en' ? 'Connection cancelled.' : 'Connexion annulée.');
        restoreWindowFocus();
      }
    ).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, [settings, onUpdateSettings]);

  // Clean up any running volume preview when unmounting or closing
  useEffect(() => {
    return () => {
      soundEngine.stopVolumePreview();
    };
  }, []);

  const handleSwitchLanguage = (lang: Language) => {
    soundEngine.playMechanicalClick();
    const updated: AppSettings = { ...settings, language: lang };
    onUpdateSettings(updated);
    setNativeLanguage(lang);
  };

  const handleVolumeChange = (newVolume: number) => {
    onUpdateSettings({
      ...settings,
      audio: { ...settings.audio, masterVolume: newVolume }
    });
    // Trigger 1-second audio preview on touch/change
    soundEngine.playVolumePreview(newVolume, (playing) => {
      setIsPlayingSample(playing);
    });
  };

  const handleStartGoogleOAuth = async () => {
    soundEngine.playMechanicalClick();
    setOauthError(null);

    const cId = GOOGLE_OAUTH_CLIENT_ID.trim();
    const cSecret = GOOGLE_OAUTH_CLIENT_SECRET.trim();
    if (!cId) {
      setOauthError(
        settings.language === 'en'
          ? 'This version of RRadio does not have a public Google Client ID configured.'
          : "Cette version de RRadio n'a pas d'ID client Google public configuré."
      );
      return;
    }

    setOauthLoading(true);
    try {
      await startNativeGoogleOAuth(cId, cSecret || undefined);
    } catch (e: unknown) {
      setOauthLoading(false);
      setOauthError(typeof e === 'string' ? e : e instanceof Error ? e.message : 'OAuth error');
    }
  };

  const handleNextStep = () => {
    soundEngine.playMechanicalClick();
    soundEngine.stopVolumePreview(setIsPlayingSample);
    if (currentStepIndex < stepsOrder.length - 1) {
      setCurrentStep(stepsOrder[currentStepIndex + 1]);
    }
  };

  const handlePrevStep = () => {
    soundEngine.playMechanicalClick();
    soundEngine.stopVolumePreview(setIsPlayingSample);
    if (currentStepIndex > 0) {
      setCurrentStep(stepsOrder[currentStepIndex - 1]);
    }
  };

  const handleFinishOnboarding = () => {
    soundEngine.playMechanicalClick();
    soundEngine.stopVolumePreview(setIsPlayingSample);
    if (oauthLoading) {
      cancelNativeGoogleOAuth();
      setOauthLoading(false);
    }
    const finalSettings: AppSettings = {
      ...settings,
      hasCompletedOnboarding: true
    };
    onUpdateSettings(finalSettings);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-4 md:p-8 bg-transparent select-none font-gta6 pointer-events-auto"
        >
          {/* Main Card Container */}
          <div
            className="relative flex flex-col w-full max-w-4xl h-[620px] max-h-[90vh] rounded-3xl overflow-hidden shadow-[0_35px_100px_rgba(0,0,0,0.95)]"
            style={{
              border: '1.5px solid rgba(245, 235, 224, 0.4)',
              boxShadow: '0 35px 100px rgba(0,0,0,0.95), inset 0 1px 2px rgba(245, 235, 224, 0.35)'
            }}
          >
            {/* 1. Base Frosted Glass Layer */}
            <div className="absolute inset-0 bg-[#F5EDE4]/15 backdrop-blur-2xl pointer-events-none" />

            {/* 2. Rotating Gradient Mesh Layer */}
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

            {/* 3. Deep Dark Balancing Veil */}
            <div className="absolute inset-0 bg-[#140E24]/80 backdrop-blur-md pointer-events-none" />

            {/* Top Header with Badge and Progress Steps */}
            <div className="relative z-20 flex items-center justify-between px-8 pt-7 pb-4 border-b border-white/[0.12]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFA07A] to-[#FF6584] flex items-center justify-center shadow-[0_0_15px_rgba(255,160,122,0.5)]">
                  <RadioTower className="w-5 h-5 text-black" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-mono tracking-widest font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#FFA07A]/20 border border-[#FFA07A]/40 text-[#FFA07A]">
                      {t.onboarding.badge}
                    </span>
                    <span className="text-white/40 text-xs font-mono">
                      {currentStepIndex + 1} / {stepsOrder.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Step Indicators */}
              <div className="flex items-center gap-2">
                {stepsOrder.map((step, idx) => {
                  const isActive = step === currentStep;
                  const isDone = idx < currentStepIndex;
                  return (
                    <div
                      key={step}
                      className="flex items-center gap-1.5"
                    >
                      <button
                        onClick={() => {
                          soundEngine.playMechanicalClick();
                          soundEngine.stopVolumePreview(setIsPlayingSample);
                          setCurrentStep(step);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-[#FFA07A] to-[#FF6584] text-black shadow-[0_0_12px_rgba(255,160,122,0.6)]'
                            : isDone
                            ? 'bg-white/20 text-white hover:bg-white/30'
                            : 'bg-white/5 text-white/40'
                        }`}
                      >
                        {isDone ? (
                          <Check className="w-3 h-3 stroke-[3]" />
                        ) : (
                          <span>0{idx + 1}</span>
                        )}
                        <span className="hidden sm:inline uppercase">
                          {t.onboarding.steps[step]}
                        </span>
                      </button>
                      {idx < stepsOrder.length - 1 && (
                        <div className="w-2 h-0.5 bg-white/20 rounded-full" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content Body Area */}
            <div className="relative z-10 flex-1 overflow-y-auto px-8 md:px-12 py-6">
              <AnimatePresence mode="wait">
                {/* STEP 1: LANGUAGE SELECTION */}
                {currentStep === 'language' && (
                  <motion.div
                    key="step-language"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                    className="flex flex-col h-full justify-between"
                  >
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wide text-white drop-shadow-md">
                        {t.onboarding.step1Title}
                      </h2>
                      <p className="text-white/70 text-sm mt-1 mb-8">
                        {t.onboarding.step1Desc}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
                        {/* Français Card */}
                        <button
                          onClick={() => handleSwitchLanguage('fr')}
                          className={`flex flex-col p-6 rounded-2xl border transition-all text-left relative overflow-hidden group ${
                            settings.language === 'fr'
                              ? 'bg-white/15 border-[#FFA07A] shadow-[0_0_25px_rgba(255,160,122,0.3)]'
                              : 'bg-black/40 border-white/15 hover:border-white/30 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-3xl">🇫🇷</span>
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                                settings.language === 'fr'
                                  ? 'bg-[#FFA07A] border-[#FFA07A] text-black'
                                  : 'border-white/30 text-transparent'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          </div>
                          <span className="text-xl font-black text-white uppercase tracking-wider">
                            {t.onboarding.selectLanguageFr}
                          </span>
                          <span className="text-xs text-white/60 mt-1 font-sans">
                            Interface, notifications et sélecteur en français
                          </span>
                        </button>

                        {/* English Card */}
                        <button
                          onClick={() => handleSwitchLanguage('en')}
                          className={`flex flex-col p-6 rounded-2xl border transition-all text-left relative overflow-hidden group ${
                            settings.language === 'en'
                              ? 'bg-white/15 border-[#FFA07A] shadow-[0_0_25px_rgba(255,160,122,0.3)]'
                              : 'bg-black/40 border-white/15 hover:border-white/30 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-3xl">🇬🇧</span>
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                                settings.language === 'en'
                                  ? 'bg-[#FFA07A] border-[#FFA07A] text-black'
                                  : 'border-white/30 text-transparent'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          </div>
                          <span className="text-xl font-black text-white uppercase tracking-wider">
                            {t.onboarding.selectLanguageEn}
                          </span>
                          <span className="text-xs text-white/60 mt-1 font-sans">
                            Interface, notifications and selector in English
                          </span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: VOLUME CALIBRATION & 1S PREVIEW */}
                {currentStep === 'volume' && (
                  <motion.div
                    key="step-volume"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                    className="flex flex-col h-full justify-between"
                  >
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wide text-white drop-shadow-md">
                        {t.onboarding.step2Title}
                      </h2>
                      <p className="text-white/70 text-sm mt-1 mb-6">
                        {t.onboarding.step2Desc}
                      </p>

                      {/* Main Volume Slider Box */}
                      <div className="p-6 rounded-2xl bg-black/40 border border-white/15 backdrop-blur-md max-w-2xl mx-auto space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/15">
                              <Volume2 className="w-5 h-5 text-[#FFA07A]" />
                            </div>
                            <div>
                              <span className="text-sm font-extrabold uppercase tracking-wider text-white">
                                {t.audio.masterVolume}
                              </span>
                              <div className="text-xs text-white/50 font-mono">
                                {settings.audio.masterVolume}%
                              </div>
                            </div>
                          </div>

                          {/* Sound preview activity badge */}
                          <div
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                              isPlayingSample
                                ? 'bg-gradient-to-r from-[#FFA07A] to-[#FF6584] text-black shadow-[0_0_15px_rgba(255,160,122,0.7)] animate-pulse'
                                : 'bg-white/10 text-white/40'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>
                              {isPlayingSample
                                ? t.onboarding.volumeSamplePlaying
                                : '1s Audio Test'}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Range Slider */}
                        <div className="flex flex-col gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={settings.audio.masterVolume}
                            onInput={(e) => {
                              const val = parseInt((e.target as HTMLInputElement).value, 10);
                              handleVolumeChange(val);
                            }}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              handleVolumeChange(val);
                            }}
                            className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-white/20 accent-[#FFA07A]"
                          />
                          <div className="flex justify-between text-[11px] font-mono text-white/40">
                            <span>0% (SILENT)</span>
                            <span>50%</span>
                            <span>100% (MAX)</span>
                          </div>
                        </div>

                        {/* Mute on startup option */}
                        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-extrabold uppercase tracking-wide text-white">
                              {t.onboarding.muteOnStartupTitle}
                            </span>
                            <span className="text-xs text-white/50">
                              {t.onboarding.muteOnStartupDesc}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              soundEngine.playMechanicalClick();
                              onUpdateSettings({
                                ...settings,
                                audio: {
                                  ...settings.audio,
                                  muteOnStartup: !settings.audio.muteOnStartup
                                }
                              });
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
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: GOOGLE & YOUTUBE MUSIC (WITH VERIFICATION NOTICE) */}
                {currentStep === 'google' && (
                  <motion.div
                    key="step-google"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                    className="flex flex-col h-full justify-between"
                  >
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wide text-white drop-shadow-md">
                        {t.onboarding.step3Title}
                      </h2>
                      <p className="text-white/70 text-sm mt-1 mb-5">
                        {t.onboarding.step3Desc}
                      </p>

                      <div className="max-w-2xl mx-auto space-y-4">
                        {/* Prominent Verification Alert Card */}
                        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-200 backdrop-blur-md shadow-lg">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-extrabold text-xs tracking-wider uppercase text-amber-300 block mb-1">
                                {t.onboarding.googleVerificationAlertTitle}
                              </span>
                              <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
                                {t.onboarding.googleVerificationAlertDesc}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Google OAuth Login Box */}
                        <div className="p-6 rounded-2xl bg-black/40 border border-white/15 backdrop-blur-md">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                              <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.5)] shrink-0">
                                <Youtube className="w-7 h-7 text-white" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-extrabold text-base tracking-wide text-white uppercase">
                                  YouTube Music
                                </span>
                                <span className="text-xs text-white/50">
                                  {settings.services.youtubeMusic.connected
                                    ? `${t.onboarding.connectedAs} : ${settings.services.youtubeMusic.userName || settings.services.youtubeMusic.userEmail || 'Google User'}`
                                    : t.services.ytmDisconnected}
                                </span>
                              </div>
                            </div>

                            {/* Action Button */}
                            {settings.services.youtubeMusic.connected ? (
                              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs">
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>{t.services.ytmConnected}</span>
                              </div>
                            ) : oauthLoading ? (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 border border-red-500/40 text-red-200 font-mono text-xs">
                                  <RotateCcw className="w-3.5 h-3.5 animate-spin text-red-400" />
                                  <span>{t.services.connecting}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundEngine.playMechanicalClick();
                                    setOauthLoading(false);
                                    cancelNativeGoogleOAuth();
                                  }}
                                  className="px-3 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-white font-bold text-xs uppercase"
                                >
                                  {t.services.cancelWait}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={handleStartGoogleOAuth}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-[0_0_20px_rgba(255,0,0,0.4)]"
                              >
                                <Youtube className="w-4 h-4" />
                                <span>{t.onboarding.connectGoogle}</span>
                              </button>
                            )}
                          </div>

                          {oauthLoading && (
                            <div className="mt-4 p-3.5 rounded-xl bg-sky-950/60 border border-sky-400/40 text-sky-200 text-xs flex items-center gap-3 shadow-inner">
                              <Globe className="w-4 h-4 text-sky-400 shrink-0 animate-pulse" />
                              <span>
                                {settings.language === 'en'
                                  ? 'Your default web browser has been opened in the foreground. Complete the Google authorization there.'
                                  : "Votre navigateur web par défaut s'est ouvert au premier plan. Validez la connexion sur la page Google."}
                              </span>
                            </div>
                          )}

                          {oauthError && (
                            <div className="mt-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
                              {oauthError}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: CONTROLS & READY */}
                {currentStep === 'controls' && (
                  <motion.div
                    key="step-controls"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                    className="flex flex-col h-full justify-between"
                  >
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wide text-white drop-shadow-md">
                        {t.onboarding.step4Title}
                      </h2>
                      <p className="text-white/70 text-sm mt-1 mb-5">
                        {t.onboarding.step4Desc}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                        <div className="p-4 rounded-xl bg-black/40 border border-white/15 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Tv className="w-5 h-5 text-[#FFA07A]" />
                            <span className="text-xs font-bold uppercase text-white">
                              {t.onboarding.wheelShortcut}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-white/10 font-mono font-bold text-xs text-[#FFD2A4]">
                            F8 / Alt + V
                          </span>
                        </div>

                        <div className="p-4 rounded-xl bg-black/40 border border-white/15 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Volume2 className="w-5 h-5 text-[#FFA07A]" />
                            <span className="text-xs font-bold uppercase text-white">
                              {t.onboarding.muteShortcut}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-white/10 font-mono font-bold text-xs text-[#FFD2A4]">
                            F9 / Alt + M
                          </span>
                        </div>

                        <div className="p-4 rounded-xl bg-black/40 border border-white/15 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Sliders className="w-5 h-5 text-[#FFA07A]" />
                            <span className="text-xs font-bold uppercase text-white">
                              {t.onboarding.settingsShortcut}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-white/10 font-mono font-bold text-xs text-[#FFD2A4]">
                            F10 / Alt + S
                          </span>
                        </div>

                        <div className="p-4 rounded-xl bg-black/40 border border-white/15 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Radio className="w-5 h-5 text-[#FFA07A]" />
                            <span className="text-xs font-bold uppercase text-white">
                              {t.onboarding.modeShortcut}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-white/10 font-mono font-bold text-xs text-[#FFD2A4]">
                            F7 / Alt + O
                          </span>
                        </div>

                        <div className="sm:col-span-2 p-4 rounded-xl bg-black/40 border border-white/15 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Gamepad2 className="w-5 h-5 text-[#FFA07A]" />
                            <span className="text-xs font-bold uppercase text-white">
                              {t.onboarding.gamepadHoldShortcut}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-white/10 font-mono font-bold text-xs text-[#FFD2A4]">
                            LB (Hold) • RB / X (Mute)
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Footer Actions */}
            <div className="relative z-20 flex items-center justify-between px-8 py-5 border-t border-white/[0.12] bg-black/20">
              {/* Back button */}
              <button
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all ${
                  currentStepIndex === 0
                    ? 'text-white/20 cursor-not-allowed'
                    : 'text-white/80 hover:text-white hover:bg-white/10 active:scale-95'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t.onboarding.back}</span>
              </button>

              {/* Next / Finish action button */}
              {currentStepIndex === stepsOrder.length - 1 ? (
                <button
                  onClick={handleFinishOnboarding}
                  className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-[#FFA07A] via-[#FF6584] to-[#B053F5] hover:opacity-95 text-black font-black text-sm uppercase tracking-wider transition-all active:scale-95 shadow-[0_0_25px_rgba(255,160,122,0.6)]"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>{t.onboarding.finish}</span>
                </button>
              ) : (
                <button
                  onClick={handleNextStep}
                  className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#FFA07A] to-[#FF6584] hover:opacity-95 text-black font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-[0_0_20px_rgba(255,160,122,0.5)]"
                >
                  <span>{t.onboarding.next}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
