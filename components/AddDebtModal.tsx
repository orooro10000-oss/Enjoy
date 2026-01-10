import React, { useState } from 'react';
import { X, PlusCircle, Gamepad2, Coffee, FileText, Minus, Plus } from 'lucide-react';
import { CreditEntry, QUICK_PRICES } from '../types';
import { formatCurrency } from '../utils';

interface AddDebtModalProps {
  credit: CreditEntry;
  onClose: () => void;
  onConfirm: (amounts: { playAmount: number; foodAmount: number; notes: string }) => void;
}

const AddDebtModal: React.FC<AddDebtModalProps> = ({ credit, onClose, onConfirm }) => {
  const [playAmount, setPlayAmount] = useState<string>('');
  const [foodAmount, setFoodAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  const pAmount = parseFloat(playAmount) || 0;
  const fAmount = parseFloat(foodAmount) || 0;
  const totalNewDebt = pAmount + fAmount;

  // Special increments for Play Amount (2.5 steps up to 20)
  const PLAY_DEBT_INCREMENTS = [2.5, 5.0, 7.5, 10.0, 12.5, 15.0, 17.5, 20.0];

  const handlePlayAmountChange = (delta: number) => {
      const current = parseFloat(playAmount) || 0;
      const newVal = Math.max(0, current + delta);
      setPlayAmount(newVal.toString());
  };

  const handleFoodAmountChange = (delta: number) => {
      const current = parseFloat(foodAmount) || 0;
      const newVal = Math.max(0, current + delta);
      setFoodAmount(newVal.toString());
  };

  // Additive logic for Quick Food buttons
  const addFoodAmount = (amountToAdd: number) => {
      const current = parseFloat(foodAmount) || 0;
      const newVal = current + amountToAdd;
      setFoodAmount(newVal.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalNewDebt <= 0) return;
    onConfirm({ playAmount: pAmount, foodAmount: fAmount, notes });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-700 overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PlusCircle className="text-blue-500 w-5 h-5" />
            إضافة دين جديد: {credit.customerName}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 text-center mb-4">
             <p className="text-slate-400 text-sm mb-1">الدين الحالي (القديم)</p>
             <p className="text-xl font-bold text-slate-300">{formatCurrency(credit.totalAmount)}</p>
          </div>

          <div className="space-y-6">
            {/* Play Debt Input (UPDATED - 2.5 Step) */}
            <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-700/50">
                <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2 font-bold">
                    <Gamepad2 className="w-4 h-4 text-indigo-400" /> مبلغ اللعب الجديد
                </label>
                <div className="flex items-center gap-2 mb-3">
                    <button 
                    type="button" 
                    onClick={() => handlePlayAmountChange(-2.5)}
                    className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 text-slate-300 font-bold flex items-center justify-center transition-colors"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <input 
                    type="number" 
                    step="0.5"
                    min="0"
                    value={playAmount}
                    onChange={(e) => setPlayAmount(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-indigo-500 outline-none text-center ltr"
                    placeholder="0.00"
                    />
                    <button 
                    type="button" 
                    onClick={() => handlePlayAmountChange(2.5)}
                    className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 text-slate-300 font-bold flex items-center justify-center transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                   {PLAY_DEBT_INCREMENTS.map(price => (
                      <button 
                        key={`play-${price}`}
                        type="button"
                        onClick={() => setPlayAmount(price.toString())}
                        className="bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-600 hover:border-indigo-500 rounded-lg py-2 text-sm font-bold transition-colors"
                      >
                        {price}
                      </button>
                   ))}
                </div>
            </div>

            {/* Food Debt Input (UPDATED - Calculator Style) */}
            <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-700/50">
                <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2 font-bold">
                    <Coffee className="w-4 h-4 text-pink-400" /> مبلغ المأكولات (تراكمي)
                </label>
                
                <div className="flex items-center gap-2 mb-3">
                    <button 
                    type="button" 
                    onClick={() => handleFoodAmountChange(-0.5)}
                    className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 text-slate-300 font-bold flex items-center justify-center transition-colors"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <div className="relative flex-1">
                        <input 
                            type="number" 
                            step="0.5"
                            min="0"
                            value={foodAmount}
                            onChange={(e) => setFoodAmount(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-pink-500 outline-none text-center ltr"
                            placeholder="0.00"
                        />
                        {parseFloat(foodAmount) > 0 && (
                            <button 
                                type="button"
                                onClick={() => setFoodAmount('')}
                                className="absolute left-2 top-2.5 text-slate-500 hover:text-red-400"
                                title="مسح المبلغ"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <button 
                    type="button" 
                    onClick={() => handleFoodAmountChange(0.5)}
                    className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 text-slate-300 font-bold flex items-center justify-center transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-6 gap-2">
                   {QUICK_PRICES.map(price => (
                      <button 
                        key={`food-${price}`}
                        type="button"
                        onClick={() => addFoodAmount(price)}
                        className="bg-slate-800 hover:bg-pink-600 text-slate-300 hover:text-white border border-slate-600 hover:border-pink-500 rounded py-1 text-xs transition-colors"
                        title={`إضافة +${price}`}
                      >
                        +{price}
                      </button>
                   ))}
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="block text-sm text-slate-400 mb-1 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" /> ملاحظات إضافية
                </label>
                <input 
                  type="text" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                  placeholder="تفاصيل الدين الجديد..."
                />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
              <span className="text-slate-400 text-sm">مجموع الدين الجديد:</span>
              <span className="text-xl font-bold text-white">{formatCurrency(credit.totalAmount + totalNewDebt)}</span>
          </div>

          <div className="flex gap-3 pt-2">
             <button 
               type="button" 
               onClick={onClose}
               className="flex-1 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
             >
               إلغاء
             </button>
             <button 
               type="submit" 
               disabled={totalNewDebt <= 0}
               className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
             >
               <PlusCircle className="w-5 h-5" />
               تأكيد الإضافة
             </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddDebtModal;