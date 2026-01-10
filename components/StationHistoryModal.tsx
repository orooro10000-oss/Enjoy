import React from 'react';
import { X, Pencil, Trash2, Clock, Swords, Coffee } from 'lucide-react';
import { Session } from '../types';
import { formatCurrency } from '../utils';

interface StationHistoryModalProps {
  stationName: string;
  sessions: Session[];
  onClose: () => void;
  onEditSession: (session: Session) => void;
  onDeleteSession: (sessionId: string) => void;
}

const StationHistoryModal: React.FC<StationHistoryModalProps> = ({ 
  stationName, 
  sessions, 
  onClose, 
  onEditSession, 
  onDeleteSession 
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="bg-slate-900 p-5 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            سجل العمليات التفصيلي: <span className="text-indigo-400">{stationName}</span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {sessions.length === 0 ? (
            <div className="text-center py-10 text-slate-500">لا توجد سجلات لهذه المحطة حتى الآن</div>
          ) : (
            <table className="w-full text-right">
              <thead className="bg-slate-900/50 text-slate-400 text-sm sticky top-0">
                <tr>
                  <th className="p-3 rounded-tr-lg">الوقت</th>
                  <th className="p-3">النوع</th>
                  <th className="p-3">التفاصيل</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3 rounded-tl-lg">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-3 text-slate-400 font-mono text-sm">
                       {new Date(s.endTime || 0).toLocaleTimeString('ar-MA', {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 flex-wrap">
                        {s.sessionCost > 0 && <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs border border-emerald-500/20">وقت</span>}
                        {s.matchCount > 0 && <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded text-xs border border-indigo-500/20">مباريات</span>}
                        {s.foodCost && s.foodCost > 0 && <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded text-xs border border-amber-500/20">أكل</span>}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-slate-300">
                       {s.sessionCost > 0 && (
                         <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                           <Clock className="w-3 h-3"/> {Math.floor(s.durationMinutes / 60)}h {s.durationMinutes % 60}m
                         </div>
                       )}
                       {s.matchCount > 0 && (
                         <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                           <Swords className="w-3 h-3"/> {s.matchCount} مباريات
                         </div>
                       )}
                       {s.foodCost && s.foodCost > 0 && (
                         <div className="flex items-center gap-1 text-xs text-slate-400">
                           <Coffee className="w-3 h-3"/> {formatCurrency(s.foodCost)}
                         </div>
                       )}
                       {s.notes && <div className="text-xs text-yellow-500/70 mt-1">"{s.notes}"</div>}
                    </td>
                    <td className="p-3 font-bold text-white">
                      {formatCurrency(s.totalCost)}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onEditSession(s)} 
                          className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                          title="تعديل"
                        >
                          <Pencil className="w-4 h-4"/>
                        </button>
                        <button 
                          onClick={() => onDeleteSession(s.id)} 
                          className="p-2 hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default StationHistoryModal;