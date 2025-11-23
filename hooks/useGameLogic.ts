
import { useState, useCallback, useRef } from 'react';
import { GridState, Rune, RuneLevel, RuneType } from '../types';
import { GRID_SIZE, RUNE_TYPES, SCORE_TABLE, LV5_BONUS_SCORE } from '../constants';
import { useSound } from './useSound';

const createInitialStats = () => {
  const stats: Record<string, Record<number, number>> = {};
  RUNE_TYPES.forEach(type => {
    stats[type] = {};
    [1, 2, 3, 4, 5].forEach(level => {
      stats[type][level] = 0;
    });
  });
  return stats as Record<RuneType, Record<RuneLevel, number>>;
};

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

  const [runeStats, setRuneStats] = useState(createInitialStats());
  const [collection, setCollection] = useState(createInitialStats());

  // 新增：記錄目前哪個格正在被拖曳（用來讓原位看起來是空的）
  const [draggingFrom, setDraggingFrom] = useState<number | null>(null);

  const processingRef = useRef(false);
  const { playSound } = useSound();

  // BFS based match finding for strict Orthogonal connectivity
  // 改良後的 Match-3 邏輯：嚴格檢查橫向與直向連線
  const findMatches = (currentGrid: GridState) => {
    const matchedIndices = new Set<number>();
    const clusters: { type: RuneType; level: RuneLevel; indices: number[] }[] = [];

    const getRune = (idx: number) => (idx >= 0 && idx < currentGrid.length) ? currentGrid[idx].rune : null;

    // Helper: 檢查兩個 Rune 是否完全相同（類型與等級）
    const isSame = (idx1: number, idx2: number) => {
        const r1 = getRune(idx1);
        const r2 = getRune(idx2);
        return r1 && r2 && r1.type === r2.type && r1.level === r2.level;
    };

    // 1. 橫向掃描 (Horizontal Scan)
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE - 2; x++) {
            const idx = y * GRID_SIZE + x;
            if (isSame(idx, idx + 1) && isSame(idx + 1, idx + 2)) {
                // 發現至少 3 個橫向相連，標記它們
                matchedIndices.add(idx);
                matchedIndices.add(idx + 1);
                matchedIndices.add(idx + 2);

                // 如果後面還有相同的，繼續標記 (例如 4 或 5 連線)
                let k = x + 3;
                while (k < GRID_SIZE && isSame(idx, y * GRID_SIZE + k)) {
                    matchedIndices.add(y * GRID_SIZE + k);
                    k++;
                }
            }
        }
    }

    // 2. 直向掃描 (Vertical Scan)
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE - 2; y++) {
            const idx = y * GRID_SIZE + x;
            const next1 = (y + 1) * GRID_SIZE + x;
            const next2 = (y + 2) * GRID_SIZE + x;

            if (isSame(idx, next1) && isSame(next1, next2)) {
                // 發現至少 3 個直向相連，標記它們
                matchedIndices.add(idx);
                matchedIndices.add(next1);
                matchedIndices.add(next2);

                // 如果後面還有相同的，繼續標記
                let k = y + 3;
                while (k < GRID_SIZE && isSame(idx, k * GRID_SIZE + x)) {
                    matchedIndices.add(k * GRID_SIZE + x);
                    k++;
                }
            }
        }
    }

    // 3. 將標記的消除格分組 (Clustering)
    // 雖然我們找出了所有連線，但相鄰的連線應該視為同一個消除事件 (例如 T 型或 L 型)
    const visited = new Set<number>();

    // 定義相鄰查找函式 (用於將相連的 Match 合併)
    const getNeighbors = (idx: number) => {
        const x = idx % GRID_SIZE;
        const y = Math.floor(idx / GRID_SIZE);
        const neighbors = [];
        if (x > 0) neighbors.push(idx - 1);
        if (x < GRID_SIZE - 1) neighbors.push(idx + 1);
        if (y > 0) neighbors.push(idx - GRID_SIZE);
        if (y < GRID_SIZE - 1) neighbors.push(idx + GRID_SIZE);
        return neighbors;
    };

    matchedIndices.forEach(startIdx => {
        if (visited.has(startIdx)) return;

        const rootRune = getRune(startIdx);
        if (!rootRune) return;

        const currentCluster: number[] = [];
        const queue = [startIdx];
        visited.add(startIdx);

        while (queue.length > 0) {
            const curr = queue.shift()!;
            currentCluster.push(curr);

            const neighbors = getNeighbors(curr);
            for (const nIdx of neighbors) {
                // 條件：必須是被標記為 Match 的格子，且尚未訪問過，且類型等級相同
                if (matchedIndices.has(nIdx) && !visited.has(nIdx) && isSame(curr, nIdx)) {
                    visited.add(nIdx);
                    queue.push(nIdx);
                }
            }
        }

        clusters.push({
            type: rootRune.type,
            level: rootRune.level,
            indices: currentCluster
        });
    });

    return clusters;
  };

  const resolveBoard = useCallback(async (startGrid: GridState) => {
    processingRef.current = true;
    setIsProcessing(true);

    let activeGrid = [...startGrid];
    let stability = false;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    while (!stability) {
      // 1. Gravity Loop (Priority)
      let gridAfterGravity = [...activeGrid];
      let gravityApplied = false;
      for (let col = 0; col < GRID_SIZE; col++) {
        const runesInColumn = [];
        for (let row = 0; row < GRID_SIZE; row++) {
          const idx = row * GRID_SIZE + col;
          if (gridAfterGravity[idx].rune !== null) runesInColumn.push(gridAfterGravity[idx].rune);
        }
        const emptyCount = GRID_SIZE - runesInColumn.length;

        // Refill logic (Phase C)
        const newRunes = [];
        for(let k=0; k<emptyCount; k++){
             const r = generateRandomRune();
             // 統計掉落的 Lv1
             setCollection(prev => (prev && {
                 ...prev,
                 [r.type]: { ...prev[r.type], [1]: prev[r.type][1] + 1 }
             }) || prev);
             newRunes.push({ ...r, isNew: true, id: crypto.randomUUID() });
        }

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

      // 2. Match Loop
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
      let hasLv5Blast = false;

      const roundStatsUpdates: { type: RuneType, level: RuneLevel }[] = [];

      for (const cluster of clusters) {
        // --- 特殊規則：Lv5 觸發行列消除 ---
        if (cluster.level === RuneLevel.Blade) {
            hasLv5Blast = true;
            hasHighLevelUpgrade = true; // Play fancy sound

            // 找出涉及的行與列
            const involvedRows = new Set<number>();
            const involvedCols = new Set<number>();

            cluster.indices.forEach(idx => {
                involvedRows.add(Math.floor(idx / GRID_SIZE));
                involvedCols.add(idx % GRID_SIZE);
            });

            // 判斷消除方向
            const rowsArr = Array.from(involvedRows);
            const colsArr = Array.from(involvedCols);

            const isHorizontal = rowsArr.length === 1;
            const isVertical = colsArr.length === 1;

            const indicesToBlast = new Set<number>();

            if (isHorizontal) {
                const r = rowsArr[0];
                for (let c = 0; c < GRID_SIZE; c++) indicesToBlast.add(r * GRID_SIZE + c);
            } else if (isVertical) {
                const c = colsArr[0];
                for (let r = 0; r < GRID_SIZE; r++) indicesToBlast.add(r * GRID_SIZE + c);
            } else {
                rowsArr.forEach(r => {
                    for (let c = 0; c < GRID_SIZE; c++) indicesToBlast.add(r * GRID_SIZE + c);
                });
                colsArr.forEach(c => {
                    for (let r = 0; r < GRID_SIZE; r++) indicesToBlast.add(r * GRID_SIZE + c);
                });
            }

            // 執行消除並計分
            gainedScore += LV5_BONUS_SCORE;
            gainedScore += indicesToBlast.size;

            indicesToBlast.forEach(idx => {
                gridWithMerges[idx] = { ...gridWithMerges[idx], rune: null };
            });

        } else {
            // --- 一般規則：Lv1-4 合成 ---
            const sortedIndices = [...cluster.indices].sort((a, b) => a - b);

            const count = sortedIndices.length;
            const upgradeIndices = sortedIndices.slice(1, count - 1);
            const removeIndices = [sortedIndices[0], sortedIndices[count - 1]];

            const nextLevel = Math.min(cluster.level + 1, RuneLevel.Blade);
            if (nextLevel >= RuneLevel.Tome) hasHighLevelUpgrade = true;

            gainedScore += SCORE_TABLE[cluster.level] * count;

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
      }

      if (roundStatsUpdates.length > 0) {
          setRuneStats(prev => {
              const newStats = { ...prev };
              RUNE_TYPES.forEach(t => newStats[t] = { ...prev[t] });
              roundStatsUpdates.forEach(({ type, level }) => {
                  newStats[type][level] += 1;
              });
              return newStats;
          });
          setCollection(prev => {
               const newColl = { ...prev };
               RUNE_TYPES.forEach(t => newColl[t] = { ...prev[t] });
               roundStatsUpdates.forEach(({ type, level }) => {
                  newColl[type][level] += 1;
              });
              return newColl;
          });
      }

      setScore(s => s + gainedScore);

      // 音效判斷
      if (gainedScore > 0) {
          if (hasLv5Blast) playSound('levelup'); // Use heavy sound for blast
          else playSound(hasHighLevelUpgrade ? 'levelup' : 'merge');
      }

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

  //定義角落格子
  const isCorner = (id: number) => {
    const x = id % GRID_SIZE;
    const y = Math.floor(id / GRID_SIZE);
    return (x === 0 && y === 0) || // 左上
          (x === 0 && y === GRID_SIZE - 1) || // 左下
          (x === GRID_SIZE - 1 && y === 0) || // 右上
          (x === GRID_SIZE - 1 && y === GRID_SIZE - 1); // 右下
  };

  // Helper: 依 index 取得內部鄰格（不會超界）
  const getInnerNeighbors = (id: number) => {
    const x = id % GRID_SIZE;
    const y = Math.floor(id / GRID_SIZE);
    const neighbors: number[] = [];
    // 內側鄰格是指朝向棋盤中心的相鄰兩格（角落只有 2 個內側鄰格）
    if (x === 0) {
      // left column -> right is inner
      neighbors.push(id + 1);
    } else if (x === GRID_SIZE - 1) {
      // right column -> left is inner
      neighbors.push(id - 1);
    }
    if (y === 0) {
      // top row -> down is inner
      neighbors.push(id + GRID_SIZE);
    } else if (y === GRID_SIZE - 1) {
      // bottom row -> up is inner
      neighbors.push(id - GRID_SIZE);
    }
    // 角落情形會回傳兩個數（上/左 之類）
    return neighbors.filter(n => n >= 0 && n < GRID_SIZE * GRID_SIZE);
  };

  /**
   * handleDiscard 修改：
   * - 確保在丟棄開始時鎖定遊戲 (isProcessing=true)
   * - 確保在丟棄開始時清除 draggingFrom，丟棄結束後依序執行 resolveBoard
   */
  const handleDiscard = useCallback((fromId: number, dropTargetId?: number) => {
    if (processingRef.current) return;
    const rune = grid[fromId].rune;
    if (!rune) return;

    // 不再限制只有角落能丟棄，所有邊界都可以 (UI 層面有控制，Logic 放寬)
    const allowedTargets = getInnerNeighbors(fromId);
    const isAllowedDrop = dropTargetId === undefined || allowedTargets.includes(dropTargetId);

    if (!isAllowedDrop) {
        setDraggingFrom(null);
        return;
    }

    // 鎖定遊戲，避免動畫期間的操作衝突
    processingRef.current = true;
    setIsProcessing(true);

    // 開始丟棄流程
    playSound('discard');
    setMoves(prev => prev + 1);

    if (rune.level === RuneLevel.Blade) {
        setScore(s => s + LV5_BONUS_SCORE);
    }

    const newGrid = [...grid];
    newGrid[fromId] = { ...newGrid[fromId], isDeleted: true };
    setGrid(newGrid);
    setDraggingFrom(null);

    // 延遲真正移除 rune，等待動畫播放完成
    setTimeout(() => {
        const cleaned = newGrid.map((cell, index) => {
        if (index === fromId) return { ...cell, rune: null, isDeleted: false };
        return { ...cell, isDeleted: false };
        });
        setGrid(cleaned);
        // resolveBoard 會接手 isProcessing 狀態，直到消除完畢
        resolveBoard(cleaned);
    }, 350); // 0.35s 與 deletedOverlay transition 對應
  }, [grid, resolveBoard, playSound]);


  // 新增：開始拖曳（呼叫後 UI 可立即把原位隱藏）
  const handleDragStart = useCallback((fromId: number) => {
    setDraggingFrom(fromId);
  }, []);

  // 新增：結束拖曳（不論 drop 成功或取消都呼叫）
  const handleDragEnd = useCallback(() => {
    setDraggingFrom(null);
  }, []);

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
    setRuneStats(createInitialStats());
    setCollection(createInitialStats());
    setGrid(createInitialGrid());
  }, [playSound]);

  return {
    grid,
    score,
    moves,
    runeStats,
    collection,
    isProcessing,
    handleInteraction,
    handleDiscard,
    reshuffleBoard,
    resetGame,

    // 新增對外 API（UI 端使用）
    draggingFrom,
    handleDragStart,
    handleDragEnd,
  };
};
