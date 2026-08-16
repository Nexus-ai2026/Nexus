import { AccentTheme, ThemeConfig } from '../types';

export const THEME_CONFIGS: Record<AccentTheme, ThemeConfig> = {
  'neon-green': {
    id: 'neon-green',
    name: 'Neon Matrix',
    primaryHex: '#00ff66',
    glowRgb: '0, 255, 102',
    accentClass: 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(0,255,102,0.5)]',
    textNeonClass: 'text-emerald-400 text-shadow-[0_0_12px_rgba(0,255,102,0.6)]',
    borderClass: 'border-emerald-500/30 hover:border-emerald-400',
  },
  'electric-cyan': {
    id: 'electric-cyan',
    name: 'Electric Cyan',
    primaryHex: '#00f0ff',
    glowRgb: '0, 240, 255',
    accentClass: 'bg-cyan-400 text-black shadow-[0_0_20px_rgba(0,240,255,0.5)]',
    textNeonClass: 'text-cyan-400 text-shadow-[0_0_12px_rgba(0,240,255,0.6)]',
    borderClass: 'border-cyan-500/30 hover:border-cyan-400',
  },
  'cyber-lime': {
    id: 'cyber-lime',
    name: 'Cyber Lime',
    primaryHex: '#a3e635',
    glowRgb: '163, 230, 53',
    accentClass: 'bg-lime-400 text-black shadow-[0_0_20px_rgba(163,230,53,0.5)]',
    textNeonClass: 'text-lime-400 text-shadow-[0_0_12px_rgba(163,230,53,0.6)]',
    borderClass: 'border-lime-500/30 hover:border-lime-400',
  },
  'phosphor-mint': {
    id: 'phosphor-mint',
    name: 'Phosphor Mint',
    primaryHex: '#10b981',
    glowRgb: '16, 185, 129',
    accentClass: 'bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]',
    textNeonClass: 'text-emerald-300 text-shadow-[0_0_12px_rgba(16,185,129,0.6)]',
    borderClass: 'border-emerald-500/30 hover:border-emerald-300',
  },
};
