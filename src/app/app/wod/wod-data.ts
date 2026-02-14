// ═══════════════════════════════════════════════════════════════
// Comprehensive Benchmark WOD Data
// ═══════════════════════════════════════════════════════════════
// Sorted alphabetically within each category.
// Every WOD has Rx (L3), L2 (Intermediate), L1 (Beginner) scaling.
// ═══════════════════════════════════════════════════════════════

export type WodType = "time" | "amrap";
export type WodCategory = "girl" | "hero" | "other";

export interface BenchmarkWOD {
  id: string;
  name: string;
  type: WodType;
  amrapMinutes?: number;
  category: WodCategory;
  rx: string;    // L3 — As prescribed
  l2: string;    // Intermediate scaling
  l1: string;    // Beginner scaling
}

export const WOD_CATEGORY_META: Record<WodCategory, { label: string; color: string; softBg: string }> = {
  girl:  { label: "The Girls",  color: "var(--accent-red)",    softBg: "var(--accent-red-soft)" },
  hero:  { label: "Hero",       color: "var(--accent-blue)",   softBg: "var(--accent-blue-soft)" },
  other: { label: "Open/Other", color: "var(--accent-yellow)", softBg: "var(--accent-yellow-soft)" },
};

// ── The Girls — Classic CrossFit Benchmarks ──────────────────

