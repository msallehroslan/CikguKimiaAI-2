import { motion } from "motion/react";
import { Beaker, FlaskConical, Flame, Zap, Droplets, X, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "../lib/utils";

interface EquationGuideProps {
  onClose: () => void;
}

const EQUATIONS = [
  {
    type: "Peneutralan",
    concept: "Neutralisation",
    icon: <Droplets className="w-5 h-5" />,
    pattern: "Asid + Bes → Garam + Air",
    example: "$HCl + NaOH \\rightarrow NaCl + H_2O$",
    color: "bg-blue-500",
    lightColor: "bg-blue-50 text-blue-600 border-blue-100"
  },
  {
    type: "Pemendakan",
    concept: "Precipitation",
    icon: <Beaker className="w-5 h-5" />,
    pattern: "Larutan + Larutan → Garam Tak Terlarut",
    example: "$AgNO_3 + NaCl \\rightarrow AgCl + NaNO_3$",
    color: "bg-emerald-500",
    lightColor: "bg-emerald-50 text-emerald-600 border-emerald-100"
  },
  {
    type: "Penyesaran",
    concept: "Displacement",
    icon: <FlaskConical className="w-5 h-5" />,
    pattern: "Logam Teraktif + Garam → Logam Kurang Aktif",
    example: "$Zn + CuSO_4 \\rightarrow ZnSO_4 + Cu$",
    color: "bg-orange-500",
    lightColor: "bg-orange-50 text-orange-600 border-orange-100"
  },
  {
    type: "Pembakaran",
    concept: "Combustion",
    icon: <Flame className="w-5 h-5" />,
    pattern: "Bahan Api + Oksigen → CO₂ + H₂O",
    example: "$CH_4 + 2O_2 \\rightarrow CO_2 + 2H_2O$",
    color: "bg-red-500",
    lightColor: "bg-red-50 text-red-600 border-red-100"
  },
  {
    type: "Redoks",
    concept: "Redox",
    icon: <Zap className="w-5 h-5" />,
    pattern: "Pemindahan Elektron (Ox & Red)",
    example: "$Mg + Cu^{2+} \\rightarrow Mg^{2+} + Cu$",
    color: "bg-purple-500",
    lightColor: "bg-purple-50 text-purple-600 border-purple-100"
  }
];

export function EquationGuide({ onClose }: EquationGuideProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 100, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 100, scale: 0.95 }}
        className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-8 border-b border-slate-900 flex justify-between items-center bg-brand-navy">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">Panduan Persamaan</h3>
            <p className="text-sm text-slate-400 font-medium">IoTera Chemical Intelligence</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-800 rounded-2xl transition-all text-slate-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {EQUATIONS.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group p-5 rounded-3xl border border-slate-100 bg-white hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-4">
                  <div className={cn("p-3 rounded-2xl text-white shadow-lg", item.color)}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 leading-tight">{item.type}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.concept}</p>
                  </div>
                </div>
                <div className={cn("px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-tighter", item.lightColor)}>
                  SPM KSSM
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-3 text-slate-600">
                <ChevronRight className="w-3 h-3 text-blue-400" />
                <p className="text-xs font-bold">{item.pattern}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                <div className="prose prose-sm max-w-none flex justify-center">
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                  >
                    {item.example}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="p-6 bg-blue-600 m-4 rounded-[1.5rem] shadow-xl shadow-blue-200">
          <div className="flex gap-4 items-start">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-1 italic">Tip Cikgu:</p>
              <p className="text-blue-50 text-xs leading-relaxed">
                Pastikan bilangan atom di sebelah kiri dan kanan panah sentiasa **seimbang (balanced)**. Jangan lupa cas ion kalau buat persamaan ion!
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
