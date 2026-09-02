import { RadioStation } from '../types/radio';

export const STATION_LOGOS: Record<string, string> = {
  flash_fm: 'https://static.wikia.nocookie.net/gtawiki/images/7/74/FlashFM-GTAVC-Logo.png/revision/latest/scale-to-width-down/512',
  wave_103: 'https://static.wikia.nocookie.net/gtawiki/images/4/42/Wave103-GTAVC-Logo.svg/revision/latest/scale-to-width-down/512',
  v_rock: 'https://static.wikia.nocookie.net/gtawiki/images/6/67/V-Rock-GTAVC-Logo.svg/revision/latest/scale-to-width-down/512',
  emotion_983: 'https://static.wikia.nocookie.net/gtawiki/images/0/06/Emotion98.3-GTAVC-Logo.svg/revision/latest/scale-to-width-down/512',
  fever_105: 'https://static.wikia.nocookie.net/gtawiki/images/1/16/Fever105-GTAVC-Logo.png/revision/latest/scale-to-width-down/512',
  wildstyle: 'https://static.wikia.nocookie.net/gtawiki/images/6/6a/WildstylePirateRadio-GTAVC-Logo.png/revision/latest/scale-to-width-down/512',
  espantoso: 'https://static.wikia.nocookie.net/gtawiki/images/8/83/RadioEspantoso-GTAVC-Logo.svg/revision/latest/scale-to-width-down/512',
  kchat: 'https://static.wikia.nocookie.net/gtawiki/images/4/44/KChat-GTAVC-Logo.svg/revision/latest/scale-to-width-down/512'
};

export const STATION_COVERS: Record<string, string> = {
  v_rock: 'https://static.wikia.nocookie.net/gtawiki/images/4/48/GTAVC-Soundtrack-Vrock.jpg/revision/latest/scale-to-width-down/512',
  wave_103: 'https://static.wikia.nocookie.net/gtawiki/images/5/5b/GTAVC-Soundtrack-Wave-103.jpg/revision/latest/scale-to-width-down/512',
  emotion_983: 'https://static.wikia.nocookie.net/gtawiki/images/2/2e/GTAVC-Soundtrack-Emotion-98.3.jpg/revision/latest/scale-to-width-down/512',
  flash_fm: 'https://static.wikia.nocookie.net/gtawiki/images/3/3c/Toni-GTAVC-Artwork.jpg/revision/latest/scale-to-width-down/512',
  wildstyle: 'https://static.wikia.nocookie.net/gtawiki/images/c/c1/GTAVC-Soundtrack-Wildstyle.jpg/revision/latest/scale-to-width-down/512',
  fever_105: 'https://static.wikia.nocookie.net/gtawiki/images/6/6a/OliverBiscuit-GTAVC.jpg/revision/latest/scale-to-width-down/512',
  espantoso: 'https://static.wikia.nocookie.net/gtawiki/images/3/3d/GTAVC-Soundtrack-Radio-Espantoso.jpg/revision/latest/scale-to-width-down/512',
  kchat: 'https://static.wikia.nocookie.net/gtawiki/images/3/36/GTA_Vice_City_Box_Art.jpg/revision/latest/scale-to-width-down/512'
};

export const GTA6_COVER_ART = 'https://static.wikia.nocookie.net/gtawiki/images/2/25/GTAVI-CoverArt.jpg/revision/latest/scale-to-width-down/512';
export const GTAVC_COVER_ART = 'https://static.wikia.nocookie.net/gtawiki/images/3/36/GTA_Vice_City_Box_Art.jpg/revision/latest/scale-to-width-down/512';

