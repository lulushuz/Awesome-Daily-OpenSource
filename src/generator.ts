import fs from "node:fs";
import path from "node:path";
import { CuratedRepo, DailyCuration, RepoCategory } from "./types.js";

const MONTH_NAMES_TR = [
  "Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran",
  "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik"
];

function getLanguageBadgeColor(lang: string): string {
  const map: Record<string, string> = {
    Rust: "DEA584",
    Go: "00ADD8",
    TypeScript: "3178C6",
    JavaScript: "F7DF1E",
    Python: "3776AB",
    C: "555555",
    "C++": "F34B7D",
    Zig: "EC915C",
    Swift: "F05138",
    Kotlin: "7F52FF",
    Ruby: "701516",
    Shell: "89E051",
  };
  return map[lang] || "4F46E5";
}

export function generateDailyArtifacts(baseDir: string, repos: CuratedRepo[]): DailyCuration {
  const now = new Date();
  const year = now.getFullYear().toString();
  const monthNum = String(now.getMonth() + 1).padStart(2, "0");
  const monthName = MONTH_NAMES_TR[now.getMonth()];
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}-${monthNum}-${day}`;

  const monthFolder = `${monthNum}-${monthName}`;
  const archiveDir = path.join(baseDir, "archives", year, monthFolder);
  const dataDir = path.join(baseDir, "data");

  fs.mkdirSync(archiveDir, { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });

  // Group repos by categories
  const categoryOrder: { id: RepoCategory; title: string; description: string }[] = [
    { id: "top_pick", title: "🏆 Günün En İyileri (Top Picks)", description: "Günün en yüksek skor alan, toplulukta en hızlı ivmelenen bağımsız araçları." },
    { id: "ai_ml", title: "🤖 AI & Yapay Zeka", description: "Yerel modeller, RAG, agent çatıları ve LLM kütüphaneleri." },
    { id: "devtools_cli", title: "⚡ DevTools & Terminal Sistemleri", description: "Rust, Go, C ve Zig ile yazılmış hafif CLI ve altyapı araçları." },
    { id: "web_fullstack", title: "🌐 Web, Frontend & UI", description: "Modern framework'ler, arayüz bileşenleri ve API servisleri." },
    { id: "hidden_gem", title: "💎 Gizli Cevherler (Hidden Gems)", description: "Henüz yıldızı az (< 250) ama fikri ve mühendisliği dahi bağımsız projeler." },
  ];

  const groupedCategories = categoryOrder.map((cat) => ({
    id: cat.id,
    title: cat.title,
    description: cat.description,
    repos: repos.filter((r) => r.category === cat.id),
  }));

  const curation: DailyCuration = {
    date: dateStr,
    year,
    month: monthNum,
    monthName,
    timestamp: now.toISOString(),
    totalCount: repos.length,
    categories: groupedCategories,
  };

  // 1. Write archive JSON
  const archiveJsonPath = path.join(archiveDir, `${dateStr}.json`);
  fs.writeFileSync(archiveJsonPath, JSON.stringify(curation, null, 2), "utf-8");

  // 2. Write data/latest.json (Used by GitFeed)
  const latestJsonPath = path.join(dataDir, "latest.json");
  fs.writeFileSync(latestJsonPath, JSON.stringify(curation, null, 2), "utf-8");

  // 3. Generate Archive Markdown
  const archiveMd = renderCurationMarkdown(curation, false);
  const archiveMdPath = path.join(archiveDir, `${dateStr}.md`);
  fs.writeFileSync(archiveMdPath, archiveMd, "utf-8");

  // 4. Update Root README.md
  const readmeMd = renderRootReadme(baseDir, curation);
  const readmePath = path.join(baseDir, "README.md");
  fs.writeFileSync(readmePath, readmeMd, "utf-8");

  console.log(`📁 Arşiv kaydedildi: ${archiveMdPath}`);
  console.log(`⚡ latest.json güncellendi: ${latestJsonPath}`);
  console.log(`📝 README.md başarıyla yenilendi.`);

  return curation;
}

function renderCurationMarkdown(curation: DailyCuration, isRoot: boolean): string {
  let md = "";
  if (!isRoot) {
    md += `# 📅 GitCurator Günlük Rapor — ${curation.date}\n\n`;
    md += `> Bu raporda GitHub üzerinde 7 katmanlı kalite filtresinden geçerek seçilen **${curation.totalCount} harika açık kaynak proje** listelenmiştir.\n\n`;
  }

  for (const group of curation.categories) {
    if (group.repos.length === 0) continue;
    md += `### ${group.title}\n`;
    md += `*${group.description}*\n\n`;

    for (const repo of group.repos) {
      const langColor = getLanguageBadgeColor(repo.primaryLanguage);
      md += `#### [${repo.fullName}](${repo.repoUrl})\n\n`;
      md += `> ${repo.description}\n\n`;
      md += `![Language](https://img.shields.io/badge/${encodeURIComponent(repo.primaryLanguage)}-${langColor}?style=flat-square) `;
      md += `![Stars](https://img.shields.io/badge/Stars-${repo.stars}-yellow?style=flat-square&logo=github) `;
      md += `![Forks](https://img.shields.io/badge/Forks-${repo.forks}-blue?style=flat-square) `;
      md += `![License](https://img.shields.io/badge/License-${encodeURIComponent(repo.licenseName.replace(/-/g, "--"))}-success?style=flat-square)\n\n`;
      if (repo.tags.length > 0) {
        md += `\`${repo.tags.join("` `")}\`\n\n`;
      }
      md += `---\n\n`;
    }
  }

  return md;
}

