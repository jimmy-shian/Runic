
import React from 'react';
import { RuneType, RuneLevel } from './types';
import { Droplets, Hexagon, Diamond, BookOpen, Sword, Flame, Leaf, Mountain, Zap, Shield } from 'lucide-react';

export const GRID_SIZE = 6;

export const RUNE_TYPES = [
  RuneType.Fire,
  RuneType.Water,
  RuneType.Wood,
  RuneType.Earth,
  RuneType.Lightning,
];

// Vivid, Saturated Colors for distinct visibility
// Red, Blue, Green, Yellow, Purple
export const TYPE_CONFIG: Record<RuneType, { 
  color: string; 
  bg: string;
  glow: string; 
  icon: React.ElementType; 
  gradient: string;
  border: string;
  solidColor: string; // 用於純色填充
}> = {
  [RuneType.Fire]: { 
    color: 'text-red-500', 
    bg: 'bg-red-600',
    glow: 'shadow-red-500/80', 
    icon: Flame, 
    gradient: 'from-red-500 to-orange-600',
    border: 'border-red-400',
    solidColor: '#ef4444'
  },
  [RuneType.Water]: { 
    color: 'text-blue-500', 
    bg: 'bg-blue-600',
    glow: 'shadow-blue-500/80', 
    icon: Droplets, 
    gradient: 'from-blue-500 to-cyan-600',
    border: 'border-blue-400',
    solidColor: '#3b82f6'
  },
  [RuneType.Wood]: { 
    color: 'text-emerald-500', 
    bg: 'bg-emerald-600',
    glow: 'shadow-emerald-500/80', 
    icon: Leaf, 
    gradient: 'from-emerald-500 to-green-600',
    border: 'border-emerald-400',
    solidColor: '#10b981'
  },
  [RuneType.Earth]: { 
    color: 'text-yellow-500', 
    bg: 'bg-yellow-600',
    glow: 'shadow-yellow-500/80', 
    icon: Mountain, 
    gradient: 'from-yellow-400 to-amber-500',
    border: 'border-yellow-400',
    solidColor: '#eab308'
  },
  [RuneType.Lightning]: { 
    color: 'text-purple-500', 
    bg: 'bg-purple-600',
    glow: 'shadow-purple-500/80', 
    icon: Zap, 
    gradient: 'from-purple-500 to-fuchsia-600',
    border: 'border-purple-400',
    solidColor: '#a855f7'
  },
};

export const LEVEL_CONFIG: Record<RuneLevel, { name: string; scale: string; icon: React.ElementType }> = {
  [RuneLevel.Drop]: { name: 'Essence', scale: 'scale-100', icon: Hexagon },
  [RuneLevel.Gem]: { name: 'Gem', scale: 'scale-100', icon: Shield },
  [RuneLevel.Crystal]: { name: 'Crystal', scale: 'scale-100', icon: Diamond },
  [RuneLevel.Tome]: { name: 'Grimoire', scale: 'scale-100', icon: BookOpen },
  [RuneLevel.Blade]: { name: 'Soulblade', scale: 'scale-100', icon: Sword },
};

// 簡單計分規則：Lv1=1, Lv2=2, Lv3=3, Lv4=4
// Lv5 額外計算 (Bonus)
export const SCORE_TABLE: Record<number, number> = {
  [RuneLevel.Drop]: 1,
  [RuneLevel.Gem]: 2,
  [RuneLevel.Crystal]: 3,
  [RuneLevel.Tome]: 4,
  [RuneLevel.Blade]: 5, // 基礎分，通常會有額外 Bonus
};

export const LV5_BONUS_SCORE = 10;

export const SOUND_FREQS = {
  move: [300, 400],
  match: [400, 600, 800],
  merge: [300, 200],
  discard: [150, 100],
  invalid: [150, 150],
  levelup: [500, 800, 1200],
};
