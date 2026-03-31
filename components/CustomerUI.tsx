
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, CartItem, Order, OrderStatus, Language, HeroSlide, Category } from '../types';
import { TRANSLATIONS } from '../constants';
import ProductCard from './ProductCard';
import UpsellModal from './UpsellModal';
import { GoogleGenAI } from "@google/genai";

interface Props {
  tableNumber: string;
  customerName: string;
  orders: Order[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onPlaceOrder: (items: CartItem[], totalPrice: number, note?: string) => void;
  onCallWaiter: (type: 'WAITER' | 'CHECK') => void;
  onBack: () => void;
  lang: Language;
  products: Product[];
  heroSlides: HeroSlide[];
  categories: Category[];
}

interface Notification {
  id: number;
  message: string;
  type: 'SUCCESS' | 'WARNING' | 'INFO';
}

// Book Page Flip Variants
const bookVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    rotateY: direction > 0 ? 90 : -90,
    opacity: 0,
    transformOrigin: direction > 0 ? 'left center' : 'right center',
    zIndex: 1
  }),
  center: {
    x: 0,
    rotateY: 0,
    opacity: 1,
    zIndex: 2,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] // Custom snappy easing
    }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    rotateY: direction < 0 ? 90 : -90,
    opacity: 0,
    transformOrigin: direction < 0 ? 'left center' : 'right center',
    zIndex: 1,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1]
    }
  })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

