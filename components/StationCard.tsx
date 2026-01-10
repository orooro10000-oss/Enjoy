import React, { useEffect, useState } from 'react';
import { Play, Square, Gamepad2, Clock, Plus, Minus, Swords, Hourglass, Timer, Banknote } from 'lucide-react';
import { Station, CONFIG } from '../types';
import { formatDuration, formatCurrency, calculateSessionCost } from '../utils';

interface StationCardProps {
  station: Station;
  onStartTime: (id: string, durationMinutes?: number) => void;
  onStop: (station: Station) => void;
  onAddMatch: (amount?: number) => void;
  onRemoveMatch: (amount?: number) => void;
}

const StationCard: React.FC<StationCardProps> = ({ station, onStartTime, onStop, onAddMatch, onRemoveMatch }) => {
  const [elapsed, setElapsed] = useState<string>('00:00');
  const [timeCost, setTimeCost] = useState<number>(0);
  
  // Timer Mode State (Before starting)
  const [isLimitedMode, setIsLimitedMode] = useState(false);
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<string>(''); // New state for Amount input
  
  // Calculated state for UI
  const isBusy = station.status === 'BUSY';
  const hasTimeStarted = !!station.startTime;
  const isCountdown = !!station.targetEndTime;
  
  // Pricing
  const matchPrice = station.type === 'PS5' ? CONFIG.MATCH_PRICE_PS5 : CONFIG.MATCH_PRICE_PS4;
  const matchCount = station.currentMatchCount || 0;
  const matchCost = matchCount * matchPrice;
  const totalLiveCost = timeCost + matchCost;
  
  // Dynamic Half Match Price (2.5 for PS5, 2.0 for PS4)
  const halfMatchPrice = matchPrice / 2;
  
  // Timer State (Is Time Up?)
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Theme Logic
  const theme = station.type === 'PS5' ? 'indigo' : 'blue';
  
  // Determine Card Colors
  let borderColor = theme === 'indigo' ? 'border-indigo-500/20' : 'border-blue-500/20';
  let pulseEffect = false;
  let statusBadge = null;

  if (isBusy) {
    if (isTimeUp) {
       // Orange State (Time Finished)
       borderColor = 'border-orange-500 shadow-lg shadow-orange-900/40 ring-2 ring-orange-500/50';
       pulseEffect = true;
       statusBadge = (
         <div className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full border border-orange-400 shadow-sm animate-pulse flex items-center gap-1">
           <Hourglass className="w-3 h-3" /> انتهى الوقت
         </div>
       );
    } else {
       // Red State (Active)
       borderColor = 'border-red-500/50 shadow-lg shadow-red-900/20 ring-1 ring-red-500/20';
       statusBadge = (
        <div className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full border border-red-500/30 shadow-sm shadow-red-900/50 animate-pulse">
          جلسة نشطة
        </div>
       );
    }
  }

  const iconBoxClass = isBusy
    ? (isTimeUp ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-red-900/20 border-red-500/30 text-red-400')
    : `bg-slate-900 border-slate-700 ${theme === 'indigo' ? 'text-indigo-400' : 'text-blue-400'}`;


  useEffect(() => {
    let interval: number;

    const updateTimer = () => {
       if (!hasTimeStarted || !station.startTime) return;

       const now = Date.now();

       if (isCountdown && station.targetEndTime) {
         // Countdown Logic
         const remaining = station.targetEndTime - now;
         
         if (remaining <= 0) {
           setElapsed("00:00:00");
           setIsTimeUp(true);
           // Calculate cost based on the full targeted duration
           setTimeCost(calculateSessionCost(station.startTime, station.targetEndTime)); 
         } else {
           // Format remaining time
           const hours = Math.floor(remaining / (1000 * 60 * 60));
           const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
           const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
           setElapsed(`${hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`);
           setIsTimeUp(false);
           // Cost is calculated based on elapsed time even in countdown, or usually fixed? 
           // Let's show cost as if they played until now
           setTimeCost(calculateSessionCost(station.startTime, now));
         }
       } else {
         // Normal Count Up Logic
         setElapsed(formatDuration(station.startTime, now));
         setTimeCost(calculateSessionCost(station.startTime, now));
         setIsTimeUp(false);
       }
    };

    if (hasTimeStarted) {
      updateTimer();
      interval = window.setInterval(updateTimer, 1000);
    } else {
      setElapsed('00:00');
      setTimeCost(0);
      setIsTimeUp(false);
    }
    return () => clearInterval(interval);
  }, [hasTimeStarted, station.startTime, station.targetEndTime, isCountdown]);

  // Handler for start with preset time
  const handleStartPreset = (minutes: number) => {
    onStartTime(station.id, minutes);
    setIsLimitedMode(false);
    setCustomMinutes('');
    setCustomPrice('');
  };

  // Sync Price when Minutes Change
  const handleCustomMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomMinutes(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
        // Price = (Minutes / 60) * Hourly Rate
        const price = (num / 60) * CONFIG.HOURLY_RATE;
        setCustomPrice(price.toFixed(2));
    } else {
        setCustomPrice('');
    }
  };

  // Sync Minutes when Price Change
  const handleCustomPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomPrice(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
        // Minutes = (Price / Hourly Rate) * 60
        const mins = (num / CONFIG.HOURLY_RATE) * 60;
        setCustomMinutes(Math.round(mins).toString());
    } else {
        setCustomMinutes('');
    }
  };

  // Helper to calculate price preview
  const getPricePreview = (minutes: number) => {
     return (minutes / 60) * CONFIG.HOURLY_RATE;
  };

  const customMinutesNum = parseFloat(customMinutes) || 0;

  return (
    <div className={`relative bg-slate-800 rounded-3xl border ${borderColor} p-4 flex flex-col justify-between shadow-xl overflow-hidden transition-all duration-300`}>
      
      {/* Background Pulse for Busy State */}
      {isBusy && (
         <div className={`absolute inset-0 pointer-events-none animate-pulse ${isTimeUp ? 'bg-orange-500/10' : 'bg-red-500/5'}`} />
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4 px-1 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${iconBoxClass}`}>
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isBusy ? (isTimeUp ? 'text-orange-100' : 'text-red-100') : 'text-white'}`}>{station.name}</h3>
            <span className="text-xs text-slate-500 font-mono">{station.type}</span>
          </div>
        </div>
        {statusBadge}
      </div>

      {/* SEPARATE PANELS */}
      <div className="flex-1 flex flex-col gap-3 relative z-10">
        
        {/* PANEL 1: TIME CONTROL */}
        <div className={`bg-slate-900/50 rounded-xl p-3 border ${isBusy ? (isTimeUp ? 'border-orange-500/30' : 'border-red-500/20') : 'border-slate-700/50'} relative overflow-hidden group`}>
          <div className="flex justify-between items-start mb-2">
             <div className={`flex items-center gap-2 text-sm font-semibold ${isTimeUp ? 'text-orange-400' : 'text-emerald-400'}`}>
               <Clock className="w-4 h-4" />
               <span>{isCountdown ? 'الوقت المتبقي' : 'عداد الوقت'}</span>
             </div>
             {hasTimeStarted && <span className={`${isTimeUp ? 'text-orange-400' : 'text-emerald-400'} font-bold text-sm`}>{formatCurrency(timeCost)}</span>}
          </div>
          
          {hasTimeStarted ? (
            <div className="text-center py-2">
              <div className={`text-3xl font-mono font-bold tracking-wider mb-2 ${isTimeUp ? 'text-orange-500 animate-bounce' : 'text-white'}`}>{elapsed}</div>
              <p className="text-[10px] text-slate-500">
                {isCountdown ? 'جلسة بوقت محدد' : 'جاري الاحتساب...'}
              </p>
            </div>
          ) : (
             <div className="mt-2">
               {/* Pre-start Selection Mode */}
               {!isLimitedMode ? (
                  <div className="flex gap-2">
                    <button onClick={() => onStartTime(station.id)} className="flex-1 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                       <Play className="w-4 h-4 fill-current" /> مفتوح
                    </button>
                    <button onClick={() => setIsLimitedMode(true)} className="flex-1 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                       <Timer className="w-4 h-4" /> محدد
                    </button>
                  </div>
               ) : (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                     <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleStartPreset(30)} className="bg-slate-700 hover:bg-slate-600 p-2 rounded text-xs text-white border border-slate-600">
                           30 دقيقة <span className="block text-[10px] text-emerald-400 font-bold">{formatCurrency(getPricePreview(30))}</span>
                        </button>
                        <button onClick={() => handleStartPreset(60)} className="bg-slate-700 hover:bg-slate-600 p-2 rounded text-xs text-white border border-slate-600">
                           1 ساعة <span className="block text-[10px] text-emerald-400 font-bold">{formatCurrency(getPricePreview(60))}</span>
                        </button>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-2">
                        {/* Minute Input */}
                        <div className="relative">
                            <input 
                              type="number" 
                              placeholder="0" 
                              className="w-full bg-slate-950 border border-slate-700 rounded p-2 pl-8 text-sm text-white text-center outline-none focus:border-indigo-500 ltr"
                              value={customMinutes}
                              onChange={handleCustomMinutesChange}
                            />
                            <Clock className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2.5" />
                            <span className="text-[10px] text-slate-500 absolute right-1 -top-4">دقائق</span>
                        </div>

                        {/* Price Input */}
                        <div className="relative">
                            <input 
                              type="number" 
                              placeholder="0.00" 
                              className="w-full bg-slate-950 border border-slate-700 rounded p-2 pl-8 text-sm text-white text-center outline-none focus:border-emerald-500 ltr"
                              value={customPrice}
                              onChange={handleCustomPriceChange}
                            />
                            <Banknote className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2.5" />
                             <span className="text-[10px] text-slate-500 absolute right-1 -top-4">درهم</span>
                        </div>
                     </div>
                     
                     <button 
                        onClick={() => customMinutesNum > 0 && handleStartPreset(customMinutesNum)}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded py-2 font-bold text-sm shadow-md mt-1"
                        disabled={customMinutesNum <= 0}
                     >
                        بدء الجلسة
                     </button>
                     
                     <button onClick={() => setIsLimitedMode(false)} className="w-full text-[10px] text-slate-500 hover:text-white mt-1 text-center">
                        العودة للوضع المفتوح
                     </button>
                  </div>
               )}
             </div>
          )}
        </div>

        {/* PANEL 2: MATCH CONTROL */}
        <div className={`bg-slate-900/50 rounded-xl p-3 border ${isBusy ? (isTimeUp ? 'border-orange-500/30' : 'border-red-500/20') : 'border-slate-700/50'} relative`}>
          <div className="flex justify-between items-start mb-2">
             <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold">
               <Swords className="w-4 h-4" />
               <span>عداد المباريات</span>
             </div>
             <span className="text-indigo-400 font-bold text-sm">{formatCurrency(matchCost)}</span>
          </div>

          <div className="flex items-center justify-between bg-slate-950/50 rounded-lg p-1.5 mt-1 border border-white/5">
            {/* Minus Controls */}
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => onRemoveMatch(1)}
                className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 flex items-center justify-center transition-colors active:scale-95"
              >
                <Minus className="w-5 h-5" />
              </button>
              <button 
                onClick={() => onRemoveMatch(0.5)}
                className="w-10 h-6 rounded bg-slate-800 hover:bg-red-500/20 text-xs font-bold text-slate-500 hover:text-red-400 border border-slate-700 flex items-center justify-center transition-colors active:scale-95"
                title={`- ${halfMatchPrice} د.م`}
              >
                -{halfMatchPrice}
              </button>
            </div>

            <div className="flex flex-col items-center">
               <span className="text-2xl font-bold text-white leading-none">
                 {Number.isInteger(matchCount) ? matchCount : matchCount.toFixed(2).replace(/\.00$/, '')}
               </span>
               <span className="text-[10px] text-slate-500">{formatCurrency(matchPrice)}/M</span>
            </div>
            
            {/* Plus Controls */}
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => onAddMatch(1)}
                className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 border border-slate-700 flex items-center justify-center transition-colors active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button 
                onClick={() => onAddMatch(0.5)}
                className="w-10 h-6 rounded bg-slate-800 hover:bg-indigo-500/20 text-xs font-bold text-slate-500 hover:text-indigo-400 border border-slate-700 flex items-center justify-center transition-colors active:scale-95"
                title={`+ ${halfMatchPrice} د.م`}
              >
                +{halfMatchPrice}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Total & Actions */}
      {isBusy ? (
        <div className={`mt-3 pt-3 border-t ${isTimeUp ? 'border-orange-500/30' : 'border-red-500/20'} relative z-10`}>
           <div className="flex justify-between items-end mb-3">
             <span className="text-slate-400 text-xs">الإجمالي الكلي</span>
             <span className={`text-xl font-bold ${isTimeUp ? 'text-orange-400' : 'text-white'}`}>{formatCurrency(totalLiveCost)}</span>
           </div>
           <button onClick={() => onStop(station)} className={`w-full py-3 rounded-lg text-white shadow-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${isTimeUp ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-900/40' : 'bg-red-600 hover:bg-red-500 shadow-red-900/40'}`}>
              <Square className="w-4 h-4 fill-current" /> إنهاء وحساب
           </button>
        </div>
      ) : (
        <div className="mt-4 pt-2 border-t border-slate-700/50 relative z-10">
           <p className="text-center text-xs text-slate-500">المحطة جاهزة للاستخدام</p>
        </div>
      )}
    </div>
  );
};

export default StationCard;