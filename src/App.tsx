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
import { SubscriptionModal } from "./components/SubscriptionModal";

import { FirebaseProvider, useFirebase } from "./lib/FirebaseProvider";
import { Topic, ALL_TOPICS, SUBJECTS } from "./constants";
import { useRoute, navigate, matchTopic } from "./lib/router";

function AppContent() {
  const { user, loading, error, signIn } = useFirebase();
  const route = useRoute();
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    return localStorage.getItem("selected_subject_id") || "chemistry";
  });
  const [chatKey, setChatKey] = useState(0);
  const [showOnboard, setShowOnboard] = useState(false);

  // Sync URL → selectedTopic
  useEffect(() => {
    const topicId = matchTopic(route);
    if (!topicId) {
      setSelectedTopic(null);
      return;
    }
    const fromSyllabus = ALL_TOPICS.find(t => t.id === topicId);
    if (fromSyllabus) {
      setSelectedTopic(fromSyllabus);
      // Auto-detect and switch subject
      const matchedSubject = SUBJECTS.find(s => s.topics.some(t => t.id === topicId));
      if (matchedSubject && matchedSubject.id !== selectedSubjectId) {
        setSelectedSubjectId(matchedSubject.id);
        localStorage.setItem("selected_subject_id", matchedSubject.id);
      }
      return;
    }
    // Latihan modes / specials
    const normalizedId = topicId.replace(/^(chemistry|physics|biology)-/, "");
    const synthetic = {
      "quiz-obj":       { title: "Kuiz Objektif" },
      "periodic-table": { title: "Jadual Berkala" },
      "exam-struct":    { title: "Kertas 2 — Struktur" },
      "exam-essay":     { title: "Kertas 2 — Esei" },
    } as Record<string, { title: string }>;

    if (synthetic[normalizedId]) {
      const parentSubjectId = topicId.split("-")[0] || selectedSubjectId;
      const subName = SUBJECTS.find(s => s.id === parentSubjectId)?.codename || "Silibus";
      setSelectedTopic({
        id: topicId,
        title: `${synthetic[normalizedId].title} (${subName})`,
        form: 4,
        description: "",
        subtopics: []
      });
      if (parentSubjectId !== selectedSubjectId) {
        setSelectedSubjectId(parentSubjectId);
        localStorage.setItem("selected_subject_id", parentSubjectId);
      }
    }
  }, [route, selectedSubjectId]);

  // Trigger onboarding on first login
  useEffect(() => {
    if (user && !hasOnboarded()) {
      setShowOnboard(true);
    }
  }, [user]);

  const handleSubjectSelect = (subjId: string) => {
    setSelectedSubjectId(subjId);
    localStorage.setItem("selected_subject_id", subjId);
  };

  const handleTopicSelect = (topic: Topic | null) => {
    if (topic) {
      navigate(`/t/${topic.id}`);
    } else {
      navigate("/home");
    }
    setChatKey(k => k + 1);
  };

  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState(false);
  const [paymentFailedMsg, setPaymentFailedMsg] = useState(false);
  const { refreshSubscription } = useFirebase();

  // Listen for payment callback query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    if (paymentStatus === "success") {
      refreshSubscription();
      setPaymentSuccessMsg(true);
      window.history.replaceState(null, "", window.location.pathname);
    } else if (paymentStatus === "failed") {
      setPaymentFailedMsg(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [refreshSubscription]);

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
        onUpgradeClick={() => setIsSubscriptionOpen(true)}
        selectedSubjectId={selectedSubjectId}
        onSubjectSelect={handleSubjectSelect}
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
              <Chat initialTopic={selectedTopic} onUpgradeClick={() => setIsSubscriptionOpen(true)} selectedSubjectId={selectedSubjectId} />
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
              <Dashboard
                onPickTopic={handleTopicSelect}
                onUpgradeClick={() => setIsSubscriptionOpen(true)}
                selectedSubjectId={selectedSubjectId}
                onSubjectSelect={handleSubjectSelect}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ConnectionStatus />

      {showOnboard && <Onboarding onDone={() => setShowOnboard(false)} />}

      <AnimatePresence>
        {isSubscriptionOpen && (
          <SubscriptionModal
            onClose={() => setIsSubscriptionOpen(false)}
            onSuccess={() => {
              refreshSubscription();
            }}
          />
        )}
      </AnimatePresence>

      {/* Payment Success Overlay */}
      <AnimatePresence>
        {paymentSuccessMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl mx-auto mb-4 border border-emerald-200">
                🎉
              </div>
              <h3 className="font-display text-xl text-slate-900 font-bold mb-2">
                Langganan Berjaya!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Terima kasih! Langganan <b>Cikgu AI Pro Premium</b> anda telah diaktifkan secara automatik. Jom sambung belajar tanpa had!
              </p>
              <button
                onClick={() => setPaymentSuccessMsg(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition active:scale-[0.98]"
              >
                Mula Belajar Sekarang
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Failed Overlay */}
      <AnimatePresence>
        {paymentFailedMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100"
            >
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-3xl mx-auto mb-4 border border-rose-200">
                ❌
              </div>
              <h3 className="font-display text-xl text-slate-900 font-bold mb-2">
                Pembayaran Gagal
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Pintu pembayaran melaporkan ralat atau transaksi dibatalkan. Tiada caj telah dibuat ke akaun anda.
              </p>
              <button
                onClick={() => setPaymentFailedMsg(false)}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition active:scale-[0.98]"
              >
                Cuba Lagi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
              <img src="/logo.png" alt="Cikgu AI" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-sm font-display">Iotera Tutor AI</div>
              <div className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">by Iotera Technologies</div>
            </div>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-slate-900 leading-[0.95] tracking-tight mt-20">
            Bimbingan AI<br />SPM, <em className="text-brand-accent">dengan tenang</em>.
          </h1>
          <p className="text-slate-600 mt-6 text-lg leading-relaxed max-w-md">
            Tutor AI pintar untuk subjek Kimia, Fizik, dan Biologi KSSM Tingkatan 4 & 5. Tanya soalan, hantar gambar, dan kuasai skema markah SPM rasmi.
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
