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
            // 修改 1: 加上 max-h-[90vh] 與 flex flex-col，確保 Modal 不會比螢幕高，且內部結構正確
            className="bg-slate-900/95 border border-slate-700 rounded-3xl max-w-2xl w-full shadow-2xl relative max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
        >
            {/* Header (固定在頂部，不隨表格滾動) */}
            <div className="flex justify-between items-center p-6 md:p-8 border-b border-slate-800/50 shrink-0">
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

            {/* Content Container (負責捲動區域) */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                
                {/* 5x5 Grid Table Wrapper */}
                {/* 修改 2: overflow-x-auto 負責左右滑動 */}
                <div className="overflow-x-auto -mx-6 md:-mx-8 px-6 md:px-8 pb-2">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                {/* 修改 3: 加入 whitespace-nowrap 強制不換行，並設定 sticky left-0 固定首欄 */}
                                <th className="p-3 text-left text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap sticky left-0 z-20 bg-slate-900/95 backdrop-blur shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                                    屬性 / 等級
                                </th>
                                {runeLevels.map(level => (
                                    <th key={`header-lv${level}`} className="p-3 text-center whitespace-nowrap min-w-[60px]">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-xs text-slate-400">Lv.{level}</span>
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
                                        {/* 修改 4: 同樣對首欄資料格做 Sticky 處理，並加上背景色遮擋後方滑過的內容 */}
                                        <td className="p-3 whitespace-nowrap sticky left-0 z-10 bg-slate-900 group-hover:bg-slate-800 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
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
                                                <td key={`${type}-${level}`} className="p-3 text-center whitespace-nowrap">
                                                    <span className={`
                                                        font-mono text-lg font-bold transition-all inline-block min-w-[30px]
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
            </div>
        </motion.div>
    </motion.div>
  );
};