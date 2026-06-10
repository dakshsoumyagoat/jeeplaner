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
      ["Mechanics — Track 1", [
        "Vectors",
        "Rectilinear Motion",
        "Projectile Motion",
        "Relative Motion",
        "Circular Kinematics",
        "Work, Power & Energy",
        "Centre of Mass, Momentum & Collision",
        "Rigid Body Mechanics",
        "Simple Harmonic Motion",
        "Gravitation",
      ]],
      ["Foundations & Mechanics — Track 2", [
        "Basic Mathematics (for Physics)",
        "Units, Measurements, Errors & Experiments",
        "Newton's Laws of Motion",
        "Mechanical Properties of Solids (Elasticity)",
      ]],
      ["Thermal Physics", [
        "Thermometry",
        "Thermal Expansion",
        "Calorimetry",
        "Heat Transfer",
        "Kinetic Theory of Gases",
        "Thermodynamics",
      ]],
      ["Fluids & Waves", [
        "Fluid Mechanics",
        "Transverse Waves (String Waves)",
        "Longitudinal Waves (Sound Waves)",
      ]],
    ]),
  },
  {
    id: "chemistry",
    name: "Chemistry",
    accent: "var(--chemistry)",
    units: mk("chem", [
      ["Physical Chemistry", [
        "Some Basic Concepts (Mole Concept)",
        "Atomic Structure",
        "Chemical Bonding",
        "Gaseous States",
        "Liquids",
        "Thermodynamics",
        "Thermochemistry",
        "Chemical Equilibrium",
        "Ionic Equilibrium",
        "Redox Reactions",
        "Equivalent Concept & Volumetric Analysis",
      ]],
      ["Organic Chemistry", [
        "IUPAC Nomenclature",
        "Physical Properties, Qualitative & Quantitative Analysis",
        "GOC-I",
        "GOC-II",
        "Stereochemistry",
        "Hydrocarbons",
      ]],
      ["Inorganic Chemistry", [
        "Periodic Classification",
        "Hydrogen",
        "s-Block Elements",
        "p-Block Elements",
        "Environmental Chemistry",
      ]],
    ]),
  },
  {
    id: "math",
    name: "Mathematics",
    accent: "var(--math)",
    units: mk("math", [
      ["Algebra & Foundations", [
        "Basic Maths",
        "Fundamentals of Mathematics-1 & 2",
        "Sets",
        "Relations",
        "Introduction to Functions",
        "Linear Inequalities",
        "Quadratic Equations and Expressions",
        "Sequence and Series",
        "Binomial Theorem (for any index)",
        "Permutations and Combinations",
        "Functions",
      ]],
      ["Trigonometry", [
        "Trigonometric Ratios and Identities",
        "Trigonometric Equations and Inequalities",
        "Properties of Triangles",
      ]],
      ["Coordinate Geometry", [
        "Introduction to Coordinate Geometry",
        "Straight Lines",
        "Pair of Lines",
        "Circles",
        "Conic Sections",
        "Introduction to 3D Geometry",
      ]],
      ["Calculus", [
        "Limits",
        "Methods of Differentiation",
      ]],
      ["Statistics & Probability", [
        "Statistics",
        "Probability",
      ]],
    ]),
  },
];