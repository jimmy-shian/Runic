import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { createInitialGrid, findMatches, useGameLogic } from '../hooks/useGameLogic';
import { GridState, RuneLevel, RuneType } from '../types';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

test('1000 openings contain 36 unique runes, no matches, and no spawn flags', () => {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const grid = createInitialGrid();
    assert.equal(grid.length, 36);
    assert.equal(new Set(grid.map(cell => cell.rune.id)).size, 36);
    assert.equal(findMatches(grid).length, 0);
    assert.ok(grid.every(cell => !cell.rune.isNew));
  }
});

test('opening terminates with a constant random source', () => {
  const original = Math.random;
  try {
    Math.random = () => 0;
    assert.equal(findMatches(createInitialGrid()).length, 0);
  } finally { Math.random = original; }
});

const fixture = (): GridState => Array.from({ length: 36 }, (_, id) => ({
  id, x: id % 6, y: Math.floor(id / 6), rune: {
    id: String(id), type: Object.values(RuneType)[(id % 6 + Math.floor(id / 6) * 2) % 5], level: RuneLevel.Drop,
  },
}));

test('match finder accepts horizontal, vertical, T-shaped and Lv5 lines but excludes row wrapping', () => {
  let grid = fixture();
  [0, 1, 2, 7, 13].forEach(id => grid[id].rune = { ...grid[id].rune, type: RuneType.Fire, level: 5 });
  assert.deepEqual(findMatches(grid).map(cluster => [...cluster.indices].sort((a,b) => a-b)), [[0,1,2,7,13]]);
  grid = fixture();
  [5,6,7].forEach(id => grid[id].rune = { ...grid[id].rune, type: RuneType.Fire, level: 4 });
  assert.equal(findMatches(grid).length, 0);
});

test('nonadjacent moves are ignored; adjacent moves without a match persist and count exactly one step', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let game: ReturnType<typeof useGameLogic>;
  const sounds: string[] = [];
  const play = (sound: string) => sounds.push(sound);
  const Probe = () => { game = useGameLogic(play); return null; };
  let renderer: ReturnType<typeof create>;
  await act(async () => { renderer = create(React.createElement(Probe)); });
  const original = game.grid;
  let invalid: [number, number] | undefined;
  for (let a = 0; a < 36; a++) {
    for (const b of [a % 6 < 5 ? a+1 : -1, a+6 < 36 ? a+6 : -1]) {
      if (b < 0) continue;
      const swap = original.map(cell => cell.id === a ? { ...cell, rune: original[b].rune } : cell.id === b ? { ...cell, rune: original[a].rune } : cell);
      if (!findMatches(swap).length) invalid = [a,b];
    }
  }
  assert.ok(invalid);
  await act(async () => game.handleInteraction(0, 2));
  assert.equal(game.grid, original);
  assert.equal(game.moves, 0);
  assert.equal(game.swapSignal, null);
  assert.equal(sounds.length, 0);
  {
    const [a,b] = invalid;
    const oldA = original[a].rune;
    await act(async () => { game.handleInteraction(a,b); game.handleInteraction(a,b); });
    assert.equal(game.moves, 1);
    assert.equal(game.grid[a].rune, original[b].rune);
    assert.equal(original[a].rune, oldA);
    assert.notEqual(game.grid[a], original[a]);
    assert.equal(game.isProcessing, true);
    await act(async () => context.mock.timers.tick(200));
    assert.equal(game.isProcessing, false);
    assert.equal(findMatches(game.grid).length, 0);
    assert.equal(game.grid[a].rune.id, original[b].rune.id);
    assert.equal(game.grid[b].rune.id, original[a].rune.id);
    assert.equal(game.score, 0);
  }
  await act(async () => game.resetGame());
  assert.equal(game.moves, 0);
  assert.equal(findMatches(game.grid).length, 0);
  await act(async () => renderer.unmount());
});

test('matched runes animate their exit before removal, then settle without duplicate IDs', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let game: ReturnType<typeof useGameLogic>;
  const sounds: string[] = [];
  const play = (sound: string) => sounds.push(sound);
  const Probe = () => { game = useGameLogic(play); return null; };
  let renderer: ReturnType<typeof create>;
  const originalRandom = Math.random;
  try {
    Math.random = () => 0;
    await act(async () => { renderer = create(React.createElement(Probe)); });
  } finally { Math.random = originalRandom; }
  await act(async () => game.handleInteraction(2, 3));
  assert.equal(game.moves, 1);
  await act(async () => context.mock.timers.tick(200));
  await act(async () => context.mock.timers.tick(200));
  assert.ok(game.grid.some(cell => cell.clearFx && cell.rune));
  for (let round = 0; round < 100 && game.isProcessing; round++) {
    await act(async () => context.mock.timers.tick(1000));
  }
  assert.equal(game.isProcessing, false);
  assert.equal(findMatches(game.grid).length, 0);
  assert.equal(new Set(game.grid.map(cell => cell.rune.id)).size, 36);
  assert.ok(game.score > 0);
  assert.ok(sounds.includes('merge'));
  await act(async () => renderer.unmount());
});
