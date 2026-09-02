import { OnDemandAlbum } from '../types/radio';

export const ON_DEMAND_ALBUMS: OnDemandAlbum[] = [
  {
    id: 'vc_greatest',
    title: 'VICE CITY: GREATEST HITS',
    artistOrCurator: 'ROCKSTAR GAMES SOUNDTRACK',
    genre: '80s ESSENTIALS',
    coverType: 'mixtape',
    primaryColor: '#FF2A85',
    tracks: [
      { title: 'Billie Jean', artist: 'Michael Jackson', duration: 294 },
      { title: 'Out of Touch', artist: 'Daryl Hall & John Oates', duration: 248 },
      { title: 'Africa', artist: 'Toto', duration: 295 },
      { title: 'Blue Monday', artist: 'New Order', duration: 449 },
      { title: 'You\'ve Got Another Thing Comin\'', artist: 'Judas Priest', duration: 304 },
      { title: 'Self Control', artist: 'Laura Branigan', duration: 247 },
      { title: 'Get Down On It', artist: 'Kool & The Gang', duration: 292 },
      { title: 'Rockit', artist: 'Herbie Hancock', duration: 326 }
    ]
  },
  {
    id: 'flash_pop',
    title: 'FLASH FM: POP SELECTION',
    artistOrCurator: 'CURATED BY DJ TONI',
    genre: 'DANCE POP & SYNTHWAVE',
    coverType: 'pop',
    primaryColor: '#E91E63',
    tracks: [
      { title: 'Self Control', artist: 'Laura Branigan', duration: 247 },
      { title: 'Billie Jean', artist: 'Michael Jackson', duration: 294 },
      { title: 'Out of Touch', artist: 'Daryl Hall & John Oates', duration: 248 },
      { title: 'Call Me', artist: 'Go West', duration: 254 },
      { title: 'Running with the Night', artist: 'Lionel Richie', duration: 359 },
      { title: 'Video Killed the Radio Star', artist: 'The Buggles', duration: 204 }
    ]
  },
  {
    id: 'vrock_metal',
    title: 'V-ROCK: HEAVY METAL VAULT',
    artistOrCurator: 'CURATED BY LAZLOW',
    genre: 'HARD ROCK & SPEED METAL',
    coverType: 'rock',
    primaryColor: '#D32F2F',
    tracks: [
      { title: 'You\'ve Got Another Thing Comin\'', artist: 'Judas Priest', duration: 304 },
      { title: '2 Minutes to Midnight', artist: 'Iron Maiden', duration: 360 },
      { title: 'Peace Sells', artist: 'Megadeth', duration: 242 },
      { title: 'Cum On Feel the Noize', artist: 'Quiet Riot', duration: 288 },
      { title: 'Bark at the Moon', artist: 'Ozzy Osbourne', duration: 256 },
      { title: 'I Wanna Rock', artist: 'Twisted Sister', duration: 180 }
    ]
  },
  {
    id: 'wave_synth',
    title: 'WAVE 103: NEW WAVE TAPES',
    artistOrCurator: 'CURATED BY ADAM FIRST',
    genre: 'SYNTHPOP & POST-PUNK',
    coverType: 'synth',
    primaryColor: '#00E5FF',
    tracks: [
      { title: 'Blue Monday', artist: 'New Order', duration: 449 },
      { title: 'Atomic', artist: 'Blondie', duration: 280 },
      { title: 'Cars', artist: 'Gary Numan', duration: 236 },
      { title: 'Pale Shelter', artist: 'Tears for Fears', duration: 264 },
      { title: 'Gold', artist: 'Spandau Ballet', duration: 231 },
      { title: 'Kids in America', artist: 'Kim Wilde', duration: 206 }
    ]
  },
  {
    id: 'emotion_ballads',
    title: 'EMOTION: POWER BALLADS',
    artistOrCurator: 'CURATED BY FERNANDO MARTINEZ',
    genre: 'SLOW JAM & LOVE ROCK',
    coverType: 'ballads',
    primaryColor: '#9C27B0',
    tracks: [
      { title: 'Africa', artist: 'Toto', duration: 295 },
      { title: '(I Just) Died in Your Arms', artist: 'Cutting Crew', duration: 278 },
      { title: 'Waiting for a Girl Like You', artist: 'Foreigner', duration: 289 },
      { title: 'More Than This', artist: 'Roxy Music', duration: 270 },
      { title: 'Broken Wings', artist: 'Mr. Mister', duration: 336 }
    ]
  },
  {
    id: 'fever_disco',
    title: 'FEVER 105: SOUL & DISCO',
    artistOrCurator: 'CURATED BY OLIVER BISCUIT',
    genre: 'DISCO & FUNK CLASSICS',
    coverType: 'disco',
    primaryColor: '#FF9800',
    tracks: [
      { title: 'Wanna Be Startin\' Somethin\'', artist: 'Michael Jackson', duration: 363 },
      { title: 'Get Down On It', artist: 'Kool & The Gang', duration: 292 },
      { title: 'And the Beat Goes On', artist: 'The Whispers', duration: 293 },
      { title: 'Automatic', artist: 'Pointer Sisters', duration: 288 },
      { title: 'All Night Long', artist: 'Mary Jane Girls', duration: 345 }
    ]
  },
  {
    id: 'user_custom',
    title: 'CUSTOM CASSETTE MIXTAPE',
    artistOrCurator: 'MY PERSONAL MUSIC FOLDER',
    genre: 'USER TRACKS (DRAG & DROP)',
    coverType: 'custom',
    primaryColor: '#607D8B',
    tracks: [
      { title: 'Track 01 - Vice Drive', artist: 'User Playlist', duration: 215 },
      { title: 'Track 02 - Ocean Beach Sunset', artist: 'User Playlist', duration: 198 },
      { title: 'Track 03 - Starfish Island Night', artist: 'User Playlist', duration: 242 }
    ]
  }
];
