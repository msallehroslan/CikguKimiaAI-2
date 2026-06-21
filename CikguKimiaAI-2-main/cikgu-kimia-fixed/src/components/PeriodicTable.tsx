import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { X, Sparkles, Info, FlaskConical, Atom } from "lucide-react";
import { cn } from "../lib/utils";

interface Element {
  symbol: string;
  name: string;
  atomicNumber: number;
  atomicMass: number;
  group: number;
  period: number;
  category: string;
  config: string;
  description: string;
  color: string;
}

const ELEMENTS: Element[] = [
  { symbol: "H", name: "Hidrogen", atomicNumber: 1, atomicMass: 1.008, group: 1, period: 1, category: "Nonmetal", config: "1s1", color: "bg-blue-500", description: "Unsur paling ringan. Digunakan dalam sel bahan api." },
  { symbol: "He", name: "Helium", atomicNumber: 2, atomicMass: 4.003, group: 18, period: 1, category: "Noble Gas", config: "1s2", color: "bg-brand-purple", description: "Gas lengai. Digunakan dalam belon kaji cuaca." },
  { symbol: "Li", name: "Litium", atomicNumber: 3, atomicMass: 6.941, group: 1, period: 2, category: "Alkali Metal", config: "[He] 2s1", color: "bg-emerald-500", description: "Logam alkali paling ringan. Digunakan dalam bateri." },
  { symbol: "Be", name: "Berilium", atomicNumber: 4, atomicMass: 9.012, group: 2, period: 2, category: "Alkaline Earth", config: "[He] 2s2", color: "bg-emerald-600", description: "Logam kuat dan ringan." },
  { symbol: "B", name: "Boron", atomicNumber: 5, atomicMass: 10.81, group: 13, period: 2, category: "Metalloid", config: "[He] 2s2 2p1", color: "bg-amber-500", description: "Metalloid yang keras." },
  { symbol: "C", name: "Karbon", atomicNumber: 6, atomicMass: 12.01, group: 14, period: 2, category: "Nonmetal", config: "[He] 2s2 2p2", color: "bg-blue-400", description: "Asas organik kehidupan. Wujud sebagai intan atau grafit." },
  { symbol: "N", name: "Nitrogen", atomicNumber: 7, atomicMass: 14.01, group: 15, period: 2, category: "Nonmetal", config: "[He] 2s2 2p3", color: "bg-blue-400", description: "78% atmosfera bumi. Penting untuk protein." },
  { symbol: "O", name: "Oksigen", atomicNumber: 8, atomicMass: 16.00, group: 16, period: 2, category: "Nonmetal", config: "[He] 2s2 2p4", color: "bg-blue-400", description: "Diperlukan untuk respirasi dan pembakaran." },
  { symbol: "F", name: "Fluorin", atomicNumber: 9, atomicMass: 19.00, group: 17, period: 2, category: "Halogen", config: "[He] 2s2 2p5", color: "bg-rose-500", description: "Halogen paling reaktif." },
  { symbol: "Ne", name: "Neon", atomicNumber: 10, atomicMass: 20.18, group: 18, period: 2, category: "Noble Gas", config: "[He] 2s2 2p6", color: "bg-brand-purple", description: "Gas lengai yang bercahaya kemerahan dlm tiub lucutan." },
  { symbol: "Na", name: "Natrium", atomicNumber: 11, atomicMass: 22.99, group: 1, period: 3, category: "Alkali Metal", config: "[Ne] 3s1", color: "bg-emerald-500", description: "Sangat reaktif dengan air. Disimpan dalam minyak parafin." },
  { symbol: "Mg", name: "Magnesium", atomicNumber: 12, atomicMass: 24.31, group: 2, period: 3, category: "Alkaline Earth", config: "[Ne] 3s2", color: "bg-emerald-600", description: "Terbakar dengan cahaya putih yang sangat menyilaukan." },
  { symbol: "Al", name: "Aluminium", atomicNumber: 13, atomicMass: 26.98, group: 13, period: 3, category: "Post-transition", config: "[Ne] 3s2 3p1", color: "bg-slate-400", description: "Logam ringan dan kalis karat." },
  { symbol: "Si", name: "Silikon", atomicNumber: 14, atomicMass: 28.09, group: 14, period: 3, category: "Metalloid", config: "[Ne] 3s2 3p2", color: "bg-amber-500", description: "Separuh konduktor utama dalam cip komputer." },
  { symbol: "P", name: "Fosforus", atomicNumber: 15, atomicMass: 30.97, group: 15, period: 3, category: "Nonmetal", config: "[Ne] 3s2 3p3", color: "bg-blue-400", description: "Penting untuk tulang dan DNA." },
  { symbol: "S", name: "Sulfur", atomicNumber: 16, atomicMass: 32.06, group: 16, period: 3, category: "Nonmetal", config: "[Ne] 3s2 3p4", color: "bg-blue-400", description: "Pepejal kuning. Digunakan dlm pemvulkanan getah." },
  { symbol: "Cl", name: "Klorin", atomicNumber: 17, atomicMass: 35.45, group: 17, period: 3, category: "Halogen", config: "[Ne] 3s2 3p5", color: "bg-rose-500", description: "Gas kuning-hijau. Agen peluntur dan pembasmi kuman." },
  { symbol: "Ar", name: "Argon", atomicNumber: 18, atomicMass: 39.95, group: 18, period: 3, category: "Noble Gas", config: "[Ne] 3s2 3p6", color: "bg-brand-purple", description: "Menyediakan atmosfera lengai dalam mentol filamen." },
  { symbol: "K", name: "Kalium", atomicNumber: 19, atomicMass: 39.10, group: 1, period: 4, category: "Alkali Metal", config: "[Ar] 4s1", color: "bg-emerald-500", description: "Logam alkali sangat reaktif. Penting untuk fungsi saraf." },
  { symbol: "Ca", name: "Kalsium", atomicNumber: 20, atomicMass: 40.08, group: 2, period: 4, category: "Alkaline Earth", config: "[Ar] 4s2", color: "bg-emerald-600", description: "Komponen utama tulang dan cangkerang." },
  // Adding more as placeholders or key transition metals for SPM
  { symbol: "Fe", name: "Ferum", atomicNumber: 26, atomicMass: 55.85, group: 8, period: 4, category: "Transition Metal", config: "[Ar] 3d6 4s2", color: "bg-indigo-500", description: "Logam peralihan. Membentuk sebatian berwarna dan ion bervariasi." },
  { symbol: "Cu", name: "Kuprum", atomicNumber: 29, atomicMass: 63.55, group: 11, period: 4, category: "Transition Metal", config: "[Ar] 3d10 4s1", color: "bg-indigo-500", description: "Konduktor elektrik yang baik. Digunakan dlm kabel elektrik." },
  { symbol: "Zn", name: "Zink", atomicNumber: 30, atomicMass: 65.38, group: 12, period: 4, category: "Transition Metal", config: "[Ar] 3d10 4s2", color: "bg-indigo-500", description: "Digunakan untuk menyadur besi (penggalvanian)." },
  { symbol: "Br", name: "Bromin", atomicNumber: 35, atomicMass: 79.90, group: 17, period: 4, category: "Halogen", config: "[Ar] 3d10 4s2 4p5", color: "bg-rose-500", description: "Satu-satunya nonmetal cecair pada suhu bilik." },
  { symbol: "I", name: "Iodin", atomicNumber: 53, atomicMass: 126.9, group: 17, period: 5, category: "Halogen", config: "[Kr] 4d10 5s2 5p5", color: "bg-rose-500", description: "Pepejal hitam-ungu yang memewap (sublimes) menjadi gas ungu." },
];

