
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order, OrderStatus, WaiterCall, Product, Language, SubscriptionInfo, Staff, HeroSlide, Category } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';
import { GoogleGenAI } from "@google/genai";

interface Props {
  orders: Order[];
  waiterCalls: WaiterCall[];
  onUpdateStatus: (id: string, status: OrderStatus, completedBy?: string) => void;
  onSendFeedback: (id: string, feedback: string) => void;
  onClearCall: (id: string, staffName: string) => void;
  isAuth: boolean;
  setAuth: (val: boolean) => void;
  products: Product[];
  onUpdateProduct: (p: Product) => void;
  onAddProduct: (p: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onAddStaff: (s: Partial<Staff>) => void;
  onUpdateStaff: (s: Staff) => void;
  onDeleteStaff: (id: string) => void;
  staff: Staff[];
  onBack: () => void;
  lang: Language;
  heroSlides: HeroSlide[];
  onUpdateHeroSlides: (slides: HeroSlide[]) => void;
  welcomeSettings: { backgroundImage: string };
  onUpdateWelcomeSettings: (settings: any) => void;
  onShowPricing: () => void;
  subscription: SubscriptionInfo;
  currentUser?: any;
  onCloseTable: (tableNum: string) => void;
  onTakeOrder: (tableNum: string, staffName: string) => void;
  categories: Category[];
  onAddCategory: (c: Category) => void;
  onDeleteCategory: (id: string) => void;
  logAction: (action: string, details: string, userName: string, userRole: string) => void;
}

const QUICK_REPLIES = [
  "Siparişiniz hazırlanıyor. 👨‍🍳",
  "5 dakika içinde masanızda! ⏳",
  "Afiyet olsun! ❤️",
  "Gecikme için özür dileriz. 🙏",
  "Hesabınız hazırlanıyor. 🧾"
];

const KitchenUI: React.FC<Props> = ({ 
  orders, waiterCalls, onUpdateStatus, onSendFeedback, onClearCall, 
  isAuth, setAuth, products, onUpdateProduct, onAddProduct, onDeleteProduct,
  onAddStaff, onUpdateStaff, onDeleteStaff, staff, onBack, lang,
  heroSlides, onUpdateHeroSlides, welcomeSettings, onUpdateWelcomeSettings,
  onShowPricing, subscription, currentUser, onCloseTable, onTakeOrder,
  categories, onAddCategory, onDeleteCategory, logAction
}) => {
  // --- STATE ---
  const [loginTab, setLoginTab] = useState<'GARSON' | 'MUTFAK' | 'ADMIN'>('GARSON');
  const [adminEmail, setAdminEmail] = useState('cevikademm@gmail.com');
  const [adminPass, setAdminPass] = useState('123');
  const [activeStaff, setActiveStaff] = useState<{name: string, role: string} | null>(null);

  const [activeTab, setActiveTab] = useState<'ORDERS' | 'TABLES' | 'CALLS' | 'PERFORMANCE' | 'MENU' | 'SHOWCASE' | 'HISTORY'>('ORDERS');
  
  // History States
  const [historyFilterType, setHistoryFilterType] = useState<'DAILY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>(''); 
  const [expandedHistoryOrder, setExpandedHistoryOrder] = useState<string | null>(null);

  // Menu States
  const [menuFilter, setMenuFilter] = useState('all');
  const [newProd, setNewProd] = useState<Partial<Product>>({ 
    name: '', price: 0, category: 'haehnchen', description: '', image: '', spiceLevel: 0, allergens: [], available: true, stock: 0
  });
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [newCategory, setNewCategory] = useState({ id: '', icon: '' });
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Showcase States
  const [newSlide, setNewSlide] = useState<Partial<HeroSlide>>({ type: 'IMAGE', url: '', title: '', subtitle: '' });

  // Feedback States
  const [activeFeedbackOrderId, setActiveFeedbackOrderId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedNotes, setTranslatedNotes] = useState<Record<string, string>>({});

  // Mock Performance Data
  const [staffStats, setStaffStats] = useState([
    { id: 'w1', name: 'Ahmet Y.', score: 1250, orders: 45, calls: 12, level: 'Hız Canavarı ⚡' },
    { id: 'w2', name: 'Ayşe K.', score: 980, orders: 32, calls: 8, level: 'Müşteri Dostu 🌟' },
    { id: 'w3', name: 'Mehmet D.', score: 1450, orders: 58, calls: 20, level: 'Salon Şefi 👑' },
  ]);

  // --- LOGIC & EFFECTS ---

  // Role Based Tabs
  const allowedTabs = useMemo(() => {
    if (!activeStaff) return [];
    if (activeStaff.role === 'Yönetici') return ['ORDERS', 'TABLES', 'CALLS', 'HISTORY', 'PERFORMANCE', 'MENU', 'SHOWCASE'];
    if (activeStaff.role === 'Garson') return ['ORDERS', 'TABLES', 'CALLS', 'HISTORY'];
    if (activeStaff.role === 'Mutfak') return ['ORDERS', 'HISTORY'];
    return ['ORDERS'];
  }, [activeStaff]);

  useEffect(() => {
     if (allowedTabs.length > 0 && !allowedTabs.includes(activeTab as any)) {
         setActiveTab(allowedTabs[0] as any);
     }
  }, [allowedTabs]);

  // Orders Logic
  const visibleOrders = useMemo(() => {
      return orders.filter(o => o.status !== OrderStatus.CLOSED && o.status !== OrderStatus.COMPLETED);
  }, [orders]);

  // History Logic
  const historyData = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.CLOSED);
    const grouped: Record<string, { total: number, orders: Order[] }> = {};

