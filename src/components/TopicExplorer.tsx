import { TopicCard } from "./TopicCard";
import { SYLLABUS_TOPICS, Topic } from "../constants";
import { Sparkles, GraduationCap } from "lucide-react";
import { motion } from "motion/react";

interface TopicExplorerProps {
  onTopicSelect: (topic: Topic) => void;
}

export function TopicExplorer({ onTopicSelect }: TopicExplorerProps) {
  const form4 = SYLLABUS_TOPICS.filter((t) => t.form === 4);
  const form5 = SYLLABUS_TOPICS.filter((t) => t.form === 5);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl text-white mb-6 shadow-xl"
        >
          <GraduationCap className="w-8 h-8" />
        </motion.div>
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
          Cikgu Kimia <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">SPM</span>
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto text-lg mb-6">
          Kuasai silibus Kimia dengan Tutor AI peribadi anda. Pilih topik atau mula bersembang terus.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 text-xs font-bold">
          <Sparkles className="w-3 h-3" />
          Selaras dengan Silibus KSSM SPM & Skema Pemarkahan
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <section>
          <div className="flex items-center gap-3 mb-6 px-4">
            <div className="h-1 shadow-sm w-8 bg-emerald-500 rounded-full" />
            <h2 className="text-xl font-bold text-slate-800">Tingkatan 4 KSSM</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {form4.map((topic) => (
              <TopicCard key={topic.id} topic={topic} onClick={onTopicSelect} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6 px-4">
            <div className="h-1 shadow-sm w-8 bg-blue-500 rounded-full" />
            <h2 className="text-xl font-bold text-slate-800">Tingkatan 5 KSSM</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {form5.map((topic) => (
              <TopicCard key={topic.id} topic={topic} onClick={onTopicSelect} />
            ))}
          </div>
        </section>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 p-8 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="relative">
          <h3 className="text-2xl font-bold mb-2">Ada soalan am?</h3>
          <p className="text-slate-400">Tak perlu pilih topik, terus sahaja bersembang dengan Cikgu.</p>
        </div>
        <button
          onClick={() => {
            console.log('Button clicked!');
            (onTopicSelect as any)(null);
          }}
          className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95 text-white whitespace-nowrap"
        >
          <Sparkles className="w-5 h-5" />
          Mula Bersembang
        </button>
      </motion.div>
    </div>
  );
}
