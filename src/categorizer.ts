import { RawGitHubRepo, CuratedRepo, RepoCategory } from "./types.js";
import { calculateCuratorScore } from "./filter.js";

const AI_KEYWORDS = [
  "ai",
  "llm",
  "gpt",
  "rag",
  "agent",
  "inference",
  "vision",
  "neural",
  "diffusion",
  "embedding",
  "langchain",
  "ollama",
  "machine-learning",
  "deep-learning",
  "transformers",
  "whisper",
];

const DEVTOOLS_KEYWORDS = [
  "cli",
  "terminal",
  "tui",
  "devtools",
  "developer-tools",
  "compiler",
  "linter",
  "database",
  "docker",
  "kubernetes",
  "shell",
  "system",
  "profiler",
  "benchmark",
  "git",
  "wasm",
  "debugger",
];

const WEB_KEYWORDS = [
  "web",
  "frontend",
  "backend",
  "react",
  "nextjs",
  "vue",
  "svelte",
  "tailwind",
  "ui",
  "css",
  "component",
  "fullstack",
  "rest-api",
  "graphql",
  "server",
  "http",
  "router",
];

function detectRepoCategory(repo: RawGitHubRepo): RepoCategory {
  const text = `${repo.name} ${repo.description || ""} ${(repo.topics || []).join(" ")}`.toLowerCase();

  for (const kw of AI_KEYWORDS) {
    if (text.includes(kw)) return "ai_ml";
  }

  for (const kw of DEVTOOLS_KEYWORDS) {
    if (text.includes(kw)) return "devtools_cli";
  }

  for (const kw of WEB_KEYWORDS) {
    if (text.includes(kw)) return "web_fullstack";
  }

  // Language heuristics
  const lang = (repo.language || "").toLowerCase();
  if (["rust", "go", "c", "c++", "zig", "assembly"].includes(lang)) {
    return "devtools_cli";
  }
  if (["typescript", "javascript", "html", "css"].includes(lang)) {
    return "web_fullstack";
  }
  if (["python", "jupyter notebook"].includes(lang)) {
    return "ai_ml";
  }

  return "devtools_cli";
}

export function categorizeAndSelect15(candidates: RawGitHubRepo[]): CuratedRepo[] {
  // Map candidates with their base category and scores
  const scored = candidates.map((repo) => ({
    repo,
    score: calculateCuratorScore(repo),
    baseCategory: detectRepoCategory(repo),
  }));

  // Sort descending by curator score
  scored.sort((a, b) => b.score - a.score);

  const selectedSet = new Set<number>();
  const finalRepos: CuratedRepo[] = [];

  // Helper to convert Raw -> Curated
  const toCurated = (raw: RawGitHubRepo, cat: RepoCategory, catLabel: string, score: number): CuratedRepo => ({
    id: raw.id.toString(),
    name: raw.name,
    fullName: raw.full_name,
    owner: {
      username: raw.owner.login,
      avatarUrl: raw.owner.avatar_url,
      githubUrl: raw.owner.html_url,
    },
    description: raw.description || "Açıklama belirtilmemiş.",
    pitch: raw.description || "",
    repoUrl: raw.html_url,
    homepageUrl: raw.homepage && raw.homepage.startsWith("http") ? raw.homepage : undefined,
    primaryLanguage: raw.language || "Other",
    stars: raw.stargazers_count,
    forks: raw.forks_count,
    openIssues: raw.open_issues_count,
    licenseName: raw.license?.name || "Open Source",
    tags: (raw.topics || []).slice(0, 5),
    category: cat,
    categoryLabel: catLabel,
    curatorScore: score,
    createdAt: raw.created_at,
    pushedAt: raw.pushed_at,
  });

  // 1. TOP PICKS: Top 3 highest scoring repos
  const topPicks = scored.slice(0, 3);
  for (const item of topPicks) {
    selectedSet.add(item.repo.id);
    finalRepos.push(toCurated(item.repo, "top_pick", "🏆 Günün En İyileri", item.score));
  }

  // 2. AI & ML: 3 repos
  const aiCandidates = scored.filter(
    (item) => !selectedSet.has(item.repo.id) && item.baseCategory === "ai_ml"
  );
  for (const item of aiCandidates.slice(0, 3)) {
    selectedSet.add(item.repo.id);
    finalRepos.push(toCurated(item.repo, "ai_ml", "🤖 AI & Yapay Zeka", item.score));
  }

  // 3. DEVTOOLS & CLI: 3 repos
  const devtoolsCandidates = scored.filter(
    (item) => !selectedSet.has(item.repo.id) && item.baseCategory === "devtools_cli"
  );
  for (const item of devtoolsCandidates.slice(0, 3)) {
    selectedSet.add(item.repo.id);
    finalRepos.push(toCurated(item.repo, "devtools_cli", "⚡ DevTools & Terminal", item.score));
  }

  // 4. WEB & FULLSTACK: 3 repos
  const webCandidates = scored.filter(
    (item) => !selectedSet.has(item.repo.id) && item.baseCategory === "web_fullstack"
  );
  for (const item of webCandidates.slice(0, 3)) {
    selectedSet.add(item.repo.id);
    finalRepos.push(toCurated(item.repo, "web_fullstack", "🌐 Web & Fullstack", item.score));
  }

  // 5. HIDDEN GEMS: 3 repos with < 200 stars that have high freshness & originality
  const gemCandidates = scored.filter(
    (item) =>
      !selectedSet.has(item.repo.id) &&
      item.repo.stargazers_count >= 10 &&
      item.repo.stargazers_count <= 250
  );
  for (const item of gemCandidates.slice(0, 3)) {
    selectedSet.add(item.repo.id);
    finalRepos.push(toCurated(item.repo, "hidden_gem", "💎 Gizli Cevherler", item.score));
  }

  // If any category had fewer than 3 candidates, fill up to 15 from remaining highest scored repos
  if (finalRepos.length < 15) {
    const remaining = scored.filter((item) => !selectedSet.has(item.repo.id));
    for (const item of remaining) {
      if (finalRepos.length >= 15) break;
      selectedSet.add(item.repo.id);
      finalRepos.push(toCurated(item.repo, item.baseCategory, "🚀 Öne Çıkanlar", item.score));
    }
  }

  return finalRepos.slice(0, 15);
}
