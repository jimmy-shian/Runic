
import { useState, useCallback, useRef } from 'react';
import { GridState, Rune, RuneLevel, RuneType } from '../types';
import { GRID_SIZE, RUNE_TYPES, SCORE_TABLE } from '../constants';
import { useSound } from './useSound';

const generateRandomRune = (): Rune => ({
  id: crypto.randomUUID(),
  type: RUNE_TYPES[Math.floor(Math.random() * RUNE_TYPES.length)],
  level: RuneLevel.Drop,
  isNew: true,
});

const createInitialGrid = (): GridState => {
  return Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({
    id: i,
    x: i % GRID_SIZE,
    y: Math.floor(i / GRID_SIZE),
    rune: generateRandomRune(),
  }));
};

export const useGameLogic = () => {
  const [grid, setGrid] = useState<GridState>(createInitialGrid());
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const processingRef = useRef(false);
  const { playSound } = useSound();

  // Logic to check for connected clusters (Orthogonal Flood Fill)
  // Logic: Strict Horizontal or Vertical Line Check (No L-shapes, No Blobs)
  const findMatches = (currentGrid: GridState) => {
    const clusters: { type: RuneType; level: RuneLevel; indices: number[] }[] = [];

    // Helper to safely get rune
    const getRune = (idx: number) => {
      if (idx < 0 || idx >= currentGrid.length) return null;
      return currentGrid[idx].rune;
    };

    // 1. ----------------- Horizontal Check (橫向掃描) -----------------
    for (let y = 0; y < GRID_SIZE; y++) {
      let currentSequence: number[] = [];
      
      for (let x = 0; x < GRID_SIZE; x++) {
        const idx = y * GRID_SIZE + x;
        const rune = getRune(idx);

        if (currentSequence.length === 0) {
          if (rune) currentSequence.push(idx);
        } else {
          const prevIdx = currentSequence[currentSequence.length - 1];
          const prevRune = getRune(prevIdx);

          if (rune && prevRune && rune.type === prevRune.type && rune.level === prevRune.level) {
            // Same type/level, add to sequence
            currentSequence.push(idx);
          } else {
            // Sequence broken
            if (currentSequence.length >= 3) {
              clusters.push({
                type: prevRune!.type,
                level: prevRune!.level,
                indices: [...currentSequence],
              });
            }
            // Start new sequence
            currentSequence = rune ? [idx] : [];
          }
        }
      }
      // End of Row: check if the last sequence was a match
      if (currentSequence.length >= 3) {
        const r = getRune(currentSequence[0]);
        clusters.push({
          type: r!.type,
          level: r!.level,
          indices: [...currentSequence],
        });
      }
    }

    // 2. ----------------- Vertical Check (縱向掃描) -----------------
    for (let x = 0; x < GRID_SIZE; x++) {
      let currentSequence: number[] = [];

      for (let y = 0; y < GRID_SIZE; y++) {
        const idx = y * GRID_SIZE + x;
        const rune = getRune(idx);

        if (currentSequence.length === 0) {
          if (rune) currentSequence.push(idx);
        } else {
          const prevIdx = currentSequence[currentSequence.length - 1];
          const prevRune = getRune(prevIdx);

          if (rune && prevRune && rune.type === prevRune.type && rune.level === prevRune.level) {
            currentSequence.push(idx);
          } else {
            if (currentSequence.length >= 3) {
              clusters.push({
                type: prevRune!.type,
                level: prevRune!.level,
                indices: [...currentSequence],
              });
            }
            currentSequence = rune ? [idx] : [];
          }
        }
      }
      // End of Column check
      if (currentSequence.length >= 3) {
        const r = getRune(currentSequence[0]);
        clusters.push({
          type: r!.type,
          level: r!.level,
          indices: [...currentSequence],
        });
      }
    }

    return clusters;
  };

  const resolveBoard = useCallback(async (startGrid: GridState) => {
    processingRef.current = true;
    setIsProcessing(true);

    let activeGrid = [...startGrid];
    let stability = false;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    while (!stability) {
      // ------------------- 1. True vertical gravity -------------------
      let gridAfterGravity = [...activeGrid];
      let gravityApplied = false;

      for (let col = 0; col < GRID_SIZE; col++) {
        // 收集本欄所有非 null rune
        const runesInColumn = [];
        for (let row = 0; row < GRID_SIZE; row++) {
          const idx = row * GRID_SIZE + col;
          if (gridAfterGravity[idx].rune !== null) {
            runesInColumn.push(gridAfterGravity[idx].rune);
          }
        }

        // 計算空缺
        const emptyCount = GRID_SIZE - runesInColumn.length;

        // 最上方先補新 rune
        const newRunes = Array.from({ length: emptyCount }, () => ({
          ...generateRandomRune(),
          isNew: true,
          id: crypto.randomUUID(), // 保證唯一
        }));

        // 最終欄結果（上新 rune -> 下原有 rune）
        const finalColumn = [...newRunes, ...runesInColumn];

        // 寫回 grid
        for (let row = 0; row < GRID_SIZE; row++) {
          const idx = row * GRID_SIZE + col;
          const rune = finalColumn[row];
          gridAfterGravity[idx] = {
            ...gridAfterGravity[idx], // 保留 x,y
            rune: rune ? { ...rune, id: rune.id, isNew: rune.isNew } : null,
          };
          gravityApplied = true;
        }
      }

      if (gravityApplied) {
        setGrid(gridAfterGravity);
        activeGrid = gridAfterGravity;
        await delay(200); // 允許掉落動畫播放
      }

      // ------------------- 2. Find Matches -------------------
      const clusters = findMatches(activeGrid);

      if (clusters.length === 0) {
        stability = true;
        break;
      }

      playSound('match');
      await delay(250);

      // ------------------- 3. Process Merges -------------------
      let gridWithMerges = [...activeGrid];
      let gainedScore = 0;
      let hasHighLevelUpgrade = false;

      for (const cluster of clusters) {
        const sortedIndices = [...cluster.indices].sort((a, b) => a - b);
        const count = sortedIndices.length;

        const upgradeIndices = sortedIndices.slice(1, count - 1);
        const removeIndices = [sortedIndices[0], sortedIndices[count - 1]];

        const nextLevel = Math.min(cluster.level + 1, RuneLevel.Blade);
        const pointsPerItem = SCORE_TABLE[cluster.level];
        const clusterScore = pointsPerItem * count;

        if (nextLevel >= RuneLevel.Tome) hasHighLevelUpgrade = true;

        // 升級中間 rune
        upgradeIndices.forEach(idx => {
          gridWithMerges[idx] = {
            ...gridWithMerges[idx],
            rune: {
              id: crypto.randomUUID(),
              type: cluster.type,
              level: nextLevel,
              justMerged: true,
            },
          };
        });

        // 移除兩端 rune
        removeIndices.forEach(idx => {
          gridWithMerges[idx] = { ...gridWithMerges[idx], rune: null };
        });

        gainedScore += clusterScore;
      }

      setScore(s => s + gainedScore);
      if (gainedScore > 0) playSound(hasHighLevelUpgrade ? 'levelup' : 'merge');

      setGrid([...gridWithMerges]);
      activeGrid = gridWithMerges;
      await delay(300);
    }

    // ------------------- 4. Cleanup -------------------
    const cleanGrid = activeGrid.map(cell => ({
      ...cell,
      rune: cell.rune
        ? { ...cell.rune, justMerged: false, isNew: false }
        : null,
    }));
    setGrid(cleanGrid);

    processingRef.current = false;
    setIsProcessing(false);
  }, [score, playSound]);

  const handleInteraction = useCallback((fromId: number, toId: number) => {
    if (processingRef.current) return;

    const fX = fromId % GRID_SIZE;
    const fY = Math.floor(fromId / GRID_SIZE);
    const tX = toId % GRID_SIZE;
    const tY = Math.floor(toId / GRID_SIZE);
    const isAdjacent = Math.abs(fX - tX) + Math.abs(fY - tY) === 1;

    if (!isAdjacent) return;

    playSound('move');
    setMoves(prev => prev + 1);

    const newGrid = [...grid];
    const temp = newGrid[fromId].rune;
    newGrid[fromId].rune = newGrid[toId].rune;
    newGrid[toId].rune = temp;

    setGrid(newGrid);
    resolveBoard(newGrid);
  }, [grid, resolveBoard, playSound]);

  const handleDiscard = useCallback((fromId: number) => {
    if (processingRef.current) return;

    playSound('discard');
    setMoves(prev => prev + 1);
    
    const newGrid = [...grid];

    // 保留刪除標記
    newGrid[fromId] = {
      ...newGrid[fromId],
      rune: null,
      isDeleted: true
    };

    setGrid(newGrid);

    // 0.3 秒後清掉刪除標記，再掉落
    setTimeout(() => {
      const cleaned = newGrid.map(cell => ({ ...cell, isDeleted: false }));
      setGrid(cleaned);
      resolveBoard(cleaned);
    }, 300);
  }, [grid, resolveBoard, playSound]);

  // Shuffle existing board (maintain items)
  const reshuffleBoard = useCallback(() => {
    if (processingRef.current) return;
    
    playSound('move'); 

    const currentRunes = grid
        .map(cell => cell.rune)
        .filter((r): r is Rune => r !== null);

    // Fisher-Yates
    for (let i = currentRunes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentRunes[i], currentRunes[j]] = [currentRunes[j], currentRunes[i]];
    }

    // Fill gaps if any (shouldn't happen unless bug)
    while (currentRunes.length < GRID_SIZE * GRID_SIZE) {
        currentRunes.push(generateRandomRune());
    }

    const newGrid = grid.map((cell, index) => ({
        ...cell,
        rune: currentRunes[index]
    }));

    setGrid(newGrid);
    
    // Resolve in case shuffle created matches
    setTimeout(() => resolveBoard(newGrid), 400);

  }, [grid, playSound, resolveBoard]);

  // Completely reset game
  const resetGame = useCallback(() => {
    if(processingRef.current) return;
    playSound('levelup');
    setScore(0);
    setMoves(0);
    setGrid(createInitialGrid());
  }, [playSound]);

  return {
    grid,
    score,
    moves,
    isProcessing,
    handleInteraction,
    handleDiscard,
    reshuffleBoard,
    resetGame
  };
};
