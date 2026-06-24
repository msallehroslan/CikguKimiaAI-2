import { TopicCard } from "./TopicCard";
import { SYLLABUS_TOPICS, Topic } from "../constants";
import { Sparkles, GraduationCap, Brain, TrendingUp, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useFirebase } from "../lib/FirebaseProvider";
import { memoryService, StudentMemory } from "../services/memoryService";

interface TopicExplorerProps {
  onTopicSelect: (topic: Topic) => void;
}

export function TopicExplorer({ onTopicSelect }: TopicExplorerProps) {
  const { user } = useFirebase();
  const [globalInsights, setGlobalInsights] = useState<any[]>([]);
  const [memory, setMemory] = useState<StudentMemory>({
    weakTopics: [],
    identifiedMistakes: [],
    examPapersAnalysis: []
  });

  const form4 = SYLLABUS_TOPICS.filter((t) => t.form === 4);
  const form5 = SYLLABUS_TOPICS.filter((t) => t.form === 5);

  useEffect(() => {
    if (user) {
      memoryService.getMemory(user.uid).then(setMemory).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, "global_insights"), orderBy("createdAt", "desc"), limit(3));
    const fetchInsights = async () => {
      try {
        const snapshot = await getDocs(q);
        const insights = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGlobalInsights(insights);
      } catch (error) {
        console.error("Neural Feed Fetch error:", error);
      }
    };
    fetchInsights();
    // Poll every 60 seconds instead of using unstable stream
    const interval = setInterval(fetchInsights, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
      <div className="mb-20 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/10 blur-[100px] rounded-full -z-10" />
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-brand-navy rounded-[2rem] text-white mb-10 shadow-2xl ring-8 ring-slate-50 relative group"
        >
          <div className="absolute inset-0 bg-blue-500 blur-xl opacity-0 group-hover:opacity-30 transition-opacity"></div>
          <GraduationCap className="w-10 h-10 relative z-10" />
        </motion.div>

        <h1 className="text-5xl sm:text-7xl font-black text-slate-900 mb-6 tracking-tighter uppercase italic leading-none">
          Cikgu AI <span className="text-blue-600">Nexus</span>
        </h1>
        
        <p className="text-slate-500 max-w-2xl mx-auto text-xl mb-10 font-medium leading-relaxed">
          The ultimate <span className="text-slate-900 font-black">SPM Chemistry</span> intelligence system. Master the syllabus with your personal neural tutor.
        </p>

        <div className="inline-flex flex-wrap justify-center gap-4">
          <div className="inline-flex items-center gap-1.5 px-6 py-3 bg-white border border-slate-200 rounded-full text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
            KSSM Syllabus v2.0
          </div>
          <div className="inline-flex items-center gap-1.5 px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 text-[10px] font-black uppercase tracking-[0.3em] shadow-sm">
            <Brain className="w-4 h-4 text-emerald-500" />
            Neural System Active
          </div>
        </div>
      </div>

      {/* Neural Feedback Section */}
      <section className="mb-24">
        <div className="flex items-center justify-between mb-10 px-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Neural Feed</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Insight kolektif daripada komuniti SPM</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {globalInsights.length > 0 ? globalInsights.map((insight, idx) => (
            <motion.div 
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl relative overflow-hidden group border-b-4 border-b-blue-500/20"
            >
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
                  <Zap className="w-12 h-12" />
               </div>
               <div className="flex items-center gap-2 mb-4">
                 <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded-md border border-blue-100 italic">Collective Intelligence</span>
               </div>
               <h3 className="font-black text-slate-800 text-sm mb-2 uppercase italic leading-tight">{insight.topic}</h3>
               <p className="text-xs text-slate-500 leading-relaxed font-medium">"{insight.insight}"</p>
            </motion.div>
          )) : (
            <div className="col-span-3 p-12 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
               <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Sistem dalam fasa pembelajaran...</p>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
        <section>
          <div className="flex items-center justify-between mb-10 px-4">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-emerald-500 rounded-full" />
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Tingkatan 4</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">The Foundation</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100 uppercase tracking-widest">{form4.length} Units</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {form4.map((topic) => (
              <TopicCard 
                key={topic.id} 
                topic={topic} 
                onClick={onTopicSelect} 
                isWeak={memory.weakTopics.some(wt => topic.title.toLowerCase().includes(wt.toLowerCase()) || wt.toLowerCase().includes(topic.title.toLowerCase()))}
              />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-10 px-4">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-blue-500 rounded-full" />
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Tingkatan 5</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Advanced Concepts</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg border border-blue-100 uppercase tracking-widest">{form5.length} Units</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {form5.map((topic) => (
              <TopicCard 
                key={topic.id} 
                topic={topic} 
                onClick={onTopicSelect} 
                isWeak={memory.weakTopics.some(wt => topic.title.toLowerCase().includes(wt.toLowerCase()) || wt.toLowerCase().includes(topic.title.toLowerCase()))}
              />
            ))}
          </div>
        </section>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-12 p-12 sm:p-20 rounded-[4rem] bg-brand-navy text-white flex flex-col lg:flex-row items-center justify-between gap-12 shadow-2xl overflow-hidden relative border border-white/5"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-purple/10 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2" />
        
        <div className="relative max-w-xl text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-4 mb-6 opacity-50">
             <div className="w-8 h-[2px] bg-white"></div>
             <span className="text-[10px] font-black uppercase tracking-[0.5em]">Direct Intelligence Access</span>
          </div>
          <h3 className="text-4xl sm:text-5xl font-black mb-6 tracking-tighter uppercase italic leading-none">Ada soalan am?</h3>
          <p className="text-slate-400 text-lg sm:text-xl font-medium leading-relaxed">
            Tak perlu pilih topik, terus sahaja bersembang atau hantar gambar nota kimia anda kepada Cikgu.
          </p>
        </div>
        
        <button
          onClick={() => {
            (onTopicSelect as any)(null);
          }}
          className="group relative flex items-center gap-4 px-12 py-6 bg-white text-brand-navy hover:bg-blue-50 focus:ring-4 focus:ring-blue-500/20 rounded-[2.5rem] font-black text-lg transition-all shadow-2xl active:scale-95 whitespace-nowrap overflow-hidden"
        >
          <div className="absolute inset-0 bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform" />
          <Sparkles className="w-6 h-6 text-blue-600 relative z-10" />
          <span className="relative z-10 uppercase italic">Mula Bersembang</span>
        </button>
      </motion.div>
    </div>
  );
}
