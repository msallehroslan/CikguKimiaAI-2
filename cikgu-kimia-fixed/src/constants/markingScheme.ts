/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MarkingTip {
  topic: string;
  requiredKeywords: string[];
  commonMistakes: string;
  markingSchemeLogic: string;
}

export const MARKING_SCHEME_TIPS: MarkingTip[] = [
  {
    topic: "Rate of Reaction (Collision Theory)",
    requiredKeywords: ["Total surface area", "Concentration", "Temperature", "Catalyst", "Frequency of collision", "Frequency of effective collision", "Activation energy"],
    commonMistakes: "Students often forget to mention 'Effective' collision. Just saying 'collision increases' usually gets 0 or partial marks.",
    markingSchemeLogic: "1. State factor. 2. Explain how factor affects particles. 3. Mention frequency of collision. 4. Mention frequency of effective collision. 5. State rate of reaction increases."
  },
  {
    topic: "Carbon Compounds (Isomerism)",
    requiredKeywords: ["Same molecular formula", "Different structural formula", "Boiling point", "Functional group"],
    commonMistakes: "Mixed up between 'same chemical property' and 'different physical property'.",
    markingSchemeLogic: "Must show the structural difference clearly and name them according to IUPAC nomenclature."
  },
  {
    topic: "Acids, Bases and Salts (Salts Preparation)",
    requiredKeywords: ["Double decomposition", "Precipitation", "Filtration", "Distilled water", "Dry by pressing between filter papers"],
    commonMistakes: "Using soluble reactants for insoluble salts or vice versa.",
    markingSchemeLogic: "For insoluble salts, use Double Decomposition (Solution + Solution). For soluble salts (not SPA), use Acid + Metal/Base/Carbonate."
  },
  {
    topic: "Redox (Electrolysis)",
    requiredKeywords: ["Selective discharge", "Electrochemical series", "Standard electrode potential", "Anion", "Cation"],
    commonMistakes: "Confusing the terminal (Anode/Cathode) with the process (Oxidation/Reduction). Remember AN OX (Anode Oxidation) and RED CAT (Reduction Cathode).",
    markingSchemeLogic: "Identify ions present -> Identify which ion is discharged (based on concentration, type of electrode, or standard potential) -> Write half-equation."
  }
];
