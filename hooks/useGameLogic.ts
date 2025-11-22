import { useState, useCallback, useRef } from 'react';
import { GridState, Rune, RuneLevel, RuneType } from '../types';
import { GRID_SIZE, RUNE_TYPES, SCORE_TABLE } from '../constants';
import { useSound } from './useSound';

// 1. 定義初始的統計資料結構 (5屬性 x 5等級)
// 結構範例: { Fire: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, Water: ... }
const createInitialStats = () => {
  const stats: Record<string, Record<number, number>> = {};
  RUNE_TYPES.forEach(type => {
    stats[type] = {};
    // 建立 Lv1 到 Lv5 的計數器 (雖然 Lv1 通常是掉落，但預留欄位保持表格完整)
    [1, 2, 3, 4, 5].forEach(level => {
      stats[type][level] = 0;
    });
  });
  return stats as Record<RuneType, Record<RuneLevel, number>>;
};

// Generate helper... (省略 generateRandomRune 與 createInitialGrid，保持原樣)
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
  
  // 2. [新增] 詳細的合成統計 State
  const [runeStats, setRuneStats] = useState(createInitialStats());

  const processingRef = useRef(false);
  const { playSound } = useSound();

  // ... (findMatches 保持不變) ...
  const findMatches = (currentGrid: GridState) => {
    const clusters: { type: RuneType; level: RuneLevel; indices: number[] }[] = [];
    const getRune = (idx: number) => (idx >= 0 && idx < currentGrid.length) ? currentGrid[idx].rune : null;

    // Horizontal Check
    for (let y = 0; y < GRID_SIZE; y++) {
      let currentSequence: number[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        const idx = y * GRID_SIZE + x;
        const rune = getRune(idx);
        if (currentSequence.length === 0) {
          if (rune) currentSequence.push(idx);
        } else {
          const prevRune = getRune(currentSequence[currentSequence.length - 1]);
          if (rune && prevRune && rune.type === prevRune.type && rune.level === prevRune.level) {
            currentSequence.push(idx);
          } else {
            if (currentSequence.length >= 3) {
              clusters.push({ type: prevRune!.type, level: prevRune!.level, indices: [...currentSequence] });
            }
            currentSequence = rune ? [idx] : [];
          }
        }
      }
      if (currentSequence.length >= 3) {
        const r = getRune(currentSequence[0]);
        clusters.push({ type: r!.type, level: r!.level, indices: [...currentSequence] });
      }
    }

    // Vertical Check
    for (let x = 0; x < GRID_SIZE; x++) {
      let currentSequence: number[] = [];
      for (let y = 0; y < GRID_SIZE; y++) {
        const idx = y * GRID_SIZE + x;
        const rune = getRune(idx);
        if (currentSequence.length === 0) {
          if (rune) currentSequence.push(idx);
        } else {
          const prevRune = getRune(currentSequence[currentSequence.length - 1]);
          if (rune && prevRune && rune.type === prevRune.type && rune.level === prevRune.level) {
            currentSequence.push(idx);
          } else {
            if (currentSequence.length >= 3) {
              clusters.push({ type: prevRune!.type, level: prevRune!.level, indices: [...currentSequence] });
            }
            currentSequence = rune ? [idx] : [];
          }
        }
      }
      if (currentSequence.length >= 3) {
        const r = getRune(currentSequence[0]);
        clusters.push({ type: r!.type, level: r!.level, indices: [...currentSequence] });
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
      // Gravity Logic ... (保持不變)
      let gridAfterGravity = [...activeGrid];
      let gravityApplied = false;
      for (let col = 0; col < GRID_SIZE; col++) {
        const runesInColumn = [];
        for (let row = 0; row < GRID_SIZE; row++) {
          const idx = row * GRID_SIZE + col;
          if (gridAfterGravity[idx].rune !== null) runesInColumn.push(gridAfterGravity[idx].rune);
        }
        const emptyCount = GRID_SIZE - runesInColumn.length;
        const newRunes = Array.from({ length: emptyCount }, () => ({ ...generateRandomRune(), isNew: true, id: crypto.randomUUID() }));
        const finalColumn = [...newRunes, ...runesInColumn];
        for (let row = 0; row < GRID_SIZE; row++) {
          const idx = row * GRID_SIZE + col;
          const rune = finalColumn[row];
          gridAfterGravity[idx] = { ...gridAfterGravity[idx], rune: rune ? { ...rune, id: rune.id, isNew: rune.isNew } : null };
          gravityApplied = true;
        }
      }
      if (gravityApplied) {
        setGrid(gridAfterGravity);
        activeGrid = gridAfterGravity;
        await delay(200);
      }

      const clusters = findMatches(activeGrid);
      if (clusters.length === 0) {
        stability = true;
        break;
      }

      playSound('match');
      await delay(250);

      let gridWithMerges = [...activeGrid];
      let gainedScore = 0;
      let hasHighLevelUpgrade = false;

      // 3. [新增] 暫存本輪合成數據
      const roundStatsUpdates: { type: RuneType, level: RuneLevel }[] = [];

      for (const cluster of clusters) {
        const sortedIndices = [...cluster.indices].sort((a, b) => a - b);
        const count = sortedIndices.length;
        const upgradeIndices = sortedIndices.slice(1, count - 1);
        const removeIndices = [sortedIndices[0], sortedIndices[count - 1]];

        // 計算合成後的目標等級
        const nextLevel = Math.min(cluster.level + 1, RuneLevel.Blade);
        if (nextLevel >= RuneLevel.Tome) hasHighLevelUpgrade = true;
        
        // 分數計算
        gainedScore += SCORE_TABLE[cluster.level] * count;

        // 記錄合成：我們記錄「產出」了什麼符文
        // 例如：3個 Lv1 合成，產出 1個 Lv2 -> 記錄 Lv2 +1
        upgradeIndices.forEach(() => {
             roundStatsUpdates.push({ type: cluster.type, level: nextLevel as RuneLevel });
        });

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

        removeIndices.forEach(idx => {
          gridWithMerges[idx] = { ...gridWithMerges[idx], rune: null };
        });
      }

      // 4. [新增] 更新統計 State
      if (roundStatsUpdates.length > 0) {
          setRuneStats(prev => {
              const newStats = { ...prev };
              // 深拷貝以觸發 React 更新
              RUNE_TYPES.forEach(t => newStats[t] = { ...prev[t] });
              
              roundStatsUpdates.forEach(({ type, level }) => {
                  newStats[type][level] += 1;
              });
              return newStats;
          });
      }

      setScore(s => s + gainedScore);
      if (gainedScore > 0) playSound(hasHighLevelUpgrade ? 'levelup' : 'merge');

      setGrid([...gridWithMerges]);
      activeGrid = gridWithMerges;
      await delay(300);
    }

    const cleanGrid = activeGrid.map(cell => ({
      ...cell,
      rune: cell.rune ? { ...cell.rune, justMerged: false, isNew: false } : null,
    }));
    setGrid(cleanGrid);
    processingRef.current = false;
    setIsProcessing(false);
  }, [score, playSound]);

  // handleInteraction, handleDiscard, reshuffleBoard ... (保持不變)
  const handleInteraction = useCallback((fromId: number, toId: number) => {
    if (processingRef.current) return;
    const fX = fromId % GRID_SIZE;
    const fY = Math.floor(fromId / GRID_SIZE);
    const tX = toId % GRID_SIZE;
    const tY = Math.floor(toId / GRID_SIZE);
    if (Math.abs(fX - tX) + Math.abs(fY - tY) !== 1) return;
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
    newGrid[fromId] = { ...newGrid[fromId], rune: null, isDeleted: true };
    setGrid(newGrid);
    setTimeout(() => {
      const cleaned = newGrid.map(cell => ({ ...cell, isDeleted: false }));
      setGrid(cleaned);
      resolveBoard(cleaned);
    }, 300);
  }, [grid, resolveBoard, playSound]);

  const reshuffleBoard = useCallback(() => {
    if (processingRef.current) return;
    playSound('move'); 
    const currentRunes = grid.map(cell => cell.rune).filter((r): r is Rune => r !== null);
    for (let i = currentRunes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentRunes[i], currentRunes[j]] = [currentRunes[j], currentRunes[i]];
    }
    while (currentRunes.length < GRID_SIZE * GRID_SIZE) currentRunes.push(generateRandomRune());
    const newGrid = grid.map((cell, index) => ({ ...cell, rune: currentRunes[index] }));
    setGrid(newGrid);
    setTimeout(() => resolveBoard(newGrid), 400);
  }, [grid, playSound, resolveBoard]);

  const resetGame = useCallback(() => {
    if(processingRef.current) return;
    playSound('levelup');
    setScore(0);
    setMoves(0);
    // 5. [新增] 重置統計數據
    setRuneStats(createInitialStats());
    setGrid(createInitialGrid());
  }, [playSound]);

  return {
    grid,
    score,
    moves,
    runeStats, // 6. [匯出] 
    isProcessing,
    handleInteraction,
    handleDiscard,
    reshuffleBoard,
    resetGame
  };
};