const GIRLS: BenchmarkWOD[] = [
  {
    id: "amanda", name: "Amanda", type: "time", category: "girl",
    rx:  "9-7-5:\nMuscle-ups & Squat Snatches (135/95 lb)",
    l2:  "9-7-5:\n4 Pull-ups + 4 Dips per Muscle-up & Power Snatches (95/65 lb)",
    l1:  "9-7-5:\nPull-ups & Overhead Squats (45/35 lb)",
  },
  {
    id: "angie", name: "Angie", type: "time", category: "girl",
    rx:  "For Time:\n100 Pull-ups\n100 Push-ups\n100 Sit-ups\n100 Air Squats",
    l2:  "For Time:\n75 Pull-ups\n75 Push-ups\n75 Sit-ups\n75 Air Squats",
    l1:  "For Time:\n50 Ring Rows\n50 Knee Push-ups\n50 Sit-ups\n50 Air Squats",
  },
  {
    id: "annie", name: "Annie", type: "time", category: "girl",
    rx:  "50-40-30-20-10:\nDouble-unders & Sit-ups",
    l2:  "50-40-30-20-10:\n3:1 Single-unders & Sit-ups",
    l1:  "30-20-10:\n2:1 Single-unders & Sit-ups",
  },
  {
    id: "barbara", name: "Barbara", type: "time", category: "girl",
    rx:  "5 RFT (3 min rest):\n20 Pull-ups\n30 Push-ups\n40 Sit-ups\n50 Air Squats",
    l2:  "5 RFT (3 min rest):\n15 Pull-ups\n25 Push-ups\n30 Sit-ups\n40 Air Squats",
    l1:  "4 RFT (3 min rest):\n10 Ring Rows\n15 Knee Push-ups\n20 Sit-ups\n30 Air Squats",
  },
  {
    id: "candy", name: "Candy", type: "time", category: "girl",
    rx:  "5 RFT:\n20 Pull-ups\n40 Push-ups\n60 Air Squats",
    l2:  "5 RFT:\n15 Pull-ups\n30 Push-ups\n45 Air Squats",
    l1:  "4 RFT:\n10 Ring Rows\n20 Knee Push-ups\n30 Air Squats",
  },
  {
    id: "chelsea", name: "Chelsea", type: "time", category: "girl",
    rx:  "EMOM 30:\n5 Pull-ups\n10 Push-ups\n15 Air Squats",
    l2:  "EMOM 20:\n5 Pull-ups\n10 Push-ups\n15 Air Squats",
    l1:  "EMOM 15:\n3 Ring Rows\n6 Knee Push-ups\n9 Air Squats",
  },
  {
    id: "cindy", name: "Cindy", type: "amrap", amrapMinutes: 20, category: "girl",
    rx:  "AMRAP 20:\n5 Pull-ups\n10 Push-ups\n15 Air Squats",
    l2:  "AMRAP 20:\n5 Banded Pull-ups\n10 Push-ups\n15 Air Squats",
    l1:  "AMRAP 20:\n5 Ring Rows\n10 Knee Push-ups\n15 Air Squats",
  },
  {
    id: "diane", name: "Diane", type: "time", category: "girl",
    rx:  "21-15-9:\nDeadlifts (225/155 lb) & Handstand Push-ups",
    l2:  "21-15-9:\nDeadlifts (185/125 lb) & Box Pike HSPUs",
    l1:  "21-15-9:\nDeadlifts (135/95 lb) & DB Shoulder Press (35/20 lb)",
  },
  {
    id: "elizabeth", name: "Elizabeth", type: "time", category: "girl",
    rx:  "21-15-9:\nSquat Cleans (135/95 lb) & Ring Dips",
    l2:  "21-15-9:\nPower Cleans (115/75 lb) & Bar Dips",
    l1:  "21-15-9:\nHang Power Cleans (75/55 lb) & Box Dips",
  },
  {
    id: "erin", name: "Erin", type: "time", category: "girl",
    rx:  "5 RFT:\n15 Split Cleans (135/95 lb)\n21 Pull-ups",
    l2:  "5 RFT:\n15 Power Cleans (95/65 lb)\n15 Pull-ups",
    l1:  "4 RFT:\n12 Hang Power Cleans (65/45 lb)\n12 Ring Rows",
  },
  {
    id: "eva", name: "Eva", type: "time", category: "girl",
    rx:  "5 RFT:\n800m Run\n30 KB Swings (70/53 lb)\n30 Pull-ups",
    l2:  "5 RFT:\n800m Run\n30 KB Swings (53/35 lb)\n20 Pull-ups",
    l1:  "3 RFT:\n400m Run\n20 KB Swings (35/26 lb)\n15 Ring Rows",
  },
  {
    id: "fran", name: "Fran", type: "time", category: "girl",
    rx:  "21-15-9:\nThrusters (95/65 lb) & Pull-ups",
    l2:  "21-15-9:\nThrusters (75/55 lb) & Banded Pull-ups",
    l1:  "21-15-9:\nThrusters (45/35 lb) & Ring Rows",
  },
  {
    id: "grace", name: "Grace", type: "time", category: "girl",
    rx:  "For Time:\n30 Clean & Jerks (135/95 lb)",
    l2:  "For Time:\n30 Clean & Jerks (115/75 lb)",
    l1:  "For Time:\n30 Clean & Jerks (75/55 lb)",
  },
  {
    id: "gwen", name: "Gwen", type: "time", category: "girl",
    rx:  "15-12-9 (unbroken, touch-and-go):\nClean & Jerks (135/95 lb)\nRest as needed between sets. Score = heaviest load completed.",
    l2:  "15-12-9 (unbroken):\nClean & Jerks (95/65 lb)\nRest as needed between sets.",
    l1:  "12-9-6 (unbroken):\nClean & Jerks (65/45 lb)\nRest as needed between sets.",
  },
  {
    id: "helen", name: "Helen", type: "time", category: "girl",
    rx:  "3 RFT:\n400m Run\n21 KB Swings (53/35 lb)\n12 Pull-ups",
    l2:  "3 RFT:\n400m Run\n21 KB Swings (35/26 lb)\n12 Banded Pull-ups",
    l1:  "3 RFT:\n400m Jog\n15 KB Swings (26/18 lb)\n10 Ring Rows",
  },
  {
    id: "hope", name: "Hope", type: "amrap", amrapMinutes: 17, category: "girl",
    rx:  "3 rounds (scored like FGB, 1 min rest):\n1 min Burpees\n1 min Power Snatches (75/55 lb)\n1 min Box Jumps (24/20 in)\n1 min Thrusters (75/55 lb)\n1 min C2B Pull-ups",
    l2:  "3 rounds (1 min rest):\n1 min Burpees\n1 min Power Snatches (55/35 lb)\n1 min Box Jumps (20/16 in)\n1 min Thrusters (55/35 lb)\n1 min Pull-ups",
    l1:  "3 rounds (1 min rest):\n1 min Burpees\n1 min DB Snatches (20/10 lb)\n1 min Box Step-ups (20 in)\n1 min DB Thrusters (15/10 lb)\n1 min Ring Rows",
  },
  {
    id: "isabel", name: "Isabel", type: "time", category: "girl",
    rx:  "For Time:\n30 Snatches (135/95 lb)",
    l2:  "For Time:\n30 Snatches (115/75 lb)",
    l1:  "For Time:\n30 Snatches (75/55 lb)",
  },
  {
    id: "jackie", name: "Jackie", type: "time", category: "girl",
    rx:  "For Time:\n1000m Row\n50 Thrusters (45/35 lb)\n30 Pull-ups",
    l2:  "For Time:\n800m Row\n35 Thrusters (45/35 lb)\n20 Pull-ups",
    l1:  "For Time:\n500m Row\n25 Thrusters (35/15 lb)\n15 Ring Rows",
  },
  {
    id: "karen", name: "Karen", type: "time", category: "girl",
    rx:  "For Time:\n150 Wall Balls (20/14 lb, 10/9 ft)",
    l2:  "For Time:\n150 Wall Balls (14/10 lb, 10/9 ft)",
    l1:  "For Time:\n100 Wall Balls (10/6 lb, 9 ft)",
  },
  {
    id: "kelly", name: "Kelly", type: "time", category: "girl",
    rx:  "5 RFT:\n400m Run\n30 Box Jumps (24/20 in)\n30 Wall Balls (20/14 lb)",
    l2:  "5 RFT:\n400m Run\n30 Box Jumps (20/16 in)\n30 Wall Balls (14/10 lb)",
    l1:  "4 RFT:\n400m Jog\n20 Box Step-ups (20 in)\n20 Wall Balls (10/6 lb)",
  },
  {
    id: "linda", name: "Linda", type: "time", category: "girl",
    rx:  "10-9-8-7-6-5-4-3-2-1:\nDeadlifts (1.5x BW)\nBench Press (BW)\nCleans (0.75x BW)",
    l2:  "10-9-8-7-6-5-4-3-2-1:\nDeadlifts (1.25x BW)\nBench Press (0.75x BW)\nCleans (0.5x BW)",
    l1:  "10-9-8-7-6-5-4-3-2-1:\nDeadlifts (BW)\nBench Press (0.5x BW)\nCleans (0.4x BW)",
  },
  {
    id: "lynne", name: "Lynne", type: "amrap", category: "girl",
    rx:  "5 rounds (rest as needed):\nMax rep Bench Press (BW)\nMax rep Pull-ups",
    l2:  "5 rounds (rest as needed):\nMax rep Bench Press (0.75x BW)\nMax rep Banded Pull-ups",
    l1:  "5 rounds (rest as needed):\nMax rep Bench Press (0.5x BW)\nMax rep Ring Rows",
  },
  {
    id: "maggie", name: "Maggie", type: "time", category: "girl",
    rx:  "5 RFT:\n20 Handstand Push-ups\n40 Pistols (alternating)\n60 Pull-ups",
    l2:  "5 RFT:\n15 Box Pike HSPUs\n30 Pistols to Box\n40 Pull-ups",
    l1:  "3 RFT:\n10 DB Shoulder Press (25/15 lb)\n20 Goblet Lunges\n20 Ring Rows",
  },
  {
    id: "mary", name: "Mary", type: "amrap", amrapMinutes: 20, category: "girl",
    rx:  "AMRAP 20:\n5 Handstand Push-ups\n10 Pistols (alternating)\n15 Pull-ups",
    l2:  "AMRAP 20:\n5 Box Pike HSPUs\n10 Pistols to Box\n15 Banded Pull-ups",
    l1:  "AMRAP 20:\n5 DB Shoulder Press (25/15 lb)\n10 Goblet Lunges\n15 Ring Rows",
  },
  {
    id: "nancy", name: "Nancy", type: "time", category: "girl",
    rx:  "5 RFT:\n400m Run\n15 Overhead Squats (95/65 lb)",
    l2:  "5 RFT:\n400m Run\n15 Overhead Squats (65/45 lb)",
    l1:  "4 RFT:\n400m Jog\n10 Overhead Squats (45/35 lb)",
  },
  {
    id: "nicole", name: "Nicole", type: "amrap", amrapMinutes: 20, category: "girl",
    rx:  "AMRAP 20:\n400m Run\nMax rep Pull-ups\n(Score = total pull-ups)",
    l2:  "AMRAP 20:\n400m Run\nMax rep Banded Pull-ups",
    l1:  "AMRAP 20:\n400m Jog\nMax rep Ring Rows",
  },
];

