import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import StationCard from './components/StationCard';
import CheckoutModal from './components/CheckoutModal';
import EditSessionModal from './components/EditSessionModal';
import StationHistoryModal from './components/StationHistoryModal';
import PartialPaymentModal from './components/PartialPaymentModal';
import AddDebtModal from './components/AddDebtModal';
import ConfirmModal from './components/ConfirmModal';
import { Station, Session, Expense, DailyStats, CONFIG, DEFAULT_STATIONS, EXPENSE_CATEGORIES, CreditEntry, CreditTransaction, StoreTransaction, QUICK_PRICES } from './types';
import { formatCurrency, generateId } from './utils';
import { TrendingUp, Wallet, Activity, AlertTriangle, PlusCircle, Trash2, Pencil, Save, X, Clock, Swords, Monitor, List, Users, Coffee, Gamepad, Gamepad2, Banknote, CheckCircle, RotateCcw, ShoppingBag, Plus, ChevronRight, Tags, FileText, Printer, ArrowDownCircle, ArrowUpCircle, Minus, ShoppingCart, RefreshCcw, Lock } from 'lucide-react';

const App: React.FC = () => {
  // --- Auth State ---
  const [isLocked, setIsLocked] = useState(true);
  const [unlockCode, setUnlockCode] = useState('');
  const [authError, setAuthError] = useState('');

  // --- State ---
  const [activeTab, setActiveTab] = useState('floor');
  const [stations, setStations] = useState<Station[]>(DEFAULT_STATIONS);
  
  // In a real app, these would be in a DB. Here we use memory + basic effect persistence logic if needed
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [credits, setCredits] = useState<CreditEntry[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [storeTransactions, setStoreTransactions] = useState<StoreTransaction[]>([]);
  
  // Expenses Form State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: EXPENSE_CATEGORIES[0],
    description: ''
  });

  // Credit Form State
  const [creditForm, setCreditForm] = useState({
    customerName: '',
    playAmount: '',
    foodAmount: '',
    notes: ''
  });
  const [partialPaymentCredit, setPartialPaymentCredit] = useState<CreditEntry | null>(null);
  const [addDebtCredit, setAddDebtCredit] = useState<CreditEntry | null>(null);

  // Store Form State
  const [storeForm, setStoreForm] = useState({
    productName: '',
    amount: ''
  });
  const [storeQuantity, setStoreQuantity] = useState(1);
  const [storeUnitPrice, setStoreUnitPrice] = useState(0);
  
  // Store Cart State (New)
  const [cart, setCart] = useState<Array<{
    id: string;
    name: string;
    unitPrice: number;
    quantity: number;
    total: number;
  }>>([]);
  
  // Confirmation Modal State
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger: boolean;
  } | null>(null);

  // Session Management State
  const [checkoutStation, setCheckoutStation] = useState<Station | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [historyStationId, setHistoryStationId] = useState<string | null>(null);
  const [selectedDashboardStationId, setSelectedDashboardStationId] = useState<string | null>(null);
  const [selectedDashboardExpenseCategory, setSelectedDashboardExpenseCategory] = useState<string | null>(null);

  // --- Constants for Quick Store Select ---
  const QUICK_PRODUCTS = ['ماء', 'مشروبات', 'عصير', 'بسكويت', 'حلويات', 'مكسرات', 'شيبس'];
  
  // Special increments for Play Amount (2.5 steps up to 20)
  const PLAY_DEBT_INCREMENTS = [2.5, 5.0, 7.5, 10.0, 12.5, 15.0, 17.5, 20.0];

  // --- Auth Handlers ---
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockCode === 'summer') {
      setIsLocked(false);
      setUnlockCode('');
      setAuthError('');
      setActiveTab('dashboard'); // Automatically switch to dashboard on unlock
    } else {
      setAuthError('رمز الدخول غير صحيح');
      setUnlockCode('');
    }
  };

  const handleLockApp = () => {
    setIsLocked(true);
  };

  // --- Actions ---

  const handleStartTime = (stationId: string, durationMinutes?: number) => {
    setStations(prev => prev.map(s => {
      if (s.id === stationId) {
        const now = Date.now();
        // Calculate target end time if duration is provided
        const targetEndTime = durationMinutes ? now + (durationMinutes * 60 * 1000) : undefined;

        return { 
          ...s, 
          status: 'BUSY', 
          startTime: now,
          targetEndTime: targetEndTime,
          currentSessionId: s.currentSessionId || generateId(),
          currentMatchCount: s.currentMatchCount || 0
        };
      }
      return s;
    }));
  };

  const handleStopClick = (station: Station) => {
    setCheckoutStation(station);
  };

  const handleAddMatch = (stationId: string, count: number = 1) => {
    setStations(prev => prev.map(s => {
      if (s.id === stationId) {
        // If available, make busy (without time) and add match.
        // If busy, just add match.
        const isAvailable = s.status === 'AVAILABLE';
        return { 
          ...s, 
          status: 'BUSY', 
          currentSessionId: s.currentSessionId || generateId(),
          currentMatchCount: (s.currentMatchCount || 0) + count,
          startTime: s.startTime // Preserve existing start time if any
        };
      }
      return s;
    }));
  };

  const handleRemoveMatch = (stationId: string, count: number = 1) => {
    setStations(prev => prev.map(s => {
      if (s.id === stationId && (s.currentMatchCount || 0) > 0) {
        const newCount = Math.max(0, (s.currentMatchCount || 0) - count);
        return { ...s, currentMatchCount: newCount };
      }
      return s;
    }));
  };

  const handleConfirmPayment = (details: {
    matchCount: number;
    matchCost: number;
    sessionCost: number;
    foodCost: number;
    totalCost: number;
    notes: string;
  }) => {
    if (!checkoutStation) return;

    // Determine start time for record (use actual start time, or now if match-only session)
    const recordStartTime = checkoutStation.startTime || Date.now();
    const durationMinutes = checkoutStation.startTime 
      ? Math.floor((Date.now() - checkoutStation.startTime) / 60000)
      : 0;

    const newSession: Session = {
      id: checkoutStation.currentSessionId || generateId(),
      stationId: checkoutStation.id,
      stationName: checkoutStation.name,
      startTime: recordStartTime,
      endTime: Date.now(),
      durationMinutes: durationMinutes,
      sessionCost: details.sessionCost,
      matchCount: details.matchCount,
      matchCost: details.matchCost,
      foodCost: details.foodCost, // Add food cost
      totalCost: details.totalCost,
      isPaid: true,
      notes: details.notes
    };

    // Save Session
    setSessions(prev => [newSession, ...prev]);

    // Reset Station
    setStations(prev => prev.map(s => {
      if (s.id === checkoutStation.id) {
        return { 
          ...s, 
          status: 'AVAILABLE', 
          startTime: undefined, 
          currentSessionId: undefined, 
          targetEndTime: undefined,
          currentMatchCount: 0 
        };
      }
      return s;
    }));

    // Close Modal
    setCheckoutStation(null);
  };

  // --- Session Edit/Delete Handlers ---

  const handleDeleteSession = (sessionId: string) => {
      setConfirmation({
        isOpen: true,
        title: 'حذف الجلسة',
        message: 'هل أنت متأكد من حذف هذه الجلسة نهائياً من السجلات؟',
        isDanger: true,
        onConfirm: () => {
          setSessions(prev => prev.filter(s => s.id !== sessionId));
        }
      });
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
  };

  const handleSaveSessionUpdate = (updatedSession: Session) => {
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    setEditingSession(null);
  };

  // --- Expenses Logic ---

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseForm.amount);
    if (!amount || !expenseForm.category) return;

    if (editingExpense) {
      // Update existing
      setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? {
        ...exp,
        amount,
        category: expenseForm.category,
        description: expenseForm.description,
      } : exp));
      setEditingExpense(null);
    } else {
      // Create new
      setExpenses(prev => [{
        id: generateId(),
        amount,
        category: expenseForm.category,
        description: expenseForm.description,
        timestamp: Date.now()
      }, ...prev]);
    }
    // Reset form
    setExpenseForm({ amount: '', category: EXPENSE_CATEGORIES[0], description: '' });
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    setExpenseForm({ amount: '', category: EXPENSE_CATEGORIES[0], description: '' });
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description
    });
    // Switch to expenses tab to show the form
    setActiveTab('expenses');
  };

  const handleDeleteExpense = (id: string) => {
    // Direct delete without confirmation to fix "not working" issue if alert is blocked
    setExpenses(prev => prev.filter(e => e.id !== id));
    
    if (editingExpense?.id === id) {
      handleCancelEdit();
    }
  };

  // --- Store Logic ---

  const handleStoreQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, storeQuantity + delta);
    setStoreQuantity(newQuantity);
    
    // If we have a unit price selected, update the total amount
    if (storeUnitPrice > 0) {
      setStoreForm(prev => ({ ...prev, amount: (storeUnitPrice * newQuantity).toString() }));
    }
  };

  // NEW: Add item to cart instead of direct submit
  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(storeForm.amount);
    if (!amount || !storeForm.productName.trim()) {
      alert("يرجى إدخال اسم المنتج والمبلغ");
      return;
    }

    // Determine unit price
    // If unit price is tracked (from quick buttons), use it
    // If not, calculate it from total amount / quantity
    let finalUnitPrice = storeUnitPrice;
    if (finalUnitPrice === 0) {
        finalUnitPrice = amount / storeQuantity;
    }

    // Check if item exists in cart to merge
    const existingItemIndex = cart.findIndex(
        item => item.name === storeForm.productName.trim() && Math.abs(item.unitPrice - finalUnitPrice) < 0.01
    );

    if (existingItemIndex >= 0) {
        // Update existing item
        setCart(prev => {
            const newCart = [...prev];
            newCart[existingItemIndex].quantity += storeQuantity;
            newCart[existingItemIndex].total = newCart[existingItemIndex].quantity * newCart[existingItemIndex].unitPrice;
            return newCart;
        });
    } else {
        // Add new item
        setCart(prev => [...prev, {
            id: generateId(),
            name: storeForm.productName.trim(),
            unitPrice: finalUnitPrice,
            quantity: storeQuantity,
            total: finalUnitPrice * storeQuantity
        }]);
    }

    // Reset Form
    setStoreForm({ productName: '', amount: '' });
    setStoreQuantity(1);
    setStoreUnitPrice(0);
  };

  // NEW: Update quantity inside cart
  const handleUpdateCartItem = (id: string, delta: number) => {
      setCart(prev => prev.map(item => {
          if (item.id === id) {
              const newQty = Math.max(1, item.quantity + delta);
              return { 
                  ...item, 
                  quantity: newQty, 
                  total: newQty * item.unitPrice 
              };
          }
          return item;
      }));
  };

  // NEW: Remove from cart
  const handleRemoveFromCart = (id: string) => {
      setCart(prev => prev.filter(item => item.id !== id));
  };

  // NEW: Complete the sale (Checkout Cart)
  const handleCheckoutCart = () => {
      if (cart.length === 0) return;

      const timestamp = Date.now();
      const newTransactions: StoreTransaction[] = cart.map(item => ({
          id: generateId(),
          productName: item.quantity > 1 ? `${item.name} (x${item.quantity})` : item.name,
          amount: item.total,
          timestamp: timestamp
      }));

      setStoreTransactions(prev => [...newTransactions, ...prev]);
      setCart([]); // Clear cart
  };

  const handleDeleteStoreTransaction = (id: string) => {
    setStoreTransactions(prev => prev.filter(t => t.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);

  // --- Credit Logic ---

  const handleCreditPlayAmountChange = (delta: number) => {
      const current = parseFloat(creditForm.playAmount) || 0;
      const newVal = Math.max(0, current + delta);
      setCreditForm(prev => ({ ...prev, playAmount: newVal.toString() }));
  };

  const handleCreditFoodAmountChange = (delta: number) => {
      const current = parseFloat(creditForm.foodAmount) || 0;
      const newVal = Math.max(0, current + delta);
      setCreditForm(prev => ({ ...prev, foodAmount: newVal.toString() }));
  };

  // Additive logic for Quick Food buttons
  const addCreditFoodAmount = (amountToAdd: number) => {
      const current = parseFloat(creditForm.foodAmount) || 0;
      const newVal = current + amountToAdd;
      setCreditForm(prev => ({ ...prev, foodAmount: newVal.toString() }));
  };

  const handleCreditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customerName = creditForm.customerName.trim();
    const playAmount = parseFloat(creditForm.playAmount) || 0;
    const foodAmount = parseFloat(creditForm.foodAmount) || 0;

    if (!customerName || (playAmount === 0 && foodAmount === 0)) {
        alert("يرجى إدخال اسم الزبون ومبلغ واحد على الأقل");
        return;
    }

    const newCredit: CreditEntry = {
        id: generateId(),
        customerName,
        playAmount,
        foodAmount,
        totalAmount: playAmount + foodAmount,
        isPaid: false,
        timestamp: Date.now(),
        notes: creditForm.notes
    };

    setCredits(prev => [newCredit, ...prev]);
    setCreditForm({ customerName: '', playAmount: '', foodAmount: '', notes: '' });
  };

  const handleMarkAsFullPaid = (id: string) => {
      const credit = credits.find(c => c.id === id);
      if (!credit) return;

      setConfirmation({
        isOpen: true,
        title: 'تأكيد السداد الكامل',
        message: 'هل أنت متأكد من سداد كامل المبلغ؟ سيتم تسجيل العملية وحذف اسم الزبون من قائمة الديون.',
        isDanger: false,
        onConfirm: () => {
             // 1. Record transactions for the remaining amount
             const newTransactions: CreditTransaction[] = [];
             if (credit.playAmount > 0) {
                 newTransactions.push({
                     id: generateId(),
                     creditId: credit.id,
                     amount: credit.playAmount,
                     type: 'PLAY',
                     timestamp: Date.now()
                 });
             }
             if (credit.foodAmount > 0) {
                 newTransactions.push({
                     id: generateId(),
                     creditId: credit.id,
                     amount: credit.foodAmount,
                     type: 'FOOD',
                     timestamp: Date.now()
                 });
             }
             setCreditTransactions(prev => [...newTransactions, ...prev]);

             // 2. DELETE Credit (Remove from list instead of marking paid)
             setCredits(prev => prev.filter(c => c.id !== id));
        }
      });
  };

  const handlePartialPayment = (amounts: { playPayment: number; foodPayment: number }) => {
      if (!partialPaymentCredit) return;
      
      // 1. Record transactions
      const newTransactions: CreditTransaction[] = [];
      if (amounts.playPayment > 0) {
          newTransactions.push({
              id: generateId(),
              creditId: partialPaymentCredit.id,
              amount: amounts.playPayment,
              type: 'PLAY',
              timestamp: Date.now()
          });
      }
      if (amounts.foodPayment > 0) {
          newTransactions.push({
              id: generateId(),
              creditId: partialPaymentCredit.id,
              amount: amounts.foodPayment,
              type: 'FOOD',
              timestamp: Date.now()
          });
      }
      setCreditTransactions(prev => [...newTransactions, ...prev]);

      // 2. Update Credit Balance AND Delete if Zero
      setCredits(prev => {
          const updatedList = prev.map(c => {
              if (c.id === partialPaymentCredit.id) {
                  const newPlayAmount = Math.max(0, c.playAmount - amounts.playPayment);
                  const newFoodAmount = Math.max(0, c.foodAmount - amounts.foodPayment);
                  const newTotal = newPlayAmount + newFoodAmount;

                  // If debt is fully paid, mark for deletion (return null)
                  if (newTotal === 0) return null;

                  return { 
                      ...c, 
                      playAmount: newPlayAmount,
                      foodAmount: newFoodAmount,
                      totalAmount: newTotal,
                      isPaid: false
                  };
              }
              return c;
          });
          
          // Filter out the nulls (paid debts)
          return updatedList.filter((c): c is CreditEntry => c !== null);
      });
      
      setPartialPaymentCredit(null);
  };
  
  const handleConfirmAddDebt = (amounts: { playAmount: number; foodAmount: number; notes: string }) => {
    if (!addDebtCredit) return;

    setCredits(prev => prev.map(c => {
      if (c.id === addDebtCredit.id) {
        const updatedPlayAmount = c.playAmount + amounts.playAmount;
        const updatedFoodAmount = c.foodAmount + amounts.foodAmount;
        const updatedTotal = updatedPlayAmount + updatedFoodAmount;
        
        // Append notes if any
        const updatedNotes = amounts.notes 
          ? (c.notes ? `${c.notes} | ${amounts.notes}` : amounts.notes) 
          : c.notes;

        return {
          ...c,
          playAmount: updatedPlayAmount,
          foodAmount: updatedFoodAmount,
          totalAmount: updatedTotal,
          isPaid: false, // Make sure it is not marked as paid since we added debt
          timestamp: Date.now(), // Update timestamp to show activity? Or keep original? Let's update to bump it up.
          notes: updatedNotes
        };
      }
      return c;
    }));
    
    setAddDebtCredit(null);
  };

  const handlePermanentlyDeleteCredit = (id: string) => {
      setConfirmation({
        isOpen: true,
        title: 'حذف السجل نهائياً',
        message: 'هل أنت متأكد من حذف هذا السجل من القائمة؟ لا يمكن التراجع عن هذا الإجراء.',
        isDanger: true,
        onConfirm: () => {
             setCredits(prev => prev.filter(c => c.id !== id));
        }
      });
  };

  // --- Stats Calculation ---
  // Calculates Play Revenue (Time + Match) separately from Food Revenue
  // NOW: Includes payments made via Credit AND Direct Store Sales
  const calculateDailyStats = () => {
    // 1. Revenue from Direct Sessions (Cash)
    const sessionPlayRevenue = sessions.reduce((acc, s) => acc + s.sessionCost + s.matchCost, 0);
    const sessionFoodRevenue = sessions.reduce((acc, s) => acc + (s.foodCost || 0), 0);
    
    // 2. Revenue from Credit Payments (Collected Debts)
    const creditPlayRevenue = creditTransactions
        .filter(t => t.type === 'PLAY')
        .reduce((acc, t) => acc + t.amount, 0);
        
    const creditFoodRevenue = creditTransactions
        .filter(t => t.type === 'FOOD')
        .reduce((acc, t) => acc + t.amount, 0);

    // 3. Revenue from Direct Store Sales (New)
    const storeRevenue = storeTransactions.reduce((acc, t) => acc + t.amount, 0);

    // 4. Totals
    const totalPlayRevenue = sessionPlayRevenue + creditPlayRevenue;
    const totalFoodRevenue = sessionFoodRevenue + creditFoodRevenue + storeRevenue;
    const totalRevenue = totalPlayRevenue + totalFoodRevenue;
    
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const activeStations = stations.filter(s => s.status === 'BUSY').length;
    
    return {
      totalPlayRevenue,
      totalFoodRevenue,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      totalSessions: sessions.length,
      utilization: (activeStations / stations.length) * 100
    };
  };

  const stats = calculateDailyStats();

  // --- Station Aggregation for "4 Lines" Display ---
  const stationAggregates = DEFAULT_STATIONS.map(st => {
    // Filter sessions by Station Name (or ID)
    const stSessions = sessions.filter(s => s.stationName === st.name);
    
    const totalDuration = stSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const totalTimeRev = stSessions.reduce((sum, s) => sum + s.sessionCost, 0);
    const totalMatches = stSessions.reduce((sum, s) => sum + s.matchCount, 0);
    const totalMatchRev = stSessions.reduce((sum, s) => sum + s.matchCost, 0);
    
    return {
      id: st.id,
      name: st.name,
      totalDuration,
      totalTimeRev,
      totalMatches,
      totalMatchRev
    };
  });

  // Helper to get sessions for history modal
  const getHistorySessions = () => {
    if (!historyStationId) return [];
    // Find name
    const st = stations.find(s => s.id === historyStationId);
    if (!st) return [];
    return sessions.filter(s => s.stationName === st.name).sort((a, b) => b.endTime! - a.endTime!);
  };

  // Filter credits for stats (only count unpaid amounts)
  const unpaidCredits = credits.filter(c => !c.isPaid);

  // Since playAmount and foodAmount now represent the REMAINING debt in the new logic, we just sum them up.
  const totalPlayDebt = unpaidCredits.reduce((acc, c) => acc + c.playAmount, 0);
  const totalFoodDebt = unpaidCredits.reduce((acc, c) => acc + c.foodAmount, 0);

  // --- Render ---

  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4" dir="rtl">
         <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col items-center">
               <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg mb-6 border border-slate-700">
                  <Lock className="w-10 h-10 text-indigo-400" />
               </div>
               
               <h1 className="text-3xl font-bold text-white mb-2">LARTISTE Manager</h1>
               <p className="text-slate-400 mb-8 text-sm">النظام مؤمن. الرجاء إدخال رمز الدخول للمتابعة.</p>

               <form onSubmit={handleUnlock} className="w-full space-y-4">
                  <div className="relative">
                     <input 
                       type="password" 
                       value={unlockCode}
                       onChange={(e) => setUnlockCode(e.target.value)}
                       placeholder="رمز الدخول"
                       className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 px-12 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-center tracking-widest text-lg"
                       autoFocus
                     />
                     <Lock className="w-5 h-5 text-slate-500 absolute right-4 top-3.5" />
                  </div>

                  {authError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-bold">
                       {authError}
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-900/20 transition-all active:scale-95"
                  >
                     دخول للنظام
                  </button>
               </form>
            </div>
         </div>
         <p className="mt-8 text-slate-600 text-xs">Protected by SecureGuard © 2024</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100 font-sans">
      
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLock={handleLockApp} />

      {/* Main Content Area */}
      <main className="mr-64 flex-1 p-8 overflow-y-auto h-screen relative">
        
        {/* Top Bar / Header Stats - UPDATED with Separate Play/Food Revenue */}
        <header className="print:hidden flex justify-between items-center mb-8 bg-slate-800/50 p-4 rounded-2xl border border-slate-700 backdrop-blur-sm sticky top-0 z-10">
           <div className="flex gap-4">
              {/* Play Revenue */}
              <div className="flex items-center gap-3 px-3 border-l border-slate-700 pl-4">
                <div className="p-2 bg-emerald-500/20 rounded-lg"><TrendingUp className="text-emerald-400 w-5 h-5"/></div>
                <div>
                  <p className="text-xs text-slate-400">الإيرادات اليومية للعب</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(stats.totalPlayRevenue)}</p>
                </div>
              </div>

              {/* Food Revenue (New) */}
              <div className="flex items-center gap-3 px-3 border-l border-slate-700 pl-4">
                <div className="p-2 bg-amber-500/20 rounded-lg"><Coffee className="text-amber-400 w-5 h-5"/></div>
                <div>
                  <p className="text-xs text-slate-400">الإيرادات اليومية للأكل</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(stats.totalFoodRevenue)}</p>
                </div>
              </div>

              {/* Expenses */}
              <div className="flex items-center gap-3 px-3 border-l border-slate-700 pl-4">
                <div className="p-2 bg-red-500/20 rounded-lg"><Wallet className="text-red-400 w-5 h-5"/></div>
                <div>
                  <p className="text-xs text-slate-400">المصروفات</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(stats.totalExpenses)}</p>
                </div>
              </div>

              {/* Net Profit */}
               <div className="flex items-center gap-3 px-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg"><Activity className="text-indigo-400 w-5 h-5"/></div>
                <div>
                  <p className="text-xs text-slate-400">الصافي التقريبي</p>
                  <p className={`text-lg font-bold ${stats.netProfit >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>
                    {formatCurrency(stats.netProfit)}
                  </p>
                </div>
              </div>
           </div>
           
           <div className="flex items-center gap-2">
             <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-700">
                <span className="text-slate-400 text-sm">التاريخ: </span>
                <span className="text-white font-mono">{new Date().toLocaleDateString('ar-MA')}</span>
             </div>
           </div>
        </header>

        {/* --- VIEW: DASHBOARD (New Summary View) --- */}
        {activeTab === 'dashboard' && (
           <div className="max-w-5xl mx-auto space-y-8">
             <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span className="w-2 h-8 bg-indigo-600 rounded-full inline-block"></span>
                  لوحة التحكم العامة
                </h2>
             </div>

             {/* Stations Status Compact View */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stations.map(s => (
                  <div key={s.id} className={`p-4 rounded-xl border flex items-center justify-between ${s.status === 'BUSY' ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                     <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${s.status === 'BUSY' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {s.type === 'PS5' ? <Gamepad2 className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-white">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.type}</p>
                        </div>
                     </div>
                     <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.status === 'BUSY' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                       {s.status === 'BUSY' ? 'مشغول' : 'متاح'}
                     </span>
                  </div>
                ))}
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Sessions - Interactive Selection */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 h-fit min-h-[400px]">
                   <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                     <Clock className="w-5 h-5 text-indigo-400" />
                     آخر الجلسات المكتملة
                   </h3>
                   
                   {!selectedDashboardStationId ? (
                     // View 1: List of Stations
                     <div className="grid grid-cols-1 gap-3">
                        {stations.map(station => {
                           const stationSessions = sessions.filter(s => s.stationName === station.name);
                           const totalAmount = stationSessions.reduce((sum, s) => sum + s.totalCost, 0);
                           
                           return (
                             <button 
                               key={station.id}
                               onClick={() => setSelectedDashboardStationId(station.id)}
                               className="flex justify-between items-center p-4 bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl transition-all group"
                             >
                                <div className="flex items-center gap-3">
                                   <div className={`p-2 rounded-lg bg-slate-800 ${station.type === 'PS5' ? 'text-indigo-400' : 'text-blue-400'}`}>
                                      {station.type === 'PS5' ? <Gamepad2 className="w-5 h-5"/> : <Monitor className="w-5 h-5"/>}
                                   </div>
                                   <div className="text-right">
                                      <span className="font-bold text-white block group-hover:text-indigo-400 transition-colors">{station.name}</span>
                                      <span className="text-xs text-slate-500">{stationSessions.length} جلسات اليوم</span>
                                   </div>
                                </div>
                                <div className="text-left">
                                   <span className="font-bold text-emerald-400 text-lg block">{formatCurrency(totalAmount)}</span>
                                   <span className="text-[10px] text-slate-500">اضغط للتفاصيل</span>
                                </div>
                             </button>
                           );
                        })}
                     </div>
                   ) : (
                     // View 2: Detailed Sessions for Selected Station
                     <div className="transition-all duration-300">
                        {(() => {
                          const station = stations.find(s => s.id === selectedDashboardStationId);
                          const stationSessions = sessions.filter(s => s.stationName === station?.name);
                          const totalAmount = stationSessions.reduce((sum, s) => sum + s.totalCost, 0);
                          
                          if (!station) return null;

                          return (
                             <>
                                <button 
                                  onClick={() => setSelectedDashboardStationId(null)}
                                  className="mb-4 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                                >
                                   <div className="bg-slate-700 p-1 rounded-full"><ChevronRight className="w-4 h-4" /></div>
                                   الرجوع للقائمة
                                </button>
                                
                                <div className="bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden">
                                   <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/50 flex justify-between items-center">
                                      <h4 className="font-bold text-indigo-400">{station.name}</h4>
                                      <span className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded-full border border-slate-700">{stationSessions.length} جلسات</span>
                                   </div>
                                   
                                   <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                      {stationSessions.length === 0 ? (
                                        <div className="p-8 text-center text-slate-500">لا توجد جلسات مسجلة لهذا الجهاز اليوم</div>
                                      ) : (
                                        <div className="divide-y divide-slate-700/30">
                                           {stationSessions.map(s => (
                                             <div key={s.id} className="flex justify-between items-center px-4 py-3 hover:bg-slate-700/20 transition-colors">
                                                <div>
                                                   <p className="text-xs text-slate-300 font-mono mb-1">
                                                     {new Date(s.endTime || 0).toLocaleTimeString('ar-MA', {hour:'2-digit', minute:'2-digit'})}
                                                   </p>
                                                   <div className="flex gap-1">
                                                      {s.matchCount > 0 && <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">{s.matchCount} M</span>}
                                                      {s.durationMinutes > 0 && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">{Math.floor(s.durationMinutes/60)}h {s.durationMinutes%60}m</span>}
                                                   </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-bold text-white">{formatCurrency(s.totalCost)}</span>
                                                    <div className="flex gap-1">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleEditSession(s); }} 
                                                            className="p-1.5 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white transition-colors"
                                                            title="تعديل"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }} 
                                                            className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                                            title="حذف"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                             </div>
                                           ))}
                                        </div>
                                      )}
                                   </div>

                                   <div className="bg-slate-800/50 px-4 py-3 border-t border-slate-700/50 flex justify-between items-center">
                                      <span className="text-sm text-slate-400">المجموع الكلي</span>
                                      <span className="font-bold text-emerald-400 text-lg">{formatCurrency(totalAmount)}</span>
                                   </div>
                                </div>
                             </>
                          );
                        })()}
                     </div>
                   )}
                </div>

                {/* Recent Expenses - Interactive Selection */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 h-fit min-h-[400px]">
                   <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                     <Wallet className="w-5 h-5 text-red-400" />
                     آخر المصروفات
                   </h3>

                   {!selectedDashboardExpenseCategory ? (
                      // View 1: List of Categories with totals
                      <div className="grid grid-cols-1 gap-3">
                        {(() => {
                          const uniqueCategories = Array.from(new Set(expenses.map(e => e.category)));
                          if (uniqueCategories.length === 0) {
                            return <p className="text-slate-500 text-sm text-center py-4">لا توجد مصروفات اليوم</p>;
                          }
                          
                          return uniqueCategories.map(cat => {
                            const catExpenses = expenses.filter(e => e.category === cat);
                            const totalAmount = catExpenses.reduce((sum, e) => sum + e.amount, 0);

                            return (
                              <button 
                                key={cat}
                                onClick={() => setSelectedDashboardExpenseCategory(cat)}
                                className="flex justify-between items-center p-4 bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                   <div className="p-2 rounded-lg bg-slate-800 text-red-400">
                                      <Tags className="w-5 h-5"/>
                                   </div>
                                   <div className="text-right">
                                      <span className="font-bold text-white block group-hover:text-red-400 transition-colors">{cat}</span>
                                      <span className="text-xs text-slate-500">{catExpenses.length} عمليات</span>
                                   </div>
                                </div>
                                <div className="text-left">
                                   <span className="font-bold text-red-400 text-lg block">-{formatCurrency(totalAmount)}</span>
                                   <span className="text-[10px] text-slate-500">اضغط للتفاصيل</span>
                                </div>
                              </button>
                            );
                          });
                        })()}
                      </div>
                   ) : (
                      // View 2: Detailed Expenses for Selected Category
                      <div className="transition-all duration-300">
                         {(() => {
                           const catExpenses = expenses.filter(e => e.category === selectedDashboardExpenseCategory);
                           const totalAmount = catExpenses.reduce((sum, e) => sum + e.amount, 0);

                           return (
                             <>
                                <button 
                                  onClick={() => setSelectedDashboardExpenseCategory(null)}
                                  className="mb-4 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                                >
                                   <div className="bg-slate-700 p-1 rounded-full"><ChevronRight className="w-4 h-4" /></div>
                                   الرجوع للقائمة
                                </button>
                                
                                <div className="bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden">
                                   <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/50 flex justify-between items-center">
                                      <h4 className="font-bold text-red-400">{selectedDashboardExpenseCategory}</h4>
                                      <span className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded-full border border-slate-700">{catExpenses.length} عمليات</span>
                                   </div>
                                   
                                   <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                      <div className="divide-y divide-slate-700/30">
                                         {catExpenses.map(e => (
                                           <div key={e.id} className="flex justify-between items-center px-4 py-3 hover:bg-slate-700/20 transition-colors">
                                              <div>
                                                 <p className="text-xs text-slate-300 font-mono mb-1">
                                                   {new Date(e.timestamp).toLocaleTimeString('ar-MA', {hour:'2-digit', minute:'2-digit'})}
                                                 </p>
                                                 <p className="text-xs text-slate-400">{e.description}</p>
                                              </div>
                                              <div className="flex items-center gap-4">
                                                  <span className="font-bold text-red-400">-{formatCurrency(e.amount)}</span>
                                                  <div className="flex gap-1">
                                                      <button 
                                                          onClick={() => handleEditExpense(e)} 
                                                          className="p-1.5 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white transition-colors"
                                                          title="تعديل"
                                                      >
                                                          <Pencil className="w-4 h-4" />
                                                      </button>
                                                      <button 
                                                          onClick={() => handleDeleteExpense(e.id)} 
                                                          className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                                          title="حذف"
                                                      >
                                                          <Trash2 className="w-4 h-4" />
                                                      </button>
                                                  </div>
                                              </div>
                                           </div>
                                         ))}
                                      </div>
                                   </div>

                                   <div className="bg-slate-800/50 px-4 py-3 border-t border-slate-700/50 flex justify-between items-center">
                                      <span className="text-sm text-slate-400">المجموع الكلي</span>
                                      <span className="font-bold text-red-400 text-lg">-{formatCurrency(totalAmount)}</span>
                                   </div>
                                </div>
                             </>
                           );
                         })()}
                      </div>
                   )}
                </div>
             </div>
           </div>
        )}

        {/* --- VIEW: FLOOR (Main) --- */}
        {activeTab === 'floor' && (
          <div className="transition-all duration-500">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-8 bg-indigo-500 rounded-full inline-block"></span>
              الصالة المباشرة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {stations.map(station => (
                <StationCard 
                  key={station.id} 
                  station={station} 
                  onStartTime={(id, duration) => handleStartTime(id, duration)}
                  onStop={handleStopClick}
                  onAddMatch={(count) => handleAddMatch(station.id, count)}
                  onRemoveMatch={(count) => handleRemoveMatch(station.id, count)}
                />
              ))}
            </div>

             {/* Recent Activity: AGGREGATED TABLES (4 Lines) */}
             <div className="mt-8 grid grid-cols-1 gap-8 max-w-5xl mx-auto">
               
               {/* Table 1: MATCH LOGS (Aggregated) - Moved to TOP */}
               <div>
                 <h3 className="text-lg font-semibold text-indigo-400 mb-4 flex items-center gap-2">
                   <Swords className="w-5 h-5" />
                   ملخص المباريات
                 </h3>
                 <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
                   <table className="w-full text-right">
                     <thead className="bg-slate-900/50 text-slate-400 text-sm">
                       <tr>
                         <th className="p-3 font-normal">المحطة</th>
                         <th className="p-3 font-normal">إجمالي المباريات</th>
                         <th className="p-3 font-normal">المجموع</th>
                         <th className="p-3 font-normal w-10"></th>
                       </tr>
                     </thead>
                     <tbody>
                       {stationAggregates.map(agg => (
                         <tr key={`match-${agg.id}`} className="border-t border-slate-700 hover:bg-slate-700/50 transition-colors">
                            <td className="p-3 font-bold text-white text-sm">{agg.name}</td>
                            <td className="p-3 text-indigo-300 font-bold text-sm">{agg.totalMatches}</td>
                            <td className="p-3 text-indigo-400 font-bold text-sm">{formatCurrency(agg.totalMatchRev)}</td>
                            <td className="p-3">
                               <button onClick={() => setHistoryStationId(agg.id)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="التفاصيل"><List className="w-4 h-4"/></button>
                            </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>

               {/* Table 2: TIME LOGS (Aggregated) - Moved to BOTTOM */}
               <div>
                 <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                   <Clock className="w-5 h-5" />
                   ملخص الجلسات الزمنية
                 </h3>
                 <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
                   <table className="w-full text-right">
                     <thead className="bg-slate-900/50 text-slate-400 text-sm">
                       <tr>
                         <th className="p-3 font-normal">المحطة</th>
                         <th className="p-3 font-normal">إجمالي الساعات</th>
                         <th className="p-3 font-normal">المجموع</th>
                         <th className="p-3 font-normal w-10"></th>
                       </tr>
                     </thead>
                     <tbody>
                       {stationAggregates.map(agg => (
                         <tr key={`time-${agg.id}`} className="border-t border-slate-700 hover:bg-slate-700/50 transition-colors">
                            <td className="p-3 font-bold text-white text-sm">{agg.name}</td>
                            <td className="p-3 text-slate-300 font-mono text-sm" dir="ltr">
                              {Math.floor(agg.totalDuration / 60)}h {agg.totalDuration % 60}m
                            </td>
                            <td className="p-3 text-emerald-400 font-bold text-sm">{formatCurrency(agg.totalTimeRev)}</td>
                            <td className="p-3">
                               <button onClick={() => setHistoryStationId(agg.id)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="التفاصيل"><List className="w-4 h-4"/></button>
                            </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>

             </div>
          </div>
        )}

        {/* --- VIEW: STORE --- */}
        {activeTab === 'store' && (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-8 bg-amber-500 rounded-full inline-block"></span>
              المتجر (بيع مباشر)
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* COL 1: Product Selection Form */}
              <div className="lg:col-span-1">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl sticky top-8">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                     <ShoppingBag className="w-5 h-5 text-amber-400" /> إضافة منتج للسلة
                  </h3>
                  
                  {/* Quick Products */}
                  <div className="mb-4">
                     <label className="text-xs text-slate-400 mb-2 block">منتجات سريعة</label>
                     <div className="grid grid-cols-3 gap-2">
                        {QUICK_PRODUCTS.map(item => (
                           <button
                             type="button"
                             key={item}
                             onClick={() => {
                               setStoreForm(prev => ({ ...prev, productName: item }));
                               setStoreQuantity(1); // Reset quantity when changing product
                             }}
                             className={`text-xs font-bold py-2 px-1 rounded-lg border transition-all ${storeForm.productName === item ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'}`}
                           >
                             {item}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Quick Prices */}
                  <div className="mb-4">
                     <label className="text-xs text-slate-400 mb-2 block">أسعار الوحدة (د.م)</label>
                     <div className="grid grid-cols-4 gap-2">
                        {QUICK_PRICES.map(price => (
                           <button
                             type="button"
                             key={price}
                             onClick={() => {
                               setStoreUnitPrice(price);
                               // Recalculate total amount based on current quantity
                               setStoreForm(prev => ({ ...prev, amount: (price * storeQuantity).toString() }));
                             }}
                             className={`text-xs font-bold py-2 rounded-lg border transition-all ${storeUnitPrice === price ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'}`}
                           >
                             {price}
                           </button>
                        ))}
                     </div>
                  </div>

                  <form onSubmit={handleAddToCart} className="space-y-4 pt-2 border-t border-slate-700">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">المنتج (كتابة يدوية)</label>
                      <input type="text" value={storeForm.productName} onChange={e => setStoreForm({...storeForm, productName: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white" placeholder="أو اكتب اسم المنتج..." />
                    </div>
                    
                    {/* Quantity Control */}
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">الكمية</label>
                      <div className="flex items-center gap-3 bg-slate-900 rounded-lg border border-slate-600 p-1">
                         <button 
                            type="button"
                            onClick={() => handleStoreQuantityChange(-1)}
                            className="w-8 h-8 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                         >
                            <Minus className="w-4 h-4"/>
                         </button>
                         <span className="flex-1 text-center font-bold text-white text-lg font-mono">{storeQuantity}</span>
                         <button 
                            type="button"
                            onClick={() => handleStoreQuantityChange(1)}
                            className="w-8 h-8 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
                         >
                            <Plus className="w-4 h-4"/>
                         </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">المبلغ الإجمالي للمنتج</label>
                      <input 
                        type="number" 
                        step="0.5" 
                        value={storeForm.amount} 
                        onChange={e => {
                          setStoreForm({...storeForm, amount: e.target.value});
                          // If user types manually, clear unit price tracking to act as raw total override
                          setStoreUnitPrice(0);
                        }} 
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white font-bold" 
                        placeholder="0.00" 
                      />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                       <PlusCircle className="w-5 h-5" /> إضافة للسلة
                    </button>
                  </form>
                </div>
              </div>

              {/* COL 2: Shopping Cart (Basket) */}
              <div className="lg:col-span-1">
                 <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl sticky top-8 flex flex-col h-fit">
                    <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center justify-between">
                       <h3 className="font-bold text-white flex items-center gap-2">
                          <ShoppingCart className="w-5 h-5 text-emerald-400" /> سلة المشتريات
                       </h3>
                       <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">{cart.length} عناصر</span>
                    </div>
                    
                    <div className="flex-1 min-h-[300px] max-h-[500px] overflow-y-auto custom-scrollbar p-2 space-y-2 bg-slate-900/30">
                       {cart.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full py-12 text-slate-500 gap-2">
                             <ShoppingCart className="w-12 h-12 opacity-20" />
                             <p>السلة فارغة</p>
                          </div>
                       ) : (
                          cart.map(item => (
                             <div key={item.id} className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-sm flex flex-col gap-2 transition-all duration-300">
                                <div className="flex justify-between items-start">
                                   <div>
                                      <p className="font-bold text-white text-sm">{item.name}</p>
                                      <p className="text-[10px] text-slate-500">{formatCurrency(item.unitPrice)} / وحدة</p>
                                   </div>
                                   <button onClick={() => handleRemoveFromCart(item.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                                      <X className="w-4 h-4" />
                                   </button>
                                </div>
                                
                                <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-1 border border-slate-700/50">
                                   <div className="flex items-center gap-2">
                                      <button onClick={() => handleUpdateCartItem(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded text-slate-300 text-sm font-bold transition-colors">-</button>
                                      <span className="text-white font-mono font-bold w-6 text-center">{item.quantity}</span>
                                      <button onClick={() => handleUpdateCartItem(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded text-slate-300 text-sm font-bold transition-colors">+</button>
                                   </div>
                                   <span className="font-bold text-emerald-400 text-sm">{formatCurrency(item.total)}</span>
                                </div>
                             </div>
                          ))
                       )}
                    </div>

                    <div className="p-4 bg-slate-900 border-t border-slate-700">
                       <div className="flex justify-between items-center mb-4">
                          <span className="text-slate-400">المجموع الكلي</span>
                          <span className="text-2xl font-bold text-white">{formatCurrency(cartTotal)}</span>
                       </div>
                       <div className="flex gap-2">
                          <button 
                             onClick={() => setCart([])}
                             disabled={cart.length === 0} 
                             className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
                          >
                             إلغاء
                          </button>
                          <button 
                             onClick={handleCheckoutCart}
                             disabled={cart.length === 0} 
                             className="flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/20"
                          >
                             <CheckCircle className="w-5 h-5" /> تأكيد البيع
                          </button>
                       </div>
                    </div>
                 </div>
              </div>

              {/* COL 3: History List */}
              <div className="lg:col-span-1">
                 <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                       <h3 className="font-bold text-slate-300">سجل المبيعات اليومية</h3>
                    </div>
                    {storeTransactions.length === 0 ? (
                       <div className="p-8 text-center text-slate-500">لا توجد مبيعات مسجلة اليوم</div>
                    ) : (
                       <div className="divide-y divide-slate-700/50 max-h-[600px] overflow-y-auto custom-scrollbar">
                          {storeTransactions.map(t => (
                             <div key={t.id} className="p-4 flex justify-between items-center hover:bg-slate-700/20">
                                <div>
                                   <p className="font-bold text-white text-sm">{t.productName}</p>
                                   <p className="text-xs text-slate-500">{new Date(t.timestamp).toLocaleTimeString('ar-MA')}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                   <span className="font-bold text-emerald-400 text-sm">{formatCurrency(t.amount)}</span>
                                   <button onClick={() => handleDeleteStoreTransaction(t.id)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>

            </div>
          </div>
        )}

        {/* --- VIEW: CREDITS --- */}
        {activeTab === 'credits' && (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-8 bg-purple-500 rounded-full inline-block"></span>
              سجل الديون (الكريدي)
            </h2>
            
            {/* Add Credit Form - Expanded */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl mb-8">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" /> إضافة زبون جديد / دين جديد
              </h3>
              <form onSubmit={handleCreditSubmit} className="space-y-6">
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="w-full">
                        <label className="text-xs text-slate-400 mb-1 block">اسم الزبون</label>
                        <input type="text" value={creditForm.customerName} onChange={e => setCreditForm({...creditForm, customerName: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white" placeholder="الاسم الكامل" />
                     </div>
                     <div className="w-full">
                        <label className="text-xs text-slate-400 mb-1 block">ملاحظات</label>
                        <input type="text" value={creditForm.notes} onChange={e => setCreditForm({...creditForm, notes: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white" placeholder="اختياري" />
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Play Amount Section (UPDATED - 2.5 Steps) */}
                     <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                        <div className="mb-2">
                           <label className="text-xs text-indigo-400 mb-1 block font-bold flex items-center gap-1"><Gamepad2 className="w-3 h-3"/> مبلغ اللعب</label>
                           <div className="flex items-center gap-2">
                               <button 
                                type="button" 
                                onClick={() => handleCreditPlayAmountChange(-2.5)}
                                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 text-slate-300 font-bold flex items-center justify-center transition-colors"
                               >
                                  <Minus className="w-4 h-4" />
                               </button>
                               <input 
                                 type="number" 
                                 step="0.5" 
                                 value={creditForm.playAmount} 
                                 onChange={e => setCreditForm({...creditForm, playAmount: e.target.value})} 
                                 className="flex-1 bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white text-center font-bold" 
                                 placeholder="0.00" 
                               />
                               <button 
                                type="button" 
                                onClick={() => handleCreditPlayAmountChange(2.5)}
                                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 text-slate-300 font-bold flex items-center justify-center transition-colors"
                               >
                                  <Plus className="w-4 h-4" />
                               </button>
                           </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mt-3">
                           {PLAY_DEBT_INCREMENTS.map(price => (
                              <button 
                                key={`play-${price}`}
                                type="button"
                                onClick={() => setCreditForm(prev => ({ ...prev, playAmount: price.toString() }))}
                                className="bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-600 hover:border-indigo-500 rounded-lg py-2 text-sm font-bold transition-colors"
                              >
                                {price}
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* Food Amount Section (UPDATED - Additive Calculator) */}
                     <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                        <div className="mb-2">
                           <label className="text-xs text-pink-400 mb-1 block font-bold flex items-center gap-1"><Coffee className="w-3 h-3"/> مبلغ الأكل (تراكمي)</label>
                           <div className="flex items-center gap-2">
                               <button 
                                type="button" 
                                onClick={() => handleCreditFoodAmountChange(-0.5)}
                                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 text-slate-300 font-bold flex items-center justify-center transition-colors"
                               >
                                  <Minus className="w-4 h-4" />
                               </button>
                               <div className="relative flex-1">
                                  <input 
                                    type="number" 
                                    step="0.5" 
                                    value={creditForm.foodAmount} 
                                    onChange={e => setCreditForm({...creditForm, foodAmount: e.target.value})} 
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white text-center font-bold" 
                                    placeholder="0.00" 
                                  />
                                  {parseFloat(creditForm.foodAmount) > 0 && (
                                     <button 
                                       type="button"
                                       onClick={() => setCreditForm({...creditForm, foodAmount: ''})}
                                       className="absolute left-2 top-2.5 text-slate-500 hover:text-red-400"
                                     >
                                        <X className="w-4 h-4" />
                                     </button>
                                  )}
                               </div>
                               <button 
                                type="button" 
                                onClick={() => handleCreditFoodAmountChange(0.5)}
                                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 text-slate-300 font-bold flex items-center justify-center transition-colors"
                               >
                                  <Plus className="w-4 h-4" />
                               </button>
                           </div>
                        </div>
                        <div className="grid grid-cols-6 gap-2 mt-3">
                           {QUICK_PRICES.map(price => (
                              <button 
                                key={`food-${price}`}
                                type="button"
                                onClick={() => addCreditFoodAmount(price)}
                                className="bg-slate-800 hover:bg-pink-600 text-slate-300 hover:text-white border border-slate-600 hover:border-pink-500 rounded py-1 text-xs transition-colors"
                                title={`إضافة +${price}`}
                              >
                                +{price}
                              </button>
                           ))}
                        </div>
                     </div>
                 </div>

                 <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20">
                    <Plus className="w-5 h-5" /> إضافة الزبون / الدين
                 </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {credits.length === 0 ? (
                 <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                    لا توجد ديون مسجلة حالياً
                 </div>
              ) : (
                 credits.map(credit => (
                   <div key={credit.id} className={`bg-slate-800 rounded-xl border ${credit.isPaid ? 'border-emerald-500/30 opacity-70' : 'border-slate-700'} overflow-hidden shadow-lg transition-all hover:shadow-2xl group`}>
                      <div className={`p-4 border-b flex justify-between items-start ${credit.isPaid ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-slate-900/50 border-slate-700'}`}>
                         <div>
                            <h3 className="font-bold text-white text-lg">{credit.customerName}</h3>
                            <p className="text-xs text-slate-500">{new Date(credit.timestamp).toLocaleDateString('ar-MA')}</p>
                         </div>
                         {credit.isPaid ? (
                            <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                               <CheckCircle className="w-3 h-3"/> مدفوع
                            </span>
                         ) : (
                            <div className="flex gap-1">
                               <button onClick={() => setAddDebtCredit(credit)} className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded" title="زيادة الدين">
                                  <PlusCircle className="w-4 h-4" />
                               </button>
                               <button onClick={() => handlePermanentlyDeleteCredit(credit.id)} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded" title="حذف">
                                  <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                         )}
                      </div>
                      
                      <div className="p-4 space-y-3">
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 flex items-center gap-1"><Gamepad2 className="w-3.5 h-3.5"/> لعب:</span>
                            <span className="font-bold text-indigo-400">{formatCurrency(credit.playAmount)}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 flex items-center gap-1"><Coffee className="w-3.5 h-3.5"/> أكل:</span>
                            <span className="font-bold text-pink-400">{formatCurrency(credit.foodAmount)}</span>
                         </div>
                         {credit.notes && (
                            <div className="text-xs text-yellow-500/70 bg-yellow-500/5 p-2 rounded border border-yellow-500/10">
                               {credit.notes}
                            </div>
                         )}
                         <div className="pt-3 border-t border-slate-700 flex justify-between items-end">
                            <span className="text-xs text-slate-500">المجموع</span>
                            <span className={`text-xl font-bold ${credit.isPaid ? 'text-emerald-400' : 'text-white'}`}>{formatCurrency(credit.totalAmount)}</span>
                         </div>
                      </div>

                      {!credit.isPaid && (
                         <div className="p-3 bg-slate-900 border-t border-slate-700 grid grid-cols-2 gap-2">
                            <button onClick={() => setPartialPaymentCredit(credit)} className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-600 transition-colors">
                               دفع جزء
                            </button>
                            <button onClick={() => handleMarkAsFullPaid(credit.id)} className="py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors">
                               سداد كامل
                            </button>
                         </div>
                      )}
                   </div>
                 ))
              )}
            </div>
          </div>
        )}

        {/* --- VIEW: EXPENSES --- */}
        {activeTab === 'expenses' && (
          <div className="max-w-4xl mx-auto">
             <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-8 bg-red-500 rounded-full inline-block"></span>
              المصروفات
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form */}
              <div className="md:col-span-1">
                 <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl sticky top-8">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                       {editingExpense ? <Pencil className="w-5 h-5 text-indigo-400" /> : <PlusCircle className="w-5 h-5 text-emerald-400" />}
                       {editingExpense ? 'تعديل مصروف' : 'إضافة مصروف'}
                    </h3>
                    <form onSubmit={handleExpenseSubmit} className="space-y-4">
                       <div>
                          <label className="text-xs text-slate-400 mb-1 block">المبلغ</label>
                          <input type="number" step="0.5" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white" placeholder="0.00" />
                       </div>
                       <div>
                          <label className="text-xs text-slate-400 mb-1 block">النوع</label>
                          <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white">
                             {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="text-xs text-slate-400 mb-1 block">الوصف</label>
                          <textarea value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white h-20" placeholder="تفاصيل..." />
                       </div>
                       
                       <div className="flex gap-2">
                          {editingExpense && (
                            <button type="button" onClick={handleCancelEdit} className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-400 hover:text-white">إلغاء</button>
                          )}
                          <button type="submit" className="flex-[2] bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                             <Save className="w-4 h-4" /> حفظ
                          </button>
                       </div>
                    </form>
                 </div>
              </div>

              {/* List */}
              <div className="md:col-span-2">
                 <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
                       <h3 className="font-bold text-slate-300">سجل المصروفات</h3>
                       <span className="text-sm font-bold text-red-400">المجموع: {formatCurrency(stats.totalExpenses)}</span>
                    </div>
                    {expenses.length === 0 ? (
                       <div className="p-8 text-center text-slate-500">لا توجد مصروفات مسجلة اليوم</div>
                    ) : (
                       <div className="divide-y divide-slate-700/50">
                          {expenses.map(exp => (
                             <div key={exp.id} className="p-4 flex justify-between items-center hover:bg-slate-700/20 group">
                                <div>
                                   <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{exp.category}</span>
                                      <span className="text-xs text-slate-500">{new Date(exp.timestamp).toLocaleTimeString('ar-MA')}</span>
                                   </div>
                                   <p className="font-bold text-white text-sm">{exp.description || 'بدون وصف'}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                   <span className="font-bold text-red-400 text-lg">-{formatCurrency(exp.amount)}</span>
                                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => handleEditExpense(exp)} className="p-1.5 hover:bg-slate-600 rounded text-slate-400 hover:text-white"><Pencil className="w-4 h-4"/></button>
                                      <button onClick={() => handleDeleteExpense(exp.id)} className="p-1.5 hover:bg-red-900/20 rounded text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
                                   </div>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: REPORTS --- */}
        {activeTab === 'reports' && (
           <div className="max-w-5xl mx-auto space-y-8 pb-12">
              <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span className="w-2 h-8 bg-yellow-500 rounded-full inline-block"></span>
                  التقرير المالي اليومي المفصل
                 </h2>
                 <button onClick={() => window.print()} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition-colors print:hidden">
                    <Printer className="w-4 h-4" /> طباعة التقرير
                 </button>
              </div>

              {/* 1. High Level Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Total In */}
                 <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><ArrowDownCircle className="w-24 h-24 text-emerald-500"/></div>
                    <p className="text-slate-400 text-sm mb-2">مجموع الدخل النقدي (Cash In)</p>
                    <p className="text-3xl font-bold text-emerald-400">{formatCurrency(stats.totalRevenue)}</p>
                    <p className="text-xs text-slate-500 mt-2">شامل اللعب، المتجر، وتحصيل الديون</p>
                 </div>
                 
                 {/* Total Out */}
                 <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><ArrowUpCircle className="w-24 h-24 text-red-500"/></div>
                    <p className="text-slate-400 text-sm mb-2">مجموع المصروفات (Cash Out)</p>
                    <p className="text-3xl font-bold text-red-400">-{formatCurrency(stats.totalExpenses)}</p>
                    <p className="text-xs text-slate-500 mt-2">شامل جميع فئات المصروفات</p>
                 </div>

                 {/* Net Profit */}
                 <div className="bg-indigo-900/20 p-6 rounded-2xl border border-indigo-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Activity className="w-24 h-24 text-indigo-500"/></div>
                    <p className="text-indigo-300 text-sm mb-2">صافي الصندوق (Net Cash)</p>
                    <p className="text-4xl font-bold text-indigo-400">{formatCurrency(stats.netProfit)}</p>
                    <p className="text-xs text-indigo-300/60 mt-2">المبلغ الفعلي المفترض تواجده في الدرج</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 
                 {/* 2. Detailed Income Breakdown */}
                 <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                    <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                       <h3 className="font-bold text-emerald-400 flex items-center gap-2"><TrendingUp className="w-4 h-4"/> تفاصيل الإيرادات</h3>
                    </div>
                    <div className="p-4 space-y-4">
                       {/* Gaming Time */}
                       <div className="flex justify-between items-center p-3 bg-slate-900/30 rounded-lg border border-slate-700/50">
                          <span className="text-slate-300 text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-500/70"/> وقت اللعب</span>
                          <span className="font-bold text-white">{formatCurrency(sessions.reduce((acc, s) => acc + s.sessionCost, 0))}</span>
                       </div>
                       {/* Gaming Matches */}
                       <div className="flex justify-between items-center p-3 bg-slate-900/30 rounded-lg border border-slate-700/50">
                          <span className="text-slate-300 text-sm flex items-center gap-2"><Swords className="w-4 h-4 text-indigo-500/70"/> مباريات</span>
                          <span className="font-bold text-white">{formatCurrency(sessions.reduce((acc, s) => acc + s.matchCost, 0))}</span>
                       </div>
                       {/* Gaming Food (Direct) */}
                       <div className="flex justify-between items-center p-3 bg-slate-900/30 rounded-lg border border-slate-700/50">
                          <span className="text-slate-300 text-sm flex items-center gap-2"><Coffee className="w-4 h-4 text-amber-500/70"/> مأكولات (داخل الجلسة)</span>
                          <span className="font-bold text-white">{formatCurrency(sessions.reduce((acc, s) => acc + (s.foodCost || 0), 0))}</span>
                       </div>
                       {/* Store Sales */}
                       <div className="flex justify-between items-center p-3 bg-slate-900/30 rounded-lg border border-slate-700/50">
                          <span className="text-slate-300 text-sm flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-amber-500/70"/> مبيعات المتجر (المباشرة)</span>
                          <span className="font-bold text-white">{formatCurrency(storeTransactions.reduce((acc, t) => acc + t.amount, 0))}</span>
                       </div>
                       {/* Debt Collection */}
                       <div className="flex justify-between items-center p-3 bg-slate-900/30 rounded-lg border border-slate-700/50">
                          <span className="text-slate-300 text-sm flex items-center gap-2"><Banknote className="w-4 h-4 text-purple-500/70"/> تحصيل ديون سابقة</span>
                          <span className="font-bold text-white">{formatCurrency(creditTransactions.reduce((acc, t) => acc + t.amount, 0))}</span>
                       </div>
                       
                       <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                          <span className="text-sm text-emerald-500 font-bold">المجموع الكلي للإيرادات</span>
                          <span className="text-xl font-bold text-emerald-400">{formatCurrency(stats.totalRevenue)}</span>
                       </div>
                    </div>
                 </div>

                 {/* 3. Detailed Expenses Breakdown */}
                 <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                    <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                       <h3 className="font-bold text-red-400 flex items-center gap-2"><Wallet className="w-4 h-4"/> تفاصيل المصروفات</h3>
                    </div>
                    <div className="p-4">
                       {expenses.length === 0 ? (
                          <div className="text-center text-slate-500 py-4">لا توجد مصروفات</div>
                       ) : (
                          <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                             {expenses.map(exp => (
                                <div key={exp.id} className="flex justify-between items-center p-2 hover:bg-slate-700/20 rounded">
                                   <div>
                                      <p className="text-xs text-slate-400">{exp.category}</p>
                                      <p className="text-sm text-slate-200">{exp.description}</p>
                                   </div>
                                   <span className="font-bold text-red-400 text-sm">-{formatCurrency(exp.amount)}</span>
                                </div>
                             ))}
                          </div>
                       )}
                       <div className="pt-4 mt-2 border-t border-slate-700 flex justify-between items-center">
                          <span className="text-sm text-red-500 font-bold">مجموع المصروفات</span>
                          <span className="text-xl font-bold text-red-400">-{formatCurrency(stats.totalExpenses)}</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* 4. Debt Flow & Operational Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Debt Flow */}
                  <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                     <div className="p-4 bg-slate-900/50 border-b border-slate-700">
                        <h3 className="font-bold text-purple-400 flex items-center gap-2"><Users className="w-4 h-4"/> حركة الديون اليوم</h3>
                     </div>
                     <div className="p-4 grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-purple-900/10 rounded-xl border border-purple-500/20">
                           <p className="text-xs text-purple-300 mb-1">ديون جديدة مسجلة (لعب/أكل)</p>
                           <p className="text-xl font-bold text-white">
                              {formatCurrency(
                                 // Simple logic: New debts = Total Credits in state created TODAY (assuming all state is today for this demo)
                                 credits.reduce((acc, c) => acc + c.totalAmount + (c.isPaid ? 0 : 0), 0) // Note: This logic in a real DB needs filtering by date created
                              )} 
                              {/* NOTE: In this demo, `credits` stores CURRENT state. Real history needs a log.
                                  For the visual, we'll sum unpaid + paid amounts to estimate 'total given today' if all were created today. 
                              */}
                           </p>
                        </div>
                        <div className="p-4 bg-emerald-900/10 rounded-xl border border-emerald-500/20">
                           <p className="text-xs text-emerald-300 mb-1">ديون تم تحصيلها (Cash In)</p>
                           <p className="text-xl font-bold text-white">{formatCurrency(creditTransactions.reduce((acc, t) => acc + t.amount, 0))}</p>
                        </div>
                     </div>
                  </div>

                  {/* Operational Stats */}
                  <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                     <div className="p-4 bg-slate-900/50 border-b border-slate-700">
                        <h3 className="font-bold text-blue-400 flex items-center gap-2"><FileText className="w-4 h-4"/> إحصائيات التشغيل</h3>
                     </div>
                     <div className="p-4 space-y-3">
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                           <span className="text-slate-400 text-sm">عدد الجلسات المكتملة</span>
                           <span className="text-white font-bold">{sessions.length}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                           <span className="text-slate-400 text-sm">عدد المباريات الملعوبة</span>
                           <span className="text-white font-bold">{sessions.reduce((acc, s) => acc + s.matchCount, 0)}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-700 pb-2">
                           <span className="text-slate-400 text-sm">عدد مبيعات المتجر</span>
                           <span className="text-white font-bold">{storeTransactions.length}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-slate-400 text-sm">إجمالي ساعات التشغيل</span>
                           <span className="text-white font-bold font-mono ltr">
                              {Math.floor(sessions.reduce((acc, s) => acc + s.durationMinutes, 0) / 60)}h {sessions.reduce((acc, s) => acc + s.durationMinutes, 0) % 60}m
                           </span>
                        </div>
                     </div>
                  </div>
              </div>

              {/* End of Report Signature Area (Visible only in Print) */}
              <div className="hidden print:block mt-12 pt-8 border-t border-black">
                 <div className="flex justify-between text-black">
                    <div>
                       <p className="font-bold">توقيع المستلم:</p>
                       <div className="h-12 border-b border-black w-48 mt-4"></div>
                    </div>
                    <div>
                       <p className="font-bold">توقيع المسلم:</p>
                       <div className="h-12 border-b border-black w-48 mt-4"></div>
                    </div>
                 </div>
                 <p className="text-center text-xs mt-8">تم إنشاء هذا التقرير تلقائياً بواسطة نظام PlayLounge Manager</p>
              </div>

           </div>
        )}
      </main>

      {/* Modals */}
      {checkoutStation && (
        <CheckoutModal 
          station={checkoutStation} 
          onClose={() => setCheckoutStation(null)} 
          onConfirmPayment={handleConfirmPayment}
        />
      )}
      
      {editingSession && (
          <EditSessionModal
            session={editingSession}
            onClose={() => setEditingSession(null)}
            onSave={handleSaveSessionUpdate}
          />
      )}

      {historyStationId && (
        <StationHistoryModal
           stationName={stations.find(s => s.id === historyStationId)?.name || ''}
           sessions={getHistorySessions()}
           onClose={() => setHistoryStationId(null)}
           onEditSession={handleEditSession}
           onDeleteSession={handleDeleteSession}
        />
      )}

      {partialPaymentCredit && (
         <PartialPaymentModal
            credit={partialPaymentCredit}
            onClose={() => setPartialPaymentCredit(null)}
            onConfirm={handlePartialPayment}
         />
      )}

      {addDebtCredit && (
         <AddDebtModal
            credit={addDebtCredit}
            onClose={() => setAddDebtCredit(null)}
            onConfirm={handleConfirmAddDebt}
         />
      )}

      {confirmation && (
        <ConfirmModal
          isOpen={confirmation.isOpen}
          title={confirmation.title}
          message={confirmation.message}
          onConfirm={confirmation.onConfirm}
          onClose={() => setConfirmation(null)}
          isDanger={confirmation.isDanger}
        />
      )}

    </div>
  );
};

export default App;