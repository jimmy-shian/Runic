import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, X } from 'lucide-react';
import { RuneLevel, RuneType } from '../types';
import { TYPE_CONFIG, LEVEL_CONFIG } from '../constants';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Record<RuneType, Record<RuneLevel, number>>;
}

export const CollectionModal: React.FC<CollectionModalProps> = ({ isOpen, onClose, collection }) => {
  if (!isOpen) return null;

  const runeTypes = Object.values(RuneType);
  const runeLevels = [1, 2, 3, 4, 5];

  return (
    <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md"
        onClick={onClose}
    >
        <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="bg-slate-900/95 border border-slate-700 p-6 md:p-8 rounded-3xl max-w-2xl w-full shadow-2xl relative"
            onClick={e => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                    <BookOpen className="text-amber-400 w-8 h-8" /> 
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-300">
                        符文圖鑑
                    </span>
                </h2>
                <button 
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-400 transition"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-6 gap-2 sm:gap-4 overflow-x-auto min-w-[500px]">
                {/* Header Row */}
                <div className="p-2 text-slate-500 text-xs text-center font-bold uppercase">元素</div>
                {runeLevels.map(lvl => (
                    <div key={`col-${lvl}`} className="p-2 text-slate-400 text-xs text-center font-bold">
                        Lv.{lvl}
                    </div>
                ))}

                {/* Rows */}
                {runeTypes.map(type => {
                    const typeConfig = TYPE_CONFIG[type];
                    const TypeIcon = typeConfig.icon;
                    return (
                        <React.Fragment key={type}>
                            {/* Type Label */}
                            <div className="flex items-center justify-center p-2">
                                <div className={`p-2 rounded-lg ${typeConfig.bg.replace('bg-', 'bg-opacity-20 bg-')}`}>
                                    <TypeIcon className={`w-6 h-6 ${typeConfig.color}`} />
                                </div>
                            </div>
                            
                            {/* Level Cells */}
                            {runeLevels.map(lvl => {
                                const isUnlocked = collection[type][lvl as RuneLevel] > 0;
                                const LevelIcon = LEVEL_CONFIG[lvl as RuneLevel].icon;
                                
                                return (
                                    <div key={`${type}-${lvl}`} className="flex flex-col items-center justify-center p-2 relative group">
                                        <div className={`
                                            w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300
                                            ${isUnlocked 
                                                ? `${typeConfig.bg.replace('bg-', 'bg-opacity-10 bg-')} ${typeConfig.border} shadow-[0_0_10px_rgba(0,0,0,0.2)]` 
                                                : 'bg-slate-800/50 border-slate-700 grayscale opacity-40'
                                            }
                                        `}>
                                            <LevelIcon className={`
                                                w-6 h-6 transition-all duration-300
                                                ${isUnlocked ? typeConfig.color : 'text-slate-600'}
                                                ${isUnlocked && lvl === 5 ? 'animate-pulse drop-shadow-[0_0_5px_currentColor]' : ''}
                                            `} />
                                        </div>
                                        
                                        {/* Count Badge */}
                                        {isUnlocked && (
                                            <div className="absolute -top-1 -right-1 bg-slate-900 border border-slate-600 text-[10px] text-slate-300 px-1.5 rounded-full font-mono">
                                                {collection[type][lvl as RuneLevel]}
                                            </div>
                                        )}
                                        
                                        {/* Tooltip on hover */}
                                        <div className="opacity-0 group-hover:opacity-100 absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10 transition-opacity">
                                            {LEVEL_CONFIG[lvl as RuneLevel].name}
                                        </div>
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    );
                })}
            </div>
            
             <div className="mt-6 text-center text-xs text-slate-500">
                * 點亮圖鑑需要曾經合成過該等級符文 (Lv1 為掉落獲得)
            </div>

        </motion.div>
    </motion.div>
  );
};