// ── Hero WODs — In Honor of the Fallen ──────────────────────

const HEROES: BenchmarkWOD[] = [
  {
    id: "badger", name: "Badger", type: "time", category: "hero",
    rx:  "3 RFT:\n30 Squat Cleans (95/65 lb)\n30 Pull-ups\n800m Run",
    l2:  "3 RFT:\n20 Power Cleans (75/55 lb)\n20 Pull-ups\n800m Run",
    l1:  "3 RFT:\n15 Hang Power Cleans (55/35 lb)\n15 Ring Rows\n400m Run",
  },
  {
    id: "bradshaw", name: "Bradshaw", type: "time", category: "hero",
    rx:  "10 RFT:\n3 Handstand Push-ups\n6 Deadlifts (225/155 lb)\n12 Pull-ups\n24 Double-unders",
    l2:  "7 RFT:\n3 Box Pike HSPUs\n6 Deadlifts (185/125 lb)\n12 Pull-ups\n24 Single-unders",
    l1:  "5 RFT:\n5 DB Shoulder Press\n6 Deadlifts (135/95 lb)\n12 Ring Rows\n24 Single-unders",
  },
  {
    id: "chad", name: "Chad", type: "time", category: "hero",
    rx:  "For Time:\n1000 Box Step-ups (20 in)\nWearing a 20/14 lb vest\n(partition as needed)",
    l2:  "For Time:\n750 Box Step-ups (20 in)\nNo vest",
    l1:  "For Time:\n500 Box Step-ups (20 in)\nNo vest",
  },
  {
    id: "clovis", name: "Clovis", type: "time", category: "hero",
    rx:  "For Time:\n10-mile Run\nEvery 1 mile: 20 Burpees",
    l2:  "For Time:\n5-mile Run\nEvery 1 mile: 15 Burpees",
    l1:  "For Time:\n3-mile Run/Walk\nEvery 0.5 mile: 10 Burpees",
  },
  {
    id: "daniel", name: "Daniel", type: "time", category: "hero",
    rx:  "For Time:\n50 Pull-ups\n400m Run\n21 Thrusters (95/65 lb)\n800m Run\n21 Thrusters (95/65 lb)\n400m Run\n50 Pull-ups",
    l2:  "For Time:\n35 Pull-ups\n400m Run\n15 Thrusters (75/55 lb)\n800m Run\n15 Thrusters (75/55 lb)\n400m Run\n35 Pull-ups",
    l1:  "For Time:\n25 Ring Rows\n400m Run\n12 Thrusters (45/35 lb)\n600m Run\n12 Thrusters (45/35 lb)\n400m Run\n25 Ring Rows",
  },
  {
    id: "dt", name: "DT", type: "time", category: "hero",
    rx:  "5 RFT:\n12 Deadlifts (155/105 lb)\n9 Hang Power Cleans\n6 Push Jerks",
    l2:  "5 RFT:\n12 Deadlifts (115/75 lb)\n9 Hang Power Cleans\n6 Push Jerks",
    l1:  "5 RFT:\n12 Deadlifts (75/55 lb)\n9 Hang Power Cleans\n6 Push Press",
  },
  {
    id: "griff", name: "Griff", type: "time", category: "hero",
    rx:  "For Time:\n800m Run\n400m Run backward\n800m Run\n400m Run backward",
    l2:  "For Time:\n800m Run\n200m Run backward\n800m Run\n200m Run backward",
    l1:  "For Time:\n400m Run\n200m Walk backward\n400m Run\n200m Walk backward",
  },
  {
    id: "jack", name: "Jack", type: "amrap", amrapMinutes: 20, category: "hero",
    rx:  "AMRAP 20:\n10 Push Press (115/85 lb)\n10 KB Swings (53/35 lb)\n10 Box Jumps (24/20 in)",
    l2:  "AMRAP 20:\n10 Push Press (85/55 lb)\n10 KB Swings (35/26 lb)\n10 Box Jumps (20/16 in)",
    l1:  "AMRAP 20:\n10 Push Press (55/35 lb)\n10 KB Swings (26/18 lb)\n10 Box Step-ups (20 in)",
  },
  {
    id: "jason", name: "Jason", type: "time", category: "hero",
    rx:  "For Time:\n100 Squats, 5 Muscle-ups\n75 Squats, 10 Muscle-ups\n50 Squats, 15 Muscle-ups\n25 Squats, 20 Muscle-ups",
    l2:  "For Time:\n100 Squats, 5 C2B Pull-ups + 5 Ring Dips\n75 Squats, 10+10\n50 Squats, 15+15\n25 Squats, 20+20",
    l1:  "For Time:\n75 Squats, 5 Pull-ups + 5 Dips\n50 Squats, 8+8\n25 Squats, 10+10",
  },
  {
    id: "jt", name: "JT", type: "time", category: "hero",
    rx:  "21-15-9:\nHandstand Push-ups\nRing Dips\nPush-ups",
    l2:  "21-15-9:\nBox Pike HSPUs\nBar Dips\nPush-ups",
    l1:  "21-15-9:\nDB Shoulder Press (25/15 lb)\nBox Dips\nKnee Push-ups",
  },
  {
    id: "kalsu", name: "Kalsu", type: "time", category: "hero",
    rx:  "For Time:\nEMOM 5 Burpees\nFill remaining time with Thrusters (135/95 lb)\nFinish when 100 Thrusters are complete",
    l2:  "For Time:\nEMOM 5 Burpees\nThrusters (95/65 lb) to 75 total",
    l1:  "For Time:\nEMOM 3 Burpees\nThrusters (65/45 lb) to 50 total",
  },
  {
    id: "loredo", name: "Loredo", type: "time", category: "hero",
    rx:  "6 RFT:\n24 Air Squats\n24 Push-ups\n24 Walking Lunges\n400m Run",
    l2:  "6 RFT:\n24 Air Squats\n18 Push-ups\n18 Walking Lunges\n400m Run",
    l1:  "4 RFT:\n20 Air Squats\n12 Knee Push-ups\n12 Walking Lunges\n400m Jog",
  },
  {
    id: "lumberjack", name: "Lumberjack 20", type: "time", category: "hero",
    rx:  "For Time:\n20 Deadlifts (275/185 lb)\n400m Run\n20 KB Swings (53/35 lb)\n400m Run\n20 OHS (115/75 lb)\n400m Run\n20 Burpees\n400m Run\n20 C&J (135/95 lb)\n400m Run\n20 Box Jumps (24/20 in)",
    l2:  "For Time:\n20 Deadlifts (225/155 lb)\n400m Run\n20 KB Swings (35/26 lb)\n400m Run\n20 OHS (75/55 lb)\n400m Run\n20 Burpees\n400m Run\n20 C&J (95/65 lb)\n400m Run\n20 Box Jumps (20/16 in)",
    l1:  "For Time:\n15 Deadlifts (155/105 lb)\n400m Run\n15 KB Swings (26/18 lb)\n400m Run\n15 Front Squats (45/35 lb)\n400m Run\n15 Burpees\n400m Run\n15 C&J (65/45 lb)\n400m Run\n15 Box Step-ups (20 in)",
  },
  {
    id: "mcghee", name: "McGhee", type: "time", category: "hero",
    rx:  "5 RFT:\n275m Run\n10 Deadlifts (185/135 lb)\n5 Burpee Box Jumps (24/20 in)\n10 Push-ups",
    l2:  "5 RFT:\n275m Run\n10 Deadlifts (135/95 lb)\n5 Burpee Box Step-ups (20 in)\n10 Push-ups",
    l1:  "4 RFT:\n200m Run\n8 Deadlifts (95/65 lb)\n5 Burpees\n8 Knee Push-ups",
  },
  {
    id: "michael", name: "Michael", type: "time", category: "hero",
    rx:  "3 RFT:\n800m Run\n50 Back Extensions\n50 Sit-ups",
    l2:  "3 RFT:\n800m Run\n35 Back Extensions\n35 Sit-ups",
    l1:  "3 RFT:\n600m Run\n25 Superman Holds\n25 Sit-ups",
  },
  {
    id: "mr_joshua", name: "Mr. Joshua", type: "time", category: "hero",
    rx:  "5 RFT:\n400m Run\n30 GHD Sit-ups\n15 Deadlifts (250/175 lb)",
    l2:  "5 RFT:\n400m Run\n20 GHD Sit-ups\n15 Deadlifts (185/135 lb)",
    l1:  "4 RFT:\n400m Run\n15 Sit-ups\n12 Deadlifts (135/95 lb)",
  },
  {
    id: "murph", name: "Murph", type: "time", category: "hero",
    rx:  "For Time (20/14 lb vest):\n1 mile Run\n100 Pull-ups\n200 Push-ups\n300 Air Squats\n1 mile Run\n(Partition pull-ups, push-ups, squats as needed)",
    l2:  "For Time (no vest):\n1 mile Run\n100 Pull-ups\n200 Push-ups\n300 Air Squats\n1 mile Run",
    l1:  "For Time (no vest):\n1 mile Run/Walk\n50 Ring Rows\n100 Knee Push-ups\n150 Air Squats\n1 mile Run/Walk",
  },
  {
    id: "nate", name: "Nate", type: "amrap", amrapMinutes: 20, category: "hero",
    rx:  "AMRAP 20:\n2 Muscle-ups\n4 Handstand Push-ups\n8 KB Swings (70/53 lb)",
    l2:  "AMRAP 20:\n4 C2B Pull-ups + 4 Ring Dips\n4 Box Pike HSPUs\n8 KB Swings (53/35 lb)",
    l1:  "AMRAP 20:\n4 Pull-ups + 4 Dips\n4 DB Shoulder Press\n8 KB Swings (35/26 lb)",
  },
  {
    id: "nutts", name: "Nutts", type: "time", category: "hero",
    rx:  "For Time:\n10 Handstand Push-ups\n15 Deadlifts (250/175 lb)\n25 Box Jumps (30/24 in)\n50 Pull-ups\n100 Wall Balls (20/14 lb)\n200 Double-unders\n400m Run w/ 45 lb plate",
    l2:  "For Time:\n10 Box Pike HSPUs\n15 Deadlifts (185/125 lb)\n25 Box Jumps (24/20 in)\n35 Pull-ups\n75 Wall Balls (14/10 lb)\n200 Single-unders\n400m Run w/ 25 lb plate",
    l1:  "For Time:\n10 DB Shoulder Press\n12 Deadlifts (135/95 lb)\n20 Box Step-ups (20 in)\n25 Ring Rows\n50 Wall Balls (10/6 lb)\n100 Single-unders\n400m Run",
  },
  {
    id: "paul", name: "Paul", type: "time", category: "hero",
    rx:  "5 RFT:\n50 Double-unders\n35 Knees-to-Elbows\n185 lb Overhead Walk (20 yd)",
    l2:  "5 RFT:\n50 Single-unders\n25 Hanging Knee Raises\n135 lb Overhead Walk (20 yd)",
    l1:  "4 RFT:\n40 Single-unders\n15 Hanging Knee Raises\n95 lb Overhead Walk (20 yd)",
  },
  {
    id: "pequot", name: "Pequot", type: "time", category: "hero",
    rx:  "10 RFT:\n3 Handstand Push-ups\n6 Clean & Jerks (135/95 lb)\n12 Toes-to-Bar\n24 Air Squats",
    l2:  "7 RFT:\n3 Box Pike HSPUs\n6 Clean & Jerks (95/65 lb)\n12 Hanging Knee Raises\n24 Air Squats",
    l1:  "5 RFT:\n5 DB Shoulder Press\n6 Clean & Jerks (65/45 lb)\n10 V-ups\n20 Air Squats",
  },
  {
    id: "randy", name: "Randy", type: "time", category: "hero",
    rx:  "For Time:\n75 Power Snatches (75/55 lb)",
    l2:  "For Time:\n75 Power Snatches (55/35 lb)",
    l1:  "For Time:\n50 Power Snatches (35/25 lb)",
  },
  {
    id: "riley", name: "Riley", type: "time", category: "hero",
    rx:  "For Time:\n1.5-mile Run\n8 RFT: 5 Burpee Pull-ups + 20 Air Squats\n1.5-mile Run",
    l2:  "For Time:\n1-mile Run\n6 RFT: 5 Burpee Pull-ups + 15 Air Squats\n1-mile Run",
    l1:  "For Time:\n800m Run\n5 RFT: 5 Burpees + 10 Air Squats\n800m Run",
  },
  {
    id: "rj", name: "RJ", type: "time", category: "hero",
    rx:  "5 RFT:\n800m Run\n5 Rope Climbs (15 ft)\n50 Push-ups",
    l2:  "5 RFT:\n800m Run\n3 Rope Climbs or 5 Towel Pull-ups\n35 Push-ups",
    l1:  "3 RFT:\n400m Run\n5 Towel Pull-ups\n20 Knee Push-ups",
  },
  {
    id: "ryan", name: "Ryan", type: "time", category: "hero",
    rx:  "5 RFT:\n7 Muscle-ups\n21 Burpees",
    l2:  "5 RFT:\n7 C2B Pull-ups + 7 Ring Dips\n21 Burpees",
    l1:  "5 RFT:\n7 Pull-ups + 7 Box Dips\n15 Burpees",
  },
  {
    id: "the_seven", name: "The Seven", type: "time", category: "hero",
    rx:  "7 RFT:\n7 Handstand Push-ups\n7 Thrusters (135/95 lb)\n7 Knees-to-Elbows\n7 Deadlifts (245/175 lb)\n7 Burpees\n7 KB Swings (70/53 lb)\n7 Pull-ups",
    l2:  "7 RFT:\n7 Box Pike HSPUs\n7 Thrusters (95/65 lb)\n7 Hanging Knee Raises\n7 Deadlifts (185/125 lb)\n7 Burpees\n7 KB Swings (53/35 lb)\n7 Pull-ups",
    l1:  "5 RFT:\n7 DB Shoulder Press\n7 Thrusters (65/45 lb)\n7 V-ups\n7 Deadlifts (135/95 lb)\n7 Burpees\n7 KB Swings (35/26 lb)\n7 Ring Rows",
  },
  {
    id: "tommy_v", name: "Tommy V", type: "time", category: "hero",
    rx:  "21-15-9:\nThrusters (115/85 lb) & Rope Climbs (15 ft)",
    l2:  "21-15-9:\nThrusters (85/55 lb) & 4 Towel Pull-ups per Rope Climb",
    l1:  "15-12-9:\nThrusters (55/35 lb) & 2 Towel Pull-ups per Rope Climb",
  },
  {
    id: "wittman", name: "Wittman", type: "time", category: "hero",
    rx:  "7 RFT:\n15 KB Swings (53/35 lb)\n15 Power Cleans (95/65 lb)\n15 Box Jumps (24/20 in)",
    l2:  "7 RFT:\n15 KB Swings (35/26 lb)\n15 Power Cleans (75/55 lb)\n15 Box Jumps (20/16 in)",
    l1:  "5 RFT:\n12 KB Swings (26/18 lb)\n12 Hang Power Cleans (55/35 lb)\n12 Box Step-ups (20 in)",
  },
];

