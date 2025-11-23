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
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 md:p-4 backdrop-blur-md"
        onClick={onClose}
    >
        <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="bg-slate-900/95 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex justify-between items-center p-5 md:p-6 border-b border-slate-800/50 shrink-0 bg-slate-900 z-30">
                <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-white">
                    <BookOpen className="text-amber-400 w-6 h-6 md:w-8 md:h-8" /> 
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

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6">
                
                {/* Scrollable Table Wrapper */}
                <div className="overflow-x-auto pb-2 -mx-2 md:mx-0">
                    <table className="w-full text-left border-collapse min-w-[350px]">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="p-2 md:p-3 text-left text-slate-500 text-xs text-center font-bold uppercase whitespace-nowrap sticky left-0 z-20 bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                                    元素
                                </th>
                                {runeLevels.map(lvl => (
                                    <th key={`col-${lvl}`} className="p-2 md:p-3 text-center whitespace-nowrap min-w-[60px] md:min-w-[80px]">
                                        <div className="text-slate-400 text-xs font-bold">
                                            Lv.{lvl}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {runeTypes.map(type => {
                                const typeConfig = TYPE_CONFIG[type];
                                const TypeIcon = typeConfig.icon;
                                return (
                                    <tr key={type} className="group hover:bg-slate-800/30 transition-colors">
                                        {/* Sticky Type Label */}
                                        <td className="p-2 md:p-3 whitespace-nowrap sticky left-0 z-10 bg-slate-900 group-hover:bg-slate-800 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] border-r border-slate-800/50">
                                            <div className="flex items-center justify-center">
                                                <div className={`p-1.5 md:p-2 rounded-lg ${typeConfig.bg.replace('bg-', 'bg-opacity-20 bg-')}`}>
                                                    <TypeIcon className={`w-5 h-5 md:w-6 md:h-6 ${typeConfig.color}`} />
                                                </div>
                                            </div>
                                        </td>
                                        
                                        {/* Level Cells */}
                                        {runeLevels.map(lvl => {
                                            const isUnlocked = collection[type][lvl as RuneLevel] > 0;
                                            const LevelIcon = LEVEL_CONFIG[lvl as RuneLevel].icon;
                                            
                                            return (
                                                <td key={`${type}-${lvl}`} className="p-2 md:p-3 text-center whitespace-nowrap align-middle">
                                                    <div className="flex flex-col items-center justify-center relative group/item">
                                                        <div className={`
                                                            w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border transition-all duration-300
                                                            ${isUnlocked 
                                                                ? `${typeConfig.bg.replace('bg-', 'bg-opacity-10 bg-')} ${typeConfig.border} shadow-[0_0_10px_rgba(0,0,0,0.2)]` 
                                                                : 'bg-slate-800/50 border-slate-700 grayscale opacity-40'
                                                            }
                                                        `}>
                                                            <LevelIcon className={`
                                                                w-5 h-5 md:w-6 md:h-6 transition-all duration-300
                                                                ${isUnlocked ? typeConfig.color : 'text-slate-600'}
                                                                ${isUnlocked && lvl === 5 ? 'animate-pulse drop-shadow-[0_0_5px_currentColor]' : ''}
                                                            `} />
                                                        </div>
                                                        
                                                        {/* Count Badge */}
                                                        {isUnlocked && (
                                                            <div className="absolute -top-1 -right-1 bg-slate-900 border border-slate-600 text-[10px] text-slate-300 px-1.5 rounded-full font-mono z-10">
                                                                {collection[type][lvl as RuneLevel]}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Tooltip on hover (Desktop) */}
                                                        <div className="hidden md:block opacity-0 group-hover/item:opacity-100 absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap z-30 transition-opacity">
                                                            {LEVEL_CONFIG[lvl as RuneLevel].name}
                                                        </div>
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
                
                <div className="mt-6 text-center text-xs text-slate-500">
                    * 點亮圖鑑需要曾經合成過該等級符文 (Lv1 為掉落獲得)
                </div>

            </div>
        </motion.div>
    </motion.div>
  );
};