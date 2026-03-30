
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, Language } from '../types';
import { PRODUCTS, TRANSLATIONS } from '../constants';

interface Props {
  product: Product | null;
  onClose: () => void;
  onAdd: (product: Product) => void;
  lang: Language;
}

const UpsellModal: React.FC<Props> = ({ product, onClose, onAdd, lang }) => {
  if (!product || !product.upsellItems) return null;

  const t = TRANSLATIONS[lang];
  const upsellProducts = PRODUCTS.filter(p => product.upsellItems?.includes(p.id));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl"
        >
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
               <span className="material-icons-round text-emerald-500 text-3xl">auto_awesome</span>
            </div>
            <h3 className="text-xl font-display font-bold mb-2">{t.upsellTitle}</h3>
            <p className="text-zinc-400 text-sm mb-8">
              <span className="text-white font-bold">{product.name}</span> {t.upsellDesc}
            </p>

            <div className="space-y-3">
              {upsellProducts.map(p => (
                <div key={p.id} className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl flex items-center gap-4 text-left group hover:border-emerald-500/50 transition-all">
                  <img src={p.image} className="w-14 h-14 rounded-xl object-cover" alt={p.name} />
                  <div className="flex-1">
                    <h4 className="font-bold text-sm leading-tight">{p.name}</h4>
                    <span className="text-emerald-500 font-bold text-xs">+{p.price.toFixed(2)}€</span>
                  </div>
                  <button 
                    onClick={() => onAdd(p)}
                    className="bg-emerald-600/10 text-emerald-500 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"
                  >
                    <span className="material-icons-round">add</span>
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={onClose}
              className="mt-8 text-zinc-500 font-bold text-sm hover:text-zinc-300 transition-colors"
            >
              {t.maybeLater}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UpsellModal;
