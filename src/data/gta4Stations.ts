import type { RadioStation } from '../types/radio';

// Archive.org metadata: https://archive.org/metadata/GTA_iv_Radio
// Indexed reggae: https://archive.org/metadata/gta-iv-tuff-gong-radio-tracks-seperated
// Durations preserve source MP3 metadata precision; broadcasts are not individual songs.
// Classics, Journey, Jazz Nation and Vibe have no verified per-song files or chapters.
// Keep their complete recordings (including DJ breaks), never estimated song timelines.
export const GTA4_MANIFEST: Record<string, {
  filename: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
}[]> = {
  gta4_classics: [
    { filename: "The Classics 104.1.mp3", title: "The Classics 104.1 — Full Broadcast", artist: "DJ Premier", duration: 1734.95, url: "https://archive.org/download/GTA_iv_Radio/The%20Classics%20104.1.mp3" }
  ],
  gta4_journey: [
    { filename: "The Journey.mp3", title: "The Journey — Full Broadcast", artist: "Fruit computer", duration: 1935.65, url: "https://archive.org/download/GTA_iv_Radio/The%20Journey.mp3" }
  ],
  gta4_jazz: [
    { filename: "Jazz Nation Radio 108.5.mp3", title: "Jazz Nation Radio 108.5 — Full Broadcast", artist: "Roy Haynes", duration: 2418.44, url: "https://archive.org/download/GTA_iv_Radio/Jazz%20Nation%20Radio%20108.5.mp3" }
  ],
  gta4_vibe: [
    { filename: "The Vibe 98.8.mp3", title: "The Vibe 98.8 — Full Broadcast", artist: "Vaughn Harper", duration: 4569.08, url: "https://archive.org/download/GTA_iv_Radio/The%20Vibe%2098.8.mp3" }
  ],
  gta4_integrity: [
    { filename: "Integrity 2.0.mp3", title: "Integrity 2.0 — Lazlow's Talk Show", artist: "Lazlow Jones", duration: 3289.36, url: "https://archive.org/download/GTA_iv_Radio/Integrity%202.0.mp3" }
  ],
  gta4_tuff_gong: [
    { filename: "01 Radio Break 1.mp3", title: "Radio Break 1", artist: "Rockstar Games", duration: 60, url: "https://archive.org/download/gta-iv-tuff-gong-radio-tracks-seperated/01%20Radio%20Break%201.mp3" },
    { filename: "02 Chase Dem.mp3", title: "Chase Dem", artist: "Stephen Marley", duration: 207, url: "https://archive.org/download/gta-iv-tuff-gong-radio-tracks-seperated/02%20Chase%20Dem.mp3" },
    { filename: "03 Radio Break 2.mp3", title: "Radio Break 2", artist: "Rockstar Games", duration: 61, url: "https://archive.org/download/gta-iv-tuff-gong-radio-tracks-seperated/03%20Radio%20Break%202.mp3" },
    { filename: "04 Concrete Jungle.mp3", title: "Concrete Jungle", artist: "Bob Marley & The Wailers", duration: 224, url: "https://archive.org/download/gta-iv-tuff-gong-radio-tracks-seperated/04%20Concrete%20Jungle.mp3" },
    { filename: "05 Radio Break 3.mp3", title: "Radio Break 3", artist: "Rockstar Games", duration: 62, url: "https://archive.org/download/gta-iv-tuff-gong-radio-tracks-seperated/05%20Radio%20Break%203.mp3" },
    { filename: "06 Pimper's Paradise.mp3", title: "Pimper's Paradise", artist: "Bob Marley & The Wailers", duration: 186, url: "https://archive.org/download/gta-iv-tuff-gong-radio-tracks-seperated/06%20Pimper's%20Paradise.mp3" },
    { filename: "07 Radio Break 4.mp3", title: "Radio Break 4", artist: "Rockstar Games", duration: 84, url: "https://archive.org/download/gta-iv-tuff-gong-radio-tracks-seperated/07%20Radio%20Break%204.mp3" },
    { filename: "08 Rat Race.mp3", title: "Rat Race", artist: "Bob Marley & The Wailers", duration: 158, url: "https://archive.org/download/gta-iv-tuff-gong-radio-tracks-seperated/08%20Rat%20Race.mp3" },
    { filename: "09 Radio Break 5.mp3", title: "Radio Break 5", artist: "Rockstar Games", duration: 46, url: "https://archive.org/download/gta-iv-tuff-gong-radio-tracks-seperated/09%20Radio%20Break%205.mp3" },
    { filename: "10 Rebel Music (3 O'Clock Roadblock).mp3", title: "Rebel Music (3 O'Clock Roadblock)", artist: "Bob Marley & The Wailers", duration: 198, url: "https://archive.org/download/gta-iv-tuff-gong-radio-tracks-seperated/10%20Rebel%20Music%20(3%20O'Clock%20Roadblock).mp3" },
    { filename: "11 Radio Break 6.mp3", title: "Radio Break 6", artist: "Rockstar Games", duration: 54, url: "https://archive.org/download/gta-iv-tuff-gong-radio-tracks-seperated/11%20Radio%20Break%206.mp3" },
    { filename: "12 Satisfy My Soul.mp3", title: "Satisfy My Soul", artist: "Bob Marley & The Wailers", duration: 241, url: "https://archive.org/download/gta-iv-tuff-gong-radio-tracks-seperated/12%20Satisfy%20My%20Soul.mp3" },
    { filename: "13 Radio Break 7.mp3", title: "Radio Break 7", artist: "Rockstar Games", duration: 127, url: "https://archive.org/download/gta-iv-tuff-gong-radio-tracks-seperated/13%20Radio%20Break%207.mp3" },
    { filename: "14 So Much Trouble In The World.mp3", title: "So Much Trouble In The World", artist: "Bob Marley & The Wailers", duration: 203, url: "https://archive.org/download/gta-iv-tuff-gong-radio-tracks-seperated/14%20So%20Much%20Trouble%20In%20The%20World.mp3" },
    { filename: "15 Radio Break 8.mp3", title: "Radio Break 8", artist: "Rockstar Games", duration: 55, url: "https://archive.org/download/gta-iv-tuff-gong-radio-tracks-seperated/15%20Radio%20Break%208.mp3" },
    { filename: "16 Stand Up Jamrock.mp3", title: "Stand Up Jamrock", artist: "Bob Marley & The Wailers", duration: 262, url: "https://archive.org/download/gta-iv-tuff-gong-radio-tracks-seperated/16%20Stand%20Up%20Jamrock.mp3" },
    { filename: "17 Radio Break 9.mp3", title: "Radio Break 9", artist: "Rockstar Games", duration: 36, url: "https://archive.org/download/gta-iv-tuff-gong-radio-tracks-seperated/17%20Radio%20Break%209.mp3" },
    { filename: "18 Wake Up And Live Pts. 1 & 2.mp3", title: "Wake Up And Live Pts. 1 & 2", artist: "Bob Marley & The Wailers", duration: 192, url: "https://archive.org/download/gta-iv-tuff-gong-radio-tracks-seperated/18%20Wake%20Up%20And%20Live%20Pts.%201%20%26%202.mp3" },
    { filename: "19 Radio Break 10.mp3", title: "Radio Break 10", artist: "Rockstar Games", duration: 18, url: "https://archive.org/download/gta-iv-tuff-gong-radio-tracks-seperated/19%20Radio%20Break%2010.mp3" }
  ]
};

