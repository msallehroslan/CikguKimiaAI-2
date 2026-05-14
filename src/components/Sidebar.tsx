import { SYLLABUS_TOPICS, Topic } from "../constants";
import { FlaskConical, BookOpen, GraduationCap, Brain, Menu, X, Sparkles, ChevronDown, Trophy, Target, ClipboardCheck } from "lucide-react";
import { cn } from "../lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface SidebarProps {
  selectedTopicId?: string;
  onTopicSelect: (topic: Topic | null) => void;
  className?: string;
}

export function Sidebar({ selectedTopicId, onTopicSelect, className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedForm, setExpandedForm] = useState<number | null>(null);
  const [isLatihanExpanded, setIsLatihanExpanded] = useState(true);

  const form4 = SYLLABUS_TOPICS.filter((t) => t.form === 4);
  const form5 = SYLLABUS_TOPICS.filter((t) => t.form === 5);

  const toggleForm = (form: number) => {
    setExpandedForm(expandedForm === form ? null : form);
  };

  const TopicItem = ({ topic }: { topic: Topic }) => (
      <button
      onClick={() => {
        onTopicSelect(topic);
        setIsOpen(false);
      }}
      className={cn(
        "w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-start gap-3 group relative overflow-hidden",
        selectedTopicId === topic.id
          ? "bg-white text-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
          : "hover:bg-blue-700/50 text-blue-100 hover:text-white"
      )}
    >
      <div className={cn(
        "mt-1 p-1.5 rounded-lg shrink-0 transition-colors",
        selectedTopicId === topic.id ? "bg-blue-50" : "bg-blue-800/40 group-hover:bg-blue-400 text-blue-100 group-hover:text-white"
      )}>
        <BookOpen className="w-3.5 h-3.5" />
      </div>
      <div>
        <div className="font-bold text-xs leading-tight">{topic.title}</div>
        <div className={cn(
          "text-[10px] mt-0.5 opacity-70",
          selectedTopicId === topic.id ? "text-blue-400" : "text-blue-200"
        )}>
          Bab {topic.id.split('-c')[1]}
        </div>
      </div>
    </button>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-white rounded-2xl shadow-xl border border-slate-100 text-slate-600 active:scale-95"
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {(isOpen || true) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-72 bg-brand-sidebar border-r border-blue-200 flex flex-col transition-transform lg:translate-x-0 lg:static overflow-hidden",
              !isOpen && "translate-x-[-100%] lg:translate-x-0",
              className
            )}
          >
            {/* Header */}
            <div className="p-6 border-b border-blue-200 shrink-0">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => onTopicSelect(null)}
              >
                <div className="w-12 h-12 bg-white rounded-2xl overflow-hidden shadow-xl shadow-blue-200/50 group-hover:scale-105 transition-transform flex items-center justify-center border border-blue-100">
                  <img 
                    src="/logo.png" 
                    alt="IoTera Nexus" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="flex flex-col items-center justify-center bg-blue-50 w-full h-full">
                          <span class="text-blue-600 font-black text-sm leading-none">IO</span>
                          <span class="text-blue-400 font-bold text-[8px] uppercase tracking-tighter">Nexus</span>
                        </div>
                      `;
                    }}
                  />
                </div>
                <div>
                  <h1 className="font-black text-white tracking-tighter leading-none text-xl italic uppercase">Cikgu Kimia</h1>
                  <span className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em] leading-none mt-1 block">IoTera Nexus</span>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-grow overflow-y-auto p-4 space-y-8 scrollbar-hide">
              <button
                onClick={() => {
                   onTopicSelect(null);
                   setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-black transition-all border-2 uppercase tracking-tight",
                  !selectedTopicId 
                    ? "bg-white text-blue-600 border-white shadow-xl shadow-blue-200/50 scale-[1.02]" 
                    : "bg-blue-300/30 text-blue-900/80 border-blue-200 hover:bg-blue-300/50 hover:text-blue-950"
                )}
              >
                <Sparkles className={cn("w-5 h-5", !selectedTopicId ? "text-blue-500" : "text-blue-600")} />
                Dunia Kimia
              </button>

              <section>
                <button 
                  onClick={() => toggleForm(4)}
                  className="w-full px-4 mb-3 flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-cyan-300 rounded-full shadow-[0_0_8px_#22d3ee]" />
                    <h3 className="text-[10px] font-black text-blue-50 uppercase tracking-widest">Tingkatan 4</h3>
                  </div>
                  <ChevronDown className={cn("w-3 h-3 text-blue-100/50 transition-transform", expandedForm === 4 && "rotate-180")} />
                </button>
                <motion.div 
                  initial={false}
                  animate={{ height: expandedForm === 4 ? "auto" : 0 }}
                  className="space-y-1 overflow-hidden"
                >
                  {form4.map(t => <TopicItem key={t.id} topic={t} />)}
                </motion.div>
              </section>

              <section>
                <button 
                  onClick={() => toggleForm(5)}
                  className="w-full px-4 mb-3 flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />
                    <h3 className="text-[10px] font-black text-blue-50 uppercase tracking-widest">Tingkatan 5</h3>
                  </div>
                  <ChevronDown className={cn("w-3 h-3 text-blue-100/50 transition-transform", expandedForm === 5 && "rotate-180")} />
                </button>
                <motion.div 
                  initial={false}
                  animate={{ height: expandedForm === 5 ? "auto" : 0 }}
                  className="space-y-1 overflow-hidden"
                >
                  {form5.map(t => <TopicItem key={t.id} topic={t} />)}
                </motion.div>
              </section>

              <section>
                <button 
                  onClick={() => setIsLatihanExpanded(!isLatihanExpanded)}
                  className="w-full px-4 mb-3 flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                    <h3 className="text-[10px] font-black text-blue-50 uppercase tracking-widest">Zon Latihan</h3>
                  </div>
                  <ChevronDown className={cn("w-3 h-3 text-blue-100/50 transition-transform", isLatihanExpanded && "rotate-180")} />
                </button>
                <motion.div 
                  initial={false}
                  animate={{ height: isLatihanExpanded ? "auto" : 0 }}
                  className="space-y-1 overflow-hidden"
                >
                  {[
                    { id: "quiz-obj", title: "Kuiz Objektif (K1)", icon: <Target className="w-3.5 h-3.5" />, color: "text-rose-500" },
                    { id: "exam-struct", title: "Kertas 2 (Struktur)", icon: <ClipboardCheck className="w-3.5 h-3.5" />, color: "text-amber-500" },
                    { id: "exam-essay", title: "Kertas 2 (Esei)", icon: <GraduationCap className="w-3.5 h-3.5" />, color: "text-indigo-500" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        // Handle special modes
                        onTopicSelect({ id: item.id, title: item.title, description: `Mod: ${item.title}`, form: 4, subtopics: [] });
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-start gap-3 group",
                        selectedTopicId === item.id
                          ? "bg-white text-blue-600 shadow-xl"
                          : "hover:bg-blue-700/50 text-blue-100 hover:text-white"
                      )}
                    >
                      <div className={cn(
                        "mt-1 p-1.5 rounded-lg shrink-0 transition-colors",
                        selectedTopicId === item.id ? "bg-blue-50" : "bg-blue-800/40 group-hover:bg-blue-400 opacity-60 group-hover:opacity-100"
                      )}>
                        {item.icon}
                      </div>
                      <div>
                        <div className="font-bold text-xs leading-tight">{item.title}</div>
                        <div className={cn(
                          "text-[9px] mt-0.5 font-bold uppercase tracking-tighter",
                          selectedTopicId === item.id ? "text-blue-400" : "text-blue-200"
                        )}>Latihan AI</div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              </section>
            </div>

            {/* Footer Area */}
            <div className="p-4 border-t border-blue-500/30 shrink-0">
               <div className="p-4 bg-blue-700/50 rounded-2xl border border-blue-500/30 flex items-start gap-3">
                  <Brain className="w-4 h-4 text-cyan-300 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[10px] font-black text-white uppercase tracking-tight">AI Engine Aktif</div>
                    <p className="text-[10px] text-blue-100/70 leading-relaxed mt-1">Menganalisis bab & skema markah SPM secara real-time.</p>
                  </div>
               </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