export function PeriodicTable({ onClose, onAnalyze, onExplore }: { onClose: () => void; onAnalyze?: (el: Element) => void; onExplore?: (el: Element) => void }) {
  const [selected, setSelected] = useState<Element | null>(null);

  const getPos = (group: number, period: number) => {
    return {
      gridColumnStart: group,
      gridRowStart: period
    };
  };

  const handleAnalyze = () => {
    if (selected && onAnalyze) {
      onAnalyze(selected);
    }
  };

  const handleExplore = () => {
    if (selected && onExplore) {
      onExplore(selected);
    }
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col p-6 sm:p-10 overflow-hidden relative">
      <div className="flex items-center justify-between mb-8">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Neural Tool v1.0</span>
           </div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Jadual Berkala <span className="text-blue-600">Interaktif</span></h2>
        </div>
        <button 
          onClick={onClose}
          className="p-3 bg-white hover:bg-slate-100 rounded-2xl border border-slate-200 transition-all shadow-sm"
        >
          <X className="w-6 h-6 text-slate-400" />
        </button>
      </div>

      <div className="flex-grow overflow-auto custom-scrollbar p-4">
        <div className="grid grid-cols-18 gap-1.5 sm:gap-2 min-w-[1200px] mb-20">
          {ELEMENTS.map((el) => (
            <motion.button
              key={el.symbol}
              whileHover={{ scale: 1.1, zIndex: 10 }}
              onClick={() => setSelected(el)}
              style={getPos(el.group, el.period)}
              className={cn(
                "relative h-20 sm:h-24 rounded-xl sm:rounded-2xl border flex flex-col items-center justify-center transition-all shadow-sm group",
                selected?.symbol === el.symbol 
                  ? "ring-4 ring-blue-500/20 border-blue-500 scale-110 z-10" 
                  : "border-slate-100 hover:border-slate-300"
              )}
            >
              <div className={cn("absolute inset-0 opacity-[0.03] rounded-2xl", el.color)} />
              <span className="text-[8px] font-black self-start ml-2 mt-1 opacity-40">{el.atomicNumber}</span>
              <span className={cn("text-xl sm:text-2xl font-black mb-0.5", el.symbol === selected?.symbol ? "text-blue-600" : "text-slate-800")}>{el.symbol}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{el.name}</span>
            </motion.button>
          ))}

          {/* Group numbers indicator */}
          {[...Array(18)].map((_, i) => (
             <div key={i} className="text-[9px] font-black text-slate-300 text-center py-2 uppercase tracking-widest">{i + 1}</div>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute left-0 right-0 bottom-0 bg-white border-t border-slate-200 shadow-[0_-20px_60px_rgba(0,0,0,0.1)] p-8 sm:p-12 z-50 rounded-t-[3rem]"
          >
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-start relative">
              <button 
                onClick={() => setSelected(null)}
                className="absolute top-0 right-0 p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"
                title="Tutup butiran"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>

              <div className="flex-shrink-0 flex flex-col items-center gap-6">
                <div className={cn("w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] flex flex-col items-center justify-center text-white relative shadow-2xl overflow-hidden", selected.color)}>
                  <div className="absolute inset-0 bg-white/10" />
                  <span className="text-sm font-black absolute top-4 left-4 opacity-50">{selected.atomicNumber}</span>
                  <span className="text-5xl sm:text-7xl font-black tracking-tighter relative z-10">{selected.symbol}</span>
                  <span className="text-xs font-black uppercase tracking-widest absolute bottom-4 opacity-50">{selected.atomicMass}</span>
                </div>
                
                <div className="flex gap-2">
                   <div className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">Kumpulan {selected.group}</div>
                   <div className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">Kala {selected.period}</div>
                </div>
              </div>

              <div className="flex-grow">
                <div className="flex items-center gap-4 mb-6">
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{selected.name}</h3>
                  <span className={cn("px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-opacity-10 border", selected.color.replace('bg-', 'text-'), selected.color.replace('bg-', 'border-'))}>
                    {selected.category}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <div className="flex items-center gap-3 mb-3 text-blue-600">
                      <Atom className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Susunan Elektron</span>
                    </div>
                    <p className="text-2xl font-black text-slate-800 tracking-tight font-mono">{selected.config}</p>
                  </div>
                  
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <div className="flex items-center gap-3 mb-3 text-emerald-600">
                      <Info className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Ciri Utama & Kegunaan</span>
                    </div>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed italic">"{selected.description}"</p>
                  </div>
                </div>

                <div className="flex gap-4">
                   <button 
                    onClick={handleAnalyze}
                    className="flex-grow flex items-center justify-center gap-3 py-4 bg-brand-navy text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl active:scale-95"
                   >
                     <Sparkles className="w-4 h-4 text-cyan-400" />
                     Analisis SPM Deep-Dive
                   </button>
                   <button 
                    onClick={handleExplore}
                    className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-blue-600 transition-all active:scale-90"
                   >
                     <FlaskConical className="w-5 h-5 flex-shrink-0" />
                   </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .grid-cols-18 {
          grid-template-columns: repeat(18, minmax(0, 1fr));
        }
      `}</style>
    </div>
  );
}