export const STATIONS: RadioStation[] = [
  {
    id: 'flash_fm',
    name: 'FLASH FM',
    frequency: '102.9 FM',
    genre: '80s POP & NEW WAVE',
    dj: 'Toni',
    description: 'The best pop hits in Vice City',
    primaryColor: '#FF2A85',
    accentColor: '#FFD600',
    badgeBg: 'linear-gradient(135deg, #FF2A85 0%, #FF7EB3 100%)',
    logoType: 'flash',
    tracks: [
      { title: 'Billie Jean', artist: 'Michael Jackson', duration: 294 },
      { title: 'Out of Touch', artist: 'Daryl Hall & John Oates', duration: 248 },
      { title: 'Self Control', artist: 'Laura Branigan', duration: 247 },
      { title: 'Call Me', artist: 'Go West', duration: 254 },
      { title: 'Running with the Night', artist: 'Lionel Richie', duration: 359 },
      { title: 'Video Killed the Radio Star', artist: 'The Buggles', duration: 204 },
      { title: 'Japanese Boy', artist: 'Aneka', duration: 236 },
      { title: 'Life\'s What You Make It', artist: 'Talk Talk', duration: 268 },
      { title: 'Your Love', artist: 'The Outfield', duration: 216 },
      { title: 'Crockett\'s Theme', artist: 'Jan Hammer', duration: 212 }
    ]
  },
  {
    id: 'wave_103',
    name: 'WAVE 103',
    frequency: '103.2 FM',
    genre: 'SYNTHPOP & POST-PUNK',
    dj: 'Adam First',
    description: 'The future of sound is right here',
    primaryColor: '#00E5FF',
    accentColor: '#7C4DFF',
    badgeBg: 'linear-gradient(135deg, #00E5FF 0%, #0077FF 100%)',
    logoType: 'wave',
    tracks: [
      { title: 'Blue Monday', artist: 'New Order', duration: 449 },
      { title: 'Atomic', artist: 'Blondie', duration: 280 },
      { title: 'Love Missile F1-11', artist: 'Sigue Sigue Sputnik', duration: 228 },
      { title: 'Cars', artist: 'Gary Numan', duration: 236 },
      { title: 'Pale Shelter', artist: 'Tears for Fears', duration: 264 },
      { title: 'Gold', artist: 'Spandau Ballet', duration: 231 },
      { title: 'Two Tribes', artist: 'Frankie Goes to Hollywood', duration: 236 },
      { title: 'Never Say Never', artist: 'Romeo Void', duration: 354 },
      { title: 'Kids in America', artist: 'Kim Wilde', duration: 206 }
    ]
  },
  {
    id: 'v_rock',
    name: 'V-ROCK',
    frequency: '99.5 FM',
    genre: 'HARD ROCK & HEAVY METAL',
    dj: 'Lazlow',
    description: 'Maximum rock, no commercial compromises',
    primaryColor: '#FF3B30',
    accentColor: '#FF9500',
    badgeBg: 'linear-gradient(135deg, #FF3B30 0%, #990000 100%)',
    logoType: 'vrock',
    tracks: [
      { title: 'You\'ve Got Another Thing Comin\'', artist: 'Judas Priest', duration: 304 },
      { title: '2 Minutes to Midnight', artist: 'Iron Maiden', duration: 360 },
      { title: 'Peace Sells', artist: 'Megadeth', duration: 242 },
      { title: 'Cum On Feel the Noize', artist: 'Quiet Riot', duration: 288 },
      { title: 'Too Young to Fall in Love', artist: 'Mötley Crüe', duration: 213 },
      { title: 'Bark at the Moon', artist: 'Ozzy Osbourne', duration: 256 },
      { title: 'I Wanna Rock', artist: 'Twisted Sister', duration: 180 },
      { title: 'Raining Blood', artist: 'Slayer', duration: 257 }
    ]
  },
  {
    id: 'emotion_983',
    name: 'EMOTION 98.3',
    frequency: '98.3 FM',
    genre: 'POWER BALLADS & SOUL',
    dj: 'Fernando Martinez',
    description: 'Touch your heart and your soul',
    primaryColor: '#E040FB',
    accentColor: '#FF4081',
    badgeBg: 'linear-gradient(135deg, #E040FB 0%, #7B1FA2 100%)',
    logoType: 'emotion',
    tracks: [
      { title: 'Africa', artist: 'Toto', duration: 295 },
      { title: '(I Just) Died in Your Arms', artist: 'Cutting Crew', duration: 278 },
      { title: 'Waiting for a Girl Like You', artist: 'Foreigner', duration: 289 },
      { title: 'More Than This', artist: 'Roxy Music', duration: 270 },
      { title: 'Broken Wings', artist: 'Mr. Mister', duration: 336 },
      { title: 'Sister Christian', artist: 'Night Ranger', duration: 302 },
      { title: 'Tempted', artist: 'Squeeze', duration: 240 }
    ]
  },
  {
    id: 'fever_105',
    name: 'FEVER 105',
    frequency: '105.4 FM',
    genre: 'DISCO, FUNK & R&B',
    dj: 'Oliver Biscuit',
    description: 'The groove that keeps Vice City dancing',
    primaryColor: '#FFAB00',
    accentColor: '#FF3D00',
    badgeBg: 'linear-gradient(135deg, #FFD600 0%, #FF6D00 100%)',
    logoType: 'fever',
    tracks: [
      { title: 'Wanna Be Startin\' Somethin\'', artist: 'Michael Jackson', duration: 363 },
      { title: 'Get Down On It', artist: 'Kool & The Gang', duration: 292 },
      { title: 'And the Beat Goes On', artist: 'The Whispers', duration: 293 },
      { title: 'Act Like You Know', artist: 'Fat Larry\'s Band', duration: 248 },
      { title: 'Automatic', artist: 'Pointer Sisters', duration: 288 },
      { title: 'I\'ll Be Good', artist: 'René & Angela', duration: 245 },
      { title: 'All Night Long', artist: 'Mary Jane Girls', duration: 345 }
    ]
  },
  {
    id: 'wildstyle',
    name: 'WILDSTYLE PIRATE',
    frequency: '92.1 FM',
    genre: 'ELECTRO & OLD SCHOOL HIP-HOP',
    dj: 'Mr. Magic',
    description: 'Underground beats from the streets of VC',
    primaryColor: '#00E676',
    accentColor: '#FFD600',
    badgeBg: 'linear-gradient(135deg, #00E676 0%, #00B0FF 100%)',
    logoType: 'wildstyle',
    tracks: [
      { title: 'Rockit', artist: 'Herbie Hancock', duration: 326 },
      { title: 'The Message', artist: 'Grandmaster Flash & The Furious Five', duration: 431 },
      { title: 'Clear', artist: 'Cybotron', duration: 294 },
      { title: 'Hip Hop, Be Bop (Don\'t Stop)', artist: 'Man Parrish', duration: 335 },
      { title: 'Al-Naafiysh (The Soul)', artist: 'Hashim', duration: 332 },
      { title: 'Looking for the Perfect Beat', artist: 'Afrika Bambaataa', duration: 418 }
    ]
  },
  {
    id: 'espantoso',
    name: 'RADIO ESPANTOSO',
    frequency: '94.7 FM',
    genre: 'LATIN JAZZ, SALSA & MAMBO',
    dj: 'Pepe',
    description: 'El sabor latino de Vice City',
    primaryColor: '#FF6D00',
    accentColor: '#FFD600',
    badgeBg: 'linear-gradient(135deg, #FF6D00 0%, #DD2C00 100%)',
    logoType: 'espantoso',
    tracks: [
      { title: 'Super Strut', artist: 'Eumir Deodato', duration: 532 },
      { title: 'The Mohan', artist: 'Tito Puente', duration: 348 },
      { title: 'Descarga Criolla', artist: 'Ray Barretto', duration: 312 },
      { title: 'A Gozar Con Mi Combo', artist: 'Cachao', duration: 254 },
      { title: 'Me Dejo', artist: 'Tony Pabón & La Protesta', duration: 290 }
    ]
  },
  {
    id: 'kchat',
    name: 'K-CHAT',
    frequency: '107.7 FM',
    genre: 'TALK RADIO & INTERVIEWS',
    dj: 'Amy Sheckenhausen',
    description: 'Vice City\'s premier celebrity talk show',
    primaryColor: '#7C4DFF',
    accentColor: '#00E5FF',
    badgeBg: 'linear-gradient(135deg, #7C4DFF 0%, #304FFE 100%)',
    logoType: 'kchat',
    tracks: [
      { title: 'Interview: Jezz Torrent (Love Fist)', artist: 'K-Chat Celebrity Hour', duration: 420 },
      { title: 'Interview: Gethsemanee (Spiritualist)', artist: 'K-Chat Talk', duration: 380 },
      { title: 'Interview: BJ Smith (Football Legend)', artist: 'K-Chat Sports Special', duration: 410 },
      { title: 'Interview: Claude Maginot', artist: 'K-Chat Culture', duration: 395 }
    ]
  }
];