    completedOrders.forEach(order => {
        const date = new Date(order.timestamp);
        let key = '';

        if (historyFilterType === 'DAILY') {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        } else if (historyFilterType === 'MONTHLY') {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else {
            key = `${date.getFullYear()}`;
        }

        if (!grouped[key]) grouped[key] = { total: 0, orders: [] };

        grouped[key].total += order.totalPrice;
        grouped[key].orders.push(order);
    });

    return grouped;
  }, [orders, historyFilterType]);

  // Otomatik Tarih Seçimi
  useEffect(() => {
    const availableDates = Object.keys(historyData).sort().reverse();
    if ((!selectedHistoryDate || !historyData[selectedHistoryDate]) && availableDates.length > 0) {
      setSelectedHistoryDate(availableDates[0]);
    }
  }, [historyData, selectedHistoryDate]);

  // Table Logic
  const tablesWithStatus = useMemo(() => {
      const activeTablesMap = new Map<string, { total: number, status: string }>();
      orders.forEach(o => {
          if (o.status !== OrderStatus.CLOSED) {
              const current = activeTablesMap.get(o.tableNumber) || { total: 0, status: 'IDLE' };
              current.total += o.totalPrice;
              if (o.status === OrderStatus.SERVED) current.status = 'SERVED';
              else if (o.status === OrderStatus.PREPARING && current.status !== 'SERVED') current.status = 'PREPARING';
              else if (o.status === OrderStatus.RECEIVED && current.status !== 'SERVED' && current.status !== 'PREPARING') current.status = 'RECEIVED';
              else if (o.status === OrderStatus.COMPLETED && current.status === 'IDLE') current.status = 'COMPLETED';
              activeTablesMap.set(o.tableNumber, current);
          }
      });
      return Array.from(activeTablesMap.entries()).map(([table, data]) => ({
          table,
          ...data
      })).sort((a,b) => parseInt(a.table) - parseInt(b.table));
  }, [orders]);

  // Menu Filtering
  const filteredProducts = useMemo(() => {
    if (menuFilter === 'all') return products;
    return products.filter(p => p.category === menuFilter);
 }, [products, menuFilter]);

  // Auto Translate
  useEffect(() => {
    const autoTranslateNotes = async () => {
      const pendingOrders = orders.filter(o => 
        o.note && o.note.trim() !== '' &&
        o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CLOSED &&
        o.customerLanguage !== 'TR' && !translatedNotes[o.id]
      );
      if (pendingOrders.length === 0) return;
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const newTranslations: Record<string, string> = {};
      await Promise.all(pendingOrders.map(async (order) => {
        try {
           const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate this restaurant order note from ${order.customerLanguage} to Turkish. Return ONLY the translated text. Note: "${order.note}"`,
          });
          if (response.text) {
             newTranslations[order.id] = response.text.trim();
          }
        } catch (e) { console.error("Auto translation failed", e); }
      }));
      if (Object.keys(newTranslations).length > 0) {
        setTranslatedNotes(prev => ({ ...prev, ...newTranslations }));
      }
    };
    autoTranslateNotes();
  }, [orders, translatedNotes]);

  // --- HANDLERS ---
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "AZ ÖNCE";
    return `${Math.floor(seconds / 60)} DK ÖNCE`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuth(false);
    setActiveStaff(null);
    onBack();
  };

  const handleQuickLogin = (name: string, role: string) => {
    setActiveStaff({ name, role });
    setAuth(true);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail === 'cevikademm@gmail.com' && adminPass === '123') {
      setActiveStaff({ name: 'Adem Çevik', role: 'Yönetici' });
      setAuth(true);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPass });
    if (error) alert('Hatalı giriş.');
    else {
        setActiveStaff({ name: 'Yönetici', role: 'Yönetici' });
        setAuth(true);
    }
  };

  const handleCompleteCall = (callId: string) => {
    if (activeStaff) {
      onClearCall(callId, activeStaff.name);
    }
  };

  const handleSendFeedbackLocal = async (order: Order, text: string) => {
    if (!text.trim()) return;
    setIsTranslating(true);
    try {
      let finalMessage = text.trim();
      const targetLang = order.customerLanguage || 'TR';
      if (targetLang !== 'TR') {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Translate this restaurant message to the customer's language (${targetLang}). Provide ONLY the translated text. Message: "${text}"`,
        });
        if (response.text) finalMessage = response.text.trim();
      }
      onSendFeedback(order.id, finalMessage);
      setActiveFeedbackOrderId(null);
      setFeedbackText('');
    } catch (err) {
      onSendFeedback(order.id, text.trim());
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddProduct(newProd);
    setNewProd({ name: '', price: 0, category: 'haehnchen', description: '', image: '', spiceLevel: 0, allergens: [], available: true, stock: 0 });
    setIsAddingProduct(false);
  };
  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) { onUpdateProduct(editingProduct); setEditingProduct(null); }
  };
  const handleAddSlide = () => {
    if (!newSlide.url || !newSlide.title) return;
    const slideToAdd: HeroSlide = {
        id: `slide-${Date.now()}`,
        type: newSlide.type || 'IMAGE',
        url: newSlide.url,
        title: newSlide.title,
        subtitle: newSlide.subtitle || ''
    };
    onUpdateHeroSlides([...heroSlides, slideToAdd]);
    setNewSlide({ type: 'IMAGE', url: '', title: '', subtitle: '' });
  };
  const handleDeleteSlide = (id: string) => {
    if (heroSlides.length <= 1) { alert("En az bir vitrin görseli kalmalıdır."); return; }
    onUpdateHeroSlides(heroSlides.filter(s => s.id !== id));
  };

  // Rol Kontrolleri
  const isAdmin = activeStaff?.role === 'Yönetici';
  const isKitchen = activeStaff?.role === 'Mutfak' || isAdmin;
  const isWaiter = activeStaff?.role === 'Garson' || isAdmin;

  // --- RENDER ---

  if (!isAuth || !activeStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=2000')] bg-cover opacity-10 blur-sm" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-4xl bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[600px]">
          <div className="w-full md:w-1/3 bg-black/20 border-r border-white/5 p-6 flex flex-col gap-2">
            <h2 className="text-xl font-display font-bold text-white mb-6 px-2">Personel Girişi</h2>
            <button onClick={() => setLoginTab('GARSON')} className={`p-4 rounded-2xl text-left transition-all flex items-center gap-3 ${loginTab === 'GARSON' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'}`}>
              <span className="material-icons-round">restaurant_menu</span>
              <span className="font-bold text-sm">Garson Girişi</span>
            </button>
            <button onClick={() => setLoginTab('MUTFAK')} className={`p-4 rounded-2xl text-left transition-all flex items-center gap-3 ${loginTab === 'MUTFAK' ? 'bg-orange-600 text-white shadow-lg' : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'}`}>
              <span className="material-icons-round">soup_kitchen</span>
              <span className="font-bold text-sm">Mutfak Ekibi</span>
            </button>
            <button onClick={() => setLoginTab('ADMIN')} className={`p-4 rounded-2xl text-left transition-all flex items-center gap-3 ${loginTab === 'ADMIN' ? 'bg-blue-600 text-white shadow-lg' : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'}`}>
              <span className="material-icons-round">admin_panel_settings</span>
              <span className="font-bold text-sm">Yönetici</span>
            </button>
            <div className="mt-auto">
                <button onClick={onBack} className="w-full p-4 rounded-2xl text-left text-zinc-500 hover:text-white transition-colors flex items-center gap-3">
                    <span className="material-icons-round">arrow_back</span> Ana Ekrana Dön
                </button>
            </div>
          </div>
          <div className="flex-1 p-8 md:p-12 overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-8 border-b border-white/10 pb-4">
               {loginTab === 'GARSON' ? 'Hangi garson sensin?' : loginTab === 'MUTFAK' ? 'Mutfak şefi seçiniz' : 'Yönetici Girişi'}
            </h3>
            {loginTab === 'GARSON' && (
              <div className="grid grid-cols-2 gap-4">
                {[1,2,3,4,5].map((num) => (
                  <button key={num} onClick={() => handleQuickLogin(`Garson ${num}`, 'Garson')} className="h-32 bg-zinc-800 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-emerald-600/20 hover:border-emerald-500 transition-all group">
                    <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                      <span className="material-icons-round text-white">person</span>
                    </div>
                    <span className="font-bold text-sm text-white">Garson {num}</span>
                  </button>
                ))}
              </div>
            )}
            {loginTab === 'MUTFAK' && (
              <div className="grid grid-cols-2 gap-4">
                {[1,2,3].map((num) => (
                  <button key={num} onClick={() => handleQuickLogin(`Mutfak Şefi ${num}`, 'Mutfak')} className="h-32 bg-zinc-800 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-orange-600/20 hover:border-orange-500 transition-all group">
                    <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                      <span className="material-icons-round text-white">restaurant</span>
                    </div>
                    <span className="font-bold text-sm text-white">Mutfak Şefi {num}</span>
                  </button>
                ))}
              </div>
            )}
            {loginTab === 'ADMIN' && (
              <form onSubmit={handleAdminLogin} className="space-y-4 max-w-md">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">E-posta</label>
                  <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Şifre</label>
                  <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500" />
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all">Giriş Yap</button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white font-sans overflow-hidden">
        {/* Sidebar */}
        <div className="w-20 lg:w-64 bg-zinc-900 border-r border-white/5 flex flex-col">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-sm">D</div>
                <span className="hidden lg:block font-bold tracking-tight">Kudret Panel</span>
            </div>
            
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {allowedTabs.includes('ORDERS') && (
                    <button onClick={() => setActiveTab('ORDERS')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'ORDERS' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <span className="material-icons-round">receipt_long</span>
                        <span className="hidden lg:block text-sm font-medium">Siparişler</span>
                    </button>
                )}
                {allowedTabs.includes('TABLES') && (
                    <button onClick={() => setActiveTab('TABLES')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'TABLES' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <span className="material-icons-round">table_restaurant</span>
                        <span className="hidden lg:block text-sm font-medium">Masalar</span>
                    </button>
                )}
                {allowedTabs.includes('CALLS') && (
                    <button onClick={() => setActiveTab('CALLS')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'CALLS' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <div className="relative">
                            <span className="material-icons-round">notifications</span>
                            {waiterCalls.filter(c => c.status === 'ACTIVE').length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />}
                        </div>
                        <span className="hidden lg:block text-sm font-medium">Çağrılar</span>
                    </button>
                )}
                {allowedTabs.includes('HISTORY') && (
                    <button onClick={() => setActiveTab('HISTORY')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'HISTORY' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <span className="material-icons-round">history</span>
                        <span className="hidden lg:block text-sm font-medium">Geçmiş</span>
                    </button>
                )}
                {allowedTabs.includes('MENU') && (
                    <button onClick={() => setActiveTab('MENU')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'MENU' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <span className="material-icons-round">restaurant_menu</span>
                        <span className="hidden lg:block text-sm font-medium">Menü</span>
                    </button>
                )}
                {allowedTabs.includes('SHOWCASE') && (
                    <button onClick={() => setActiveTab('SHOWCASE')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'SHOWCASE' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <span className="material-icons-round">collections</span>
                        <span className="hidden lg:block text-sm font-medium">Vitrin</span>
                    </button>
                )}
                {allowedTabs.includes('PERFORMANCE') && (
                    <button onClick={() => setActiveTab('PERFORMANCE')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'PERFORMANCE' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                        <span className="material-icons-round">leaderboard</span>
                        <span className="hidden lg:block text-sm font-medium">Performans</span>
                    </button>
                )}
            </nav>

            <div className="p-4 border-t border-white/5">
                <button onClick={handleLogout} className="flex items-center gap-3 text-zinc-500 hover:text-red-400 transition-colors w-full">
                    <span className="material-icons-round">logout</span>
                    <span className="hidden lg:block text-sm font-medium">Çıkış Yap</span>
                </button>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="h-16 bg-zinc-900/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8">
               <h2 className="text-xl font-bold tracking-tight">
                   {activeTab === 'ORDERS' && 'Anlık Siparişler'}
                   {activeTab === 'TABLES' && 'Masa Yönetimi'}
                   {activeTab === 'CALLS' && 'Garson Çağrıları'}
                   {activeTab === 'HISTORY' && 'Geçmiş Siparişler'}
                   {activeTab === 'MENU' && 'Menü Düzenleme'}
                   {activeTab === 'PERFORMANCE' && 'Personel Performansı'}
                   {activeTab === 'SHOWCASE' && 'Vitrin Görselleri'}
               </h2>
               <div className="flex items-center gap-4">
                   <div className="text-right hidden sm:block">
                       <p className="text-sm font-bold text-white">{activeStaff?.name}</p>
                       <p className="text-xs text-zinc-500">{activeStaff?.role}</p>
                   </div>
                   <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-500 font-bold">
                       {activeStaff?.name.charAt(0)}
                   </div>
               </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6">
                
                {/* --- ORDERS TAB --- */}
                {activeTab === 'ORDERS' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {visibleOrders.map(order => (
                            <div key={order.id} className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                                <div className="p-4 bg-black/20 border-b border-white/5 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-xs font-black rounded uppercase tracking-wider">Masa {order.tableNumber}</span>
                                            <span className="text-zinc-500 text-xs font-bold">{getTimeAgo(order.timestamp)}</span>
                                        </div>
                                        <h3 className="font-bold text-white">{order.customerName || 'Misafir'}</h3>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                                        order.status === 'RECEIVED' ? 'bg-blue-500/10 text-blue-500' :
                                        order.status === 'PREPARING' ? 'bg-orange-500/10 text-orange-500' :
                                        'bg-green-500/10 text-green-500'
                                    }`}>
                                        {order.status === 'RECEIVED' ? 'YENİ' : order.status === 'PREPARING' ? 'HAZIRLANIYOR' : 'SERVİS EDİLDİ'}
                                    </span>
                                </div>
                                <div className="p-4 flex-1 space-y-3">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <div className="flex gap-2">
                                                <span className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-xs font-bold text-emerald-500">{item.quantity}x</span>
                                                <span className="text-zinc-300">{item.name}</span>
                                            </div>
                                            {item.note && <div className="text-xs text-amber-500 italic mt-0.5 pl-7">{item.note}</div>}
                                        </div>
                                    ))}
                                    {order.note && (
                                        <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                            <p className="text-[10px] text-amber-500 font-bold uppercase mb-1">Müşteri Notu ({order.customerLanguage})</p>
                                            <p className="text-xs text-zinc-300 italic">"{order.note}"</p>
                                            {translatedNotes[order.id] && (
                                                <p className="text-xs text-emerald-400 mt-1 border-t border-amber-500/20 pt-1">TR: "{translatedNotes[order.id]}"</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 bg-black/20 border-t border-white/5 grid grid-cols-2 gap-3">
                                    {/* Mutfak Aksiyonları */}
                                    {isKitchen && order.status === 'RECEIVED' && (
                                        <button onClick={() => onUpdateStatus(order.id, OrderStatus.PREPARING)} className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest">Hazırla</button>
                                    )}
                                    
                                    {order.status === 'PREPARING' && (
                                        <>
                                           <button onClick={() => setActiveFeedbackOrderId(order.id)} className="bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest">Mesaj At</button>
                                           {isKitchen && (
                                             <button onClick={() => onUpdateStatus(order.id, OrderStatus.SERVED)} className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest">Servis Et</button>
                                           )}
                                        </>
                                    )}

                                    {/* Garson Aksiyonları */}
                                    {order.status === 'SERVED' && (
                                        <button 
                                          onClick={() => onUpdateStatus(order.id, OrderStatus.COMPLETED, activeStaff?.name)} 
                                          className={`col-span-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest border ${isWaiter ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent' : 'bg-zinc-800 text-green-500 border-green-500/20'}`}
                                          disabled={!isWaiter}
                                        >
                                          {isWaiter ? 'Masaya Teslim Et (Tamamla)' : 'Garson Bekleniyor...'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {visibleOrders.length === 0 && (
                            <div className="col-span-full text-center py-20 text-zinc-600">
                                <span className="material-icons-round text-6xl mb-4">check_circle</span>
                                <p className="font-bold">Bekleyen sipariş yok.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* --- TABLES TAB --- */}
                {activeTab === 'TABLES' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {Array.from({ length: 15 }, (_, i) => (i + 1).toString()).map((tableNum) => {
                            const tableData = tablesWithStatus.find(t => t.table === tableNum);
                            const status = tableData?.status || 'IDLE';
                            const total = tableData?.total || 0;
                            const table = tableNum;
                            return (
                            <div key={table} className={`relative h-52 rounded-2xl border flex flex-col items-center justify-center p-4 transition-all ${
                                status === 'IDLE' ? 'bg-zinc-900 border-white/5 text-zinc-500' :
                                status === 'RECEIVED' ? 'bg-blue-900/20 border-blue-500/50 text-blue-500' :
                                status === 'PREPARING' ? 'bg-orange-900/20 border-orange-500/50 text-orange-500' :
                                status === 'SERVED' ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-500' :
                                'bg-purple-900/20 border-purple-500/50 text-purple-500'
                            }`}>
                                {status !== 'IDLE' && (
                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-black text-[9px] font-black uppercase rounded-md tracking-wider">DOLU</div>
                                )}
                                <span className="text-3xl font-black mb-1">{table}</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest mb-2">
                                    {status === 'IDLE' ? 'BOŞ' : status === 'COMPLETED' ? 'ÖDEME YAPILDI' : status}
                                </span>
                                {total > 0 && <span className="text-lg font-bold text-white">{total.toFixed(2)}€</span>}
                                
                                {(isWaiter || isAdmin) && (
                                    <button
                                        onClick={() => {
                                            if (status !== 'IDLE' && !window.confirm(`Masa ${table} zaten dolu! Yine de bu masaya sipariş eklemek istiyor musunuz?`)) return;
                                            onTakeOrder(table, activeStaff?.name || 'Personel');
                                        }}
                                        className="mt-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all"
                                    >
                                        <span className="material-icons-round text-sm">add_circle</span>
                                        Sipariş Al
                                    </button>
                                )}
                                {status !== 'IDLE' && (
                                    <>
                                        <button onClick={() => onCloseTable(table)} className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all" title="Zorla Kapat">
                                            <span className="material-icons-round text-sm">power_settings_new</span>
                                        </button>

                                        {(isWaiter || isAdmin) && (
                                            <button
                                                onClick={() => {
                                                     if(window.confirm(`Masa ${table} işlemini sonlandırıp kasayı kapatmak istiyor musunuz?`)) {
                                                        onCloseTable(table);
                                                     }
                                                }}
                                                className="absolute bottom-3 left-3 right-3 bg-zinc-950/50 hover:bg-red-600 border border-white/10 hover:border-red-500 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md flex items-center justify-center gap-2 transition-all group"
                                            >
                                                <span className="material-icons-round text-sm text-red-500 group-hover:text-white">point_of_sale</span>
                                                Kasayı Kapat
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                            );
                        })}
                    </div>
                )}

                {/* --- CALLS TAB --- */}
                {activeTab === 'CALLS' && (
                    <div className="space-y-4 max-w-3xl mx-auto">
                        {waiterCalls.filter(c => c.status === 'ACTIVE').map(call => (
                             <div key={call.id} className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between animate-pulse ring-1 ring-red-500/50">
                                 <div className="flex items-center gap-4">
                                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${call.type === 'WAITER' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                         <span className="material-icons-round">{call.type === 'WAITER' ? 'notifications_active' : 'receipt'}</span>
                                     </div>
                                     <div>
                                         <h4 className="font-bold text-white text-lg">Masa {call.tableNumber}</h4>
                                         <p className="text-zinc-500 text-xs">{call.type === 'WAITER' ? 'Garson Çağırıyor' : 'Hesap İstiyor'} • {getTimeAgo(call.timestamp)}</p>
                                     </div>
                                 </div>
                                 <button onClick={() => handleCompleteCall(call.id)} className="bg-white text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors">
                                     Tamamlandı
                                 </button>
                             </div>
                        ))}
                         {waiterCalls.filter(c => c.status === 'ACTIVE').length === 0 && (
                            <div className="text-center py-20 text-zinc-600">
                                <span className="material-icons-round text-6xl mb-4">notifications_off</span>
                                <p className="font-bold">Aktif çağrı yok.</p>
                            </div>
                        )}
                    </div>
                )}
                
                {/* --- HISTORY TAB --- */}
                {activeTab === 'HISTORY' && (
                    <div className="max-w-4xl mx-auto">
                         <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
                            <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/10">
                                <button onClick={() => setHistoryFilterType('DAILY')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${historyFilterType === 'DAILY' ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-white'}`}>Günlük</button>
                                <button onClick={() => setHistoryFilterType('MONTHLY')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${historyFilterType === 'MONTHLY' ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-white'}`}>Aylık</button>
                                <button onClick={() => setHistoryFilterType('YEARLY')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${historyFilterType === 'YEARLY' ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-white'}`}>Yıllık</button>
                            </div>
                            <select className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none w-full md:w-64" value={selectedHistoryDate} onChange={(e) => setSelectedHistoryDate(e.target.value)}>
                                {Object.keys(historyData).sort().reverse().map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                         </div>
                         {selectedHistoryDate && historyData[selectedHistoryDate] ? (
                             <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                                 <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
                                     <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-500 font-bold border border-emerald-500/10">
                                            <span className="material-icons-round">calendar_today</span>
                                        </div>
                                        <h4 className="text-lg font-bold text-white">{selectedHistoryDate}</h4>
                                     </div>
                                     <div className="text-right">
                                         {isAdmin && <span className="block text-emerald-500 font-black text-xl">{historyData[selectedHistoryDate].total.toFixed(2)}€</span>}
                                         <span className="text-zinc-500 text-xs">{historyData[selectedHistoryDate].orders.length} Sipariş</span>
                                     </div>
                                 </div>
                                 <div className="space-y-2">
                                     {historyData[selectedHistoryDate].orders.map((order: Order) => (
                                         <div 
                                            key={order.id} 
                                            onClick={() => setExpandedHistoryOrder(expandedHistoryOrder === order.id ? null : order.id)}
                                            className="flex flex-col text-sm py-3 px-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer"
                                         >
                                             <div className="flex justify-between items-center">
                                                 <div>
                                                     <p className="text-zinc-200 font-bold">Masa {order.tableNumber} - {order.customerName}</p>
                                                     <p className="text-zinc-500 text-xs">{new Date(order.timestamp).toLocaleTimeString()}</p>
                                                 </div>
                                                 <div className="flex gap-4 items-center">
                                                     <span className="text-zinc-400 text-xs bg-zinc-800 px-2 py-1 rounded">{order.completedBy || '-'}</span>
                                                     {isAdmin && <span className="text-white font-mono font-bold">{order.totalPrice.toFixed(2)}€</span>}
                                                     <span className="material-icons-round text-zinc-500 text-sm">
                                                         {expandedHistoryOrder === order.id ? 'expand_less' : 'expand_more'}
                                                     </span>
                                                 </div>
                                             </div>
                                             
                                             <AnimatePresence>
                                                {expandedHistoryOrder === order.id && (
                                                    <motion.div 
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                                                            {order.items.map((item, idx) => (
                                                                <div key={idx} className="flex justify-between text-xs text-zinc-400">
                                                                     <div className="flex gap-2">
                                                                        <span className="font-bold text-emerald-500">{item.quantity}x</span>
                                                                        <span>{item.name}</span>
                                                                     </div>
                                                                     {isAdmin && <span>{(item.price * item.quantity).toFixed(2)}€</span>}
                                                                </div>
                                                            ))}
                                                            {order.note && (
                                                                <div className="mt-2 p-2 bg-amber-500/10 rounded text-amber-500 text-[10px] italic">
                                                                    Not: {order.note}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                             </AnimatePresence>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         ) : (
                             <div className="text-center py-20 text-zinc-600">
                                 <span className="material-icons-round text-6xl mb-4">history</span>
                                 <p className="font-bold">Bu tarih için kayıt bulunamadı.</p>
                             </div>
                         )}
                    </div>
                )}

                {/* --- MENU TAB --- */}
                {activeTab === 'MENU' && (
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                             <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto hide-scrollbar">
                                 <button onClick={() => setMenuFilter('all')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${menuFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                                     HEPSİ
                                 </button>
                                 {categories.map(c => c.id !== 'all' && (
                                     <div key={c.id} className="relative group">
                                         <button onClick={() => setMenuFilter(c.id)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${menuFilter === c.id ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                                             {c.icon} {c.id}
                                         </button>
                                         {isAdmin && (
                                             <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if(window.confirm(`${c.id} kategorisini silmek istediğinize emin misiniz?`)) {
                                                        onDeleteCategory(c.id);
                                                        logAction('DELETE_CATEGORY', `Deleted category: ${c.id}`, activeStaff?.name || 'Admin', activeStaff?.role || 'Admin');
                                                    }
                                                }}
                                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                             >
                                                 ✕
                                             </button>
                                         )}
                                     </div>
                                 ))}
                                 {isAdmin && (
                                     <button onClick={() => setIsAddingCategory(true)} className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 hover:text-white border border-dashed border-zinc-600 hover:border-white transition-all whitespace-nowrap">
                                         + Kategori
                                     </button>
                                 )}
                             </div>
                             <button onClick={() => setIsAddingProduct(true)} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
                                <span className="material-icons-round text-sm">add</span> Yeni Ürün
                             </button>
                        </div>
                        
                        {/* ADD CATEGORY MODAL */}
                        {isAddingCategory && (
                            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                                <div className="bg-zinc-900 border border-white/10 w-full max-w-sm p-6 rounded-3xl space-y-4">
                                    <h3 className="text-xl font-bold text-white mb-4">Yeni Kategori Ekle</h3>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-500 font-bold uppercase">Kategori ID (örn: burger)</label>
                                        <input value={newCategory.id} onChange={e => setNewCategory({...newCategory, id: e.target.value.toLowerCase()})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-500 font-bold uppercase">İkon (Emoji)</label>
                                        <input value={newCategory.icon} onChange={e => setNewCategory({...newCategory, icon: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500" />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button onClick={() => setIsAddingCategory(false)} className="px-6 py-3 text-zinc-500 font-bold text-sm">İptal</button>
                                        <button onClick={() => {
                                            if(newCategory.id && newCategory.icon) {
                                                onAddCategory(newCategory);
                                                logAction('ADD_CATEGORY', `Added category: ${newCategory.id}`, activeStaff?.name || 'Admin', activeStaff?.role || 'Admin');
                                                setNewCategory({ id: '', icon: '' });
                                                setIsAddingCategory(false);
                                            }
                                        }} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm">Ekle</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="grid gap-4">
                            {/* ADD FORM */}
                            {isAddingProduct && (
                                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                                    <form onSubmit={(e) => {
                                        handleAddProductSubmit(e);
                                        logAction('ADD_PRODUCT', `Added product: ${newProd.name}`, activeStaff?.name || 'Admin', activeStaff?.role || 'Admin');
                                    }} className="bg-zinc-900 border border-white/10 w-full max-w-lg p-6 rounded-3xl space-y-4 max-h-[90vh] overflow-y-auto">
                                        <h3 className="text-xl font-bold text-white mb-4">Yeni Ürün Ekle</h3>
                                        <div className="space-y-1">
                                            <label className="text-xs text-zinc-500 font-bold uppercase">Ürün Adı</label>
                                            <input required value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs text-zinc-500 font-bold uppercase">Fiyat (€)</label>
                                                <input required type="number" step="0.1" value={newProd.price} onChange={e => setNewProd({...newProd, price: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-zinc-500 font-bold uppercase">Stok Adedi</label>
                                                <input required type="number" value={newProd.stock} onChange={e => setNewProd({...newProd, stock: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-zinc-500 font-bold uppercase">Kategori</label>
                                                <select value={newProd.category} onChange={e => setNewProd({...newProd, category: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500">
                                                    {categories.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-zinc-500 font-bold uppercase">Resim URL</label>
                                            <input value={newProd.image} onChange={e => setNewProd({...newProd, image: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-zinc-500 font-bold uppercase">Açıklama</label>
                                            <textarea value={newProd.description} onChange={e => setNewProd({...newProd, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500 h-24 resize-none" />
                                        </div>
                                        <div className="flex justify-end gap-3 pt-4">
                                            <button type="button" onClick={() => setIsAddingProduct(false)} className="px-6 py-3 text-zinc-500 font-bold text-sm">İptal</button>
                                            <button type="submit" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm">Kaydet</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* EDIT FORM */}
                            {editingProduct && (
                                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                                    <form onSubmit={(e) => {
                                        handleEditProductSubmit(e);
                                        logAction('UPDATE_PRODUCT', `Updated product: ${editingProduct.name}`, activeStaff?.name || 'Admin', activeStaff?.role || 'Admin');
                                    }} className="bg-zinc-900 border border-white/10 w-full max-w-lg p-6 rounded-3xl space-y-4 max-h-[90vh] overflow-y-auto">
                                        <h3 className="text-xl font-bold text-white mb-4">Ürünü Düzenle</h3>
                                        <div className="space-y-1">
                                            <label className="text-xs text-zinc-500 font-bold uppercase">Ürün Adı</label>
                                            <input required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs text-zinc-500 font-bold uppercase">Fiyat (€)</label>
                                                <input required type="number" step="0.1" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-zinc-500 font-bold uppercase">Stok Adedi</label>
                                                <input required type="number" value={editingProduct.stock || 0} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-zinc-500 font-bold uppercase">Kategori</label>
                                                <select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500">
                                                    {categories.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-zinc-500 font-bold uppercase">Resim URL</label>
                                            <input value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-zinc-500 font-bold uppercase">Açıklama</label>
                                            <textarea value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 h-24 resize-none" />
                                        </div>
                                        <div className="flex justify-end gap-3 pt-4">
                                            <button type="button" onClick={() => setEditingProduct(null)} className="px-6 py-3 text-zinc-500 font-bold text-sm">İptal</button>
                                            <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm">Güncelle</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* LIST */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredProducts.map(p => (
                                    <div key={p.id} className={`bg-zinc-900 border ${p.available ? 'border-white/5' : 'border-red-500/30'} p-4 rounded-2xl flex gap-4 items-center group relative overflow-hidden`}>
                                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-black flex-shrink-0">
                                            <img src={p.image} className={`w-full h-full object-cover ${!p.available && 'grayscale opacity-50'}`} alt={p.name} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`font-bold text-sm truncate ${!p.available ? 'text-zinc-500' : 'text-white'}`}>{p.name}</h4>
                                                <span className="text-emerald-500 font-bold text-sm">{p.price}€</span>
                                            </div>
                                            <p className="text-zinc-500 text-xs truncate">{p.description}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-400 uppercase">{p.category}</span>
                                                <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold ${p.stock && p.stock < 5 ? 'bg-red-500/20 text-red-500' : 'bg-zinc-800 text-zinc-400'}`}>Stok: {p.stock || 0}</span>
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                            <button 
                                                onClick={() => {
                                                    const newStatus = !p.available;
                                                    onUpdateProduct({...p, available: newStatus});
                                                    logAction('TOGGLE_PRODUCT_AVAILABILITY', `Product ${p.name} availability set to ${newStatus}`, activeStaff?.name || 'Admin', activeStaff?.role || 'Admin');
                                                }} 
                                                className={`px-4 py-2 rounded-xl font-bold text-xs uppercase ${p.available ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}
                                            >
                                                {p.available ? 'Yayından Kaldır' : 'Yayınla'}
                                            </button>
                                            <button onClick={() => setEditingProduct(p)} className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                                                <span className="material-icons-round text-sm">edit</span>
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if(window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
                                                        onDeleteProduct(p.id);
                                                        logAction('DELETE_PRODUCT', `Deleted product: ${p.name}`, activeStaff?.name || 'Admin', activeStaff?.role || 'Admin');
                                                    }
                                                }} 
                                                className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white"
                                            >
                                                <span className="material-icons-round text-sm">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- SHOWCASE TAB --- */}
                {activeTab === 'SHOWCASE' && (
                    <div className="max-w-5xl mx-auto space-y-8">
                         <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl">
                            <h3 className="text-xl font-bold text-white mb-6">Mevcut Slaytlar</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {heroSlides.map((slide) => (
                                    <div key={slide.id} className="relative aspect-video bg-black rounded-2xl overflow-hidden group border border-white/10">
                                        {slide.type === 'VIDEO' ? (
                                            <video src={slide.url} className="w-full h-full object-cover opacity-60" muted />
                                        ) : (
                                            <img src={slide.url} className="w-full h-full object-cover opacity-60" alt={slide.title} />
                                        )}
                                        <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1 block">{slide.type}</span>
                                                    <h4 className="font-bold text-white text-lg">{slide.title}</h4>
                                                    <p className="text-xs text-zinc-400">{slide.subtitle}</p>
                                                </div>
                                                <button onClick={() => handleDeleteSlide(slide.id)} className="w-10 h-10 bg-red-600/20 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all">
                                                    <span className="material-icons-round">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                         </div>

                         <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl">
                             <h3 className="text-xl font-bold text-white mb-6">Yeni Slayt Ekle</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="space-y-4">
                                     <div className="space-y-1">
                                         <label className="text-xs font-bold text-zinc-500 uppercase">Medya Türü</label>
                                         <select value={newSlide.type} onChange={e => setNewSlide({...newSlide, type: e.target.value as 'IMAGE' | 'VIDEO'})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none">
                                             <option value="IMAGE">Resim</option>
                                             <option value="VIDEO">Video</option>
                                         </select>
                                     </div>
                                     <div className="space-y-1">
                                         <label className="text-xs font-bold text-zinc-500 uppercase">Medya URL</label>
                                         <input value={newSlide.url} onChange={e => setNewSlide({...newSlide, url: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none" placeholder="https://..." />
                                     </div>
                                 </div>
                                 <div className="space-y-4">
                                     <div className="space-y-1">
                                         <label className="text-xs font-bold text-zinc-500 uppercase">Başlık</label>
                                         <input value={newSlide.title} onChange={e => setNewSlide({...newSlide, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none" />
                                     </div>
                                     <div className="space-y-1">
                                         <label className="text-xs font-bold text-zinc-500 uppercase">Alt Başlık</label>
                                         <input value={newSlide.subtitle} onChange={e => setNewSlide({...newSlide, subtitle: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none" />
                                     </div>
                                 </div>
                             </div>
                             <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                                 <button onClick={handleAddSlide} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg transition-all">
                                     Listeye Ekle
                                 </button>
                             </div>
                         </div>
                    </div>
                )}

                {/* --- PERFORMANCE TAB --- */}
                {activeTab === 'PERFORMANCE' && (
                     <div className="max-w-5xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                           <div className="lg:col-span-1 bg-gradient-to-br from-blue-900/40 to-black border border-blue-500/30 p-6 rounded-3xl">
                               <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                                 <span className="material-icons-round text-blue-400">info</span>
                               </div>
                               <h3 className="text-xl font-bold text-white mb-2">Puanlama Sistemi</h3>
                               <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                                 Personel performansı sipariş hızı, müşteri memnuniyeti ve işlem hacmine göre otomatik olarak puanlanır.
                               </p>
                           </div>
                           <div className="lg:col-span-2 space-y-4">
                              {staffStats.sort((a,b) => b.score - a.score).map((s, idx) => (
                                <div key={s.id} className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group hover:bg-zinc-800/80 transition-all">
                                   {idx === 0 && <div className="absolute -right-4 -top-4 bg-yellow-500 w-16 h-16 blur-xl opacity-20"></div>}
                                   <div className="flex items-center gap-6 relative z-10">
                                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-lg ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black' : idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-black' : idx === 2 ? 'bg-gradient-to-br from-orange-700 to-orange-900 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                                         {idx + 1}
                                      </div>
                                      <div>
                                         <h4 className="font-bold text-lg text-white">{s.name}</h4>
                                         <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider">{s.level}</p>
                                         <p className="text-[10px] text-zinc-500 mt-1">{s.orders} Sipariş • {s.calls} Çağrı</p>
                                      </div>
                                   </div>
                                   <div className="text-right relative z-10">
                                      <span className="block font-black text-2xl text-white">{s.score}</span>
                                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest">TOPLAM PUAN</span>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                )}

            </main>
        </div>

        {/* Feedback Modal */}
        <AnimatePresence>
            {activeFeedbackOrderId && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-zinc-900 border border-white/10 w-full max-w-md p-6 rounded-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Müşteriye Mesaj</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {QUICK_REPLIES.map((msg, i) => (
                                <button key={i} onClick={() => setFeedbackText(msg)} className="text-[10px] bg-zinc-800 border border-white/5 px-3 py-2 rounded-lg hover:bg-white/10 text-zinc-300">
                                    {msg}
                                </button>
                            ))}
                        </div>
                        <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} className="w-full h-32 bg-black/30 border border-white/10 rounded-xl p-4 text-white mb-4 outline-none resize-none" placeholder="Mesajınız..." />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setActiveFeedbackOrderId(null)} className="px-4 py-2 text-zinc-500">İptal</button>
                            <button disabled={isTranslating} onClick={() => handleSendFeedbackLocal(orders.find(o => o.id === activeFeedbackOrderId)!, feedbackText)} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold">
                                {isTranslating ? 'Çevriliyor...' : 'Gönder'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default KitchenUI;
