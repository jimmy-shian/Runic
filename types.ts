
export enum RuneType {
  Fire = 'Fire',
  Water = 'Water',
  Wood = 'Wood',
  Earth = 'Earth',
  Lightning = 'Lightning',
}

export enum RuneLevel {
  Drop = 1,   // Basic
  Gem = 2,    // Refined
  Crystal = 3,// Pure
  Tome = 4,   // Knowledge
  Blade = 5   // Ultimate
}

export interface Rune {
  id: string;
  type: RuneType;
  level: RuneLevel;
  isNew?: boolean; // Flag for spawn animation
  justMerged?: boolean; // Flag for merge animation
}

export interface Cell {
  id: number; // 0-35
  x: number;
  y: number;
  rune: Rune | null;
  isDeleted?: boolean;
}

export type GridState = Cell[];

export interface GameState {
  grid: GridState;
  score: number;
  moves: number;
  combo: number;
  draggedRuneId: string | null;
  isProcessing: boolean;
}

export type Theme = 'runic' | 'elemental';

export interface LeaderboardEntry {
  date: string;
  score: number;
  moves: number;
}

export type SoundType = 'move' | 'match' | 'merge' | 'discard' | 'invalid' | 'levelup';
