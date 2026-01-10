import React, { useState } from 'react';
import { X, CheckCircle, Banknote, Gamepad2, Coffee, Minus, Plus } from 'lucide-react';
import { CreditEntry, QUICK_PRICES } from '../types';
import { formatCurrency } from '../utils';

interface PartialPaymentModalProps {
  credit: CreditEntry;
  onClose: () => void;
  onConfirm: (amounts: { playPayment: number; foodPayment: number }) => void;
}

const PartialPaymentModal: React.FC<PartialPaymentModalProps> = ({ credit, onClose, onConfirm }) => {
  const [playPayment, setPlayPayment] = useState<string>('');
  const [foodPayment, setFoodPayment] = useState<string>('');
  
  const pPay = parseFloat(playPayment) || 0;
  const fPay = parseFloat(foodPayment) || 0;
  const totalPay = pPay + fPay;

  // Special increments for Play Amount (2.5 steps up to 20)
  const PLAY_DEBT_INCREMENTS = [2.5, 5.0, 7.5, 10.0, 12.5, 15.0, 17.5, 20.0];

  // Helpers with MAX validation
  const handlePlayPaymentChange = (delta: number) => {
      const current = parseFloat(playPayment) || 0;
      const newVal = Math.min(credit.playAmount, Math.max(0, current + delta));
      setPlayPayment(newVal.toString());
  };

  const setPlayPaymentValue = (val: number) => {
      const newVal = Math.min(credit.playAmount, val);
      setPlayPayment(newVal.toString());
  };

  const handleFoodPaymentChange = (delta: number) => {
      const current = parseFloat(foodPayment) || 0;
      const newVal = Math.min(credit.foodAmount, Math.max(0, current + delta));
      setFoodPayment(newVal.toString());
  };

  // Additive logic for Quick Food buttons
  const addFoodPayment = (amountToAdd: number) => {
      const current = parseFloat(foodPayment) || 0;
      const newVal = Math.min(credit.foodAmount, current + amountToAdd);
      setFoodPayment(newVal.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (totalPay <= 0) {
      alert('المرجو إدخال مبلغ للدفع');
      return;
    }
    // Validation is handled by UI constraints, but double check
    if (pPay > credit.playAmount || fPay > credit.foodAmount) {
        alert('المبلغ المدخل أكبر من الدين المتبقي');
        return;
    }

    onConfirm({ playPayment: pPay, foodPayment: fPay });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-700 overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Banknote className="text-emerald-500 w-5 h-5" />
            دفع جزء من الدين: {credit.customerName}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 text-center mb-4">
             <p className="text-slate-400 text-sm mb-1">إجمالي المبلغ المتبقي</p>
             <p className="text-2xl font-bold text-white">{formatCurrency(credit.totalAmount)}</p>
          </div>

          <div className="space-y-6">
            {/* Play Debt Section */}
            <div className={`p-4 rounded-xl border ${credit.playAmount > 0 ? 'bg-indigo-900/10 border-indigo-500/30' : 'bg-slate-800/50 border-slate-700 opacity-60 pointer-events-none'}`}>
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold">
                        <Gamepad2 className="w-4 h-4" /> دين اللعب
                    </div>
                    <span className="text-slate-300 text-sm font-mono bg-slate-900 px-2 py-1 rounded border border-slate-700">{formatCurrency(credit.playAmount)}</span>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                    <button 
                        type="button" 
                        onClick={() => handlePlayPaymentChange(-2.5)}
                        disabled={credit.playAmount <= 0}
                        className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 text-slate-300 font-bold flex items-center justify-center transition-colors"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <input 
                      type="number" 
                      step="0.5"
                      min="0"
                      max={credit.playAmount}
                      disabled={credit.playAmount <= 0}
                      value={playPayment}
                      onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (val > credit.playAmount) return;
                          setPlayPayment(e.target.value);
                      }}
                      className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-indigo-500 outline-none text-center ltr font-bold"
                      placeholder="0.00"
                    />
                    <button 
                        type="button" 
                        onClick={() => handlePlayPaymentChange(2.5)}
                        disabled={credit.playAmount <= 0}
                        className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 text-slate-300 font-bold flex items-center justify-center transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                   {PLAY_DEBT_INCREMENTS.map(price => (
                      <button 
                        key={`play-pay-${price}`}
                        type="button"
                        onClick={() => setPlayPaymentValue(price)}
                        disabled={price > credit.playAmount && Math.abs(price - credit.playAmount) > 0.01 && price > credit.playAmount + 2.5} // Disable only if way above
                        className={`rounded-lg py-2 text-sm font-bold transition-colors border ${price <= credit.playAmount ? 'bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border-slate-600 hover:border-indigo-500' : 'bg-slate-800/50 text-slate-600 border-slate-700 cursor-not-allowed'}`}
                      >
                        {price}
                      </button>
                   ))}
                </div>
            </div>

            {/* Food Debt Section */}
            <div className={`p-4 rounded-xl border ${credit.foodAmount > 0 ? 'bg-pink-900/10 border-pink-500/30' : 'bg-slate-800/50 border-slate-700 opacity-60 pointer-events-none'}`}>
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-pink-400 text-sm font-bold">
                        <Coffee className="w-4 h-4" /> دين المأكولات (تراكمي)
                    </div>
                    <span className="text-slate-300 text-sm font-mono bg-slate-900 px-2 py-1 rounded border border-slate-700">{formatCurrency(credit.foodAmount)}</span>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                    <button 
                        type="button" 
                        onClick={() => handleFoodPaymentChange(-0.5)}
                        disabled={credit.foodAmount <= 0}
                        className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 text-slate-300 font-bold flex items-center justify-center transition-colors"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <div className="relative flex-1">
                        <input 
                          type="number" 
                          step="0.5"
                          min="0"
                          max={credit.foodAmount}
                          disabled={credit.foodAmount <= 0}
                          value={foodPayment}
                          onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (val > credit.foodAmount) return;
                              setFoodPayment(e.target.value);
                          }}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-pink-500 outline-none text-center ltr font-bold"
                          placeholder="0.00"
                        />
                        {parseFloat(foodPayment) > 0 && (
                            <button 
                                type="button"
                                onClick={() => setFoodPayment('')}
                                className="absolute left-2 top-2.5 text-slate-500 hover:text-red-400"
                                title="مسح المبلغ"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <button 
                        type="button" 
                        onClick={() => handleFoodPaymentChange(0.5)}
                        disabled={credit.foodAmount <= 0}
                        className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 text-slate-300 font-bold flex items-center justify-center transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-6 gap-2">
                   {QUICK_PRICES.map(price => (
                      <button 
                        key={`food-pay-${price}`}
                        type="button"
                        onClick={() => addFoodPayment(price)}
                        disabled={credit.foodAmount <= 0}
                        className="bg-slate-800 hover:bg-pink-600 text-slate-300 hover:text-white border border-slate-600 hover:border-pink-500 rounded py-1 text-xs transition-colors"
                        title={`إضافة +${price}`}
                      >
                        +{price}
                      </button>
                   ))}
                </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
              <span className="text-slate-400 text-sm">مجموع الدفع الآن:</span>
              <span className="text-xl font-bold text-emerald-400">{formatCurrency(totalPay)}</span>
          </div>

          <div className="flex gap-3">
             <button 
               type="button" 
               onClick={onClose}
               className="flex-1 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
             >
               إلغاء
             </button>
             <button 
               type="submit" 
               disabled={totalPay <= 0}
               className="flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
             >
               <CheckCircle className="w-5 h-5" />
               تأكيد الخصم
             </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default PartialPaymentModal;