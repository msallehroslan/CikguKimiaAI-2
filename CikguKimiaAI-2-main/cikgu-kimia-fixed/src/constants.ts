/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Topic {
  id: string;
  title: string;
  form: 4 | 5;
  description: string;
  subtopics: string[];
}

export const SYLLABUS_TOPICS: Topic[] = [
  // Form 4
  {
    id: "f4-c2",
    title: "Jirim dan Struktur Atom",
    form: 4,
    description: "Memahami isotop, model atom, dan zarah subatom.",
    subtopics: ["Matter", "History of Atomic Models", "Structure of Atom", "Isotopes and their uses"],
  },
  {
    id: "f4-c3",
    title: "Konsep Mol, Formula dan Persamaan Kimia",
    form: 4,
    description: "Asas stoikiometri dan pengiraan kimia.",
    subtopics: ["Relative Atomic Mass", "Mole Concept", "Chemical Formulae", "Chemical Equations"],
  },
  {
    id: "f4-c4",
    title: "Jadual Berkala Unsur",
    form: 4,
    description: "Meneroka trend dan kumpulan unsur.",
    subtopics: ["Development of Periodic Table", "Group 18", "Group 1", "Group 17", "Elements in Period 3", "Transition Elements"],
  },
  {
    id: "f4-c5",
    title: "Ikatan Kimia",
    form: 4,
    description: "Bagaimana atom bergabung untuk membentuk bahan yang stabil.",
    subtopics: ["Ionic Bond", "Covalent Bond", "Hydrogen Bond", "Dative Bond", "Metallic Bond"],
  },
  {
    id: "f4-c6",
    title: "Asid, Bes dan Garam",
    form: 4,
    description: "Sifat larutan dan penyediaan garam.",
    subtopics: ["The Role of Water", "pH Value", "Neutralisation", "Preparation of Salts", "Qualitative Analysis"],
  },
  {
    id: "f4-c7",
    title: "Kadar Tindak Balas",
    form: 4,
    description: "Mengkaji kepantasan perubahan kimia berlaku.",
    subtopics: ["Factors Affecting Rate", "Collision Theory"],
  },
  // Form 5
  {
    id: "f5-c1",
    title: "Keseimbangan Redoks",
    form: 5,
    description: "Proses pengoksidaan dan penurunan serta sel.",
    subtopics: ["Oxidation and Reduction", "Standard Electrode Potential", "Voltaic Cell", "Electrolytic Cell", "Rusting"],
  },
  {
    id: "f5-c2",
    title: "Sebatian Karbon",
    form: 5,
    description: "Kimia organik: Alkana, Alkena, Alkohol dan banyak lagi.",
    subtopics: ["Saturated and Unsaturated Hydrocarbons", "Homologous Series", "Chemical Properties", "Esters"],
  },
  {
    id: "f5-c3",
    title: "Termokimia",
    form: 5,
    description: "Perubahan tenaga dalam tindak balas kimia.",
    subtopics: ["Heat of Precipitation", "Heat of Displacement", "Heat of Neutralisation", "Heat of Combustion"],
  },
  {
    id: "f5-c4",
    title: "Polimer",
    form: 5,
    description: "Makromolekul semula jadi dan sintetik.",
    subtopics: ["Polymerisation", "Natural Rubber", "Synthetic Rubber"],
  },
  {
    id: "f5-c5",
    title: "Kimia Pengguna dan Industri",
    form: 5,
    description: "Aplikasi kimia dalam kehidupan sebenar.",
    subtopics: ["Oils and Fats", "Cleaning Agents", "Food Additives", "Medicines", "Nanotechnology", "Green Technology"],
  },
];