export const GTA4_STATIONS: RadioStation[] = [
  {
    id: "gta4_classics",
    name: "THE CLASSICS 104.1",
    frequency: "104.1 FM",
    genre: "OLD-SCHOOL HIP-HOP",
    dj: "DJ Premier",
    description: "Liberty City golden-era hip-hop. Full broadcast; individual song metadata unavailable.",
    primaryColor: "#e4b961",
    accentColor: "#fff0c2",
    badgeBg: "linear-gradient(135deg, #e4b961 0%, #171c19 100%)",
    logoType: 'vcpr',
    tracks: GTA4_MANIFEST.gta4_classics
  },
  {
    id: "gta4_journey",
    name: "THE JOURNEY",
    frequency: "LIBERTY CITY",
    genre: "AMBIENT & DOWNTEMPO",
    dj: "The Computer",
    description: "A quiet frequency above the city. Full broadcast; individual song metadata unavailable.",
    primaryColor: "#85b9d0",
    accentColor: "#dfedf4",
    badgeBg: "linear-gradient(135deg, #85b9d0 0%, #171c19 100%)",
    logoType: 'vcpr',
    tracks: GTA4_MANIFEST.gta4_journey
  },
  {
    id: "gta4_jazz",
    name: "JAZZ NATION RADIO",
    frequency: "108.5 FM",
    genre: "JAZZ & BEBOP",
    dj: "Roy Haynes",
    description: "After-hours jazz for the boroughs. Full broadcast; individual song metadata unavailable.",
    primaryColor: "#cf945e",
    accentColor: "#f8dcb3",
    badgeBg: "linear-gradient(135deg, #cf945e 0%, #171c19 100%)",
    logoType: 'vcpr',
    tracks: GTA4_MANIFEST.gta4_jazz
  },
  {
    id: "gta4_vibe",
    name: "THE VIBE 98.8",
    frequency: "98.8 FM",
    genre: "SOUL & R&B",
    dj: "Vaughn Harper",
    description: "Soul after dark, straight from Liberty City. Full broadcast; individual song metadata unavailable.",
    primaryColor: "#bc91ba",
    accentColor: "#f3d6e9",
    badgeBg: "linear-gradient(135deg, #bc91ba 0%, #171c19 100%)",
    logoType: 'vcpr',
    tracks: GTA4_MANIFEST.gta4_vibe
  },
  {
    id: "gta4_integrity",
    name: "INTEGRITY 2.0",
    frequency: "LIBERTY CITY",
    genre: "STREET TALK RADIO",
    dj: "Lazlow Jones",
    description: "Lazlow's complete street-interview talk show, not a music playlist.",
    primaryColor: "#d7ddd7",
    accentColor: "#a8c191",
    badgeBg: "linear-gradient(135deg, #d7ddd7 0%, #171c19 100%)",
    logoType: 'vcpr',
    tracks: GTA4_MANIFEST.gta4_integrity
  },
  {
    id: "gta4_tuff_gong",
    name: "TUFF GONG RADIO",
    frequency: "LIBERTY CITY",
    genre: "ROOTS REGGAE",
    dj: "Carl Bradshaw",
    description: "GTA IV reggae selections with the original radio breaks, individually indexed.",
    primaryColor: "#b3c765",
    accentColor: "#efd987",
    badgeBg: "linear-gradient(135deg, #b3c765 0%, #171c19 100%)",
    logoType: 'vcpr',
    tracks: GTA4_MANIFEST.gta4_tuff_gong
  }
];
