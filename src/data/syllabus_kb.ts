/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SyllabusFact {
  topicId: string;
  title: string;
  context: string;
  keyPoints: string[];
}

export const SYLLABUS_KNOWLEDGE_BASE: SyllabusFact[] = [
  // FORM 4
  {
    topicId: "f4-c2",
    title: "Jirim dan Struktur Atom",
    context: "Mengkaji tentang keadaan jirim, teori kinetik, dan sejarah pembangunan model atom.",
    keyPoints: [
      "Zarah-zarah seni dan diskrit (Atom, Molekul, Ion).",
      "Keadaan Jirim: Pepejal (getaran), Cecair (gelongsor), Gas (rawak).",
      "Takat Lebur/Beku: Suhu tetap semasa pertukaran fasa (haba pendam).",
      "Subatom: Proton (+1), Neutron (0), Elektron (-1).",
      "Nombor Nukleon = Bilangan Proton + Bilangan Neutron.",
      "Isotop: Unsur sama, bilangan proton sama, bilangan neutron berbeza (Contoh: Kobalt-60 utk radioterapi)."
    ]
  },
  {
    topicId: "f4-c3",
    title: "Konsep Mol, Formula dan Persamaan Kimia",
    context: "Asas pengiraan kimia melibatkan jisim, mol, dan isi padu gas.",
    keyPoints: [
      "Pemalar Avogadro: 6.02 x 10^23 zarah per mol.",
      "Jisim Molar: Jisim satu mol bahan (sama dengan JAR/JMR).",
      "Isi padu Molar: 22.4 dm3 (STP) atau 24 dm3 (Keadaan bilik).",
      "Formula Empirik: Nisbah teringkas bilangan atom.",
      "Formula Molekul: Bilangan sebenar atom.",
      "Persamaan Kimia: Mesti seimbang (Hukum Keabadian Jisim)."
    ]
  },
  {
    topicId: "f4-c6",
    title: "Asid, Bes dan Garam",
    context: "Memahami sifat keasidan, alkali, pH, dan teknik penyediaan pelbagai jenis garam.",
    keyPoints: [
      "Asid: Mengion dlm air hasilkan H+. Kuat (mengion lengkap) vs Lemah (mengion separa).",
      "Alkali: Mengion dlm air hasilkan OH-.",
      "Skala pH: 0-6 (asid), 7 (neutral), 8-14 (alkali).",
      "Peneutralan: Asid + Alkali -> Garam + Air.",
      "Garam Larut: Semua NO3-, semua K+/Na+/NH4+, Cl- (kecuali Ag/Hg/Pb), SO4 (kecuali Ba/Ca/Pb).",
      "Ujian Kenalpasti Kation: NaOH & NH3 akues.",
      "Ujian Anion: Klorida (AgNO3), Sulfat (BaCl2), Nitrat (Cincin Perang)."
    ]
  },
  // FORM 5
  {
    topicId: "f5-c1",
    title: "Keseimbangan Redoks",
    context: "Proses pemindahan elektron, nombor pengoksidaan, dan aplikasinya dalam sel elektrokimia.",
    keyPoints: [
      "Pengoksidaan: Derma elektron, tambah nombor pengoksidaan, tambah oksigen.",
      "Penurunan: Terima elektron, kurang nombor pengoksidaan, hilang oksigen.",
      "Agen Pengoksidaan: KMnO4 berasid, K2Cr2O7 berasid, halida.",
      "Sel Kimia: Tenaga kimia -> Tenaga elektrik. Logam elektropositif jadi Anod (-).",
      "Sel Elektrolisis: Tenaga elektrik -> Tenaga kimia. Anod (+) menarik anion.",
      "Siri Elektrokimia: Kedudukan menentukan kekuatan agen penurunan.",
      "Pengaratan Besi: Melibatkan oksigen dan air (Sel kimia ringkas)."
    ]
  },
  {
    topicId: "f5-c2",
    title: "Sebatian Karbon",
    context: "Senyawa organik seperti hidrokarbon, alkohol, asid karboksilik, dan ester.",
    keyPoints: [
      "Hidrokarbon Tepu (Alkana): Ikatan C-C tunggal. Penukargantian (UV).",
      "Hidrokarbon Tak Tepu (Alkena): Ikatan ganda dua C=C. Tindak balas penambahan.",
      "Siri Homolog: Formula am sama, sifat kimia sama, beza CH2.",
      "Alkohol (-OH): Dihasilkan melalui penapaian. Pengoksidaan hasilkan asid karboksilik.",
      "Ester: Dihasilkan drpd Asid Karboksilik + Alkohol (H2SO4 pekat sbg mangkin). Bau wangi."
    ]
  },
  {
    topicId: "f5-c3",
    title: "Termokimia",
    context: "Haba tindak balas dan perubahan tenaga dalam sistem kimia.",
    keyPoints: [
      "Eksotermik: Haba dibebaskan (Delta H negatif). Suhu persekitaran naik.",
      "Endotermik: Haba diserap (Delta H positif). Suhu persekitaran turun.",
      "Haba Peneutralan: Haba terbebas bagi pembentukan 1 mol air.",
      "Haba Pembakaran: Haba terbebas apbl 1 mol bahan terbakar lengkap.",
      "Gambar Rajah Aras Tenaga: Membandingkan aras tenaga bahan vs hasil tindak balas."
    ]
  }
];
