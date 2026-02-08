export type KBArticle = {
  slug: string;
  category: string;
  emoji: string;
  title: string;
  tagline: string;
  /** Markdown-ish plain text with paragraphs */
  sections: Array<{
    heading: string;
    body: string;
  }>;
  sources: string[];
};

export const KB_CATEGORIES = [
  { key: "sleep", emoji: "😴", label: "Sleep" },
  { key: "exercise", emoji: "💪", label: "Exercise" },
  { key: "nutrition", emoji: "🥗", label: "Nutrition & Hydration" },
  { key: "mental", emoji: "🧠", label: "Mental Health" },
  { key: "habits", emoji: "🔄", label: "Habit Science" },
  { key: "recovery", emoji: "🔥", label: "Recovery" },
];

export const KB_ARTICLES: KBArticle[] = [
  // ── SLEEP ──
  {
    slug: "sleep-duration",
    category: "sleep",
    emoji: "😴",
    title: "Sleep Duration",
    tagline: "Why 7–9 hours is non-negotiable for adults",
    sections: [
      {
        heading: "What the science says",
        body: "Adults who consistently sleep fewer than 7 hours show measurable declines in immune function, cognitive performance, and emotional regulation. A large meta-analysis of over 1.3 million participants found that both short sleep (<7 hours) and long sleep (>9 hours) were associated with increased all-cause mortality, with the lowest risk at approximately 7–8 hours.",
      },
      {
        heading: "How it affects your habits",
        body: "Sleep deprivation reduces prefrontal cortex activity — the brain region responsible for willpower and decision-making. Studies show that even one night of poor sleep increases impulsive eating by 30% and reduces exercise motivation. When you track sleep alongside your habits, you'll likely notice that your worst habit days follow your worst sleep nights.",
      },
      {
        heading: "Practical tips",
        body: "Maintain a consistent wake time (even weekends). Stop caffeine 8–10 hours before bed. Keep your room at 65–68°F (18–20°C). Dim lights 1 hour before sleep. If you can't fall asleep within 20 minutes, get up and do something boring in dim light until you feel sleepy.",
      },
    ],
    sources: [
      "Walker, M. (2017). Why We Sleep. Scribner.",
      "Cappuccio et al. (2010). Sleep duration and all-cause mortality. Sleep, 33(5).",
      "Killgore, W. (2010). Effects of sleep deprivation on cognition. Progress in Brain Research.",
    ],
  },
  {
    slug: "sleep-consistency",
    category: "sleep",
    emoji: "⏰",
    title: "Sleep Consistency",
    tagline: "Regular timing matters as much as duration",
    sections: [
      {
        heading: "What the science says",
        body: "Research from Harvard and Brigham and Women's Hospital found that irregular sleep schedules — varying bedtime or wake time by more than 30 minutes — were associated with poorer academic performance, worse metabolic health, and higher rates of cardiovascular disease, independent of total sleep duration.",
      },
      {
        heading: "Your circadian rhythm",
        body: "Your body runs on a 24-hour internal clock controlled by the suprachiasmatic nucleus. This clock regulates hormone release (melatonin, cortisol), body temperature, and alertness cycles. When you shift your sleep schedule, it takes about one day per hour of shift for your body to fully adjust — similar to jet lag.",
      },
      {
        heading: "Practical tips",
        body: "Set a consistent alarm, even on weekends. If you want to sleep in, limit it to 30 minutes extra. Use bright light exposure within 30 minutes of waking to anchor your circadian rhythm. Evening routines (same sequence of activities before bed) act as cues that tell your brain it's time to wind down.",
      },
    ],
    sources: [
      "Phillips et al. (2017). Irregular sleep/wake patterns. Scientific Reports, 7.",
      "Huang et al. (2020). Sleep irregularity and cardiovascular events. JACC.",
    ],
  },

  // ── EXERCISE ──
  {
    slug: "daily-movement",
    category: "exercise",
    emoji: "🚶",
    title: "Daily Movement",
    tagline: "Even 20 minutes changes your brain chemistry",
    sections: [
      {
        heading: "What the science says",
        body: "A single bout of moderate exercise increases BDNF (brain-derived neurotrophic factor), improves attention for 2–3 hours afterward, and reduces anxiety more effectively than a 10mg dose of diazepam in clinical comparisons. Regular exercisers show 30–40% lower rates of clinical depression across dozens of longitudinal studies.",
      },
      {
        heading: "The minimum effective dose",
        body: "The WHO recommends 150 minutes of moderate activity per week (about 22 minutes daily). However, research shows significant mortality benefits begin at just 11 minutes of brisk walking per day. The biggest health jump comes from moving from zero to some activity — diminishing returns set in after about 50 minutes of daily vigorous exercise.",
      },
      {
        heading: "Practical tips",
        body: "Start with a daily walk — it's the most underrated exercise. Stack movement with something you already do (walk during phone calls, stretch while watching TV). Track steps if it motivates you, but don't obsess over 10,000 — research suggests 7,000–8,000 provides most of the benefit.",
      },
    ],
    sources: [
      "Erickson et al. (2011). Exercise training increases hippocampal volume. PNAS.",
      "Schuch et al. (2018). Physical activity and depression. JAMA Psychiatry.",
      "Paluch et al. (2022). Daily steps and mortality. Lancet Public Health.",
    ],
  },
  {
    slug: "strength-training",
    category: "exercise",
    emoji: "🏋️",
    title: "Strength Training",
    tagline: "Resistance exercise as longevity medicine",
    sections: [
      {
        heading: "What the science says",
        body: "Muscle mass peaks around age 30 and declines 3–8% per decade after that (sarcopenia). Resistance training is the only intervention proven to reverse this. A 2022 systematic review found that strength training 2–3 times per week reduced all-cause mortality risk by 15% and cancer mortality by 12%, independent of aerobic exercise.",
      },
      {
        heading: "Beyond muscles",
        body: "Strength training improves bone density (reducing fracture risk), insulin sensitivity (reducing diabetes risk), and resting metabolic rate. It also has significant mental health benefits: a meta-analysis of 33 trials found resistance exercise significantly reduced depressive symptoms regardless of health status.",
      },
      {
        heading: "Practical tips",
        body: "Two sessions per week covering major muscle groups is enough for most benefits. Focus on progressive overload (gradually increasing weight/reps). Compound movements (squat, deadlift, press, row, pull-up) give the most return on time invested. Form matters more than weight — especially when starting.",
      },
    ],
    sources: [
      "Momma et al. (2022). Muscle-strengthening activities and mortality. Br J Sports Med.",
      "Gordon et al. (2018). Association of efficacy of resistance exercise training with depressive symptoms. JAMA Psychiatry.",
      "Westcott, W. (2012). Resistance training is medicine. Current Sports Medicine Reports.",
    ],
  },

  // ── NUTRITION & HYDRATION ──
  {
    slug: "hydration",
    category: "nutrition",
    emoji: "💧",
    title: "Hydration",
    tagline: "Why tracking water intake actually matters",
    sections: [
      {
        heading: "What the science says",
        body: "Even mild dehydration (1–2% body mass loss) impairs cognitive function, mood, and physical performance. A study in The Journal of Nutrition found that young women with 1.36% dehydration experienced degraded mood, increased headache frequency, and difficulty concentrating. Most people don't notice mild dehydration until it's already affecting them.",
      },
      {
        heading: "How much do you need?",
        body: "The classic '8 glasses a day' is a reasonable starting point, but needs vary by body size, climate, and activity level. The National Academies suggest about 3.7L total water per day for men and 2.7L for women, including water from food (which provides roughly 20% of intake). Active individuals and those in hot climates need more.",
      },
      {
        heading: "Practical tips",
        body: "Drink a full glass of water first thing in the morning — you're mildly dehydrated after 7–8 hours of sleep. Keep water visible at your desk. Tracking intake (like with the water tracker in this app) significantly increases consumption in studies. Urine color is a simple gauge: pale yellow = well hydrated.",
      },
    ],
    sources: [
      "Armstrong et al. (2012). Mild dehydration affects mood in healthy young women. J Nutr.",
      "National Academies (2004). Dietary Reference Intakes for Water.",
      "Liska et al. (2019). Narrative review of hydration and health. Nutrients.",
    ],
  },

  // ── MENTAL HEALTH ──
  {
    slug: "meditation",
    category: "mental",
    emoji: "🧘",
    title: "Meditation & Mindfulness",
    tagline: "Measurable brain changes in 8 weeks",
    sections: [
      {
        heading: "What the science says",
        body: "An 8-week mindfulness program (MBSR) produced measurable increases in gray matter density in brain regions associated with learning, memory, and emotion regulation, as shown by MRI scans at Massachusetts General Hospital. Regular meditators show reduced activity in the default mode network — the brain system responsible for mind-wandering and rumination.",
      },
      {
        heading: "Practical benefits",
        body: "Meta-analyses show meditation reduces anxiety (effect size d=0.63), depression (d=0.59), and chronic pain. Even 10 minutes daily shows benefits within 2–4 weeks. Importantly, meditation is not about stopping thoughts — it's about noticing them without getting pulled in. The 'noticing' itself strengthens attention circuits.",
      },
      {
        heading: "Getting started",
        body: "Start with 5 minutes of focused breathing — inhale 4 counts, hold 4, exhale 6. Do it at the same time daily to build the habit. Guided apps help beginners, but the goal is eventually to meditate without them. Don't judge your sessions as good or bad — the practice of returning attention when it wanders IS the exercise.",
      },
    ],
    sources: [
      "Hölzel et al. (2011). Mindfulness practice leads to brain gray matter changes. Psychiatry Research.",
      "Goyal et al. (2014). Meditation programs for psychological stress. JAMA Internal Medicine.",
      "Brewer et al. (2011). Meditation experience and default mode network. PNAS.",
    ],
  },
  {
    slug: "journaling",
    category: "mental",
    emoji: "📓",
    title: "Journaling",
    tagline: "Writing as a mental health tool",
    sections: [
      {
        heading: "What the science says",
        body: "James Pennebaker's landmark research showed that expressive writing about stressful events for just 15–20 minutes over 3–4 days improved immune function, reduced doctor visits, and improved mood for months afterward. The mechanism appears to be cognitive processing — writing helps organize chaotic thoughts into coherent narratives.",
      },
      {
        heading: "Gratitude journaling",
        body: "A separate body of research shows that writing down 3 things you're grateful for each day significantly increases happiness and life satisfaction. In Emmons' studies, the gratitude group exercised more, had fewer physical complaints, and felt more optimistic compared to those who wrote about neutral events or hassles.",
      },
      {
        heading: "Getting started",
        body: "Don't aim for long entries. Three sentences about what went well today, or one paragraph about something on your mind, is enough. The consistency of the practice matters more than the length. Morning journaling sets intentions; evening journaling processes the day. Pick whichever feels more natural.",
      },
    ],
    sources: [
      "Pennebaker, J. & Smyth, J. (2016). Opening Up by Writing It Down. Guilford Press.",
      "Emmons, R. & McCullough, M. (2003). Counting blessings vs burdens. J Personality and Social Psychology.",
    ],
  },

  // ── HABIT SCIENCE ──
  {
    slug: "habit-stacking",
    category: "habits",
    emoji: "🔗",
    title: "Habit Stacking",
    tagline: "The neuroscience of linking behaviors",
    sections: [
      {
        heading: "What the science says",
        body: "Habits form through a neurological loop: cue → routine → reward. When a behavior is repeated in the same context enough times, the basal ganglia takes over from the prefrontal cortex — the action becomes automatic. Research by Wood & Neal (2007) found that approximately 43% of daily behaviors are performed habitually, often while thinking about something else.",
      },
      {
        heading: "How stacking works",
        body: "Habit stacking (coined by BJ Fogg) uses an existing habit as the cue for a new one: 'After I [current habit], I will [new habit].' This works because existing neural pathways are already strong — you're essentially piggybacking on established brain circuitry instead of building entirely new pathways from scratch.",
      },
      {
        heading: "Application",
        body: "Identify your most reliable existing habits (morning coffee, brushing teeth, sitting at your desk). Attach new habits to these anchors. Keep the new habit small at first — under 2 minutes. The goal isn't immediate perfection; it's creating the neural pathway. Once the cue-response link is automatic, you can gradually increase intensity.",
      },
    ],
    sources: [
      "Wood, W. & Neal, D. (2007). A new look at habits. Psychological Bulletin, 133(6).",
      "Fogg, B.J. (2019). Tiny Habits. Houghton Mifflin Harcourt.",
      "Clear, J. (2018). Atomic Habits. Avery.",
    ],
  },
  {
    slug: "streak-psychology",
    category: "habits",
    emoji: "🔥",
    title: "The Power of Streaks",
    tagline: "Why consecutive days create lasting change",
    sections: [
      {
        heading: "What the science says",
        body: "Research from UCL found that it takes on average 66 days for a new behavior to become automatic, though the range was 18 to 254 days depending on complexity. The critical insight: missing a single day did not significantly affect the habit formation process. What killed habits was missing two or more consecutive days — the 'what-the-hell effect.'",
      },
      {
        heading: "Loss aversion and streaks",
        body: "Behavioral economics research shows people feel losses roughly twice as strongly as equivalent gains (Kahneman & Tversky). Once you build a streak, the pain of losing it becomes a powerful motivator. This is why streaks work: they convert an abstract goal ('be healthier') into a concrete, loss-averse commitment ('don't break the chain').",
      },
      {
        heading: "Healthy streak mindset",
        body: "Streaks are tools, not chains. If you miss a day, research shows the most important thing is getting back on track immediately — never miss twice. This app uses 'green days' specifically so that one slip doesn't erase your progress. Your total green days and best streak remain as evidence of your capability.",
      },
    ],
    sources: [
      "Lally et al. (2010). How are habits formed. European J Social Psychology, 40.",
      "Kahneman, D. (2011). Thinking, Fast and Slow. Farrar, Straus and Giroux.",
      "Duhigg, C. (2012). The Power of Habit. Random House.",
    ],
  },
  {
    slug: "identity-habits",
    category: "habits",
    emoji: "🪞",
    title: "Identity-Based Habits",
    tagline: "Becoming the person who does the thing",
    sections: [
      {
        heading: "What the science says",
        body: "Self-determination theory (Deci & Ryan) distinguishes between external motivation ('I should exercise') and internalized motivation ('I'm an active person'). Research consistently shows that identity-aligned behaviors are more persistent and require less willpower. When a behavior becomes part of who you are rather than what you do, compliance rates increase dramatically.",
      },
      {
        heading: "How it works",
        body: "Every time you complete a habit, you cast a vote for the type of person you want to become. No single vote is decisive, but as the votes accumulate, the evidence builds your self-image. Someone with 30 consecutive green days isn't just 'trying to be consistent' — they have undeniable proof they ARE consistent. The behavior follows the identity, not the other way around.",
      },
      {
        heading: "Application",
        body: "Reframe your habits in identity terms: not 'I need to meditate' but 'I'm someone who takes care of my mind.' When tempted to skip, ask: 'What would a healthy person do?' This activates identity-consistent behavior. The tracking in this app provides visible proof of your emerging identity — your streak IS your evidence.",
      },
    ],
    sources: [
      "Deci, E. & Ryan, R. (2000). Self-determination theory. Psychological Inquiry, 11(4).",
      "Clear, J. (2018). Atomic Habits. Avery.",
      "Oyserman et al. (2006). Possible selves and academic outcomes. J Personality and Social Psychology.",
    ],
  },

  // ── RECOVERY ──
  {
    slug: "cold-exposure",
    category: "recovery",
    emoji: "🧊",
    title: "Cold Exposure",
    tagline: "Cold water immersion and deliberate cold",
    sections: [
      {
        heading: "What the science says",
        body: "Cold water immersion (50–59°F / 10–15°C) triggers a significant norepinephrine release — up to 200–300% above baseline — which improves alertness, mood, and focus for several hours. A 2022 review in the International Journal of Circumpolar Health found consistent evidence for reduced inflammation markers and improved mood following regular cold exposure.",
      },
      {
        heading: "Recovery benefits",
        body: "For exercise recovery, cold water immersion after intense training reduces perceived muscle soreness and may speed functional recovery, though it can blunt some long-term strength adaptations if used after every resistance training session. The best evidence supports using cold exposure on rest days or after endurance-focused sessions.",
      },
      {
        heading: "Practical tips",
        body: "Start with 30 seconds of cold water at the end of your shower. Gradually work up to 1–3 minutes at the coldest setting. For cold plunges, 50–59°F for 2–5 minutes provides most benefits. The mental challenge of voluntarily entering cold water itself builds stress tolerance and discipline — the physical benefits are almost secondary.",
      },
    ],
    sources: [
      "Šrámek et al. (2000). Human physiological responses to cold exposure. Aviation, Space, and Environmental Medicine.",
      "Huberman, A. (2022). Using deliberate cold exposure for health and performance. Huberman Lab.",
      "Machado et al. (2016). Cold water immersion and recovery. Sports Medicine.",
    ],
  },
  {
    slug: "sauna",
    category: "recovery",
    emoji: "🔥",
    title: "Sauna & Heat Exposure",
    tagline: "Heat stress as a longevity tool",
    sections: [
      {
        heading: "What the science says",
        body: "A landmark Finnish study following 2,315 men for 20 years found that those who used a sauna 4–7 times per week had a 40% lower all-cause mortality risk compared to once-weekly users. Sauna bathing increases heart rate to 100–150 bpm (similar to moderate exercise), stimulates heat shock proteins, and improves cardiovascular function.",
      },
      {
        heading: "Brain and mood benefits",
        body: "Sauna use triggers a robust release of endorphins and dynorphins (which sensitize the brain to endorphins over time). A single sauna session has been shown to reduce cortisol levels and improve subjective well-being. Regular use is associated with reduced risk of dementia and Alzheimer's disease in the Finnish cohort studies.",
      },
      {
        heading: "Practical tips",
        body: "Traditional Finnish sauna at 174–212°F (80–100°C) for 15–20 minutes, 2–4 times per week provides the studied benefits. Infrared saunas operate at lower temperatures (120–140°F) and may require longer sessions. Hydrate well before and after. Avoid alcohol before sauna use. Cool down gradually afterward.",
      },
    ],
    sources: [
      "Laukkanen et al. (2015). Association between sauna bathing and fatal cardiovascular events. JAMA Internal Medicine.",
      "Laukkanen et al. (2017). Sauna bathing and dementia risk. Age and Ageing.",
      "Patrick, R. & Johnson, T. (2021). Sauna use as a lifestyle practice. Experimental Gerontology.",
    ],
  },
];
