/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { TopicExplorer } from "./components/TopicExplorer";
import { Chat } from "./components/Chat";
import { Sidebar } from "./components/Sidebar";
import { Topic } from "./constants";
import { motion, AnimatePresence } from "motion/react";
import { FirebaseProvider, useFirebase } from "./lib/FirebaseProvider";
import { GraduationCap, LogIn, Sparkles } from "lucide-react";
import { ConnectionStatus } from "./components/ConnectionStatus";

function AppContent() {
  const { user, loading, signIn } = useFirebase();
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [chatKey, setChatKey] = useState(0);

  const handleTopicSelect = (topic: Topic | null) => {
    setSelectedTopic(topic);
    setChatKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-emerald-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md bg-white p-8 rounded-3xl shadow-xl border border-emerald-100"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Cikgu Kimia SPM</h1>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Personalized KSSM Chemistry tutor powered by AI. 
            Connect your progress to the cloud.
          </p>
          <button
            onClick={signIn}
            className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-200"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
          <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>KSSM Syllabus Grounded</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden font-sans">
      <Sidebar 
        selectedTopicId={selectedTopic?.id} 
        onTopicSelect={handleTopicSelect} 
      />

      <main className="flex-grow flex flex-col relative h-screen overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={chatKey}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex-grow h-full"
          >
            <Chat 
              key={chatKey} 
              initialTopic={selectedTopic} 
            />
          </motion.div>
        </AnimatePresence>
      </main>
      <ConnectionStatus />
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
