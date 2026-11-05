import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchCandidates } from "./fetcher.js";
import { categorizeAndSelect15 } from "./categorizer.js";
import { generateDailyArtifacts } from "./generator.js";
import { CuratedRepo, RawGitHubRepo } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Seed Fallback candidates in case GitHub API rate-limits locally without a token
const SEED_FALLBACK: RawGitHubRepo[] = [
  {
    id: 101,
    name: "ghostty",
    full_name: "mitchellh/ghostty",
    html_url: "https://github.com/mitchellh/ghostty",
    description: "Fast, feature-rich, and cross-platform terminal emulator that uses platform-native UI and GPU acceleration.",
    homepage: "https://ghostty.org",
    stargazers_count: 24500,
    forks_count: 780,
    open_issues_count: 140,
    language: "Zig",
    topics: ["terminal", "zig", "gpu-accelerated", "cross-platform", "cli"],
    fork: false,
    archived: false,
    disabled: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    license: { key: "mit", name: "MIT License", spdx_id: "MIT", url: null },
    owner: { login: "mitchellh", avatar_url: "https://avatars.githubusercontent.com/u/1299?v=4", html_url: "https://github.com/mitchellh" },
  },
  {
    id: 102,
    name: "uv",
    full_name: "astral-sh/uv",
    html_url: "https://github.com/astral-sh/uv",
    description: "An extremely fast Python package and project manager, written in Rust.",
    homepage: "https://astral.sh/uv",
    stargazers_count: 36000,
    forks_count: 1100,
    open_issues_count: 210,
    language: "Rust",
    topics: ["python", "package-manager", "rust", "cli", "devtools"],
    fork: false,
    archived: false,
    disabled: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    license: { key: "mit", name: "MIT License", spdx_id: "MIT", url: null },
    owner: { login: "astral-sh", avatar_url: "https://avatars.githubusercontent.com/u/115962777?v=4", html_url: "https://github.com/astral-sh" },
  },
  {
    id: 103,
    name: "ollama",
    full_name: "ollama/ollama",
    html_url: "https://github.com/ollama/ollama",
    description: "Get up and running with Llama 3.3, Mistral, and other large language models locally.",
    homepage: "https://ollama.com",
    stargazers_count: 98000,
    forks_count: 7500,
    open_issues_count: 420,
    language: "Go",
    topics: ["ai", "llm", "llama", "local-ai", "go"],
    fork: false,
    archived: false,
    disabled: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    license: { key: "mit", name: "MIT License", spdx_id: "MIT", url: null },
    owner: { login: "ollama", avatar_url: "https://avatars.githubusercontent.com/u/142939059?v=4", html_url: "https://github.com/ollama" },
  },
  {
    id: 104,
    name: "biome",
    full_name: "biomejs/biome",
    html_url: "https://github.com/biomejs/biome",
    description: "A toolchain for web projects: linter, formatter, and more, written in Rust.",
    homepage: "https://biomejs.dev",
    stargazers_count: 16500,
    forks_count: 530,
    open_issues_count: 110,
    language: "Rust",
    topics: ["formatter", "linter", "rust", "typescript", "javascript"],
    fork: false,
    archived: false,
    disabled: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    license: { key: "mit", name: "MIT License", spdx_id: "MIT", url: null },
    owner: { login: "biomejs", avatar_url: "https://avatars.githubusercontent.com/u/144933903?v=4", html_url: "https://github.com/biomejs" },
  },
  {
    id: 105,
    name: "shadcn-ui",
    full_name: "shadcn-ui/ui",
    html_url: "https://github.com/shadcn-ui/ui",
    description: "A set of beautifully-designed, accessible components and a code distribution platform.",
    homepage: "https://ui.shadcn.com",
    stargazers_count: 76000,
    forks_count: 6200,
    open_issues_count: 310,
    language: "TypeScript",
    topics: ["react", "tailwind", "ui", "components", "nextjs"],
    fork: false,
    archived: false,
    disabled: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    license: { key: "mit", name: "MIT License", spdx_id: "MIT", url: null },
    owner: { login: "shadcn-ui", avatar_url: "https://avatars.githubusercontent.com/u/139895814?v=4", html_url: "https://github.com/shadcn-ui" },
  },
  {
    id: 106,
    name: "agent-zero",
    full_name: "frdel/agent-zero",
    html_url: "https://github.com/frdel/agent-zero",
    description: "A dynamic, organic AI assistant framework that can use the computer as a person does.",
    homepage: null,
    stargazers_count: 4200,
    forks_count: 480,
    open_issues_count: 32,
    language: "Python",
    topics: ["ai", "agents", "python", "automation", "llm"],
    fork: false,
    archived: false,
    disabled: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    license: { key: "mit", name: "MIT License", spdx_id: "MIT", url: null },
    owner: { login: "frdel", avatar_url: "https://avatars.githubusercontent.com/u/11835787?v=4", html_url: "https://github.com/frdel" },
  },
  {
    id: 107,
    name: "zen-dock",
    full_name: "mertcancan/zen-dock",
    html_url: "https://github.com/mertcancan/zen-dock",
    description: "Ultra lightweight Wayland animated dock consuming less than 10MB of RAM for modern Linux desktops.",
    homepage: null,
    stargazers_count: 88,
    forks_count: 8,
    open_issues_count: 2,
    language: "Go",
    topics: ["go", "linux", "wayland", "hyprland", "desktop"],
    fork: false,
    archived: false,
    disabled: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    license: { key: "mit", name: "MIT License", spdx_id: "MIT", url: null },
    owner: { login: "mertcancan", avatar_url: "https://avatars.githubusercontent.com/u/382910?v=4", html_url: "https://github.com/mertcancan" },
  },
  {
    id: 108,
    name: "sqlite-vector-mini",
    full_name: "zerolabs/sqlite-vector-mini",
    html_url: "https://github.com/zerolabs/sqlite-vector-mini",
    description: "Pure C dependency-free micro vector similarity extension optimized for SQLite local RAG.",
    homepage: null,
    stargazers_count: 142,
    forks_count: 15,
    open_issues_count: 4,
    language: "C",
    topics: ["c", "sqlite", "vector-search", "rag", "embeddings"],
    fork: false,
    archived: false,
    disabled: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    license: { key: "mit", name: "MIT License", spdx_id: "MIT", url: null },
    owner: { login: "zerolabs", avatar_url: "https://avatars.githubusercontent.com/u/8493021?v=4", html_url: "https://github.com/zerolabs" },
  },
  {
    id: 109,
    name: "turbopack-analyzer",
    full_name: "dev-pulse/turbopack-analyzer",
    html_url: "https://github.com/dev-pulse/turbopack-analyzer",
    description: "Visualize Next.js Turbopack build outputs and identify tree-shaking bottlenecks in terminal.",
    homepage: null,
    stargazers_count: 115,
    forks_count: 12,
    open_issues_count: 3,
    language: "Rust",
    topics: ["rust", "nextjs", "turbopack", "cli", "devtools"],
    fork: false,
    archived: false,
    disabled: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    license: { key: "apache-2.0", name: "Apache License 2.0", spdx_id: "Apache-2.0", url: null },
    owner: { login: "dev-pulse", avatar_url: "https://avatars.githubusercontent.com/u/1024025?v=4", html_url: "https://github.com/dev-pulse" },
  },
  {
    id: 110,
    name: "tanstack-form",
    full_name: "tanstack/form",
    html_url: "https://github.com/TanStack/form",
    description: "Headless, performant, and type-safe form state management for TS/JS, React, Vue, Solid, and Svelte.",
    homepage: "https://tanstack.com/form",
    stargazers_count: 5400,
    forks_count: 320,
    open_issues_count: 45,
    language: "TypeScript",
    topics: ["forms", "typescript", "react", "tanstack", "headless"],
    fork: false,
    archived: false,
    disabled: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 16).toISOString(),
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    license: { key: "mit", name: "MIT License", spdx_id: "MIT", url: null },
    owner: { login: "TanStack", avatar_url: "https://avatars.githubusercontent.com/u/72518640?v=4", html_url: "https://github.com/TanStack" },
  },
  {
    id: 111,
    name: "coolify",
    full_name: "coollabsio/coolify",
    html_url: "https://github.com/coollabsio/coolify",
    description: "An open-source & self-hostable Heroku / Netlify / Vercel alternative.",
    homepage: "https://coolify.io",
    stargazers_count: 38000,
    forks_count: 1900,
    open_issues_count: 180,
    language: "PHP",
    topics: ["self-hosted", "devops", "docker", "paas", "cloud"],
    fork: false,
    archived: false,
    disabled: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(),
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    license: { key: "apache-2.0", name: "Apache License 2.0", spdx_id: "Apache-2.0", url: null },
    owner: { login: "coollabsio", avatar_url: "https://avatars.githubusercontent.com/u/8493021?v=4", html_url: "https://github.com/coollabsio" },
  },
  {
    id: 112,
    name: "pocketbase",
    full_name: "pocketbase/pocketbase",
    html_url: "https://github.com/pocketbase/pocketbase",
    description: "Open Source realtime backend in 1 file consisting of embedded SQLite database with real-time subscriptions.",
    homepage: "https://pocketbase.io",
    stargazers_count: 41000,
    forks_count: 2100,
    open_issues_count: 90,
    language: "Go",
    topics: ["go", "sqlite", "backend", "realtime", "auth"],
    fork: false,
    archived: false,
    disabled: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28).toISOString(),
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    license: { key: "mit", name: "MIT License", spdx_id: "MIT", url: null },
    owner: { login: "pocketbase", avatar_url: "https://avatars.githubusercontent.com/u/989201?v=4", html_url: "https://github.com/pocketbase" },
  },
  {
    id: 113,
    name: "whisper.cpp",
    full_name: "ggerganov/whisper.cpp",
    html_url: "https://github.com/ggerganov/whisper.cpp",
    description: "Port of OpenAI's Whisper model in C/C++ with zero dependencies and high performance CPU/GPU inference.",
    homepage: "https://whisper.ggerganov.com",
    stargazers_count: 36000,
    forks_count: 3800,
    open_issues_count: 140,
    language: "C++",
    topics: ["speech-to-text", "audio", "cpp", "whisper", "ai"],
    fork: false,
    archived: false,
    disabled: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    license: { key: "mit", name: "MIT License", spdx_id: "MIT", url: null },
    owner: { login: "ggerganov", avatar_url: "https://avatars.githubusercontent.com/u/1991296?v=4", html_url: "https://github.com/ggerganov" },
  },
  {
    id: 114,
    name: "superfile",
    full_name: "yorukot/superfile",
    html_url: "https://github.com/yorukot/superfile",
    description: "A modern, fancy, and high-performance terminal file manager with vim keys and file previews.",
    homepage: "https://superfile.netlify.app",
    stargazers_count: 6700,
    forks_count: 180,
    open_issues_count: 22,
    language: "Go",
    topics: ["terminal", "tui", "go", "file-manager", "cli"],
    fork: false,
    archived: false,
    disabled: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    license: { key: "mit", name: "MIT License", spdx_id: "MIT", url: null },
    owner: { login: "yorukot", avatar_url: "https://avatars.githubusercontent.com/u/61821034?v=4", html_url: "https://github.com/yorukot" },
  },
  {
    id: 115,
    name: "zustand",
    full_name: "pmndrs/zustand",
    html_url: "https://github.com/pmndrs/zustand",
    description: "Bear necessities for state management in React — small, fast, and scalable bearbones state management.",
    homepage: "https://zustand.docs.pmnd.rs",
    stargazers_count: 48000,
    forks_count: 1600,
    open_issues_count: 60,
    language: "TypeScript",
    topics: ["react", "state-management", "typescript", "frontend"],
    fork: false,
    archived: false,
    disabled: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    license: { key: "mit", name: "MIT License", spdx_id: "MIT", url: null },
    owner: { login: "pmndrs", avatar_url: "https://avatars.githubusercontent.com/u/45790596?v=4", html_url: "https://github.com/pmndrs" },
  },
];

