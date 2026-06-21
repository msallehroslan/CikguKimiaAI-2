/**
 * examAnswersKb.ts
 * 
 * Skema jawapan SPM past year — digunakan sebagai context untuk Gemini
 * supaya jawapan AI tepat ikut skema pemarkahan rasmi.
 * 
 * Cara tambah: extract skema dari PDF, tambah entry baru dalam EXAM_ANSWERS_KB.
 */

export interface ExamAnswerEntry {
  topicId: string;
  source: string;       // e.g. "Penang 2022 Set 2 Q8"
  question: string;     // ringkasan soalan
  keyAnswers: string[]; // poin jawapan exact dari skema (1 poin = 1 markah)
  commonErrors?: string[]; // kesilapan biasa pelajar berdasarkan skema
}

export const EXAM_ANSWERS_KB: ExamAnswerEntry[] = [

  // ── PENANG 2022 SET 2 ──────────────────────────────────────────────────────

  // Q1 — Jadual Berkala (f4-c4)
  {
    topicId: "f4-c4",
    source: "Penang 2022 Set 2 Q1",
    question: "Jadual Berkala Kala 3 — susunan elektron Si, kumpulan, saiz atom, gas nadir",
    keyAnswers: [
      "Susunan elektron silikon Si: 2.8.4",
      "Silikon berada dalam Kumpulan 14 (Kumpulan IV) dalam Jadual Berkala",
      "Saiz atom berkurang apabila merentasi Kala 3 dari kiri ke kanan",
      "Atom argon mencapai susunan elektron oktet yang stabil — mempunyai 8 elektron pada petala terluar",
      "Argon tidak menerima, menderma atau berkongsi elektron"
    ],
    commonErrors: [
      "Menulis susunan elektron Si sebagai 2.8.8.4 — silap, Si hanya 14 proton",
      "Kata saiz atom bertambah merentasi kala — silap, ia berkurang"
    ]
  },

  // Q2 — Bahan Buatan (f4-c8)
  {
    topicId: "f4-c8",
    source: "Penang 2022 Set 2 Q2",
    question: "Bahan komposit, konkrit diperkukuhkan, seramik",
    keyAnswers: [
      "P ialah bahan komposit (composite materials)",
      "Konkrit diperkukuhkan digunakan untuk membuat rangka bangunan dan jambatan",
      "Konkrit diperkukuhkan dapat menahan tekanan yang tinggi / menyokong muatan berat / lebih kuat / kekuatan daya tegangan yang lebih tinggi daripada konkrit biasa",
      "Silikon karbida tergolong dalam seramik termaju (advanced ceramic)",
      "Silikon karbida digunakan untuk membuat cakra pemotong"
    ]
  },

  // Q3 — Polimer (f5-c4)
  {
    topicId: "f5-c4",
    source: "Penang 2022 Set 2 Q3",
    question: "Polimer Z (polipropilena) — definisi, unit asas, pempolimeran, kitar semula",
    keyAnswers: [
      "Polimer ialah molekul berantai panjang yang terdiri daripada gabungan unit asas/monomer yang berulang",
      "Unit asas polimer Z ialah propena (CH2=CHCH3) — formula struktur: H2C=C(CH3)-H",
      "Jenis pempolimeran: pempolimeran penambahan (addition polymerisation)",
      "Polimer Z ialah termoplastik (thermoplastic)",
      "Termoplastik boleh diacu semula apabila dipanaskan"
    ],
    commonErrors: [
      "Menulis pempolimeran kondensasi untuk polipropilena — silap, ia pempolimeran penambahan",
      "Terkeliru antara termoplastik dengan termoset"
    ]
  },

  // Q4 — Kimia Konsumer / Nanoteknologi (f5-c5)
  {
    topicId: "f5-c5",
    source: "Penang 2022 Set 2 Q4",
    question: "Nanoteknologi, kosmetik, stokin nano, bahan tambah makanan",
    keyAnswers: [
      "Nanoteknologi ialah pembangunan bahan atau peranti dengan memanfaatkan ciri-ciri zarah nano",
      "Kelebihan kosmetik nano: sapuan pada kulit lebih sekata / menembusi lapisan kulit dengan lebih mudah / memberi kesan yang lebih memuaskan",
      "Stoking B (nano) lebih sesuai untuk atlet — tidak mengeluarkan bau busuk / kalis air / tidak menjadi lembap",
      "Pemanis alternatif untuk pesakit kencing manis: aspartam / sorbitol / stevia / madu / maple syrup",
      "Natrium nitrat ialah pengawet (preservative)",
      "Natrium nitrat menghalang makanan daripada rosak dengan memperlahankan pertumbuhan mikroorganisma"
    ]
  },

  // Q5 — Konsep Mol (f4-c3)
  {
    topicId: "f4-c3",
    source: "Penang 2022 Set 2 Q5",
    question: "Formula empirik sebatian X (C, H, O), persamaan seimbang karat besi, jisim formula relatif",
    keyAnswers: [
      "Unsur ialah suatu bahan yang terdiri daripada satu jenis atom sahaja",
      "Formula empirik sebatian X (48.65%C, 8.11%H, 43.24%O): C3H6O2",
      "Persamaan seimbang karat: 4Fe + 3O2 + 2H2O → 2Fe2O3.H2O (x=4, y=3, z=2)",
      "Bilangan mol ferum untuk menghasilkan 1 mol Fe2O3.H2O ialah 4 mol",
      "Jisim formula relatif Fe2O3.H2O = 2(56) + 3(16) + 2(1) + 16 = 178"
    ],
    commonErrors: [
      "Silap kira nisbah mol atom semasa cari formula empirik — perlu bahagi dengan nilai terkecil",
      "Lupa balanskan persamaan karat dengan betul"
    ]
  },

  // Q6 — Ikatan Kimia (f4-c5)
  {
    topicId: "f4-c5",
    source: "Penang 2022 Set 2 Q6",
    question: "Ikatan ion (Q dan S), formula kimia, takat lebur, struktur Lewis CH4, ikatan datif NH4+",
    keyAnswers: [
      "Pasangan atom yang membentuk sebatian melalui pemindahan elektron: Q dan S (atau R dan S)",
      "Formula kimia sebatian QS atau RS2",
      "Sebatian ion mempunyai takat lebur tinggi — daya tarikan elektrostatik yang kuat antara ion",
      "Lebih banyak tenaga haba diperlukan untuk mengatasi daya tarikan antara ion",
      "Ikatan datif dalam NH4+: pasangan elektron bebas pada atom nitrogen dalam molekul ammonia akan dikongsikan dengan ion hidrogen H+"
    ],
    commonErrors: [
      "Kata ikatan datif sama dengan ikatan kovalen biasa — silap, dalam ikatan datif SATU atom sahaja yang menderma kedua-dua elektron",
      "Lupa nyatakan daya tarikan elektrostatik bila terangkan takat lebur tinggi sebatian ion"
    ]
  },

  // Q7 — Sebatian Karbon (f5-c2)
  {
    topicId: "f5-c2",
    source: "Penang 2022 Set 2 Q7",
    question: "Alkohol C4H9OH (butanol) — isomer, pengoksidaan, kumpulan berfungsi, esterifikasi",
    keyAnswers: [
      "Nama alkohol C4H9OH ialah butanol",
      "Empat isomer butanol: butan-1-ol, butan-2-ol, 2-metilpropan-1-ol, 2-metilpropan-2-ol",
      "Pemerhatian tindak balas I (pengoksidaan dengan KMnO4 berasid): warna ungu menjadi tidak berwarna",
      "Kumpulan berfungsi sebatian Q (asid karboksilik): kumpulan karboksil (-COOH)",
      "Ujian gas hidrogen (hasil tindak balas Q + Mg): letakkan kayu uji menyala — bunyi 'pop' terhasil",
      "Nama tindak balas II: pengesteran (esterification)",
      "Persamaan seimbang esterifikasi: C4H9OH + C3H7COOH → C3H7COOC4H9 + H2O"
    ],
    commonErrors: [
      "Kata pemerhatian pengoksidaan KMnO4 ialah 'warna hilang' tanpa nyatakan warna asal ungu",
      "Tulis persamaan esterifikasi tanpa H2O sebagai hasil"
    ]
  },

  // Q8 — Termokimia (f5-c3)
  {
    topicId: "f5-c3",
    source: "Penang 2022 Set 2 Q8",
    question: "Haba peneutralan HNO3 + NaOH — pengiraan, persamaan termokimia, aras tenaga",
    keyAnswers: [
      "Haba peneutralan ialah haba yang dibebaskan apabila 1 mol air terbentuk daripada tindak balas antara asid nitrik dan larutan natrium hidroksida",
      "Bilangan mol NaOH = 50/1000 × 0.5 = 0.025 mol",
      "Haba dibebaskan Q = mcΔT = 100 × 4.2 × 3 = 1260 J",
      "Haba peneutralan ΔH = -1260/0.025/1000 = -50.4 kJ mol⁻¹",
      "Persamaan termokimia: NaOH + HNO3 → NaNO3 + H2O  ΔH = -50.4 kJ mol⁻¹",
      "Tindak balas ini adalah eksotermik — tenaga bahan tindak balas lebih tinggi daripada hasil"
    ],
    commonErrors: [
      "Lupa tanda negatif pada ΔH untuk tindak balas eksotermik",
      "Guna jisim NaOH sahaja bukan jumlah jisim larutan (50+50=100g) dalam Q=mcΔT",
      "Lupa nyatakan unit kJ mol⁻¹"
    ]
  },

  // Q9 — Redoks + Sel Elektrokimia (f5-c1a + f5-c1b)
  {
    topicId: "f5-c1a",
    source: "Penang 2022 Set 2 Q9",
    question: "Respirasi selular redoks, sel elektrokimia logam X vs Cu, nilai E°",
    keyAnswers: [
      "Tindak balas yang berlaku dalam respirasi selular: tindak balas redoks",
      "Fungsi gas oksigen: agen pengoksidaan — mengoksidakan glukosa kepada karbon dioksida",
      "Pengiraan jisim glukosa untuk 1000cm³ CO2: n(CO2)=1000/24000=0.042mol; n(glukosa)=0.042/6=0.007mol; jisim=0.007×180=1.26g",
      "Logam X ialah plumbum (Pb) — E° = -0.13V",
      "Voltan sel = E°(Cu) - E°(Pb) = +0.34 - (-0.13) = +0.47V",
      "Setengah persamaan pengoksidaan: Pb → Pb²⁺ + 2e⁻",
      "Setengah persamaan penurunan: Cu²⁺ + 2e⁻ → Cu",
      "Persamaan ion keseluruhan: Pb + Cu²⁺ → Pb²⁺ + Cu",
      "Tertib menaik kekuatan agen pengoksidaan: Zn²⁺, Sn²⁺, Pb²⁺, Cu²⁺",
      "Tertib menaik kekuatan agen penurunan: Cu, Pb, Sn, Zn"
    ],
    commonErrors: [
      "Silap kira voltan sel — perlu E°(katod) tolak E°(anod), bukan sebaliknya",
      "Terkeliru agen pengoksidaan dengan agen penurunan dalam siri kereaktifan",
      "Lupa tanda cas pada ion dalam setengah persamaan"
    ]
  },

  // Q10 — Asid Bes Garam (f4-c6)
  {
    topicId: "f4-c6",
    source: "Penang 2022 Set 2 Q10",
    question: "pH ammonia vs NaOH, titratan H2SO4 + NaOH, pengiraan kemolaran, asid untuk sengatan obor-obor",
    keyAnswers: [
      "Ammonia adalah alkali lemah — mengion separa dalam air menghasilkan kepekatan ion OH⁻ yang rendah",
      "Natrium hidroksida adalah alkali kuat — mengion lengkap dalam air",
      "Kepekatan ion OH⁻ dalam NaOH lebih tinggi → nilai pH lebih tinggi",
      "Persamaan: 2NaOH + H2SO4 → Na2SO4 + 2H2O",
      "Isipadu purata H2SO4 = (9.90 + 10.00 + 10.10)/3 = 10.00 cm³",
      "Kemolaran NaOH = 0.02 × 1000/25 = 0.8 mol dm⁻³",
      "Bahan untuk sengatan obor-obor: cuka / limau / sebarang asid lemah yang sesuai",
      "Asid meneutralkan sengatan obor-obor yang beralkali",
      "Asid X ialah asid sulfurik; Garam Y ialah magnesium sulfat (MgSO4)",
      "Isipadu gas H2 = 0.1 × 24 = 2.4 dm³"
    ],
    commonErrors: [
      "Tersalah kata ammonia alkali kuat — ia alkali LEMAH",
      "Lupa guna isipadu PURATA (bukan mana-mana satu bacaan) dalam titratan",
      "Silap nisbah mol dalam pengiraan kemolaran"
    ]
  },

  // Q11 — Kadar Tindak Balas (f4-c7)
  {
    topicId: "f4-c7",
    source: "Penang 2022 Set 2 Q11",
    question: "Kadar tindak balas Zn + HNO3, kesan kepekatan, graf gas vs masa, eksperimen CaCO3 + HCl",
    keyAnswers: [
      "Persamaan kimia: Zn + 2HNO3 → Zn(NO3)2 + H2",
      "Bilangan mol HNO3 = 0.2 × 50/1000 = 0.01 mol",
      "0.01 mol HNO3 menghasilkan 0.005 mol H2",
      "Isipadu H2 = 0.005 × 24 = 0.12 dm³",
      "Kadar tindak balas Set I lebih tinggi daripada Set II kerana kepekatan asid nitrik Set I lebih tinggi",
      "Kepekatan lebih tinggi → bilangan ion H⁺ per unit isipadu lebih banyak → frekuensi perlanggaran berkesan lebih tinggi",
      "Eksperimen CaCO3 + HCl: guna buret terterbalik dalam besen air untuk kumpul gas CO2",
      "Persamaan ion: CaCO3 + 2H⁺ → Ca²⁺ + CO2 + H2O"
    ],
    commonErrors: [
      "Kata 'frekuensi perlanggaran' sahaja tanpa 'berkesan' — skema SPM MESTI ada perkataan 'berkesan'",
      "Silap setup eksperimen — gas CO2 dikumpul dengan kaedah sesaran air, bukan ke udara"
    ]
  },
];

/**
 * Get exam answers for a specific topic
 */
export function getExamAnswersForTopic(topicId: string): ExamAnswerEntry[] {
  return EXAM_ANSWERS_KB.filter(e => e.topicId === topicId);
}

/**
 * Format for injection into Gemini system prompt
 */
export function formatAnswersForPrompt(topicId?: string): string {
  const entries = topicId
    ? getExamAnswersForTopic(topicId)
    : EXAM_ANSWERS_KB;

  if (entries.length === 0) return "";

  return entries.map(e =>
    `[${e.source}] ${e.question}\n` +
    `Jawapan skema:\n${e.keyAnswers.map(a => `• ${a}`).join("\n")}` +
    (e.commonErrors?.length
      ? `\nKesilapan lazim:\n${e.commonErrors.map(a => `⚠ ${a}`).join("\n")}`
      : "")
  ).join("\n\n");
}
