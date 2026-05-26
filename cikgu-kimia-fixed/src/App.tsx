/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";

import { Chat } from "./components/Chat";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Onboarding, hasOnboarded } from "./components/Onboarding";
import { ConnectionStatus } from "./components/ConnectionStatus";

import { FirebaseProvider, useFirebase } from "./lib/FirebaseProvider";
import { Topic, SYLLABUS_TOPICS } from "./constants";
import { useRoute, navigate, matchTopic } from "./lib/router";

function AppContent() {
  const { user, loading, error, signIn } = useFirebase();
  const route = useRoute();
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [chatKey, setChatKey] = useState(0);
  const [showOnboard, setShowOnboard] = useState(false);

  // Sync URL → selectedTopic
  useEffect(() => {
    const topicId = matchTopic(route);
    if (!topicId) {
      setSelectedTopic(null);
      return;
    }
    const fromSyllabus = SYLLABUS_TOPICS.find(t => t.id === topicId);
    if (fromSyllabus) {
      setSelectedTopic(fromSyllabus);
      return;
    }
    // Latihan modes / specials
    const synthetic = {
      "quiz-obj":       { title: "Kuiz Objektif" },
      "periodic-table": { title: "Jadual Berkala" },
      "exam-struct":    { title: "Kertas 2 — Struktur" },
      "exam-essay":     { title: "Kertas 2 — Esei" },
    } as Record<string, { title: string }>;
    if (synthetic[topicId]) {
      setSelectedTopic({ id: topicId, title: synthetic[topicId].title, form: 4, description: "", subtopics: [] });
    }
  }, [route]);

  // Trigger onboarding on first login
  useEffect(() => {
    if (user && !hasOnboarded()) {
      setShowOnboard(true);
    }
  }, [user]);

  const handleTopicSelect = (topic: Topic | null) => {
    if (topic) {
      navigate(`/t/${topic.id}`);
    } else {
      navigate("/home");
    }
    setChatKey(k => k + 1);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-brand-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <SignInScreen error={error} onSignIn={signIn} />;
  }

  return (
    <div className="h-screen bg-stone-50 flex overflow-hidden font-sans">
      <Sidebar
        selectedTopicId={selectedTopic?.id}
        onTopicSelect={handleTopicSelect}
        onHome={() => handleTopicSelect(null)}
      />

      <main className="flex-grow flex flex-col relative h-screen overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedTopic ? (
            <motion.div
              key={`chat-${selectedTopic.id}-${chatKey}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex-grow h-full"
            >
              <Chat initialTopic={selectedTopic} />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex-grow h-full"
            >
              <Dashboard onPickTopic={handleTopicSelect} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ConnectionStatus />

      {showOnboard && <Onboarding onDone={() => setShowOnboard(false)} />}
    </div>
  );
}

/**
 * New sign-in screen — warm, Malay-first, brand logo, two paths in (Google or guest preview).
 */
function SignInScreen({ error, onSignIn }: { error: string | null; onSignIn: () => void }) {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col lg:flex-row font-sans">
      {/* Left: warm panel */}
      <div className="lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-brand-accent/30 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-brand-navy">
              <img src="/logo.png" alt="Cikgu Kimia" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-sm font-display">Cikgu Kimia</div>
              <div className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">by Iotera Technologies</div>
            </div>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-slate-900 leading-[0.95] tracking-tight mt-20">
            Belajar Kimia<br />SPM, <em className="text-brand-accent">dengan tenang</em>.
          </h1>
          <p className="text-slate-600 mt-6 text-lg leading-relaxed max-w-md">
            Tutor AI untuk silabus KSSM Tingkatan 4 & 5. Tanya soalan, hantar gambar, dan dapat tunjuk ajar berasaskan skema markah SPM rasmi.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-3 mt-12 max-w-md">
          <FeaturePill label="13 bab KSSM" />
          <FeaturePill label="Tanda jawapan" />
          <FeaturePill label="Jadual berkala" />
        </div>
      </div>

      {/* Right: action */}
      <div className="lg:w-1/2 bg-brand-navy flex items-center justify-center p-8 sm:p-12 lg:p-16 relative overflow-hidden text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-accent/20 rounded-full blur-3xl" />
          <div className="absolute top-1/4 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-sm w-full">
          <h2 className="font-display text-3xl sm:text-4xl leading-tight mb-3 italic">
            Mula belajar dalam 10 saat.
          </h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Daftar masuk untuk simpan progres, streak, dan analisis kelemahan anda.
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs leading-relaxed"
            >
              {error}
            </motion.div>
          )}

          <button
            onClick={onSignIn}
            className="w-full bg-white text-slate-900 hover:bg-slate-100 active:scale-[0.98] rounded-xl px-5 py-3.5 font-semibold text-sm flex items-center justify-center gap-3 transition shadow-lg"
          >
            <span className="w-5 h-5 rounded-full bg-gradient-conic shadow-sm" style={{
              background: "conic-gradient(from 45deg, #ea4335, #fbbc05, #34a853, #4285f4)"
            }} />
            Teruskan dengan Google
            <ArrowRight className="w-4 h-4 opacity-50" />
          </button>

          <div className="mt-6 text-[10px] font-mono text-slate-500 tracking-widest uppercase leading-relaxed">
            Tip: jika dalam Telegram, sila <span className="text-brand-accent underline underline-offset-4">Buka dalam Pelayar</span> jika gagal log masuk.
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturePill({ label }: { label: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-full px-3 py-2 text-xs text-slate-700 font-medium text-center">
      {label}
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
