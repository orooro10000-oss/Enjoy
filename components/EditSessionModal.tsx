import React, { useState } from 'react';
import { X, Save, Calculator, Clock, Swords, Coffee } from 'lucide-react';
import { Session } from '../types';
import { formatCurrency } from '../utils';

interface EditSessionModalProps {
  session: Session;
  onClose: () => void;
  onSave: (updatedSession: Session) => void;
}

const EditSessionModal: React.FC<EditSessionModalProps> = ({ session, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    sessionCost: session.sessionCost,
    matchCount: session.matchCount,
    matchCost: session.matchCost,
    foodCost: session.foodCost || 0,
    notes: session.notes || ''
  });

  // Helper to update match cost automatically if needed, simplified here
  const handleMatchCountChange = (count: number) => {
    setFormData(prev => ({ ...prev, matchCount: count }));
  };

  const total = Number(formData.sessionCost) + Number(formData.matchCost) + Number(formData.foodCost);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...session,
      sessionCost: Number(formData.sessionCost),
      matchCount: Number(formData.matchCount),
      matchCost: Number(formData.matchCost),
      foodCost: Number(formData.foodCost),
      totalCost: total,
      notes: formData.notes
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
        
        <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calculator className="text-yellow-500 w-5 h-5" />
            تعديل الجلسة
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div className="space-y-4">
             {/* Time Cost Edit */}
             <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2 mb-2 text-emerald-400 font-semibold text-sm">
                   <Clock className="w-4 h-4" /> تكلفة الوقت
                </div>
                <div className="flex gap-2">
                   <input 
                     type="number" 
                     step="0.5"
                     value={formData.sessionCost}
                     onChange={e => setFormData({...formData, sessionCost: parseFloat(e.target.value) || 0})}
                     className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:border-emerald-500 outline-none"
                   />
                </div>
             </div>

             {/* Match Edit */}
             <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2 mb-2 text-indigo-400 font-semibold text-sm">
                   <Swords className="w-4 h-4" /> المباريات
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs text-slate-500 mb-1 block">العدد</label>
                     <input 
                       type="number" 
                       value={formData.matchCount}
                       onChange={e => handleMatchCountChange(parseInt(e.target.value) || 0)}
                       className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:border-indigo-500 outline-none"
                     />
                   </div>
                   <div>
                     <label className="text-xs text-slate-500 mb-1 block">التكلفة</label>
                     <input 
                       type="number" 
                       step="0.5"
                       value={formData.matchCost}
                       onChange={e => setFormData({...formData, matchCost: parseFloat(e.target.value) || 0})}
                       className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:border-indigo-500 outline-none"
                     />
                   </div>
                </div>
             </div>

             {/* Food Cost Edit (New) */}
             <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2 mb-2 text-amber-400 font-semibold text-sm">
                   <Coffee className="w-4 h-4" /> مأكولات/مشروبات
                </div>
                <div className="flex gap-2">
                   <input 
                     type="number" 
                     step="0.5"
                     value={formData.foodCost}
                     onChange={e => setFormData({...formData, foodCost: parseFloat(e.target.value) || 0})}
                     className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:border-amber-500 outline-none"
                   />
                </div>
             </div>

             {/* Notes */}
             <div>
               <label className="text-xs text-slate-500 mb-1 block">ملاحظات</label>
               <input 
                 type="text" 
                 value={formData.notes}
                 onChange={e => setFormData({...formData, notes: e.target.value})}
                 className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-slate-500 outline-none"
               />
             </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
             <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400">المجموع الجديد</span>
                <span className="text-2xl font-bold text-white">{formatCurrency(total)}</span>
             </div>
             <button 
               type="submit" 
               className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
             >
               <Save className="w-5 h-5" />
               حفظ التغييرات
             </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditSessionModal;