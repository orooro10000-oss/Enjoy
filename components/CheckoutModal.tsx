import React, { useState, useEffect } from 'react';
import { X, Coins, CheckCircle, Gamepad2, Clock, Plus, Minus, Swords, Coffee } from 'lucide-react';
import { Station, CONFIG } from '../types';
import { formatDuration, formatCurrency, calculateSessionCost } from '../utils';

interface CheckoutModalProps {
  station: Station;
  onClose: () => void;
  onConfirmPayment: (details: {
    matchCount: number;
    matchCost: number;
    sessionCost: number;
    foodCost: number;
    totalCost: number;
    notes: string;
  }) => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ station, onClose, onConfirmPayment }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [matchCount, setMatchCount] = useState(station.currentMatchCount || 0);
  const [foodCost, setFoodCost] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine if this session has time tracking
  const hasTime = !!station.startTime;

  // Costs
  const sessionCost = hasTime && station.startTime ? calculateSessionCost(station.startTime, currentTime) : 0;
  const matchPrice = station.type === 'PS5' ? CONFIG.MATCH_PRICE_PS5 : CONFIG.MATCH_PRICE_PS4;
  const matchCost = matchCount * matchPrice;
  const parsedFoodCost = parseFloat(foodCost) || 0;
  
  const totalCost = sessionCost + matchCost + parsedFoodCost;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-slate-900 p-5 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Coins className="text-yellow-500" />
              إنهاء الجلسة: {station.name}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            
            {/* Table 1: Time Invoice */}
            <div className={`bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden ${!hasTime ? 'opacity-50 grayscale' : ''}`}>
               <div className="bg-emerald-900/20 p-3 border-b border-slate-700 flex items-center gap-2">
                 <Clock className="w-4 h-4 text-emerald-400" />
                 <h3 className="text-emerald-400 font-bold text-sm">الوقت</h3>
                 {!hasTime && <span className="text-[10px] text-slate-500 mr-auto">(غير مفعل)</span>}
               </div>
               <div className="p-3 space-y-3">
                 <div className="flex justify-between items-center text-xs text-slate-400">
                   <span>البدء:</span>
                   <span className="font-mono">
                     {hasTime && station.startTime ? new Date(station.startTime).toLocaleTimeString('ar-MA', {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                   </span>
                 </div>
                 <div className="flex justify-between items-center p-2 bg-slate-800 rounded-lg">
                   <span className="text-white font-mono font-bold">
                     {hasTime && station.startTime ? formatDuration(station.startTime, currentTime) : '00:00'}
                   </span>
                 </div>
                 <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                   <span className="text-emerald-400 font-bold text-xl">{formatCurrency(sessionCost)}</span>
                 </div>
               </div>
            </div>

            {/* Table 2: Match Invoice */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
               <div className="bg-indigo-900/20 p-3 border-b border-slate-700 flex items-center gap-2">
                 <Swords className="w-4 h-4 text-indigo-400" />
                 <h3 className="text-indigo-400 font-bold text-sm">المباريات</h3>
               </div>
               <div className="p-3 space-y-3">
                 <div className="flex justify-between items-center text-xs text-slate-400">
                   <span>السعر:</span>
                   <span>{formatCurrency(matchPrice)}</span>
                 </div>
                 
                 <div className="flex justify-between items-center p-2 bg-slate-800 rounded-lg">
                   <div className="flex items-center gap-2 w-full justify-between">
                      <button onClick={() => setMatchCount(Math.max(0, matchCount - 1))} className="w-6 h-6 rounded bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold">-</button>
                      <span className="text-white font-bold">{matchCount}</span>
                      <button onClick={() => setMatchCount(matchCount + 1)} className="w-6 h-6 rounded bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold">+</button>
                   </div>
                 </div>

                 <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                   <span className="text-indigo-400 font-bold text-xl">{formatCurrency(matchCost)}</span>
                 </div>
               </div>
            </div>

            {/* Table 3: Food/Snacks Invoice (NEW) */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
               <div className="bg-amber-900/20 p-3 border-b border-slate-700 flex items-center gap-2">
                 <Coffee className="w-4 h-4 text-amber-400" />
                 <h3 className="text-amber-400 font-bold text-sm">مأكولات/مشروبات</h3>
               </div>
               <div className="p-3 space-y-3">
                 <div className="flex justify-between items-center text-xs text-slate-400">
                   <span>إضافة مبلغ:</span>
                 </div>
                 
                 <div className="p-0">
                   <input 
                      type="number" 
                      step="0.5"
                      min="0"
                      value={foodCost}
                      onChange={(e) => setFoodCost(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white font-bold text-center focus:border-amber-500 outline-none"
                   />
                 </div>

                 <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                   <span className="text-amber-400 font-bold text-xl">{formatCurrency(parsedFoodCost)}</span>
                 </div>
               </div>
            </div>

          </div>

          {/* Notes */}
          <div>
            <textarea
              placeholder="ملاحظات إضافية..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-700 bg-slate-900 flex flex-col gap-3">
          <div className="flex justify-between items-end mb-2 px-1">
             <span className="text-slate-400">الإجمالي النهائي</span>
             <span className="text-4xl font-bold text-white">{formatCurrency(totalCost)}</span>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-300 font-semibold hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
            <button 
              onClick={() => onConfirmPayment({ 
                matchCount, 
                matchCost, 
                sessionCost, 
                foodCost: parsedFoodCost,
                totalCost, 
                notes 
              })}
              className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <CheckCircle className="w-5 h-5" />
              تأكيد الدفع
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CheckoutModal;