import { Language } from '../types/settings';

export const fr = {
  tabs: {
    audio: 'AUDIO',
    overlay: 'AFFICHAGE',
    controls: 'COMMANDES',
    discord: 'DISCORD RPC',
    services: 'SERVICES STREAMING',
    library: 'FICHIERS PC'
  },
  audio: {
    masterVolume: 'VOLUME PRINCIPAL',
    fmStatic: 'BRUITS DE FRÉQUENCE FM',
    quality: 'QUALITÉ AUDIO',
    levels: {
      low: 'Faible',
      medium: 'Moyen',
      high: 'Élevé',
      ultra: 'Ultra'
    },
    analogTuning: 'EFFET TUNING ANALOGIQUE',
    muteOnStartup: 'MUET AU DÉMARRAGE',
    enabled: 'Activé',
    disabled: 'Désactivé'
  },
  overlay: {
    language: 'LANGUE DU SYSTÈME',
    uiStyle: "MODE D'AFFICHAGE DU SÉLECTEUR",
    ribbonStyle: 'Bandeau GTA 6',
    arcStyle: 'Roue en Arc',
    hudScale: 'ÉCHELLE DU HUD',
    dynamicEqualizer: 'VISUALISEUR ÉGALISEUR DYNAMIQUE'
  },
  updates: {
    checkForUpdates: 'LIEN MISE À JOUR AUTO',
    checkDesc: 'Vérifie la dernière release GitHub au démarrage',
    viewReleases: 'VOIR LES RELEASES GITHUB',
    newVersionAvailable: 'NOUVELLE VERSION DISPONIBLE',
    upToDate: 'À JOUR',
    checkFailed: 'VÉRIF ÉCHOUÉE',
    disabled: 'DÉSACTIVÉ',
    version: 'VERSION'
  },
  controls: {
    gamepadCadence: 'CADENCE DÉFILEMENT MANETTE',
    toggleHotkey: 'RACCOURCI AFFICHER / MASQUER',
    muteHotkey: 'RACCOURCI MUTE / UNMUTE',
    gamepadMuteButton: 'BOUTONS MUTE MANETTE',
    holdHotkey: 'MAINTIEN GTA (HOLD TO PEEK)'
  },
  library: {
    customPath: 'DOSSIER MUSIQUES PERSONNELLES',
    scanSubfolders: 'SCANNER LES SOUS-DOSSIERS'
  },
  discord: {
    title: 'DISCORD RICH PRESENCE',
    active: 'ACTIF',
    inactive: 'INACTIF',
    description: 'Affichez votre station, le morceau en cours et la barre de progression sur votre profil Discord.',
    previewTitle: 'Aperçu en direct de votre profil Discord',
    previewSubtitle: 'Mis à jour en temps réel selon la station et le lecteur',
    listeningTo: 'ÉCOUTE DE',
    playing: 'JOUE À',
    enableToggle: 'ACTIVER DISCORD RICH PRESENCE',
    activityType: "TYPE D'ACTIVITÉ",
    activityListening: 'Écoute de la musique (Listening)',
    activityPlaying: 'Joue à un jeu (Playing)',
    showStation: 'AFFICHER LA STATION',
    showTrack: "AFFICHER LE TITRE ET L'ARTISTE",
    showProgress: 'AFFICHER LA BARRE DE TEMPS RESTANT',
    githubButton: 'BOUTON VERS LE CODE SOURCE GITHUB',
    githubUrl: 'URL DU CODE SOURCE GITHUB',
    defaultAppId: 'ID Officiel par défaut',
    resetUrl: 'Réinitialiser',
    applicationId: 'APPLICATION ID DISCORD (CLIENT ID)',
    rpcNotice: "La connexion RPC utilise le canal de communication local Discord IPC. Si Discord n'est pas ouvert, RRadio réessaie en arrière-plan sans ralentir l'application."
  },
  services: {
    ytmConnected: 'COMPTE GOOGLE CONNECTÉ',
    ytmDisconnected: 'NON CONNECTÉ',
    ytmDesc: 'Connectez votre compte Google pour synchroniser vos playlists personnelles et supermix YouTube Music.',
    autoSync: 'SYNCHRONISATION AUTOMATIQUE DES MIX',
    streamingQuality: 'QUALITÉ DU STREAMING YOUTUBE',
    qualityHigh: 'Haute fidélité (256 kbps AAC)',
    qualityNormal: 'Normale (128 kbps AAC)',
    account: 'Compte Google actif',
    connectGoogle: 'SE CONNECTER AVEC GOOGLE',
    disconnect: 'SE DÉCONNECTER',
    connecting: 'En attente du navigateur (90s)...',
    cancelWait: 'Annuler',
    cancelTooltip: "Annuler l'attente et fermer le serveur local",
    redirectUriHelp: 'URI de redirection local :',
    copy: 'Copier',
    copied: 'Copié !',
    oauthNotice: "OAuth utilise l'ID client Google public configuré par le mainteneur dans cette version. Aucun Client ID ni Client Secret n'est demandé ici.",
    cloudConfigTitle: 'Configuration Google Cloud Console :',
    cloudConfigDesc: "Type d'application : Application de bureau (Desktop app) • Aucun domaine ni URL requis !",
    pkceReady: 'OAUTH 2.0 PKCE PRÊT',
    comingSoonBadge: 'PROCHAINEMENT',
    spotifyDesc: 'Spotify Connect & Web API',
    deezerDesc: 'Deezer REST & Flow',
    appleMusicDesc: 'MusicKit Developer API'
  },
  dialog: {
    restoreDefaults: 'Restaurer par défaut',
    confirm: 'Confirmer [Échap]',
    closeTooltip: 'Fermer (Échap)'
  },
  onboarding: {
    badge: 'CONFIGURATION INITIALE',
    steps: {
      language: 'Langue',
      volume: 'Volume',
      google: 'Google',
      controls: 'Contrôles'
    },
    step1Title: 'BIENVENUE SUR RRADIO',
    step1Desc: "Choisissez votre langue de prédilection pour l'interface et les paramètres.",
    selectLanguageFr: 'Français',
    selectLanguageEn: 'English',
    step2Title: 'CALIBRATION DU VOLUME',
    step2Desc: 'Ajustez le volume principal. Déplacez le curseur pour écouter un extrait sonore de 1 seconde.',
    volumeSamplePlaying: "Écoute de l'aperçu (1 seconde)...",
    muteOnStartupTitle: 'DÉMARRER EN MODE SILENCIEUX',
    muteOnStartupDesc: "Lancer l'application avec le son coupé par défaut.",
    step3Title: 'CONNEXION GOOGLE & YOUTUBE MUSIC',
    step3Desc: 'Connectez votre compte pour charger vos playlists personnelles et supermix YouTube Music.',
    googleVerificationAlertTitle: 'AVIS DE VÉRIFICATION GOOGLE OAUTH',
    googleVerificationAlertDesc: "L'application RRadio est actuellement en cours de vérification par Google. Lors de la connexion, Google peut afficher un avertissement 'Application non vérifiée'. Vous pouvez continuer sans risque (Paramètres avancés > Accéder à RRadio) ou ignorer cette étape et vous connecter plus tard.",
    connectGoogle: 'SE CONNECTER AVEC GOOGLE',
    connectedAs: 'Connecté en tant que',
    skipForNow: 'Passer cette étape',
    step4Title: 'RACCOURCIS ET CONTRÔLES',
    step4Desc: 'Découvrez les commandes globales pour piloter la radio en jeu ou sur votre bureau.',
    wheelShortcut: 'Ouvrir / Fermer le sélecteur',
    muteShortcut: 'Couper / Activer le son',
    settingsShortcut: 'Ouvrir les paramètres',
    modeShortcut: 'Basculer Radio / On-Demand',
    gamepadHoldShortcut: 'Maintien pour afficher (Hold to peek)',
    next: 'SUIVANT',
    back: 'PRÉCÉDENT',
    finish: "COMMENCER L'ÉCOUTE",
    replayButton: 'REJOUER LE TUTORIEL DE BIENVENUE',
    replayTooltip: "Relancer l'assistant de configuration initiale"
  },
  hud: {
    radio: 'RADIO',
    onDemand: 'ON DEMAND',
    mute: 'MUTE',
    unmute: 'UNMUTE',
    offAir: '[ MUTED / OFF AIR ]',
    toggleModeTooltip: 'Cliquer pour basculer entre Radio et On Demand (Touche O)',
    toggleMuteTooltip: 'Cliquer pour Couper / Activer le son (Mute = Éteindre la radio)',
    settingsTooltip: 'Paramètres GTA 6 (Touche F10)',
    backTooltip: 'Revenir au niveau précédent (Échap / Touche B)',
    selectionsAvailable: 'SÉLECTIONS DISPONIBLES • APPUYER SUR ENTRÉE',
    tracksAvailable: 'MORCEAUX • SÉLECTIONNER POUR LANCER',
    syncingYtm: 'SYNCHRONISATION DES TITRES YOUTUBE MUSIC...',
    backSelections: 'SÉLECTIONS',
    backServices: 'SERVICES',
    trackTitlePlaceholder: 'TITRE',
    trackArtistPlaceholder: 'ARTISTE'
  },
  providers: {
    stationsGta: 'STATIONS GTA',
    viceCity: 'VICE CITY',
    comingSoon: 'COMING SOON',
    pcFiles: 'FICHIERS PC',
    playlist: 'PLAYLIST',
    tracksCount: 'TITRES',
    syncing: 'SYNCHRONISATION...',
    played: 'PASSÉ'
  },
  providerData: {
    viceCityRadio: {
      name: 'STATIONS VICE CITY',
      badge: 'RADIOS GTA',
      tagline: 'Toutes les musiques des 7 radios de Vice City disponibles à la demande'
    },
    spotify: {
      name: 'SPOTIFY',
      badge: 'COMING SOON',
      tagline: 'Intégration Spotify à venir',
      comingSoonNote: "BIENTÔT DISPONIBLE • PAS D'INTÉGRATION SPOTIFY"
    },
    youtubeMusic: {
      name: 'YOUTUBE MUSIC',
      badge: 'SUPERMIX & CLIPS',
      tagline: 'Supermix, mixes officiels et playlists YouTube'
    },
    deezer: {
      name: 'DEEZER',
      badge: 'COMING SOON',
      tagline: 'Intégration Deezer à venir',
      comingSoonNote: "BIENTÔT DISPONIBLE • PAS D'INTÉGRATION DEEZER"
    },
    appleMusic: {
      name: 'APPLE MUSIC',
      badge: 'COMING SOON',
      tagline: 'Intégration Apple Music (Bientôt disponible)',
      comingSoonNote: 'COMING SOON • CLEF DEV REQUISE'
    },
    local: {
      name: 'FICHIERS LOCAUX',
      badge: 'COMING SOON',
      tagline: 'Lecture de fichiers locaux à venir',
      comingSoonNote: 'BIENTÔT DISPONIBLE • DOSSIER LOCAL NON CONFIGURABLE'
    }
  },
  controlsBar: {
    open: 'OUVRIR RADIO [Q]',
    close: 'FERMER [Q]',
    playPauseTooltip: 'Lecture / Pause (Espace)',
    prevTooltip: 'Morceau précédent',
    nextTooltip: 'Morceau suivant',
    muteTooltip: 'Mettre en sourdine (M)',
    gta6Hud: 'GTA 6 HUD',
    gta6HudTooltip: 'Rendu GTA 6 Officiel (Bandeau Cartes Carrées en Haut)',
    arcWheel: 'ROUE ARC',
    arcWheelTooltip: 'Rendu Roue / Arc Flottant',
    game: 'JEU',
    vc80s: 'VC 80s',
    overlay: 'OVERLAY',
    gamepadActive: 'Manette active',
    keyboardActive: 'Clavier actif'
  },
  tray: {
    toggle: 'Afficher / Masquer (F8 / Alt+V)',
    mute: 'Couper / Activer le son (F9 / Alt+M)',
    settings: 'Paramètres (Settings / F10)',
    quit: 'Quitter GTA 6 Radio',
    tooltip: 'GTA 6 Radio Overlay (Vice City)'
  }
};

