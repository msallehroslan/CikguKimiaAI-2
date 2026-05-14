import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, RefreshCw, Wand2, Info } from "lucide-react";
import { GeminiService } from "../services/geminiService";
import { memoryService, StudentMemory } from "../services/memoryService";
import { useFirebase } from "../lib/FirebaseProvider";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "../lib/utils";

interface EquationBalancerProps {
  onClose: () => void;
}

export function EquationBalancer({ onClose }: EquationBalancerProps) {
  const { user } = useFirebase();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [memory, setMemory] = useState<StudentMemory>({
    weakTopics: [],
    identifiedMistakes: [],
    examPapersAnalysis: []
  });

  useEffect(() => {
    if (user) {
      memoryService.getMemory(user.uid).then(setMemory);
    }
  }, [user]);

  const gemini = useMemo(() => new GeminiService(memory), [memory]);

  const handleBalance = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setResult(null);
    try {
      const response = await gemini.sendMessage(
        `Balance this chemical equation: ${input}. 
        Please provide:
        1. The balanced equation in LaTeX format (e.g. $2H_2 + O_2 \rightarrow 2H_2O$).
        2. A clear, bulleted, step-by-step explanation in Bahasa Melayu why it is balanced that way.
        3. Mention the type of reaction (e.g. Pembakaran, Peneutralan, etc.).
        Follow the SPM KSSM format strictly.`
      );
      setResult(response);
    } catch (error) {
      console.error(error);
      setResult("Maaf, Cikgu gagal mengimbang persamaan ini. Sila pastikan formula kimia betul.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 100, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 100, scale: 0.95 }}
        className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-900 flex justify-between items-center bg-brand-navy">
          <div className="flex items-center gap-4 text-cyan-400">
            <div className="p-3 bg-slate-800 rounded-2xl shadow-xl border border-slate-700">
              <RefreshCw className={cn("w-6 h-6", isLoading && "animate-spin")} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-1">Imbang Persamaan</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">IoTera Chemical Balancer</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-800 rounded-2xl transition-all text-slate-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
          {/* Input Area */}
          <div className="space-y-4">
            <label className="text-sm font-black text-slate-400 uppercase tracking-wider px-2">Masukkan Persamaan</label>
            <div className="relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Contoh: H2 + O2 = H2O"
                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-lg font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                onKeyDown={(e) => e.key === 'Enter' && handleBalance()}
              />
              <button
                onClick={handleBalance}
                disabled={isLoading || !input.trim()}
                className="absolute right-3 top-3 bottom-3 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-500/25 active:scale-95 flex items-center gap-2"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Imbang
              </button>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold px-2">
              <Info className="w-3 h-3 text-blue-400" />
              <span>Guna '=' atau '→' untuk memisahkan bahan dan hasil.</span>
            </div>
          </div>

          {/* Results Area */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="p-6 bg-slate-900 rounded-3xl shadow-xl shadow-slate-200">
                   <div className="text-[10px] font-black text-blue-400 mb-4 tracking-[0.2em] uppercase">Hasil Balanced</div>
                   <div className="flex justify-center py-4 text-white">
                      <div className="prose prose-invert max-w-none scale-150">
                        <ReactMarkdown 
                          remarkPlugins={[remarkMath]} 
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || "");
                              if (!inline && match && match[1] === "svg") {
                                return (
                                  <div 
                                    className="my-4 p-4 bg-white rounded-2xl border border-slate-100 flex justify-center shadow-inner"
                                    dangerouslySetInnerHTML={{ __html: String(children).replace(/\n$/, "") }}
                                  />
                                );
                              }
                              return (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {result.split('\n\n')[0]}
                        </ReactMarkdown>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-black text-slate-400 mb-2 tracking-[0.2em] uppercase px-2">Penjelasan Langkah-demi-langkah</div>
                  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                    <div className="prose prose-sm max-w-none text-slate-600 font-medium leading-relaxed prose-blue">
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || "");
                            if (!inline && match && match[1] === "svg") {
                              return (
                                <div 
                                  className="my-4 p-4 bg-white rounded-2xl border border-slate-100 flex justify-center shadow-inner"
                                  dangerouslySetInnerHTML={{ __html: String(children).replace(/\n$/, "") }}
                                />
                              );
                            }
                            return (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {result.includes('\n\n') ? result.substring(result.indexOf('\n\n') + 2) : ""}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Tip */}
        <div className="p-6 bg-blue-600 m-4 rounded-[1.5rem] shadow-xl shadow-blue-200">
          <div className="flex gap-4 items-center">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Info className="w-5 h-5 text-white" />
            </div>
            <p className="text-blue-50 text-xs font-bold leading-tight">
              Cikgu bukan setakat imbang taw, Cikgu ajar cara nak imbang sekali. Fahamkan cara kira atom tu ya!
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
