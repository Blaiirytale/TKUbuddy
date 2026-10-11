// ---------- COLOR THEMES ----------
// Every theme has the same color names, so screens can switch themes freely.
// Settings > Background lets the user pick one.

export type ThemeColors = {
  background: string; // screen background
  card: string;       // dark cards and bottom bar
  cardLight: string;  // lighter boxes inside cards
  coral: string;      // main accent: progress bar, buttons
  teal: string;       // second accent: the big + button, "added" / "complete"
  white: string;      // text and icons
  muted: string;      // softer text
  gold: string;       // "See All", tips
  grey: string;       // icon circles on cards
  sheet: string;      // login panel
  link: string;       // blue links
};

export type ThemeId = 'classic' | 'ocean' | 'matcha' | 'sakura' | 'midnight' | 'lavender';

export type Theme = {
  id: ThemeId;
  name: string;
  description: string;
  colors: ThemeColors;
};

export const THEMES: Theme[] = [
  {
    id: 'classic',
    name: 'TKU Classic',
    description: 'Brown paper with coral',
    colors: {
      background: '#A67A43',
      card: '#262422',
      cardLight: '#3B3835',
      coral: '#F25B5D',
      teal: '#35AECF',
      white: '#FFFFFF',
      muted: '#CFC8C0',
      gold: '#E9B949',
      grey: '#8A8580',
      sheet: '#5B4631',
      link: '#5BB5E8',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep blue with sunset orange',
    colors: {
      background: '#1F5577',
      card: '#0F1F2C',
      cardLight: '#203547',
      coral: '#E8693F',
      teal: '#1F9E96',
      white: '#FFFFFF',
      muted: '#B4C7D6',
      gold: '#F5C451',
      grey: '#5E7A90',
      sheet: '#163F59',
      link: '#7CC8F2',
    },
  },
  {
    id: 'matcha',
    name: 'Matcha',
    description: 'Sage green with pumpkin',
    colors: {
      background: '#4A6B45',
      card: '#1E291B',
      cardLight: '#33432F',
      coral: '#D9773A',
      teal: '#3E9B6A',
      white: '#FFFFFF',
      muted: '#C6D2BF',
      gold: '#F0DB82',
      grey: '#6F8669',
      sheet: '#38532F',
      link: '#9AD3F0',
    },
  },
  {
    id: 'sakura',
    name: 'Sakura Night',
    description: 'Plum with blossom pink',
    colors: {
      background: '#7A3F63',
      card: '#28161F',
      cardLight: '#43293A',
      coral: '#E0507F',
      teal: '#3A9AB5',
      white: '#FFFFFF',
      muted: '#E3CCDA',
      gold: '#F3C76B',
      grey: '#93718A',
      sheet: '#5C2E4A',
      link: '#9FD3FF',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark mode, easy on the eyes',
    colors: {
      background: '#121317',
      card: '#262932',
      cardLight: '#363943',
      coral: '#F25B5D',
      teal: '#2E9BC0',
      white: '#FFFFFF',
      muted: '#B9BCC6',
      gold: '#E9B949',
      grey: '#5D616D',
      sheet: '#1E2027',
      link: '#6CBEEB',
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    description: 'Soft purple with mint',
    colors: {
      background: '#544A86',
      card: '#1F1B33',
      cardLight: '#342E52',
      coral: '#E86A5C',
      teal: '#3E9C8F',
      white: '#FFFFFF',
      muted: '#CFC9E6',
      gold: '#F2CB63',
      grey: '#7A70A8',
      sheet: '#433A70',
      link: '#9CCBFF',
    },
  },
];

// The original TKU colors. The login screen still uses these,
// so the app always opens with the TKU look before you log in.
export const Colors = THEMES[0].colors;