function renderRootReadme(baseDir: string, latestCuration: DailyCuration): string {
  let md = `# ⚡ Awesome-Daily-OpenSource — Günlük 15 Açık Kaynak Proje Radarı\n\n`;
  md += `> **Her gece 00:00 UTC'de** GitHub'da son 30 gün içinde ivmelenen en kaliteli **15 bağımsız açık kaynak projeyi** otonom olarak keşfeden, filtreleyen ve arşivleyen günlük teknoloji bülteni.\n\n`;
  md += `[![Daily Curation](https://github.com/lulushuz/Awesome-Daily-OpenSource/actions/workflows/daily-curate.yml/badge.svg)](https://github.com/lulushuz/Awesome-Daily-OpenSource/actions)\n`;
  md += `[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)\n`;
  md += `[![Curated Repos](https://img.shields.io/badge/G%C3%BCnl%C3%BCk-15%20Repo-success?style=flat-square)](archives/)\n\n`;

  md += `## 🔥 Bugünün En İyi 15 Açık Kaynak Projesi (${latestCuration.date})\n\n`;
  md += renderCurationMarkdown(latestCuration, true);

  // Archive index section
  md += `## 📚 Geçmiş Günlerin Arşivi\n\n`;
  md += `Tüm geçmiş raporlar [archives/](archives/) dizininde yıl ve ay bazlı olarak güvenle saklanmaktadır:\n\n`;

  const archivesRoot = path.join(baseDir, "archives");
  if (fs.existsSync(archivesRoot)) {
    const years = fs.readdirSync(archivesRoot).filter((f) => !f.startsWith(".") && fs.statSync(path.join(archivesRoot, f)).isDirectory()).sort().reverse();
    for (const y of years) {
      md += `### 📁 ${y} Arşivi\n`;
      const yearDir = path.join(archivesRoot, y);
      const months = fs.readdirSync(yearDir).filter((f) => !f.startsWith(".") && fs.statSync(path.join(yearDir, f)).isDirectory()).sort().reverse();
      for (const m of months) {
        const monthDir = path.join(yearDir, m);
        const dayFiles = fs.readdirSync(monthDir).filter((f) => f.endsWith(".md")).sort().reverse();
        md += `- **${m} (${dayFiles.length} Gün):** `;
        const dayLinks = dayFiles.map((df) => `[${df.replace(".md", "")}](archives/${y}/${m}/${df})`);
        md += dayLinks.slice(0, 10).join(" · ");
        if (dayLinks.length > 10) md += ` · *...diğerleri*`;
        md += `\n`;
      }
      md += `\n`;
    }
  }

  md += `## 🛡️ Kalite Değerlendirme Kriterleri\n\n`;
  md += `Her repo GitCurator'a giremez. Bot aşağıdaki 7 katmanlı değerlendirme filtresini uygular:\n\n`;
  md += `1. **Resmi Açık Kaynak Lisansı:** Yalnızca OSI onaylı (MIT, Apache-2.0, GPL, BSD vb.) lisansı olan repolar kabul edilir.\n`;
  md += `2. **Özgünlük (No Forks):** Fork edilmiş kopyalar doğrudan elenir.\n`;
  md += `3. **Anti-Spam / Anti-Tutorial:** Ödev, kurs, hile sayfası veya "awesome-list" listeleri elenir; yalnızca çalışan gerçek yazılımlar seçilir.\n`;
  md += `4. **Tazelik & Momentum:** Son 30 günde açılmış veya son 72 saatte aktif commit almış olmalıdır.\n`;
  md += `5. **Zengin Açıklama:** Açıklaması boş veya 20 karakterden kısa olan özensiz repolar elenir.\n`;
  md += `6. **Dil Çeşitliliği:** Rust, Go, TypeScript, Python, Zig vb. diller arasında dengeli dağılım sağlanır.\n`;
  md += `7. **Kategorizasyon:** 15 repo Günün Vitrini, AI, DevTools, Web ve Gizli Cevherler olarak 5 gruba ayrılır.\n\n`;

  md += `## 🚀 GitFeed Entegrasyonu\n\n`;
  md += `GitCurator tarafından üretilen \`data/latest.json\` dosyası [GitFeed](https://github.com/lulushu/git-feed) web platformuna doğrudan taze veri pompalamak üzere API standartlarına uygun yapılandırılmıştır.\n\n`;

  md += `---\n\n`;
  md += `*Otonom olarak her gün 00:00 UTC'de [GitHub Actions](https://github.com/lulushuz/Awesome-Daily-OpenSource/actions) ile güncellenir.* 🤖\n`;

  return md;
}
