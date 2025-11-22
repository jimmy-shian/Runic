import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, X } from 'lucide-react';
import { RuneLevel, RuneType } from '../types';
import { TYPE_CONFIG, LEVEL_CONFIG } from '../constants';

interface RuneStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: Record<RuneType, Record<RuneLevel, number>>;
}

export const RuneStatsModal: React.FC<RuneStatsModalProps> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;

  const runeTypes = Object.values(RuneType);
  const runeLevels = [1, 2, 3, 4, 5]; // Lv1 - Lv5

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
                    <BarChart3 className="text-emerald-400 w-8 h-8" /> 
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-blue-300">
                        煉金手札
                    </span>
                </h2>
                <button 
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-400 transition"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* 5x5 Grid Table */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                    <thead>
                        <tr>
                            <th className="p-3 text-left text-slate-500 text-xs uppercase tracking-wider">屬性 / 等級</th>
                            {runeLevels.map(level => (
                                <th key={`header-lv${level}`} className="p-3 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-xs text-slate-400">Lv.{level}</span>
                                        {/* 顯示該等級的通用圖示 (取自 Fire 屬性當範例，或用 LEVEL_CONFIG) */}
                                        {React.createElement(LEVEL_CONFIG[level as RuneLevel].icon, { 
                                            className: "w-4 h-4 text-slate-500" 
                                        })}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {runeTypes.map((type) => {
                            const typeConfig = TYPE_CONFIG[type];
                            const TypeIcon = typeConfig.icon;
                            
                            return (
                                <tr key={type} className="group hover:bg-slate-800/30 transition-colors">
                                    {/* Row Header: Type Icon & Name */}
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${typeConfig.bg.replace('bg-', 'bg-opacity-20 bg-')}`}>
                                                <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                                            </div>
                                        </div>
                                    </td>

                                    {/* Data Cells */}
                                    {runeLevels.map(level => {
                                        const count = stats[type][level as RuneLevel];
                                        const isZero = count === 0;
                                        
                                        return (
                                            <td key={`${type}-${level}`} className="p-3 text-center">
                                                <span className={`
                                                    font-mono text-lg font-bold transition-all
                                                    ${isZero ? 'text-slate-700' : typeConfig.color}
                                                    ${!isZero && 'drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]'}
                                                `}>
                                                    {count > 0 ? count : '-'}
                                                </span>
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
                * 數字代表您在本局遊戲中，成功煉成該等級符文的次數
            </div>

        </motion.div>
    </motion.div>
  );
};