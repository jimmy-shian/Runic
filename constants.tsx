
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
}> = {
  [RuneType.Fire]: { 
    color: 'text-red-100', 
    bg: 'bg-red-600',
    glow: 'shadow-red-500/80', 
    icon: Flame, 
    gradient: 'from-red-600 to-orange-600',
    border: 'border-red-400'
  },
  [RuneType.Water]: { 
    color: 'text-blue-100', 
    bg: 'bg-blue-600',
    glow: 'shadow-blue-500/80', 
    icon: Droplets, 
    gradient: 'from-blue-600 to-cyan-600',
    border: 'border-blue-400'
  },
  [RuneType.Wood]: { 
    color: 'text-green-100', 
    bg: 'bg-green-600',
    glow: 'shadow-green-500/80', 
    icon: Leaf, 
    gradient: 'from-green-600 to-emerald-600',
    border: 'border-green-400'
  },
  [RuneType.Earth]: { 
    color: 'text-yellow-100', 
    bg: 'bg-yellow-600',
    glow: 'shadow-yellow-500/80', 
    icon: Mountain, 
    gradient: 'from-yellow-600 to-amber-600',
    border: 'border-yellow-400'
  },
  [RuneType.Lightning]: { 
    color: 'text-purple-100', 
    bg: 'bg-purple-600',
    glow: 'shadow-purple-500/80', 
    icon: Zap, 
    gradient: 'from-purple-600 to-fuchsia-600',
    border: 'border-purple-400'
  },
};

export const LEVEL_CONFIG: Record<RuneLevel, { name: string; scale: string; icon: React.ElementType }> = {
  [RuneLevel.Drop]: { name: 'Essence', scale: 'scale-100', icon: Hexagon },
  [RuneLevel.Gem]: { name: 'Gem', scale: 'scale-100', icon: Shield },
  [RuneLevel.Crystal]: { name: 'Crystal', scale: 'scale-100', icon: Diamond },
  [RuneLevel.Tome]: { name: 'Grimoire', scale: 'scale-100', icon: BookOpen },
  [RuneLevel.Blade]: { name: 'Soulblade', scale: 'scale-100', icon: Sword },
};

export const SCORE_TABLE: Record<RuneLevel, number> = {
  [RuneLevel.Drop]: 10,
  [RuneLevel.Gem]: 50,
  [RuneLevel.Crystal]: 150,
  [RuneLevel.Tome]: 500,
  [RuneLevel.Blade]: 2000,
};

export const SOUND_FREQS = {
  move: [300, 400],
  match: [400, 600, 800],
  merge: [300, 200],
  discard: [150, 100],
  invalid: [150, 150],
  levelup: [500, 800, 1200],
};
