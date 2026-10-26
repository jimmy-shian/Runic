import React, { useState } from 'react';
import { RuneImage } from './RunePiece';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, Sparkles, Award } from 'lucide-react';
import { RuneLevel, RuneType } from '../types';
import { TYPE_CONFIG, LEVEL_CONFIG, SCORE_TABLE, LV5_BONUS_SCORE } from '../constants';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Record<RuneType, Record<RuneLevel, number>>;
}

const TYPE_NAMES_ZH: Record<RuneType, string> = {
  [RuneType.Fire]: '烈焰',
  [RuneType.Water]: '流水',
  [RuneType.Wood]: '常青',
  [RuneType.Earth]: '大地',
  [RuneType.Lightning]: '雷霆',
};

const LEVEL_NAMES_ZH: Record<RuneLevel, string> = {
  [RuneLevel.Drop]: '元質精粹',
  [RuneLevel.Gem]: '成長結晶',
  [RuneLevel.Crystal]: '純淨晶石',
  [RuneLevel.Tome]: '魔法典籍',
  [RuneLevel.Blade]: '終極神器',
};

const LEVEL_DESC_ZH: Record<RuneLevel, string> = {
  [RuneLevel.Drop]: '掉落獲得的基礎元素，三顆相連即可融合進階。',
  [RuneLevel.Gem]: '凝聚元素力量的晶核，消除獲得基本倍率分數。',
  [RuneLevel.Crystal]: '純粹厚重的魔法晶石，合成高級符文的重要階梯。',
  [RuneLevel.Tome]: '記載遠古奧秘的魔法典籍，散發濃郁的元素波動。',
  [RuneLevel.Blade]: '元素力量頂點的神器！消除觸發全行/全列摧毀並額外獲得 +10 分！',
};