// ── Open / Competition / Other Benchmarks ────────────────────

const OTHER: BenchmarkWOD[] = [
  {
    id: "baseline", name: "Baseline", type: "time", category: "other",
    rx:  "For Time:\n500m Row\n40 Air Squats\n30 Sit-ups\n20 Push-ups\n10 Pull-ups",
    l2:  "For Time:\n500m Row\n40 Air Squats\n30 Sit-ups\n20 Push-ups\n10 Banded Pull-ups",
    l1:  "For Time:\n500m Row\n30 Air Squats\n20 Sit-ups\n15 Knee Push-ups\n10 Ring Rows",
  },
  {
    id: "chief", name: "The Chief", type: "amrap", category: "other",
    rx:  "5× AMRAP 3 (1 min rest):\n3 Power Cleans (135/95 lb)\n6 Push-ups\n9 Air Squats",
    l2:  "5× AMRAP 3 (1 min rest):\n3 Power Cleans (95/65 lb)\n6 Push-ups\n9 Air Squats",
    l1:  "5× AMRAP 3 (1 min rest):\n3 Hang Power Cleans (65/45 lb)\n6 Knee Push-ups\n9 Air Squats",
  },
  {
    id: "crossfit_total", name: "CrossFit Total", type: "time", category: "other",
    rx:  "1RM each (3 attempts):\nBack Squat\nShoulder Press\nDeadlift\n(Score = combined total)",
    l2:  "1RM each (3 attempts):\nBack Squat\nShoulder Press\nDeadlift\n(Work up from 60%)",
    l1:  "3RM each (3 attempts):\nBack Squat\nShoulder Press\nDeadlift\n(Focus on form, work up conservatively)",
  },
  {
    id: "fight_gone_bad", name: "Fight Gone Bad", type: "amrap", amrapMinutes: 17, category: "other",
    rx:  "3 RFT (1 min rest):\n1 min Wall Balls (20/14 lb)\n1 min SDHP (75/55 lb)\n1 min Box Jumps (20 in)\n1 min Push Press (75/55 lb)\n1 min Row (cal)",
    l2:  "3 RFT (1 min rest):\n1 min Wall Balls (14/10 lb)\n1 min SDHP (55/35 lb)\n1 min Box Step-ups (20 in)\n1 min Push Press (55/35 lb)\n1 min Row (cal)",
    l1:  "3 RFT (1 min rest):\n1 min Wall Balls (10/6 lb)\n1 min KB SDHP (26/18 lb)\n1 min Box Step-ups (16 in)\n1 min DB Push Press (15/10 lb)\n1 min Row (cal)",
  },
  {
    id: "filthy_fifty", name: "Filthy Fifty", type: "time", category: "other",
    rx:  "For Time (50 reps each):\nBox Jumps (24/20 in)\nJumping Pull-ups\nKB Swings (35/26 lb)\nWalking Lunges\nK2E\nPush Press (45/35 lb)\nBack Extensions\nWall Balls (20/14 lb)\nBurpees\nDouble-unders",
    l2:  "For Time (50 reps each):\nBox Jumps (20/16 in)\nJumping Pull-ups\nKB Swings (26/18 lb)\nWalking Lunges\nHanging Knee Raises\nPush Press (35/25 lb)\nBack Extensions\nWall Balls (14/10 lb)\nBurpees\nSingle-unders",
    l1:  "For Time (30 reps each):\nBox Step-ups (20 in)\nRing Rows\nKB Swings (18/12 lb)\nWalking Lunges\nV-ups\nDB Push Press (15/10 lb)\nSuperman Holds\nWall Balls (10/6 lb)\nBurpees\nSingle-unders",
  },
  {
    id: "king_kong", name: "King Kong", type: "time", category: "other",
    rx:  "3 RFT:\n1 Deadlift (460/315 lb)\n2 Muscle-ups\n3 Squat Cleans (250/170 lb)\n4 Handstand Push-ups",
    l2:  "3 RFT:\n1 Deadlift (315/225 lb)\n2 C2B Pull-ups + 2 Ring Dips\n3 Squat Cleans (185/125 lb)\n4 Box Pike HSPUs",
    l1:  "3 RFT:\n1 Deadlift (225/155 lb)\n4 Pull-ups + 4 Dips\n3 Power Cleans (135/95 lb)\n4 DB Shoulder Press",
  },
  {
    id: "nasty_girls", name: "Nasty Girls", type: "time", category: "other",
    rx:  "3 RFT:\n50 Air Squats\n7 Muscle-ups\n10 Hang Power Cleans (135/95 lb)",
    l2:  "3 RFT:\n50 Air Squats\n7 C2B Pull-ups + 7 Ring Dips\n10 Hang Power Cleans (95/65 lb)",
    l1:  "3 RFT:\n50 Air Squats\n7 Pull-ups + 7 Box Dips\n10 Hang Power Cleans (65/45 lb)",
  },
  {
    id: "open_145", name: "Open 14.5", type: "time", category: "other",
    rx:  "21-18-15-12-9-6-3:\nThrusters (95/65 lb) & Burpees",
    l2:  "21-18-15-12-9-6-3:\nThrusters (65/45 lb) & Burpees",
    l1:  "21-18-15-12-9-6-3:\nThrusters (45/35 lb) & Step-back Burpees",
  },
  {
    id: "open_165", name: "Open 16.5", type: "time", category: "other",
    rx:  "21-18-15-12-9-6-3:\nThrusters (95/65 lb) & Bar-facing Burpees",
    l2:  "21-18-15-12-9-6-3:\nThrusters (65/45 lb) & Bar-facing Burpees",
    l1:  "21-18-15-12-9-6-3:\nThrusters (45/35 lb) & Burpees",
  },
  {
    id: "open_185", name: "Open 18.5", type: "amrap", amrapMinutes: 7, category: "other",
    rx:  "AMRAP 7:\n3 Thrusters + 3 C2B Pull-ups\n6 + 6, 9 + 9… (100/70 lb)",
    l2:  "AMRAP 7:\n3 Thrusters + 3 Pull-ups\n6 + 6, 9 + 9… (75/55 lb)",
    l1:  "AMRAP 7:\n3 Thrusters + 3 Ring Rows\n6 + 6, 9 + 9… (45/35 lb)",
  },
  {
    id: "sprint_couplet", name: "Sprint Couplet", type: "time", category: "other",
    rx:  "3 RFT:\n10 Power Cleans (135/95 lb)\n10 Bar-facing Burpees",
    l2:  "3 RFT:\n10 Power Cleans (95/65 lb)\n10 Bar-facing Burpees",
    l1:  "3 RFT:\n10 Hang Power Cleans (65/45 lb)\n10 Burpees",
  },
];

// ── Combined & Exported ─────────────────────────────────────

export const BENCHMARK_WODS: BenchmarkWOD[] = [...GIRLS, ...HEROES, ...OTHER];
