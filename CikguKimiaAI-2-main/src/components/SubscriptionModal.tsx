import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Sparkles, CreditCard, ShieldCheck, ArrowRight, Loader2, Coins } from "lucide-react";
import { useFirebase } from "../lib/FirebaseProvider";
import { memoryService, DAILY_CAP, DAILY_CAP_PREMIUM } from "../services/memoryService";

interface SubscriptionModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function SubscriptionModal({ onClose, onSuccess }: SubscriptionModalProps) {
  const { user } = useFirebase();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "fpx">("card");
  const [step, setStep] = useState<"pricing" | "checkout" | "success">("pricing");
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardName: "",
    bank: "maybank2u"
  });

  const handleSubscribeSimulated = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsProcessing(true);

    // Simulate payment gateway API processing network delay
    setTimeout(async () => {
      try {
        await memoryService.saveMemory(user.uid, {
          isSubscriber: true,
          subscriptionPlan: selectedPlan,
        });
        setIsProcessing(false);
        setStep("success");
        if (onSuccess) onSuccess();
      } catch (err) {
        console.error("Failed to upgrade subscription:", err);
        setIsProcessing(false);
        alert("Ralat pembayaran. Sila cuba lagi.");
      }
    }, 2000);
  };

  const planPrice = selectedPlan === "monthly" ? "RM10" : "RM79";
  const planPeriod = selectedPlan === "monthly" ? "bulan" : "tahun";
  const planSavings = selectedPlan === "yearly" ? "Jimat 35%" : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 50, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 50, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 flex flex-col md:flex-row relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition z-10 hover:scale-105 active:scale-95"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Side Banner Image / Info panel */}
        <div className="w-full md:w-5/12 bg-slate-900 p-8 text-white flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-accent/20 border border-brand-accent/20 rounded-full text-brand-accent text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Cikgu Pro 👑
            </div>
            <h3 className="font-display text-2xl font-bold tracking-tight mb-4">
              Kuasai Kimia Tanpa Batasan!
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed mb-6">
              Sertai ribuan pelajar SPM yang mendapat keputusan cemerlang menggunakan simulasi interaktif, tutor 24/7 dan kefahaman jitu berasaskan sukatan KSSM Lembaga Peperiksaan.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-semibold">Sesi Selamat</h4>
                <p className="text-[10px] text-slate-400">Trial disimpan di server Cloud Firestore, tidak boleh cheating semula.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
              <Coins className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-semibold">T trial & Sesuai</h4>
                <p className="text-[10px] text-slate-400">Jaminan 100% wang dikembalikan jika tidak berpuas hati dalam masa 7 hari.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Billing Form Content */}
        <div className="w-full md:w-7/12 p-8 bg-slate-50 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === "pricing" && (
              <motion.div
                key="pricing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="font-display text-xl text-slate-900 font-bold mb-1">
                    Pilih Pakej Hebat Anda
                  </h3>
                  <p className="text-xs text-slate-600">
                    Buka sokongan SPM penuh, soalan KBAT tanpa had dan bimbingan visual Cikgu.
                  </p>
                </div>

                {/* Plan Toggle */}
                <div className="bg-slate-200/60 p-1.5 rounded-2xl flex gap-1 border border-slate-200">
                  <button
                    onClick={() => setSelectedPlan("monthly")}
                    className={`flex-1 py-2 text-center text-xs font-semibold rounded-xl transition ${
                      selectedPlan === "monthly" ? "bg-white text-slate-900 shadow-md" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Bulanan
                  </button>
                  <button
                    onClick={() => setSelectedPlan("yearly")}
                    className={`flex-1 py-2 text-center text-xs font-semibold rounded-xl transition flex justify-center items-center gap-1.5 ${
                      selectedPlan === "yearly" ? "bg-white text-slate-900 shadow-md" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tahunan {planSavings && <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[9px] scale-[0.9] font-bold">{planSavings}</span>}
                  </button>
                </div>

                {/* Comparison Lists */}
                <div className="space-y-3 bg-white p-4 rounded-3xl border border-slate-200/80">
                  <div className="flex items-start gap-2.5 text-xs">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800">{DAILY_CAP_PREMIUM} mesej & soalan sehari</span> (Berbanding hanya {DAILY_CAP} untuk Pelajar Percuma)
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800">Mod Peperiksaan & Amali Premium</span> (Hasilkan Kertas 2 tersuai sepenuhnya)
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800">Prioriti GPU & Lebih Pantas</span> (Tiada heroisme sibuk/gangguan ketika SPM dekat)
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-5 flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold text-slate-900">{planPrice}</span>
                    <span className="text-slate-500 text-xs font-semibold"> / {planPeriod}</span>
                  </div>
                  <button
                    onClick={() => setStep("checkout")}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-lg shadow-slate-950/10 flex items-center gap-2 group transition active:scale-[0.98]"
                  >
                    Dapatkan Pro Sekarang
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === "checkout" && (
              <motion.div
                key="checkout"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="font-display text-xl text-slate-900 font-bold mb-1">
                    Isi Pembayaran Sempurna
                  </h3>
                  <p className="text-xs text-slate-600">
                    Sistem demo gateway selamat. Tiada wang sebenar akan dipotong.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    aria-label="Bayar guna kad kredit"
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex-1 py-2.5 border rounded-xl flex items-center justify-center gap-2 font-display text-xs font-semibold transition ${
                      paymentMethod === "card"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> Kad Kredit/Debit
                  </button>
                  <button
                    aria-label="Bayar guna perbankan FPX"
                    type="button"
                    onClick={() => setPaymentMethod("fpx")}
                    className={`flex-1 py-2.5 border rounded-xl flex items-center justify-center gap-2 font-display text-xs font-semibold transition ${
                      paymentMethod === "fpx"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    🏦 FPX (Perbankan Internet)
                  </button>
                </div>

                <form onSubmit={handleSubscribeSimulated} className="space-y-4">
                  {paymentMethod === "card" ? (
                    <>
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nama Atas Kad</label>
                        <input
                          type="text"
                          required
                          placeholder="AHMAD BIN SULAIMAN"
                          value={formData.cardName}
                          onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1.5">No Kad Kredit</label>
                        <input
                          type="text"
                          required
                          pattern="\d{4}\s?\d{4}\s?\d{4}\s?\d{4}"
                          placeholder="4111 2222 3333 4444"
                          value={formData.cardNumber}
                          onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-800"
                        />
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1.5">Luput MM/YY</label>
                          <input
                            type="text"
                            required
                            placeholder="12/28"
                            pattern="\d{2}/\d{2}"
                            value={formData.expiry}
                            onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-800"
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1.5">CVV</label>
                          <input
                            type="password"
                            required
                            maxLength={3}
                            placeholder="123"
                            pattern="\d{3}"
                            value={formData.cvv}
                            onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-800"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1.5">Pilih Bank</label>
                      <select
                        value={formData.bank}
                        onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-800 font-semibold text-slate-800"
                      >
                        <option value="maybank2u">Maybank2u</option>
                        <option value="cimb_clicks">CIMB Clicks</option>
                        <option value="bank_islam">Bank Islam</option>
                        <option value="public_bank">Public Bank</option>
                        <option value="rhb_now">RHB Now</option>
                      </select>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep("pricing")}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 transition"
                    >
                      Kembali ke Harga
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs disabled:opacity-75 flex items-center gap-2 shadow-lg transition active:scale-[0.98]"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Memproses…
                        </>
                      ) : (
                        `Bayar ${planPrice}`
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl mx-auto border border-emerald-200">
                  🎉
                </div>
                <div>
                  <h3 className="font-display text-2xl text-slate-900 font-bold mb-2">
                    Pembayaran Berjaya!
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                    Terima kasih! Langganan <b>Pro Premium</b> anda kini diaktifkan. Anda kini mendapat kuota harian sebanyak <b>{DAILY_CAP_PREMIUM} mesej/hari</b> yang di-update di server Firestore kami.
                  </p>
                </div>

                <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-4 max-w-sm mx-auto text-left">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-800">Akaun Terselamat</h4>
                      <p className="text-[10px] text-emerald-600/90 leading-normal">
                        Langganan anda terikat kepada e-mel <b>{user?.email}</b> secara kekal. Tukar pelayar, logout atau restart peranti pun tetap Pro!
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition active:scale-[0.98]"
                >
                  Mula Belajar Dengan Cikgu Pro
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
