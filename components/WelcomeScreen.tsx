
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  onStart: (table: string, name: string, lang: Language) => void;
  onStaffAccess?: () => void;
  occupiedTables?: string[];
  welcomeSettings: { backgroundImage: string };
}

const WelcomeScreen: React.FC<Props> = ({ onStart, onStaffAccess, occupiedTables = [], welcomeSettings }) => {
  const [table, setTable] = useState('');
  const [name, setName] = useState('');
  const [selectedLang, setSelectedLang] = useState<Language>('TR');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const t = TRANSLATIONS[selectedLang];
  const isFormValid = table.length > 0 && name.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onStart(table, name.trim(), selectedLang);
    }
  };

  const languages: Language[] = ['TR', 'EN', 'DE', 'RU', 'AR', 'IT', 'FR'];
  const languageFlags: Record<Language, string> = {
    TR: 'tr', EN: 'gb', DE: 'de', RU: 'ru', AR: 'sa', IT: 'it', FR: 'fr'
  };
  const tables = Array.from({ length: 15 }, (_, i) => (i + 1).toString());

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-black overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src={welcomeSettings.backgroundImage} 
          className="w-full h-full object-cover opacity-30 animate-slow-zoom" 
          alt="Background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-transparent to-black" />
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-[360px] z-10 space-y-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
            <div className="relative w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-700 backdrop-blur-md rounded-[28px] flex items-center justify-center shadow-2xl border border-white/20">
              <span className="material-icons-round text-4xl text-white">restaurant</span>
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-display font-bold text-white tracking-tight">Kudret</h1>
            <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.5em] opacity-80">SMART SYSTEMS</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white/[0.03] border border-white/10 backdrop-blur-3xl p-8 rounded-[40px] shadow-2xl">
          <div className="space-y-5">
            <div className="flex flex-wrap justify-center gap-1.5 mb-2">
              {languages.map((l) => (
                <button key={l} type="button" onClick={() => setSelectedLang(l)} className={`w-11 h-11 rounded-xl overflow-hidden transition-all border flex items-center justify-center ${selectedLang === l ? 'border-emerald-400 scale-110 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/40' : 'border-white/10 hover:border-white/30'}`} style={selectedLang === l ? {transform:'scale(1.12)'} : {}}>
                  <img src={`https://flagcdn.com/w40/${languageFlags[l]}.png`} alt={l} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest text-center">{t.tableNo}</label>
              <button type="button" onClick={() => setIsPickerOpen(true)} className={`w-full bg-black/40 border rounded-2xl px-5 py-4 flex items-center justify-center transition-all min-h-[60px] ${table ? 'border-emerald-500/50' : 'border-white/10'}`}>
                <span className={`text-sm font-bold ${table ? 'text-white' : 'text-zinc-600'}`}>{table ? `${t.tableNo} ${table}` : t.selectTable}</span>
              </button>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest text-center">{t.nameOptional}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder={t.nameOptional} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-center text-white focus:border-emerald-500/50 outline-none" />
            </div>
          </div>
          <button disabled={!isFormValid} className="w-full bg-emerald-600 disabled:bg-zinc-900/50 disabled:text-zinc-700 text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl transition-all">{t.discoverMenu}</button>
        </form>

        <div className="flex flex-col items-center">
          <button onClick={onStaffAccess} className="flex items-center gap-3 px-6 py-3 bg-zinc-900/30 border border-white/5 rounded-2xl text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all">
            <span className="material-icons-round text-emerald-500">lock</span> {t.staffAccess}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isPickerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPickerOpen(false)} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-0 w-full bg-zinc-950 border-t border-white/10 rounded-t-[40px] z-[101] p-8 max-h-[70vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-display font-bold text-white">{t.tableNo}</h3>
                <button onClick={() => setIsPickerOpen(false)} className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-500"><span className="material-icons-round">close</span></button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {tables.map((num) => {
                  const isOccupied = occupiedTables.includes(num);
                  return (
                    <button key={num} onClick={() => {
                        if (isOccupied && table !== num) {
                          if (!window.confirm(`Masa ${num} şu anda dolu!\nYine de bu masaya geçmek istiyor musunuz?`)) return;
                        }
                        setTable(num); setIsPickerOpen(false);
                      }} className={`h-20 rounded-2xl border transition-all flex flex-col items-center justify-center relative overflow-hidden ${table === num ? 'bg-emerald-600 border-emerald-400 text-white' : isOccupied ? 'bg-amber-600/20 border-amber-500/50 text-amber-500' : 'bg-zinc-900 border-white/5 text-zinc-400'}`}>
                      {isOccupied && table !== num && <div className="absolute top-0 left-0 bg-amber-500 text-[6px] font-black px-1.5 py-0.5 rounded-br-lg text-black uppercase tracking-tighter">DOLU</div>}
                      <span className="text-[10px] font-black opacity-50">{t.tableNo}</span>
                      <span className="text-xl font-black">{num}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WelcomeScreen;
