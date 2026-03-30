import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  onPay: (plan: 'MONTHLY' | 'YEARLY') => void;
  lang: Language;
  setLang: (l: Language) => void;
  canClose?: boolean;
  onClose?: () => void;
}

const SubscriptionGate: React.FC<Props> = ({ onPay, lang, setLang, canClose, onClose }) => {
  const [loading, setLoading] = useState<'STRIPE' | 'PAYPAL' | null>(null);
  const t = TRANSLATIONS[lang];

  const handlePaymentSim = (plan: 'MONTHLY' | 'YEARLY', method: 'STRIPE' | 'PAYPAL') => {
    setLoading(method);
    // Gerçek dünyada burada Stripe Checkout veya PayPal SDK tetiklenir.
    setTimeout(() => {
      onPay(plan);
      setLoading(null);
    }, 3000);
  };

  const languages: Language[] = ['TR', 'EN', 'DE', 'RU', 'AR', 'IT', 'FR'];

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Arka Plan Dekorasyonu */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Üst Bar: Dil Seçici ve Kapatma */}
      <div className="relative z-20 w-full max-w-4xl flex justify-between items-center mb-8 px-4">
        <div className="flex flex-wrap gap-2">
          {languages.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
                lang === l ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/20'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {canClose && onClose && (
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-all"
          >
            <span className="material-icons-round">close</span>
          </button>
        )}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-4xl bg-zinc-900/40 backdrop-blur-3xl border border-white/10 rounded-[48px] p-8 md:p-16 shadow-2xl overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Sol Taraf: Bilgi */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{t.subscriptionTitle}</span>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white leading-tight">
                Premium QR <br /> <span className="text-emerald-500">Menü Sistemi</span>
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
                {t.subscriptionDesc} Kesintisiz hizmet, 7/24 destek ve profesyonel mutfak yönetimi için aboneliğinizi başlatın.
              </p>
            </div>

            <div className="space-y-4">
               {[
                 { icon: 'bolt', text: 'Anlık Sipariş Yönetimi' },
                 { icon: 'language', text: '7 Farklı Dil Desteği' },
                 { icon: 'security', text: 'Güvenli Ödeme Altyapısı' }
               ].map((item, i) => (
                 <div key={i} className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                     <span className="material-icons-round text-emerald-500 text-sm">{item.icon}</span>
                   </div>
                   <span className="text-xs font-bold text-zinc-300">{item.text}</span>
                 </div>
               ))}
            </div>
          </div>

          {/* Sağ Taraf: Kartlar */}
          <div className="space-y-6">
            {loading ? (
              <div className="h-[400px] flex flex-col items-center justify-center bg-black/20 rounded-[32px] border border-white/5 gap-6">
                <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 animate-pulse">
                    {loading === 'STRIPE' ? 'STRIPE CHECKOUT' : 'PAYPAL GATEWAY'}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-2">Güvenli ödeme sayfasına aktarılıyorsunuz...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Aylık Plan */}
                <div className="bg-white/[0.03] border border-white/5 p-6 rounded-[32px] group transition-all hover:border-white/20">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="text-white font-black text-xs uppercase tracking-widest mb-1">{t.monthlyPlan}</h4>
                      <p className="text-zinc-500 text-[10px]">Her ay yenilenen standart plan</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-display font-bold text-white">30$</span>
                      <span className="text-zinc-600 text-[10px] block font-bold">/ ay</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handlePaymentSim('MONTHLY', 'STRIPE')}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[9px] py-3 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-tighter"
                    >
                      <span className="material-icons-round text-sm">credit_card</span> Stripe
                    </button>
                    <button 
                      onClick={() => handlePaymentSim('MONTHLY', 'PAYPAL')}
                      className="bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-black text-[9px] py-3 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-tighter"
                    >
                      <span className="material-icons-round text-sm">payments</span> PayPal
                    </button>
                  </div>
                </div>

                {/* Yıllık Plan */}
                <div className="bg-emerald-600/10 border border-emerald-500/30 p-6 rounded-[32px] relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-emerald-500 text-[8px] font-black text-white px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest">
                    EN İYİ FİYAT
                  </div>
                  <div className="flex justify-between items-center mb-6 pt-2">
                    <div>
                      <h4 className="text-emerald-500 font-black text-xs uppercase tracking-widest mb-1">{t.yearlyPlan}</h4>
                      <p className="text-zinc-500 text-[10px]">Yılda 60$ tasarruf edin</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-display font-bold text-white">300$</span>
                      <span className="text-zinc-600 text-[10px] block font-bold">/ yıl</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handlePaymentSim('YEARLY', 'STRIPE')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] py-3 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-tighter shadow-xl shadow-emerald-900/20"
                    >
                      <span className="material-icons-round text-sm">credit_card</span> Stripe
                    </button>
                    <button 
                      onClick={() => handlePaymentSim('YEARLY', 'PAYPAL')}
                      className="bg-[#0070ba] hover:bg-[#005ea6] text-white font-black text-[9px] py-3 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-tighter"
                    >
                      <span className="material-icons-round text-sm">payments</span> PayPal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alt Bilgi */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-6 grayscale opacity-40">
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" className="h-4" alt="Stripe" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="PayPal" />
           </div>
           <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
             <span className="material-icons-round text-sm">security</span>
             Uçtan uca şifreli güvenli ödeme
           </p>
        </div>
      </motion.div>

      <div className="mt-8 text-center relative z-10">
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">
          {t.attribution}
        </p>
      </div>
    </div>
  );
};

export default SubscriptionGate;