export const CollectionModal: React.FC<CollectionModalProps> = ({ isOpen, onClose, collection }) => {
  const [previewRune, setPreviewRune] = useState<{ type: RuneType; level: RuneLevel } | null>(null);

  if (!isOpen) return null;

  const runeTypes = Object.values(RuneType);
  const runeLevels = [2, 3, 4, 5];

  return (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-3 md:p-6 backdrop-blur-md"
        onClick={onClose}
    >
        <motion.div 
            initial={{ scale: 0.92, y: 16 }} 
            animate={{ scale: 1, y: 0 }} 
            exit={{ scale: 0.92, y: 16 }}
            className="bg-slate-900/95 border border-slate-700/80 rounded-3xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-slate-800/80 shrink-0 bg-slate-900 z-30">
                <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-white">
                    <BookOpen className="text-amber-400 w-6 h-6 md:w-7 md:h-7" /> 
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200">
                        符文圖鑑
                    </span>
                </h2>
                <button 
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    title="關閉"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
                
                {/* Scrollable Table Wrapper */}
                <div className="overflow-x-auto pb-2 -mx-2 md:mx-0">
                    <table className="w-full text-left border-collapse min-w-[320px]">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="p-2.5 md:p-3 text-center text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap sticky left-0 z-20 bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                                    元素
                                </th>
                                {runeLevels.map(lvl => (
                                    <th key={`col-${lvl}`} className="p-2.5 md:p-3 text-center whitespace-nowrap min-w-[64px] md:min-w-[84px]">
                                        <div className="text-slate-300 text-xs font-bold">
                                            Lv.{lvl}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {runeTypes.map(type => {
                                const typeConfig = TYPE_CONFIG[type];
                                return (
                                    <tr key={type} className="group hover:bg-slate-800/30 transition-colors">
                                        {/* Sticky Type Label */}
                                        <td className="p-2.5 md:p-3 whitespace-nowrap sticky left-0 z-10 bg-slate-900 group-hover:bg-slate-800 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] border-r border-slate-800/60">
                                            <div className="flex items-center justify-center">
                                                <div className={`p-1.5 md:p-2 rounded-xl ${typeConfig.bg.replace('bg-', 'bg-opacity-20 bg-')} flex items-center justify-center`}>
                                                    <span className="block w-6 h-6"><RuneImage type={type} level={1} /></span>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        {/* Level Cells */}
                                        {runeLevels.map(lvl => {
                                            const unlockedCount = collection[type]?.[lvl as RuneLevel] || 0;
                                            const isUnlocked = unlockedCount > 0;
                                            
                                            return (
                                                <td key={`${type}-${lvl}`} className="p-2 md:p-3 text-center whitespace-nowrap align-middle">
                                                    <div 
                                                      onClick={() => setPreviewRune({ type, level: lvl as RuneLevel })}
                                                      className="flex flex-col items-center justify-center relative cursor-pointer group/item select-none"
                                                      title="點擊展開大圖"
                                                    >
                                                        <div className={`
                                                            w-11 h-11 md:w-13 md:h-13 rounded-2xl flex items-center justify-center border transition-all duration-200 transform group-hover/item:scale-105 active:scale-95
                                                            ${isUnlocked 
                                                                ? `${typeConfig.bg.replace('bg-', 'bg-opacity-15 bg-')} ${typeConfig.border} shadow-[0_0_12px_rgba(0,0,0,0.3)] hover:border-amber-400` 
                                                                : 'bg-slate-800/40 border-slate-700/60 grayscale opacity-35 hover:opacity-60'
                                                            }
                                                        `}>
                                                            <div className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center pointer-events-none">
                                                                <RuneImage type={type} level={lvl as RuneLevel} />
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Count Badge */}
                                                        {isUnlocked && (
                                                            <div className="absolute -top-1.5 -right-1.5 bg-slate-900 border border-slate-600 text-[10px] text-amber-300 px-1.5 py-0.2 rounded-full font-mono font-bold shadow-md z-10">
                                                                {unlockedCount}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                
                {/* 簡短不囉嗦的說明文字 */}
                <div className="mt-4 text-center text-xs text-slate-400 font-medium">
                    * 首次合成符文即可解鎖圖鑑
                </div>

            </div>
        </motion.div>

        {/* 符文展開大圖 Lightbox 彈窗 */}
        <AnimatePresence>
            {previewRune && (() => {
                const pType = previewRune.type;
                const pLevel = previewRune.level;
                const pTypeConfig = TYPE_CONFIG[pType];
                const count = collection[pType]?.[pLevel] || 0;
                const isUnlocked = count > 0;
                const typeNameZh = TYPE_NAMES_ZH[pType];
                const levelNameZh = LEVEL_NAMES_ZH[pLevel];
                const descZh = LEVEL_DESC_ZH[pLevel];

                return (
                    <motion.div
                        key="rune-preview-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/85 z-[60] flex items-center justify-center p-4 backdrop-blur-md"
                        onClick={() => setPreviewRune(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.85, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.85, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative flex flex-col items-center text-center overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* 頂部光暈背景 */}
                            <div 
                                className="absolute -top-24 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
                                style={{ backgroundColor: pTypeConfig.solidColor }}
                            />

                            {/* 關閉按鈕 */}
                            <button
                                onClick={() => setPreviewRune(null)}
                                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                title="關閉大圖"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* 符文特寫大圖 */}
                            <div className="relative mt-2 mb-4 w-36 h-36 flex items-center justify-center">
                                <div 
                                    className={`w-32 h-32 rounded-3xl flex items-center justify-center p-4 border-2 transition-all ${
                                        isUnlocked
                                            ? `${pTypeConfig.border} bg-slate-800/80 shadow-[0_0_30px_${pTypeConfig.solidColor}40]`
                                            : 'border-slate-700 bg-slate-800/40 grayscale opacity-40'
                                    }`}
                                >
                                    <RuneImage type={pType} level={pLevel} className="w-full h-full object-contain filter drop-shadow-xl" />
                                </div>
                                {isUnlocked && (
                                    <div className="absolute -bottom-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-black px-3 py-0.5 rounded-full shadow-lg uppercase tracking-wider">
                                        Lv.{pLevel}
                                    </div>
                                )}
                            </div>

                            {/* 符文名稱 */}
                            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-1.5">
                                <span>{typeNameZh} · {levelNameZh}</span>
                                {pLevel === RuneLevel.Blade && <Sparkles className="w-4 h-4 text-amber-400" />}
                            </h3>

                            {/* 等級與解鎖狀態標籤 */}
                            <div className="flex items-center gap-2 mb-4 mt-1">
                                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${pTypeConfig.border} ${pTypeConfig.color} bg-slate-800/70`}>
                                    {typeNameZh}屬性
                                </span>
                                {isUnlocked ? (
                                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                        <Award className="w-3 h-3" /> 已解鎖 ({count} 次)
                                    </span>
                                ) : (
                                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                        尚未解鎖
                                    </span>
                                )}
                            </div>

                            {/* 描述與效果說明 */}
                            <div className="w-full bg-slate-800/60 rounded-2xl p-3.5 border border-slate-700/50 text-left text-xs text-slate-300 leading-relaxed mb-5">
                                <p className="mb-2 text-slate-200">{descZh}</p>
                                <div className="text-[11px] text-slate-400 border-t border-slate-700/50 pt-2 flex justify-between">
                                    <span>消除分數：+{SCORE_TABLE[pLevel]} 分 / 顆</span>
                                    {pLevel === RuneLevel.Blade && (
                                        <span className="text-amber-400 font-bold">神器獎勵：+{LV5_BONUS_SCORE} 分</span>
                                    )}
                                </div>
                            </div>

                            {/* 關閉按鈕 */}
                            <button
                                onClick={() => setPreviewRune(null)}
                                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition border border-slate-700"
                            >
                                關閉預覽
                            </button>
                        </motion.div>
                    </motion.div>
                );
            })()}
        </AnimatePresence>
    </motion.div>
  );
};