export type Translations = typeof fr;

export const en: Translations = {
  tabs: {
    audio: 'AUDIO',
    overlay: 'DISPLAY',
    controls: 'CONTROLS',
    discord: 'DISCORD RPC',
    services: 'STREAMING SERVICES',
    library: 'PC FILES'
  },
  audio: {
    masterVolume: 'MASTER VOLUME',
    fmStatic: 'FM FREQUENCY STATIC',
    quality: 'AUDIO QUALITY',
    levels: {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      ultra: 'Ultra'
    },
    analogTuning: 'ANALOG TUNING EFFECT',
    muteOnStartup: 'MUTE ON STARTUP',
    enabled: 'Enabled',
    disabled: 'Disabled'
  },
  overlay: {
    language: 'SYSTEM LANGUAGE',
    uiStyle: 'SELECTOR DISPLAY MODE',
    ribbonStyle: 'GTA 6 Ribbon',
    arcStyle: 'Arc Wheel',
    hudScale: 'HUD SCALE',
    dynamicEqualizer: 'DYNAMIC EQUALIZER VISUALIZER'
  },
  updates: {
    checkForUpdates: 'AUTO UPDATE LINK',
    checkDesc: 'Check the latest GitHub release on launch',
    viewReleases: 'VIEW GITHUB RELEASES',
    newVersionAvailable: 'NEW VERSION AVAILABLE',
    upToDate: 'UP TO DATE',
    checkFailed: 'CHECK FAILED',
    disabled: 'DISABLED',
    version: 'VERSION'
  },
  controls: {
    gamepadCadence: 'GAMEPAD SCROLL CADENCE',
    toggleHotkey: 'TOGGLE OVERLAY HOTKEY',
    muteHotkey: 'MUTE / UNMUTE HOTKEY',
    gamepadMuteButton: 'GAMEPAD MUTE BUTTONS',
    holdHotkey: 'GTA HOLD TO PEEK'
  },
  library: {
    customPath: 'CUSTOM MUSIC DIRECTORY',
    scanSubfolders: 'SCAN SUBFOLDERS'
  },
  discord: {
    title: 'DISCORD RICH PRESENCE',
    active: 'ACTIVE',
    inactive: 'INACTIVE',
    description: 'Display your radio station, current track and real-time progress bar on your Discord profile.',
    previewTitle: 'Live preview of your Discord profile',
    previewSubtitle: 'Updated in real-time according to station and player',
    listeningTo: 'LISTENING TO',
    playing: 'PLAYING',
    enableToggle: 'ENABLE DISCORD RICH PRESENCE',
    activityType: 'ACTIVITY TYPE',
    activityListening: 'Listening to music',
    activityPlaying: 'Playing a game',
    showStation: 'SHOW STATION',
    showTrack: 'SHOW TRACK AND ARTIST',
    showProgress: 'SHOW TIME REMAINING BAR',
    githubButton: 'SHOW GITHUB PROFILE BUTTON',
    githubUrl: 'GITHUB REPOSITORY URL',
    defaultAppId: 'Default Official ID',
    resetUrl: 'Reset',
    applicationId: 'DISCORD APPLICATION ID (CLIENT ID)',
    rpcNotice: 'RPC connection uses the local Discord IPC pipe. If Discord is not running, RRadio retries in the background without blocking performance.'
  },
  services: {
    ytmConnected: 'GOOGLE ACCOUNT CONNECTED',
    ytmDisconnected: 'NOT CONNECTED',
    ytmDesc: 'Connect your Google account to sync your YouTube Music personal playlists and supermixes.',
    autoSync: 'AUTO-SYNC MIXES',
    streamingQuality: 'YOUTUBE STREAMING QUALITY',
    qualityHigh: 'High fidelity (256 kbps AAC)',
    qualityNormal: 'Normal (128 kbps AAC)',
    account: 'Active Google account',
    connectGoogle: 'SIGN IN WITH GOOGLE',
    disconnect: 'SIGN OUT',
    connecting: 'Waiting for browser (90s)...',
    cancelWait: 'Cancel',
    cancelTooltip: 'Cancel wait and close local loopback server',
    redirectUriHelp: 'Local redirect URI:',
    copy: 'Copy',
    copied: 'Copied!',
    oauthNotice: 'OAuth uses the public Google Client ID configured by the maintainer in this release. No Client ID or Client Secret is required here.',
    cloudConfigTitle: 'Google Cloud Console Setup:',
    cloudConfigDesc: 'Application type: Desktop app • No domain or URL required!',
    pkceReady: 'OAUTH 2.0 PKCE READY',
    comingSoonBadge: 'COMING SOON',
    spotifyDesc: 'Spotify Connect & Web API',
    deezerDesc: 'Deezer REST & Flow',
    appleMusicDesc: 'MusicKit Developer API'
  },
  dialog: {
    restoreDefaults: 'Restore defaults',
    confirm: 'Confirm [Esc]',
    closeTooltip: 'Close (Esc)'
  },
  onboarding: {
    badge: 'INITIAL SETUP',
    steps: {
      language: 'Language',
      volume: 'Volume',
      google: 'Google',
      controls: 'Controls'
    },
    step1Title: 'WELCOME TO RRADIO',
    step1Desc: 'Select your preferred language for the interface and configuration.',
    selectLanguageFr: 'Français',
    selectLanguageEn: 'English',
    step2Title: 'VOLUME CALIBRATION',
    step2Desc: 'Adjust the master volume. Move the slider to hear a 1-second audio preview.',
    volumeSamplePlaying: 'Playing preview sample (1 second)...',
    muteOnStartupTitle: 'START MUTED BY DEFAULT',
    muteOnStartupDesc: 'Launch the application in silent mode until you press unmute.',
    step3Title: 'GOOGLE & YOUTUBE MUSIC CONNECTION',
    step3Desc: 'Connect your Google account to load your YouTube Music personal playlists and mixes.',
    googleVerificationAlertTitle: 'GOOGLE OAUTH VERIFICATION NOTICE',
    googleVerificationAlertDesc: 'The RRadio application is currently undergoing official verification by Google. When signing in, Google may show an "App not verified" notice. You can safely proceed (Advanced > Go to RRadio) or skip this step and connect later.',
    connectGoogle: 'SIGN IN WITH GOOGLE',
    connectedAs: 'Connected as',
    skipForNow: 'Skip for now',
    step4Title: 'HOTKEYS & CONTROLS',
    step4Desc: 'Learn the global hotkeys to control RRadio while gaming or on your desktop.',
    wheelShortcut: 'Show / Hide radio wheel',
    muteShortcut: 'Mute / Unmute audio',
    settingsShortcut: 'Open settings dialog',
    modeShortcut: 'Toggle Radio / On-Demand',
    gamepadHoldShortcut: 'Hold bumper to peek',
    next: 'NEXT',
    back: 'PREVIOUS',
    finish: 'START LISTENING',
    replayButton: 'REPLAY ONBOARDING WIZARD',
    replayTooltip: 'Launch initial setup wizard again'
  },
  hud: {
    radio: 'RADIO',
    onDemand: 'ON DEMAND',
    mute: 'MUTE',
    unmute: 'UNMUTE',
    offAir: '[ MUTED / OFF AIR ]',
    toggleModeTooltip: 'Click to switch between Radio and On-Demand (Key O)',
    toggleMuteTooltip: 'Click to Mute / Unmute (Mute = Turn radio off)',
    settingsTooltip: 'GTA 6 Settings (Key F10)',
    backTooltip: 'Return to previous level (Esc / Key B)',
    selectionsAvailable: 'SELECTIONS AVAILABLE • PRESS ENTER',
    tracksAvailable: 'TRACKS • SELECT TO PLAY',
    syncingYtm: 'SYNCING YOUTUBE MUSIC TRACKS...',
    backSelections: 'SELECTIONS',
    backServices: 'SERVICES',
    trackTitlePlaceholder: 'TRACK',
    trackArtistPlaceholder: 'ARTIST'
  },
  providers: {
    stationsGta: 'GTA STATIONS',
    viceCity: 'VICE CITY',
    comingSoon: 'COMING SOON',
    pcFiles: 'PC FILES',
    playlist: 'PLAYLIST',
    tracksCount: 'TRACKS',
    syncing: 'SYNCING...',
    played: 'PLAYED'
  },
  providerData: {
    viceCityRadio: {
      name: 'VICE CITY STATIONS',
      badge: 'GTA RADIOS',
      tagline: 'All songs from 7 Vice City radio stations available on-demand'
    },
    spotify: {
      name: 'SPOTIFY',
      badge: 'COMING SOON',
      tagline: 'Spotify integration coming soon',
      comingSoonNote: 'COMING SOON • NO SPOTIFY INTEGRATION'
    },
    youtubeMusic: {
      name: 'YOUTUBE MUSIC',
      badge: 'SUPERMIX & CLIPS',
      tagline: 'Supermix, official mixes and YouTube playlists'
    },
    deezer: {
      name: 'DEEZER',
      badge: 'COMING SOON',
      tagline: 'Deezer integration coming soon',
      comingSoonNote: 'COMING SOON • NO DEEZER INTEGRATION'
    },
    appleMusic: {
      name: 'APPLE MUSIC',
      badge: 'COMING SOON',
      tagline: 'Apple Music integration (Coming soon)',
      comingSoonNote: 'COMING SOON • DEV KEY REQUIRED'
    },
    local: {
      name: 'LOCAL FILES',
      badge: 'COMING SOON',
      tagline: 'Local file playback coming soon',
      comingSoonNote: 'COMING SOON • LOCAL FOLDER NOT CONFIGURABLE'
    }
  },
  controlsBar: {
    open: 'OPEN RADIO [Q]',
    close: 'CLOSE [Q]',
    playPauseTooltip: 'Play / Pause (Space)',
    prevTooltip: 'Previous track',
    nextTooltip: 'Next track',
    muteTooltip: 'Mute (M)',
    gta6Hud: 'GTA 6 HUD',
    gta6HudTooltip: 'Official GTA 6 Render (Top Square Cards Ribbon)',
    arcWheel: 'ARC WHEEL',
    arcWheelTooltip: 'Floating Wheel / Arc Render',
    game: 'GAME',
    vc80s: 'VC 80s',
    overlay: 'OVERLAY',
    gamepadActive: 'Gamepad active',
    keyboardActive: 'Keyboard active'
  },
  tray: {
    toggle: 'Show / Hide (F8 / Alt+V)',
    mute: 'Mute / Unmute (F9 / Alt+M)',
    settings: 'Settings (F10)',
    quit: 'Quit GTA 6 Radio',
    tooltip: 'GTA 6 Radio Overlay (Vice City)'
  }
};
export { type Language };
export const translations: Record<Language, Translations> = { fr, en };
