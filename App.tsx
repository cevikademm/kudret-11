
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { OrderStatus, Product, CartItem, Order, WaiterCall, Language, SubscriptionInfo, Staff, HeroSlide, Category, Log } from './types';
import { TRANSLATIONS, PRODUCTS, CATEGORIES as DEFAULT_CATEGORIES } from './constants';
import CustomerUI from './components/CustomerUI';
import KitchenUI from './components/KitchenUI';
import WelcomeScreen from './components/WelcomeScreen';
import SubscriptionGate from './components/SubscriptionGate';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [view, setView] = useState<'WELCOME' | 'CUSTOMER' | 'KITCHEN'>('WELCOME');
  const [lang, setLang] = useState<Language>('TR');
  const [isKitchenAuth, setIsKitchenAuth] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [tableNumber, setTableNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');

  const [orders, setOrders] = useState<Order[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [dynamicProducts, setDynamicProducts] = useState<Product[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  
  const deletedCallIds = useRef<Set<string>>(new Set());

  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    isActive: true,
    expiryDate: '',
    plan: 'NONE'
  });

  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([
    {
      id: 'demo-slide-1',
      type: 'VIDEO',
      url: 'https://cdn.coverr.co/videos/coverr-meat-on-the-barbecue-4470/1080p.mp4',
      title: 'Ateşin Gerçek Lezzeti',
      subtitle: 'Özel marinasyon teknikleriyle hazırlanan steak menümüzü denediniz mi?'
    },
    {
      id: 'demo-slide-2',
      type: 'IMAGE',
      url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=1920',
      title: 'Efsane Burgerler',
      subtitle: '%100 dana eti ve ev yapımı soslar.'
    },
    {
      id: 'demo-slide-3',
      type: 'IMAGE',
      url: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=1920',
      title: 'Tatlı Bir Mola',
      subtitle: 'Yemeğin üzerine taze çekilmiş kahve ve tatlılarımız.'
    }
  ]);

  const [welcomeSettings, setWelcomeSettings] = useState({
    backgroundImage: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1600'
  });

  const isMasterUser = useMemo(() => user?.email === 'cevikademm@gmail.com', [user]);

  const MOCK_ORDERS: Order[] = [
    {
      id: 'demo-1',
      tableNumber: '3',
      customerName: 'Mehmet Y.',
      items: [{ ...PRODUCTS[0], quantity: 2 }, { ...PRODUCTS[1], quantity: 1 }],
      totalPrice: 32.70,
      status: OrderStatus.PREPARING,
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      customerLanguage: 'TR',
      note: 'Acısız olsun lütfen.'
    },
    {
      id: 'demo-2',
      tableNumber: '7',
      customerName: 'John Doe',
      items: [{ ...PRODUCTS[1], quantity: 1 }],
      totalPrice: 8.90,
      status: OrderStatus.SERVED,
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      customerLanguage: 'EN',
      feedback: 'Enjoy your meal! / Afiyet olsun!',
      completedBy: 'Garson Ali'
    }
  ];

  const mapProductFromDB = (p: any): Product => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: parseFloat(p.price),
    image: p.image,
    category: p.category,
    allergens: p.allergens || [],
    spiceLevel: p.spice_level || 0,
    upsellItems: p.upsell_items || [],
    available: p.available !== undefined ? p.available : true,
    stock: p.stock !== undefined ? p.stock : 0
  });

  const mapOrderFromDB = (o: any): Order => ({
    id: o.id,
    tableNumber: String(o.table_number),
    customerName: o.customer_name,
    items: o.items,
    totalPrice: parseFloat(o.total_price),
    status: o.status as OrderStatus,
    timestamp: new Date(o.timestamp),
    note: o.note,
    feedback: o.feedback,
    customerLanguage: o.customer_language as Language,
    completedBy: o.completed_by,
    stockDeducted: o.stock_deducted || false
  });

  // GÜNCELLEME: Masa ancak 'CLOSED' durumuna gelince boşalır.
  // COMPLETED (Tamamlandı/Ödendi) olsa bile masa hala dolu gözükür.
  const occupiedTables = useMemo(() => {
    const active = orders.filter(o => o.status !== OrderStatus.CLOSED);
    return [...new Set(active.map(o => String(o.tableNumber)))];
  }, [orders]);

  const logAction = async (action: string, details: string, userName: string, userRole: string) => {
    try {
      await supabase.from('logs').insert({
        action,
        details,
        user_name: userName,
        user_role: userRole,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Log error:", e);
    }
  };

  const fetchData = async () => {
    try {
      const { data: cats, error: catError } = await supabase.from('categories').select('*');
      if (!catError && cats && cats.length > 0) {
        setCategories(cats);
      }

      const { data: prods, error: prodError } = await supabase.from('products').select('*');
      
      if (!prodError && prods && prods.length > 0) {
        setDynamicProducts(prods.map(mapProductFromDB));
      } else {
        setDynamicProducts(PRODUCTS);
      }

      const { data: ords, error: orderError } = await supabase.from('orders').select('*').order('timestamp', { ascending: false });
      
      if (!orderError && ords) {
        setOrders(ords.map(mapOrderFromDB));
      } else {
        try {
          const localOrders = JSON.parse(localStorage.getItem('damla_local_orders') || '[]');
          if (localOrders.length > 0) {
            const formattedLocals = localOrders.map((o: any) => ({...o, timestamp: new Date(o.timestamp)}));
            setOrders(formattedLocals);
          } else if (orders.length === 0) {
            setOrders(MOCK_ORDERS);
          }
        } catch(e) {
            if (orders.length === 0) setOrders(MOCK_ORDERS);
        }
      }

      // GÜNCELLEME: Waiter Calls artık status bilgisi içeriyor olabilir.
      const { data: calls, error: callError } = await supabase.from('waiter_calls').select('*').order('timestamp', { ascending: false });
      
      if (!callError && calls) {
        const mappedCalls: WaiterCall[] = calls.map(c => ({
          id: c.id,
          tableNumber: String(c.table_number),
          type: c.type,
          timestamp: new Date(c.timestamp),
          status: c.status || 'ACTIVE', // Varsayılan ACTIVE
          completedBy: c.completed_by,
          completedAt: c.completed_at ? new Date(c.completed_at) : undefined
        }));
        // Silinmişleri (deletedCallIds) filtrele ama veritabanındaki status'u koru
        setWaiterCalls(mappedCalls.filter(c => !deletedCallIds.current.has(c.id)));
      } else {
         try {
            const localCalls = JSON.parse(localStorage.getItem('damla_local_calls') || '[]');
            // Local calls update
            const activeLocals = localCalls.filter((c:any) => !deletedCallIds.current.has(c.id));
             if (activeLocals.length > 0) {
               setWaiterCalls(activeLocals.map((c: any) => ({
                   ...c, 
                   timestamp: new Date(c.timestamp),
                   status: c.status || 'ACTIVE',
                   completedAt: c.completedAt ? new Date(c.completedAt) : undefined
               })));
            } 
         } catch (e) {}
      }

      const { data: staffData } = await supabase.from('staff').select('*').order('name');
      if (staffData) setStaff(staffData); 

      const { data: settings } = await supabase.from('site_settings').select('*');
      if (settings && settings.length > 0) {
        const hero = settings.find(s => s.key === 'hero_recommendation');
        if (hero) {
            if (Array.isArray(hero.value)) {
                setHeroSlides(hero.value);
            } else {
                setHeroSlides([{
                    id: 'legacy-1',
                    type: 'IMAGE',
                    url: hero.value.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800',
                    title: hero.value.title || 'Şefin Spesiyali',
                    subtitle: hero.value.note || 'Özel Lezzet'
                }]);
            }
        }

        const welcome = settings.find(s => s.key === 'welcome_settings');
        if (welcome) setWelcomeSettings(welcome.value);

        let sub = settings.find(s => s.key === 'subscription_info');
        if (sub && sub.value) {
           const expiry = new Date(sub.value.expiryDate);
           setSubscription({ ...sub.value, isActive: expiry > new Date() });
        }
      } else {
         if (subscription.plan === 'NONE') {
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            setSubscription({ isActive: true, expiryDate: nextYear.toISOString(), plan: 'YEARLY' });
         }
      }

    } catch (e) {}
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) setIsKitchenAuth(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setIsKitchenAuth(true);
    });

    fetchData();
    const syncInterval = setInterval(fetchData, 4000); 

    return () => {
      authListener.subscription.unsubscribe();
      clearInterval(syncInterval);
    };
  }, [isMasterUser]);

  const handleStartSession = async (table: string, name: string, selectedLang: Language) => {
    setTableNumber(table);
    setCustomerName(name);
    setLang(selectedLang);
    setView('CUSTOMER');
  };

  const handlePlaceOrder = async (items: CartItem[], totalPrice: number, note?: string) => {
    const newOrderPayload = {
      table_number: tableNumber,
      customer_name: customerName,
      items: items,
      total_price: totalPrice,
      status: OrderStatus.RECEIVED,
      note: note,
      customer_language: lang,
      timestamp: new Date().toISOString(),
      stock_deducted: false
    };

    const optimisticOrder: Order = {
      id: `temp-${Date.now()}`,
      tableNumber,
      customerName,
      items,
      totalPrice,
      status: OrderStatus.RECEIVED,
      note,
      customerLanguage: lang,
      timestamp: new Date(),
      stockDeducted: false
    };
    
    setOrders(prev => [optimisticOrder, ...prev]);
    setCart([]);

    try {
        const currentLocals = JSON.parse(localStorage.getItem('damla_local_orders') || '[]');
        const updatedLocals = [optimisticOrder, ...currentLocals];
        localStorage.setItem('damla_local_orders', JSON.stringify(updatedLocals));
    } catch(e) { console.error('Local save failed', e); }

    const { data, error } = await supabase.from('orders').insert([newOrderPayload]).select();

    if (!error && data) {
       await fetchData();
    }
  };

  const handleAddCategory = async (cat: Category) => {
    await supabase.from('categories').insert([cat]);
    fetchData();
  };

  const handleDeleteCategory = async (catId: string) => {
    await supabase.from('categories').delete().eq('id', catId);
    fetchData();
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, completedBy?: string) => {
    const currentOrder = orders.find(o => o.id === orderId);
    let stockUpdateSuccess = true;
    const updatePayload: any = { status };

    // STOK DÜŞÜM MANTIĞI: Sipariş 'Hazırlanıyor' aşamasına geçtiğinde
    if (status === OrderStatus.PREPARING && currentOrder && !currentOrder.stockDeducted) {
        // 1. Stok Yeterlilik Kontrolü
        for (const item of currentOrder.items) {
            const { data: productData, error } = await supabase.from('products').select('stock, name').eq('id', item.id).single();
            
            if (error || !productData) continue; // Ürün bulunamazsa devam et (veya hata ver)

            const currentStock = productData.stock || 0;
            if (currentStock < item.quantity) {
                alert(`STOK YETERSİZ: ${productData.name}\nMevcut Stok: ${currentStock}\nSipariş Adedi: ${item.quantity}\n\nLütfen stok güncelleyin veya siparişi reddedin.`);
                return; // İşlemi durdur
            }
        }

        // 2. Stok Düşümü (Yeterlilik doğrulandıktan sonra)
        for (const item of currentOrder.items) {
             const { data: productData } = await supabase.from('products').select('stock').eq('id', item.id).single();
             if (productData) {
                 const newStock = Math.max(0, (productData.stock || 0) - item.quantity);
                 await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
             }
        }
        
        // Stok düşüldü olarak işaretle
        updatePayload.stock_deducted = true;
    }

    if (status === OrderStatus.PREPARING) {
        updatePayload.feedback = "Siparişiniz hazırlanıyor... 👨‍🍳";
    }
    if (status === OrderStatus.SERVED) {
        // Mutfak şefi "Servis Et" (Hazır) dediğinde garsona bildirim düşsün
        const callPayload = {
            table_number: currentOrder?.tableNumber,
            type: 'WAITER', // veya 'KITCHEN_READY' gibi özel bir tip
            status: 'ACTIVE',
            timestamp: new Date().toISOString(),
            completed_by: completedBy // Opsiyonel: Kimin hazır ettiğini kaydet
        };
        await supabase.from('waiter_calls').insert([callPayload]);
    }
    if (status === OrderStatus.COMPLETED && completedBy) {
        updatePayload.completed_by = completedBy;
    }
    
    // LOG ACTION
    logAction('UPDATE_ORDER_STATUS', `Order ${orderId} status changed to ${status}`, completedBy || 'System', 'Unknown');

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updatePayload, completedBy: completedBy || o.completedBy } : o));
    
    try {
        const localOrders = JSON.parse(localStorage.getItem('damla_local_orders') || '[]');
        const updatedLocals = localOrders.map((o: any) => o.id === orderId ? { ...o, ...updatePayload, completed_by: completedBy } : o);
        localStorage.setItem('damla_local_orders', JSON.stringify(updatedLocals));
    } catch(e) {}

    if (!orderId.startsWith('temp-') && !orderId.startsWith('demo-')) {
       await supabase.from('orders').update(updatePayload).eq('id', orderId);
       // Stok güncellendiği için ürünleri tekrar çek
       fetchData();
    }
  };
  
  // Masayı Kapatma Fonksiyonu (Garsonlar için)
  const closeTable = async (tableNum: string) => {
     // Bu masaya ait ve henüz CLOSED olmayan tüm siparişleri CLOSED yap
     const tableOrders = orders.filter(o => o.tableNumber === tableNum && o.status !== OrderStatus.CLOSED);
     
     if (tableOrders.length === 0) return;

     // Optimistik Güncelleme
     setOrders(prev => prev.map(o => o.tableNumber === tableNum && o.status !== OrderStatus.CLOSED ? { ...o, status: OrderStatus.CLOSED } : o));

     // DB Güncelleme
     const idsToClose = tableOrders.map(o => o.id).filter(id => !id.startsWith('temp-') && !id.startsWith('demo-'));
     if (idsToClose.length > 0) {
        await supabase.from('orders').update({ status: OrderStatus.CLOSED }).in('id', idsToClose);
     }
     fetchData();
  };

  const sendOrderFeedback = async (orderId: string, feedback: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, feedback } : o));
    if (!orderId.startsWith('temp-') && !orderId.startsWith('demo-')) {
      await supabase.from('orders').update({ feedback }).eq('id', orderId);
      fetchData();
    }
  };

  const handleWaiterCall = async (type: 'WAITER' | 'CHECK') => {
    const tempCall: WaiterCall = {
        id: `temp-${Date.now()}`, 
        tableNumber, 
        type, 
        timestamp: new Date(),
        status: 'ACTIVE'
    };
    setWaiterCalls(prev => [tempCall, ...prev]);

    try {
        const currentLocals = JSON.parse(localStorage.getItem('damla_local_calls') || '[]');
        localStorage.setItem('damla_local_calls', JSON.stringify([tempCall, ...currentLocals]));
    } catch(e) {}

    await supabase.from('waiter_calls').insert([{ table_number: tableNumber, type: type, status: 'ACTIVE' }]);
    fetchData();
  };

  // GÜNCELLEME: Çağrıları silmek yerine tamamlandı olarak işaretle
  const completeWaiterCall = async (id: string, staffName: string) => {
    const completedAt = new Date();
    
    setWaiterCalls(prev => prev.map(c => c.id === id ? { ...c, status: 'COMPLETED', completedBy: staffName, completedAt } : c));
    
    try {
        const localCalls = JSON.parse(localStorage.getItem('damla_local_calls') || '[]');
        const updatedLocals = localCalls.map((c: any) => c.id === id ? { ...c, status: 'COMPLETED', completed_by: staffName, completed_at: completedAt } : c);
        localStorage.setItem('damla_local_calls', JSON.stringify(updatedLocals));
    } catch(e) {}

    if (!id.startsWith('temp-') && !id.startsWith('call-')) {
      await supabase.from('waiter_calls').update({ status: 'COMPLETED', completed_by: staffName, completed_at: completedAt.toISOString() }).eq('id', id);
      fetchData();
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    setDynamicProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));

    await supabase.from('products').update({
      name: updatedProduct.name, 
      description: updatedProduct.description, 
      price: updatedProduct.price, 
      image: updatedProduct.image, 
      category: updatedProduct.category, 
      spice_level: updatedProduct.spiceLevel, 
      upsell_items: updatedProduct.upsellItems, 
      available: updatedProduct.available,
      stock: updatedProduct.stock // Stok güncelleme
    }).eq('id', updatedProduct.id);
    
    fetchData();
  };

  const handleAddProduct = async (newProduct: Partial<Product>) => {
    await supabase.from('products').insert([{ ...newProduct, stock: newProduct.stock || 0 }]);
    fetchData();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Silmek istediğinize emin misiniz?')) {
      await supabase.from('products').delete().eq('id', productId);
      fetchData();
    }
  };

  const handleAddStaff = async (newStaff: Partial<Staff>) => {
    await supabase.from('staff').insert([newStaff]);
    fetchData();
  };

  const handleUpdateStaff = async (updatedStaff: Staff) => {
    await supabase.from('staff').update(updatedStaff).eq('id', updatedStaff.id);
    fetchData();
  };

  const handleDeleteStaff = async (staffId: string) => {
    await supabase.from('staff').delete().eq('id', staffId);
    fetchData();
  };

  const handleUpdateHeroSlides = async (newSlides: HeroSlide[]) => {
    await supabase.from('site_settings').upsert({ key: 'hero_recommendation', value: newSlides }, { onConflict: 'key' });
    setHeroSlides(newSlides);
  };

  const handleUpdateWelcomeSettings = async (newSettings: any) => {
    await supabase.from('site_settings').upsert({ key: 'welcome_settings', value: newSettings }, { onConflict: 'key' });
    setWelcomeSettings(newSettings);
  };

  const handleUpdateSubscription = async (plan: 'MONTHLY' | 'YEARLY') => {
    const expiry = new Date();
    if (plan === 'MONTHLY') expiry.setMonth(expiry.getMonth() + 1);
    else expiry.setFullYear(expiry.getFullYear() + 1);
    const subValue = { plan, expiryDate: expiry.toISOString() };
    await supabase.from('site_settings').upsert({ key: 'subscription_info', value: subValue }, { onConflict: 'key' });
    setSubscription({ isActive: true, ...subValue });
    setShowPricing(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30">
      <AnimatePresence mode="wait">
        {(!subscription.isActive || showPricing) ? (
          <motion.div key="sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SubscriptionGate onPay={handleUpdateSubscription} lang={lang} setLang={setLang} canClose={subscription.isActive} onClose={() => setShowPricing(false)} />
          </motion.div>
        ) : (
          <>
            {view === 'WELCOME' && (
              <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <WelcomeScreen onStart={handleStartSession} onStaffAccess={() => setView('KITCHEN')} occupiedTables={occupiedTables} welcomeSettings={welcomeSettings} />
              </motion.div>
            )}
            {view === 'CUSTOMER' && (
              <motion.div key="customer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <CustomerUI tableNumber={tableNumber} customerName={customerName} orders={orders.filter(o => o.tableNumber === tableNumber)} cart={cart} setCart={setCart} onPlaceOrder={handlePlaceOrder} onCallWaiter={handleWaiterCall} onBack={() => setView('WELCOME')} lang={lang} products={dynamicProducts} heroSlides={heroSlides} />
              </motion.div>
            )}
            {view === 'KITCHEN' && (
              <motion.div key="kitchen" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <KitchenUI 
                  orders={orders} 
                  waiterCalls={waiterCalls} 
                  onUpdateStatus={updateOrderStatus} 
                  onSendFeedback={sendOrderFeedback} 
                  onClearCall={completeWaiterCall} 
                  products={dynamicProducts} 
                  onUpdateProduct={handleUpdateProduct} 
                  onAddProduct={handleAddProduct} 
                  onDeleteProduct={handleDeleteProduct} 
                  onAddStaff={handleAddStaff} 
                  onUpdateStaff={handleUpdateStaff} 
                  onDeleteStaff={handleDeleteStaff} 
                  staff={staff} 
                  onBack={() => setView('WELCOME')} 
                  lang={lang} 
                  heroSlides={heroSlides} 
                  onUpdateHeroSlides={handleUpdateHeroSlides} 
                  welcomeSettings={welcomeSettings} 
                  onUpdateWelcomeSettings={handleUpdateWelcomeSettings} 
                  onShowPricing={() => setShowPricing(true)} 
                  subscription={subscription} 
                  currentUser={user} 
                  isAuth={isKitchenAuth} 
                  setAuth={setIsKitchenAuth}
                  onCloseTable={closeTable}
                  categories={categories}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                  logAction={logAction}
                />
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
