import { motion } from "motion/react";
import { BookOpen, ChevronRight } from "lucide-react";
import { Topic } from "../constants";
import { cn } from "../lib/utils";

interface TopicCardProps {
  topic: Topic;
  onClick: (topic: Topic) => void;
}

export function TopicCard({ topic, onClick }: TopicCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(topic)}
      className={cn(
        "flex flex-col items-start p-6 rounded-2xl bg-white border border-slate-200 text-left transition-all hover:shadow-lg hover:border-blue-300",
        topic.form === 4 ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-blue-500"
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={cn(
          "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
          topic.form === 4 ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
        )}>
          Tingkatan {topic.form}
        </div>
        <BookOpen className="w-4 h-4 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2 leading-tight">
        {topic.title}
      </h3>
      <p className="text-sm text-slate-500 mb-4 flex-grow">
        {topic.description}
      </p>
      <div className="flex items-center text-blue-600 text-sm font-medium mt-auto">
        Tanya Cikgu
        <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </motion.button>
  );
}
