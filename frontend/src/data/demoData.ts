export const SAMPLE_DATA = {
  target: "Obsidian",
  targetAliases: ["Obsidian", "Obsidian.md", "obsidian"],
  runs: [
    { name: "2026-04-15_note-apps", date: "Apr 15, 2026", queries: 48, winRate: 58 },
    { name: "2026-04-08_note-apps", date: "Apr 8, 2026", queries: 48, winRate: 52 },
    { name: "2026-04-01_note-apps", date: "Apr 1, 2026", queries: 48, winRate: 49 },
    { name: "2026-03-25_note-apps", date: "Mar 25, 2026", queries: 42, winRate: 44 },
    { name: "2026-03-18_note-apps", date: "Mar 18, 2026", queries: 42, winRate: 41 },
  ],
  currentRun: "2026-04-15_note-apps",

  summary: {
    total_queries: 48,
    providers: 3,
    target_mentions: 68,
    target_wins: 28,
    win_rate: 58,
    prev_win_rate: 52,
    brands: [
      { brand: "Notion", mentions: 94, found_in: 46, avg_score: 8.4, wins: 14, is_target: false },
      { brand: "Obsidian", mentions: 68, found_in: 41, avg_score: 7.9, wins: 28, is_target: true },
      { brand: "Evernote", mentions: 52, found_in: 38, avg_score: 6.2, wins: 3, is_target: false },
      { brand: "Apple Notes", mentions: 44, found_in: 32, avg_score: 6.0, wins: 1, is_target: false },
      { brand: "Roam Research", mentions: 38, found_in: 24, avg_score: 7.1, wins: 2, is_target: false },
      { brand: "Logseq", mentions: 31, found_in: 19, avg_score: 7.4, wins: 0, is_target: false },
      { brand: "Bear", mentions: 24, found_in: 18, avg_score: 6.5, wins: 0, is_target: false },
      { brand: "Craft", mentions: 19, found_in: 14, avg_score: 6.8, wins: 0, is_target: false },
    ],
  },

  providers: {
    providers: ["openai", "anthropic", "google"],
    mentions: [26, 24, 18],
    wins: [11, 10, 7],
    labels: ["GPT-4o", "Claude Sonnet 3.5", "Gemini 1.5 Pro"],
  },

  categories: {
    categories: ["privacy", "markdown-editors", "knowledge-mgmt", "students", "researchers", "writers", "free-tools"],
    win_rates: [82, 75, 68, 54, 62, 41, 28],
    target_wins: [9, 6, 8, 4, 3, 2, 1],
    total_queries: [11, 8, 12, 7, 5, 5, 4],
  },

  queries: [
    { id: 1, category: "privacy", question: "What is the best privacy-focused note-taking app?", providers: {
      openai: { winner: "Obsidian", brands: [{ brand: "Obsidian", count: 3, is_target: true }, { brand: "Standard Notes", count: 2, is_target: false }] },
      anthropic: { winner: "Obsidian", brands: [{ brand: "Obsidian", count: 4, is_target: true }] },
      google: { winner: "Standard Notes", brands: [{ brand: "Standard Notes", count: 2, is_target: false }, { brand: "Obsidian", count: 1, is_target: true }] },
    } },
    { id: 5, category: "knowledge-mgmt", question: "Best personal knowledge management tool?", providers: {
      openai: { winner: "Notion", brands: [{ brand: "Notion", count: 4, is_target: false }, { brand: "Obsidian", count: 3, is_target: true }] },
      anthropic: { winner: "Obsidian", brands: [{ brand: "Obsidian", count: 4, is_target: true }] },
      google: { winner: "Notion", brands: [{ brand: "Notion", count: 3, is_target: false }] },
    } }
  ],

  competitors: [
    { name: "Notion", aliases: ["Notion"] },
    { name: "Evernote", aliases: ["Evernote"] },
    { name: "Logseq", aliases: ["Logseq"] },
  ],

  comparison: {
    a: "2026-04-15_note-apps",
    b: "2026-04-01_note-apps",
    deltas: [
      { brand: "Obsidian", a: 68, b: 54, delta: 14, is_target: true },
      { brand: "Notion", a: 94, b: 102, delta: -8, is_target: false },
      { brand: "Logseq", a: 31, b: 22, delta: 9, is_target: false },
      { brand: "Evernote", a: 52, b: 58, delta: -6, is_target: false },
    ],
    winRateDelta: 9,
  },
};
