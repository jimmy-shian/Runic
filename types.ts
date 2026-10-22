
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
  fallRows?: number;
}

export interface Cell {
  id: number; // 0-35
  x: number;
  y: number;
  rune: Rune | null;
  isDeleted?: boolean;
  clearFx?: boolean;
}

export type GridState = Cell[];

export interface SwapSignal {
  cellA: number;
  cellB: number;
  seq: number;
  valid: boolean;
}

export type SoundType = 'move' | 'match' | 'merge' | 'discard' | 'invalid' | 'levelup' | 'blast' | 'click';
