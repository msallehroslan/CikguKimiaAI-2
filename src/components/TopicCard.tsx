import { motion } from "motion/react";
import { BookOpen, ChevronRight, Sparkles, AlertCircle } from "lucide-react";
import { Topic } from "../constants";
import { cn } from "../lib/utils";

interface TopicCardProps {
  topic: Topic;
  onClick: (topic: Topic) => void;
  isWeak?: boolean;
}

export function TopicCard({ topic, onClick, isWeak }: TopicCardProps) {
  const chapterNumber = topic.id.replace(/^f\d-[cpb]/, "");

  return (
    <motion.button
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      onClick={() => onClick(topic)}
      className={cn(
        "card-shimmer flex flex-col items-start p-8 rounded-[2rem] bg-white border text-left hover:shadow-2xl hover:shadow-slate-200/60 group relative overflow-hidden",
        isWeak
          ? "border-rose-200 ring-2 ring-rose-500/5 hover:border-rose-300"
          : "border-slate-100 hover:border-blue-400/30"
      )}
    >
      {/* Subtle background glow on hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[2rem]",
        isWeak
          ? "bg-gradient-to-br from-rose-50/40 to-transparent"
          : "bg-gradient-to-br from-blue-50/50 to-transparent"
      )} />

      <div className="absolute top-0 right-0 p-4 opacity-[0.04] translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-[0.08] transition-all duration-300">
        <BookOpen className="w-24 h-24" />
      </div>

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className={cn(
          "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border transition-colors",
          topic.form === 4
            ? "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100"
            : "bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-100"
        )}>
          BAB {chapterNumber}
        </div>
        {isWeak && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-widest animate-pulse">
            <AlertCircle className="w-3 h-3" />
            Needs Focus
          </div>
        )}
      </div>

      <h3 className={cn(
        "text-xl font-black mb-3 tracking-tighter uppercase italic leading-none transition-colors relative z-10",
        isWeak ? "text-rose-600" : "text-slate-900 group-hover:text-blue-600"
      )}>
        {topic.title}
      </h3>

      <p className="text-sm text-slate-500 mb-8 flex-grow font-medium leading-relaxed opacity-80 relative z-10">
        {topic.description}
      </p>

      <div className="flex items-center justify-between w-full mt-auto relative z-10">
        <div className="flex items-center text-[10px] font-black text-blue-500 uppercase tracking-widest">
          Mula Belajar
          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1.5 transition-transform duration-200" />
        </div>
        <motion.div
          whileHover={{ rotate: 15, scale: 1.1 }}
          className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm group-hover:shadow-blue-200/60"
        >
          <Sparkles className="w-4 h-4" />
        </motion.div>
      </div>
    </motion.button>
  );
}
