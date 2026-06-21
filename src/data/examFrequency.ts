/**
 * examFrequency.ts
 * 
 * Data kekerapan soalan SPM past year ikut topicId.
 * Setiap entry dalam `papers` adalah satu kertas exam yang dianalisis.
 * 
 * Cara tambah kertas baru:
 * 1. Tambah entry dalam `EXAM_PAPERS` array
 * 2. Setiap soalan ada: topicId, subtopic, marks, bahagian, concepts[]
 * 3. Jalankan /api/admin/rebuild-exam-frequency untuk update Firestore
 */

export interface ExamQuestion {
  soalan: number;
  topicId: string;
  subtopic: string;
  marks: number;
  bahagian: "A" | "B" | "C";
  concepts: string[];
}

export interface ExamPaper {
  source: string;
  year: number;
  paper: string;
  state: string;
  questions: ExamQuestion[];
}

export const EXAM_PAPERS: ExamPaper[] = [
  {
    source: "Penang 2022 Set 2",
    year: 2022,
    paper: "2",
    state: "Pulau Pinang",
    questions: [
      {
        soalan: 1, topicId: "f4-c4", bahagian: "A", marks: 5,
        subtopic: "Jadual Berkala - Kala 3, susunan elektron, kumpulan, saiz atom",
        concepts: ["susunan elektron", "kumpulan dalam jadual berkala", "saiz atom merentasi kala", "gas nadir tidak reaktif"]
      },
      {
        soalan: 2, topicId: "f4-c8", bahagian: "A", marks: 5,
        subtopic: "Bahan Buatan - seramik, konkrit diperkukuhkan",
        concepts: ["seramik", "konkrit diperkukuhkan", "nanoteknologi bahan"]
      },
      {
        soalan: 3, topicId: "f5-c4", bahagian: "A", marks: 6,
        subtopic: "Polimer - polimer sintetik, unit asas, pempolimeran, kitar semula",
        concepts: ["polimer sintetik", "unit asas monomer", "pempolimeran penambahan", "termoplastik", "kitar semula"]
      },
      {
        soalan: 4, topicId: "f5-c5", bahagian: "A", marks: 7,
        subtopic: "Kimia Konsumer - nanoteknologi, bahan tambah makanan",
        concepts: ["nanoteknologi", "kosmetik nano", "bahan tambah makanan", "pengawet makanan"]
      },
      {
        soalan: 5, topicId: "f4-c3", bahagian: "A", marks: 8,
        subtopic: "Konsep Mol - formula empirik, persamaan seimbang, jisim formula relatif",
        concepts: ["formula empirik", "persamaan kimia seimbang", "jisim formula relatif", "bilangan mol"]
      },
      {
        soalan: 6, topicId: "f4-c5", bahagian: "A", marks: 9,
        subtopic: "Ikatan Kimia - ikatan ion, kovalen, struktur Lewis, ikatan datif",
        concepts: ["ikatan ion", "pemindahan elektron", "takat lebur tinggi", "struktur Lewis", "ikatan datif NH4+"]
      },
      {
        soalan: 7, topicId: "f5-c2", bahagian: "A", marks: 10,
        subtopic: "Sebatian Karbon - alkohol, isomer, pengoksidaan, esterifikasi",
        concepts: ["alkohol C4H9OH", "isomer alkohol", "pengoksidaan alkohol", "asid karboksilik", "esterifikasi"]
      },
      {
        soalan: 8, topicId: "f5-c3", bahagian: "A", marks: 10,
        subtopic: "Termokimia - haba peneutralan, persamaan termokimia, aras tenaga",
        concepts: ["haba peneutralan", "pengiraan haba Q=mcΔT", "persamaan termokimia", "gambar rajah aras tenaga"]
      },
      {
        soalan: 9, topicId: "f5-c1a", bahagian: "B", marks: 20,
        subtopic: "Redoks - respirasi selular, sel elektrokimia, nilai E°",
        concepts: ["respirasi selular redoks", "pengoksidaan glukosa", "sel elektrokimia", "nilai E° keupayaan elektrod", "setengah persamaan ion", "siri kereaktifan"]
      },
      {
        soalan: 10, topicId: "f4-c6", bahagian: "B", marks: 20,
        subtopic: "Asid Bes Garam - pH alkali, titratan, kemolaran",
        concepts: ["pH ammonia vs NaOH", "alkali lemah vs kuat", "titratan asid-bes", "kemolaran larutan", "garam"]
      },
      {
        soalan: 11, topicId: "f4-c7", bahagian: "C", marks: 20,
        subtopic: "Kadar Tindak Balas - kepekatan, graf gas vs masa, eksperimen",
        concepts: ["kesan kepekatan ke atas kadar", "graf isipadu gas vs masa", "pengiraan isipadu gas", "eksperimen kadar CaCO3 + HCl"]
      },
    ]
  },
  // Tambah kertas lain di sini...
];

/**
 * Aggregate: kira frequency per topicId merentasi semua kertas
 */
export interface TopicFrequencyData {
  topicId: string;
  appearances: number;         // berapa kertas yang topik ni keluar
  totalMarks: number;          // jumlah markah keseluruhan
  highValueBahagian: string[]; // bahagian mana paling banyak (B/C = high value)
  hotConcepts: string[];       // konsep yang paling kerap muncul
  papers: string[];            // sumber kertas
}

export function buildFrequencyIndex(): Record<string, TopicFrequencyData> {
  const index: Record<string, TopicFrequencyData> = {};

  for (const paper of EXAM_PAPERS) {
    for (const q of paper.questions) {
      if (!index[q.topicId]) {
        index[q.topicId] = {
          topicId: q.topicId,
          appearances: 0,
          totalMarks: 0,
          highValueBahagian: [],
          hotConcepts: [],
          papers: [],
        };
      }
      const entry = index[q.topicId];
      entry.appearances += 1;
      entry.totalMarks += q.marks;
      if (q.bahagian === "B" || q.bahagian === "C") {
        entry.highValueBahagian.push(`${paper.source} Bah.${q.bahagian} (${q.marks}m)`);
      }
      entry.hotConcepts.push(...q.concepts);
      if (!entry.papers.includes(paper.source)) entry.papers.push(paper.source);
    }
  }

  // Dedupe & top concepts
  for (const entry of Object.values(index)) {
    const freq: Record<string, number> = {};
    for (const c of entry.hotConcepts) freq[c] = (freq[c] || 0) + 1;
    entry.hotConcepts = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([c]) => c);
  }

  return index;
}