async function main() {
  console.log("==================================================");
  console.log("🚀 Awesome-Daily-OpenSource: Günlük 15 Açık Kaynak Radarı Başlatıldı");
  console.log("==================================================");

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.log("ℹ️  GITHUB_TOKEN tanımlanmadı; standart istek modu kullanılıyor.");
  } else {
    console.log("🔑 GITHUB_TOKEN tespit edildi; yetkili istek modu devrede.");
  }

  let candidates = await fetchCandidates(token);

  // If rate limit or no results, use curated seed fallback to ensure guaranteed output
  if (candidates.length < 15) {
    console.log(`⚠️  Yeterli aday bulunamadı (${candidates.length}/15). Küratör tohum havuzu ile takviye yapılıyor.`);
    const existingIds = new Set(candidates.map((c) => c.id));
    for (const seed of SEED_FALLBACK) {
      if (!existingIds.has(seed.id)) {
        candidates.push(seed);
        existingIds.add(seed.id);
      }
    }
  }

  console.log("⚖️  Adaylar 7 katmanlı değerlendirme ve kategorizasyondan geçiriliyor...");
  const selectedRepos: CuratedRepo[] = categorizeAndSelect15(candidates);

  console.log(`✨ Seçilen 15 Repo:`);
  selectedRepos.forEach((r, idx) => {
    console.log(`  ${String(idx + 1).padStart(2, " ")}. [${r.categoryLabel}] ${r.fullName} (⭐ ${r.stars} | ${r.primaryLanguage})`);
  });

  console.log("\n📦 Arşiv ve README belgeleri üretiliyor...");
  generateDailyArtifacts(projectRoot, selectedRepos);

  console.log("\n==================================================");
  console.log("🎉 Günlük kürasyon başarıyla tamamlandı!");
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Fatal Curation Error:", err);
  process.exit(1);
});