const CustomerUI: React.FC<Props> = ({ 
  tableNumber, 
  customerName, 
  orders, 
  cart, 
  setCart,
  onPlaceOrder,
  onCallWaiter,
  onBack,
  lang,
  products,
  heroSlides,
  categories
}) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderStep, setOrderStep] = useState<'REVIEW' | 'NOTE'>('REVIEW');
  const [orderNote, setOrderNote] = useState('');
  const [upsellProduct, setUpsellProduct] = useState<Product | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // AI Translated Data States
  const [translatedProducts, setTranslatedProducts] = useState<Product[]>([]);
  const [translatedSlides, setTranslatedSlides] = useState<HeroSlide[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  // Carousel State with Direction
  const [[page, direction], setPage] = useState([0, 0]);

  const t = TRANSLATIONS[lang];

  // AI Translation Logic (Products + Hero Slides)
  useEffect(() => {
    const translateContent = async () => {
      // Varsayılan dil (TR) ise çeviri yapma, orijinal verileri kullan
      if (lang === 'TR') {
        setTranslatedProducts(products);
        setTranslatedSlides(heroSlides);
        return;
      }

      setIsTranslating(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Optimize: Ürünler ve Slaytları tek bir payload içinde gönder
        // available bilgisini göndermeye gerek yok, ID üzerinden eşleştireceğiz
        const payload = {
          products: products.map(p => ({ id: p.id, name: p.name, description: p.description })),
          slides: heroSlides.map(s => ({ id: s.id, title: s.title, subtitle: s.subtitle }))
        };

        const prompt = `
          You are a professional translator for a restaurant menu.
          Translate the texts inside the JSON object to language code: "${lang}".
          Return ONLY the JSON object with the same structure. 
          Do not translate IDs or Types or URLs.
          Ensure the JSON is valid.
          Input: ${JSON.stringify(payload)}
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });

        const responseText = response.text.trim().replace(/```json/g, '').replace(/```/g, '');
        const responseData = JSON.parse(responseText);

        // Çevrilen ürünleri eşleştir
        if (responseData.products) {
          const newProducts = products.map(p => {
            const trans = responseData.products.find((tp: any) => tp.id === p.id);
            // available durumu orijinal üründen (p) korunur
            return trans ? { ...p, name: trans.name, description: trans.description } : p;
          });
          setTranslatedProducts(newProducts);
        } else {
          setTranslatedProducts(products);
        }

        // Çevrilen slaytları eşleştir
        if (responseData.slides) {
          const newSlides = heroSlides.map(s => {
             const trans = responseData.slides.find((ts: any) => ts.id === s.id);
             return trans ? { ...s, title: trans.title, subtitle: trans.subtitle } : s;
          });
          setTranslatedSlides(newSlides);
        } else {
          setTranslatedSlides(heroSlides);
        }

      } catch (error) {
        console.error("Translation failed, using original.", error);
        setTranslatedProducts(products);
        setTranslatedSlides(heroSlides);
      } finally {
        setIsTranslating(false);
      }
    };

    translateContent();
  }, [lang, products, heroSlides]);

  // Modulo logic to handle infinite cycling
  const currentSlidesSource = translatedSlides.length > 0 ? translatedSlides : heroSlides;

  const currentSlideIndex = useMemo(() => {
    if (currentSlidesSource.length === 0) return 0;
    let index = page % currentSlidesSource.length;
    if (index < 0) index += currentSlidesSource.length;
    return index;
  }, [page, currentSlidesSource.length]);

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      paginate(1);
    }, 15000); // 15 saniye

    return () => clearInterval(timer);
  }, [heroSlides.length, page]);

  const filteredProducts = useMemo(() => {
    const sourceList = translatedProducts.length > 0 ? translatedProducts : products;
    
    // 1. Adım: Sadece STOKTA (available: true) olan ürünleri filtrele
    const availableProducts = sourceList.filter(p => p.available);

    // 2. Adım: Kategoriye göre filtrele
    if (activeCategory === 'all') return availableProducts;
    return availableProducts.filter(p => p.category === activeCategory);
  }, [activeCategory, products, translatedProducts]);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const activeFeedbacks = useMemo(() => 
    orders.filter(o => o.feedback && o.status !== OrderStatus.COMPLETED).map(o => ({
      id: o.id,
      text: o.feedback,
      status: o.status
    })), [orders]);

  const addNotification = (message: string, type: 'SUCCESS' | 'WARNING' | 'INFO') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    if (product.upsellItems && product.upsellItems.length > 0) setUpsellProduct(product);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(p => p.id === productId ? { ...p, quantity: p.quantity - 1 } : p);
      }
      return prev.filter(p => p.id !== productId);
    });
  };

  const handleCheckout = () => {
    onPlaceOrder(cart, cartTotal, orderNote);
    setIsCartOpen(false);
    setOrderNote('');
    setOrderStep('REVIEW');
    addNotification(t.orderSent, "SUCCESS");
  };

  const handleActionCall = (type: 'WAITER' | 'CHECK') => {
    onCallWaiter(type);
    if (type === 'WAITER') {
      addNotification(t.waiterCalled, "SUCCESS");
    } else {
      addNotification(t.checkRequested, "WARNING");
    }
  };

  const closeCart = () => {
    setIsCartOpen(false);
    setOrderStep('REVIEW');
  };

  const currentSlide = currentSlidesSource[currentSlideIndex] || { id: 'def', type: 'IMAGE', url: '', title: '', subtitle: ''};

  return (
    <div className={`pb-44 max-w-2xl mx-auto relative min-h-screen bg-zinc-950 ${lang === 'AR' ? 'text-right' : 'text-left'}`}>
      {/* NOTIFICATIONS & FEEDBACK OVERLAY */}
      <div className="fixed top-20 left-0 w-full z-[100] px-4 pointer-events-none flex flex-col items-center">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div 
              key={n.id}
              initial={{ y: -20, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.9 }}
              className={`mb-3 pointer-events-auto px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 ${
                n.type === 'SUCCESS' ? 'bg-emerald-600 border-emerald-400 text-white' : 
                n.type === 'WARNING' ? 'bg-amber-600 border-amber-400 text-white' : 
                'bg-zinc-800 border-zinc-600 text-white'
              }`}
            >
              <span className="material-icons-round text-lg">
                {n.type === 'SUCCESS' ? 'check_circle' : n.type === 'WARNING' ? 'receipt' : 'info'}
              </span>
              <span className="text-xs font-black uppercase tracking-widest">{n.message}</span>
            </motion.div>
          ))}

          {activeFeedbacks.map((fb, idx) => (
            <motion.div 
              key={`${fb.id}-${idx}`}
              initial={{ x: -50, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="mb-3 pointer-events-auto w-full max-w-sm"
            >
              <div className="bg-zinc-900/90 backdrop-blur-xl border border-emerald-500/30 p-4 rounded-2xl shadow-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-round text-emerald-500 text-xl">notifications_active</span>
                </div>
                <div className="flex-1">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">{t.kitchenMessage}</h5>
                  <p className="text-white text-xs font-bold leading-tight">{fb.text}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <header className={`sticky top-0 z-[60] bg-zinc-950/95 backdrop-blur-3xl border-b border-white/5 px-4 py-4 flex items-center justify-between ${lang === 'AR' ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-3 overflow-hidden ${lang === 'AR' ? 'flex-row-reverse text-right' : ''}`}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="flex-shrink-0 w-9 h-9 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center">
            <svg className={`w-5 h-5 text-zinc-400 ${lang === 'AR' ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </motion.button>
          <div className="flex flex-col justify-center min-w-0">
            <h2 className="text-base font-display font-bold text-white truncate leading-none mb-1">Kudret</h2>
            <div className={`flex items-center gap-1.5 overflow-hidden ${lang === 'AR' ? 'flex-row-reverse' : ''}`}>
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
               <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest truncate">{t.tableNo} {tableNumber}</span>
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-2 ${lang === 'AR' ? 'flex-row-reverse' : ''}`}>
           <button className="w-9 h-9 flex items-center justify-center text-zinc-400">
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
           </button>
           <button onClick={() => setIsCartOpen(true)} className="relative w-9 h-9 flex items-center justify-center">
             <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
             {cartItemCount > 0 && <span className="absolute top-0 right-0 bg-emerald-600 text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-xl">{cartItemCount}</span>}
           </button>
        </div>
      </header>

      <div className={`flex overflow-x-auto hide-scrollbar gap-2 px-4 py-4 sticky top-[68px] z-40 bg-zinc-950/90 backdrop-blur-md border-b border-white/[0.02] ${lang === 'AR' ? 'flex-row-reverse' : ''}`}>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all border ${lang === 'AR' ? 'flex-row-reverse' : ''} ${activeCategory === cat.id ? 'bg-emerald-600 border-emerald-500 text-white font-black text-[10px] uppercase tracking-wider shadow-lg' : 'bg-zinc-900 border-white/5 text-zinc-500 font-black text-[10px] uppercase tracking-wider'}`}>
            <span className="text-sm leading-none">{cat.icon}</span>
            <span>{t.categories[cat.id as keyof typeof t.categories] || cat.id}</span>
          </button>
        ))}
      </div>

      {/* HERO SLIDER SECTION WITH BOOK PAGE TURN EFFECT */}
      <div className="px-4 mt-4 mb-8">
         <div className="relative rounded-[32px] aspect-[16/9] shadow-2xl bg-zinc-900 perspective-2000 overflow-visible group">
            <div className="absolute inset-0 overflow-hidden rounded-[32px] border border-white/5">
                <AnimatePresence initial={false} custom={direction}>
                <motion.div 
                    key={page}
                    custom={direction}
                    variants={bookVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset, velocity }) => {
                    const swipe = swipePower(offset.x, velocity.x);
                    if (swipe < -swipeConfidenceThreshold) {
                        paginate(1);
                    } else if (swipe > swipeConfidenceThreshold) {
                        paginate(-1);
                    }
                    }}
                    className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing bg-zinc-900 backface-hidden"
                >
                    {currentSlide.type === 'VIDEO' ? (
                    <video 
                        src={currentSlide.url} 
                        className="w-full h-full object-cover pointer-events-none" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                    />
                    ) : (
                    <img src={currentSlide.url} className="w-full h-full object-cover pointer-events-none" alt={currentSlide.title} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 pointer-events-none" />
                    
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent flex flex-col justify-end p-6 ${lang === 'AR' ? 'items-end' : ''}`}>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-1">{t.recommendation}</span>
                    <h3 className="text-xl font-display font-bold text-white mb-1">{currentSlide.title}</h3>
                    <p className="text-zinc-400 text-[10px] mb-2 line-clamp-1 max-w-sm font-medium">{currentSlide.subtitle}</p>
                    </div>
                </motion.div>
                </AnimatePresence>
            </div>
            
            {/* Dots */}
            {currentSlidesSource.length > 1 && (
              <div className="absolute bottom-4 right-4 flex gap-1.5 z-20 pointer-events-none">
                {currentSlidesSource.map((_, idx) => (
                  <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentSlideIndex ? 'bg-emerald-500 w-3' : 'bg-white/30'}`} />
                ))}
              </div>
            )}
         </div>
      </div>

      {/* ACTIVE ORDERS FOR THIS TABLE */}
      {orders.filter(o => o.status !== OrderStatus.CLOSED).length > 0 && (
        <div className="px-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t.tableNo} {tableNumber} — Aktif Sipariş</span>
          </div>
          <div className="space-y-2">
            {orders.filter(o => o.status !== OrderStatus.CLOSED).map(order => {
              const statusColor =
                order.status === OrderStatus.RECEIVED   ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                order.status === OrderStatus.PREPARING  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                order.status === OrderStatus.SERVED     ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                /* COMPLETED */                           'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
              const statusLabel =
                order.status === OrderStatus.RECEIVED   ? 'Sipariş Alındı ⏳' :
                order.status === OrderStatus.PREPARING  ? 'Hazırlanıyor 👨‍🍳' :
                order.status === OrderStatus.SERVED     ? 'Masanıza Geliyor 🚶' :
                /* COMPLETED */                           'Servis Edildi ✅';
              return (
                <div key={order.id} className={`rounded-2xl border p-3 ${statusColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-70">{statusLabel}</span>
                    <span className="text-[10px] font-bold">{order.totalPrice.toFixed(2)}€</span>
                  </div>
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <span className="font-medium opacity-80">{item.name}</span>
                        <span className="font-black">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  {order.feedback && (
                    <div className="mt-2 pt-2 border-t border-white/10 text-[10px] opacity-70 italic">{order.feedback}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-4 space-y-4">
        {isTranslating && (
          <div className="flex items-center gap-2 justify-center py-4 text-zinc-500 text-xs">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
            <span>Menü dilinize çevriliyor...</span>
          </div>
        )}
        {filteredProducts.map(p => (
          <ProductCard key={p.id} product={p} onAdd={() => addToCart(p)} />
        ))}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-zinc-500 opacity-60">
             <span className="material-icons-round text-4xl mb-2">no_meals</span>
             <p className="text-xs font-bold uppercase tracking-widest">Bu kategoride ürün bulunamadı</p>
          </div>
        )}
      </div>

      {/* FIXED BUTTONS */}
      <div className="fixed bottom-0 left-0 w-full z-50 px-4 pb-10 pointer-events-none">
        <div className={`max-w-2xl mx-auto flex items-end justify-between pointer-events-auto ${lang === 'AR' ? 'flex-row-reverse' : ''}`}>
          <div className="flex flex-col gap-4">
             <motion.button 
               whileTap={{ scale: 0.9 }}
               onClick={() => handleActionCall('WAITER')}
               className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl flex items-center justify-center transition-all group active:bg-emerald-600 active:border-emerald-500"
             >
               <svg className="w-9 h-9 text-emerald-500 group-active:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
             </motion.button>
             <motion.button 
               whileTap={{ scale: 0.9 }}
               onClick={() => handleActionCall('CHECK')}
               className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl flex items-center justify-center transition-all group active:bg-amber-600 active:border-amber-500"
             >
               <svg className="w-9 h-9 text-amber-500 group-active:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"></path><path d="M16 8h-6"></path><path d="M16 12h-6"></path><path d="M16 16h-6"></path></svg>
             </motion.button>
          </div>

          <AnimatePresence>
            {cartItemCount > 0 && (
              <motion.button 
                initial={{ x: lang === 'AR' ? -100 : 100, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                exit={{ x: lang === 'AR' ? -100 : 100, opacity: 0 }}
                onClick={() => setIsCartOpen(true)}
                className={`h-14 flex items-center gap-5 bg-emerald-600 px-5 rounded-2xl shadow-2xl text-white transition-all active:scale-[0.97] ${lang === 'AR' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex flex-col ${lang === 'AR' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-80 leading-none mb-0.5">{t.cart.toUpperCase()}</span>
                  <span className="text-base font-black tracking-tight leading-none">{cartTotal.toFixed(2)}€</span>
                </div>
                <div className="w-px h-6 bg-white/20" />
                <div className={`flex items-center gap-1.5 ${lang === 'AR' ? 'flex-row-reverse' : ''}`}>
                   <span className="text-base font-black">{cartItemCount}</span>
                   <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeCart} className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[70]" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className={`fixed bottom-0 left-0 w-full max-w-2xl mx-auto bg-zinc-950 rounded-t-[32px] z-[80] overflow-hidden flex flex-col max-h-[85vh] border-t border-white/10 ${lang === 'AR' ? 'text-right' : 'text-left'}`}>
              <div className={`p-6 pb-4 flex justify-between items-center ${lang === 'AR' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex flex-col ${lang === 'AR' ? 'items-end' : ''}`}>
                  <h3 className="text-xl font-display font-bold text-white leading-tight">{orderStep === 'REVIEW' ? t.cart : t.orderNote}</h3>
                  {orderStep === 'REVIEW' && cartItemCount > 0 && <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mt-0.5">{cartItemCount} {t.items.toUpperCase()}</span>}
                </div>
                <button onClick={closeCart} className="w-10 h-10 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center"><span className="material-icons-round text-xl text-zinc-500">close</span></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-2">
                {orderStep === 'REVIEW' ? (
                  <div className="space-y-3">
                    {cart.length === 0 ? <div className="text-center py-16 opacity-30 flex flex-col items-center"><span className="material-icons-round text-6xl mb-4">shopping_basket</span><p className="font-black text-[10px] uppercase tracking-widest">{t.emptyCart}</p></div> : 
                      cart.map(item => (
                        <div key={item.id} className={`flex gap-4 items-center bg-white/[0.03] p-3 rounded-2xl border border-white/5 ${lang === 'AR' ? 'flex-row-reverse text-right' : ''}`}>
                          <img src={item.image} className="w-12 h-12 rounded-xl object-cover shadow-lg flex-shrink-0" alt={item.name} />
                          <div className="flex-1 min-w-0"><h4 className="font-bold text-xs text-white pr-2">{item.name}</h4><p className="text-emerald-500 font-bold text-xs">{item.price.toFixed(2)}€</p></div>
                          <div className={`flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/5 flex-shrink-0 ${lang === 'AR' ? 'flex-row-reverse' : ''}`}>
                             <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 font-bold text-lg">-</button>
                             <span className="font-black text-xs w-4 text-center text-white">{item.quantity}</span>
                             <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-md flex items-center justify-center text-emerald-500 font-bold text-lg">+</button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                      <p className={`text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-3 ${lang === 'AR' ? 'mr-1' : 'ml-1'}`}>{t.orderNote}?</p>
                      <textarea autoFocus value={orderNote} onChange={(e) => setOrderNote(e.target.value)} placeholder={t.orderNote} className={`w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-zinc-100 outline-none h-32 resize-none ${lang === 'AR' ? 'text-right' : 'text-left'}`} />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 bg-zinc-950 border-t border-white/5 space-y-4">
                <div className={`flex justify-between items-center px-2 ${lang === 'AR' ? 'flex-row-reverse' : ''}`}><span className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em]">{t.total.toUpperCase()}</span><span className="text-2xl font-display font-bold text-emerald-500">{cartTotal.toFixed(2)}€</span></div>
                {orderStep === 'REVIEW' ? (
                  <button disabled={cart.length === 0} onClick={() => setOrderStep('NOTE')} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-900 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl shadow-lg transition-all">{t.confirmOrder}</button>
                ) : (
                  <div className={`flex gap-3 ${lang === 'AR' ? 'flex-row-reverse' : ''}`}>
                    <button onClick={() => setOrderStep('REVIEW')} className="flex-1 bg-zinc-900 text-zinc-400 font-black text-[10px] uppercase tracking-widest py-4 rounded-xl transition-all">{t.back}</button>
                    <button onClick={handleCheckout} className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-xl shadow-lg transition-all">{t.confirmOrder}</button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <UpsellModal product={upsellProduct} onClose={() => setUpsellProduct(null)} onAdd={(p) => { addToCart(p); setUpsellProduct(null); }} lang={lang} />
    </div>
  );
};

export default CustomerUI;
