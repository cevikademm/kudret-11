
import React from 'react';
import { Product } from '../types';

interface Props {
  product: Product;
  onAdd: () => void;
}

const ProductCard: React.FC<Props> = ({ product, onAdd }) => {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-[24px] p-3 flex gap-4 group transition-all cursor-pointer shadow-lg overflow-hidden">
      <div className="w-20 h-20 md:w-28 md:h-28 rounded-[18px] overflow-hidden flex-shrink-0 relative shadow-xl">
        <img 
          src={product.image} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          alt={product.name} 
        />
        {product.spiceLevel > 0 && (
           <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-md px-1 py-0.5 rounded-lg flex gap-0.5 border border-white/10">
             {[...Array(product.spiceLevel)].map((_, i) => (
               <span key={i} className="text-[7px]">🔥</span>
             ))}
           </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
        <div className="space-y-0.5">
          <h4 className="font-bold text-white leading-tight text-sm tracking-tight truncate">
            {product.name}
          </h4>
          <p className="text-[10px] text-zinc-500 line-clamp-2 leading-snug font-medium opacity-80">
            {product.description}
          </p>
          
          <div className="flex flex-wrap gap-1 pt-0.5">
            {product.allergens.slice(0, 2).map(a => (
              <span key={a} className="text-[7px] font-black uppercase tracking-tighter text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded-md">
                {a}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mt-1.5">
          <span className="text-base font-black text-emerald-500 tracking-tighter">{product.price.toFixed(2)}€</span>
          <button 
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center transition-all shadow-lg active:scale-90"
          >
            <span className="material-icons-round text-lg leading-none">add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
