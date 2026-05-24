export type Chapter = { id: string; name: string };
export type Unit = { id: string; name: string; chapters: Chapter[] };
export type Subject = {
  id: "physics" | "chemistry" | "math";
  name: string;
  accent: string;
  units: Unit[];
};

const mk = (prefix: string, items: [string, string[]][]): Unit[] =>
  items.map(([u, chs], i) => ({
    id: `${prefix}-u${i}`,
    name: u,
    chapters: chs.map((c, j) => ({ id: `${prefix}-u${i}-c${j}`, name: c })),
  }));

export const SYLLABUS: Subject[] = [
  {
    id: "physics",
    name: "Physics",
    accent: "var(--physics)",
    units: mk("phy", [
      ["Mechanics", ["Units & Measurements", "Kinematics", "Laws of Motion", "Work, Energy & Power", "Rotational Motion", "Gravitation"]],
      ["Properties of Matter", ["Solids & Fluids", "Thermal Properties", "Thermodynamics", "Kinetic Theory"]],
      ["Oscillations & Waves", ["SHM", "Waves", "Sound"]],
      ["Electrostatics & Current", ["Electrostatics", "Capacitance", "Current Electricity"]],
      ["Magnetism & EMI", ["Magnetic Effects", "EMI", "Alternating Current", "EM Waves"]],
      ["Optics", ["Ray Optics", "Wave Optics"]],
      ["Modern Physics", ["Dual Nature", "Atoms & Nuclei", "Semiconductors"]],
    ]),
  },
  {
    id: "chemistry",
    name: "Chemistry",
    accent: "var(--chemistry)",
    units: mk("chem", [
      ["Physical Chemistry", ["Mole Concept", "Atomic Structure", "Chemical Bonding", "Thermodynamics", "Equilibrium", "Electrochemistry", "Chemical Kinetics", "Solutions"]],
      ["Inorganic Chemistry", ["Periodic Table", "s-Block", "p-Block", "d & f Block", "Coordination Compounds", "Metallurgy"]],
      ["Organic Chemistry", ["GOC", "Hydrocarbons", "Haloalkanes", "Alcohols, Phenols, Ethers", "Aldehydes & Ketones", "Carboxylic Acids", "Amines", "Biomolecules", "Polymers"]],
    ]),
  },
  {
    id: "math",
    name: "Mathematics",
    accent: "var(--math)",
    units: mk("math", [
      ["Algebra", ["Sets & Relations", "Complex Numbers", "Quadratic Equations", "Sequences & Series", "Permutations & Combinations", "Binomial Theorem", "Matrices & Determinants"]],
      ["Calculus", ["Limits & Continuity", "Differentiation", "Application of Derivatives", "Indefinite Integration", "Definite Integration", "Differential Equations"]],
      ["Coordinate Geometry", ["Straight Lines", "Circles", "Parabola", "Ellipse", "Hyperbola"]],
      ["Trigonometry", ["Trigonometric Functions", "Inverse Trig", "Heights & Distances"]],
      ["Vectors & 3D", ["Vectors", "3D Geometry"]],
      ["Probability & Stats", ["Probability", "Statistics"]],
    ]),
  },
];