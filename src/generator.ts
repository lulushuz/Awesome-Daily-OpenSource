import fs from "node:fs";
import path from "node:path";
import { CuratedRepo, DailyCuration, RepoCategory } from "./types.js";

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return num.toString();
}

function cleanDescription(desc: string): string {
  return desc.replace(/\r?\n|\r/g, " ").trim();
}

export function generateDailyArtifacts(baseDir: string, repos: CuratedRepo[]): DailyCuration {
  const now = new Date();
  const year = now.getFullYear().toString();
  const monthNum = String(now.getMonth() + 1).padStart(2, "0");
  const monthName = MONTH_NAMES_EN[now.getMonth()];
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}-${monthNum}-${day}`;

  const monthFolder = `${monthNum}-${monthName}`;
  const archiveDir = path.join(baseDir, "archives", year, monthFolder);
  const dataDir = path.join(baseDir, "data");

  fs.mkdirSync(archiveDir, { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });

  // Clean up legacy Turkish folder if it exists
  const legacyTurkishDir = path.join(baseDir, "archives", year, `${monthNum}-Kasim`);
  if (fs.existsSync(legacyTurkishDir) && legacyTurkishDir !== archiveDir) {
    try {
      fs.rmSync(legacyTurkishDir, { recursive: true, force: true });
    } catch {
      // Ignore if not removable
    }
  }

  // Category definitions without emojis
  const categoryOrder: { id: RepoCategory; title: string; description: string }[] = [
    {
      id: "top_pick",
      title: "Top Picks",
      description: "The fastest-accelerating, highest-impact open-source tools of the day.",
    },
    {
      id: "ai_ml",
      title: "AI & Machine Learning",
      description: "Local models, RAG engines, agent frameworks, and LLM utilities.",
    },
    {
      id: "devtools_cli",
      title: "DevTools & Systems",
      description: "Lightweight CLI, compilers, databases, and infra in Rust, Go, Zig & C.",
    },
    {
      id: "web_fullstack",
      title: "Web & Fullstack",
      description: "Modern UI components, web frameworks, and backend services.",
    },
    {
      id: "hidden_gem",
      title: "Hidden Gems",
      description: "Early-stage repos (< 250 stars) with exceptional engineering and novelty.",
    },
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

  // 2. Write data/latest.json
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

  console.log(`Archive saved: ${archiveMdPath}`);
  console.log(`latest.json updated: ${latestJsonPath}`);
  console.log(`README.md updated with minimal design.`);

  return curation;
}

function renderCurationMarkdown(curation: DailyCuration, isRoot: boolean): string {
  let md = "";
  if (!isRoot) {
    md += `# Awesome Daily Open Source — ${curation.date}\n\n`;
    md += `> Top **${curation.totalCount} open-source repositories** filtered through a 7-stage quality pipeline.\n\n`;
  }

  for (const group of curation.categories) {
    if (group.repos.length === 0) continue;
    md += `### ${group.title}\n`;
    md += `*${group.description}*\n\n`;

    for (const repo of group.repos) {
      const cleanDesc = cleanDescription(repo.description);
      const starStr = formatNumber(repo.stars);
      const forkStr = formatNumber(repo.forks);
      const licenseShort = repo.licenseName.replace(/ License/i, "");

      md += `- [**${repo.fullName}**](${repo.repoUrl}) — ${cleanDesc}\n`;
      md += `  \`${repo.primaryLanguage}\` · \`${starStr} stars\` · \`${forkStr} forks\` · \`${licenseShort}\``;
      if (repo.tags.length > 0) {
        md += ` · *${repo.tags.slice(0, 3).map((t) => `#${t}`).join(" ")}*`;
      }
      md += `\n\n`;
    }
  }

  return md;
}

function renderRootReadme(baseDir: string, latestCuration: DailyCuration): string {
  let md = `<div align="center">\n\n`;
  md += `# Awesome Daily Open Source\n\n`;
  md += `**Curating the top 15 rising open-source repositories every single day at 00:00 UTC.**\n\n`;
  md += `[![Daily Curation](https://github.com/lulushuz/Awesome-Daily-OpenSource/actions/workflows/daily-curate.yml/badge.svg)](https://github.com/lulushuz/Awesome-Daily-OpenSource/actions)\n`;
  md += `[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)\n`;
  md += `[![Daily Repos](https://img.shields.io/badge/Daily-15%20Repos-success?style=flat-square)](archives/)\n\n`;
  md += `[Archives](archives) · [Latest JSON Feed](data/latest.json)\n\n`;
  md += `</div>\n\n`;
  md += `---\n\n`;

  md += `## Today's Top 15 Repositories (${latestCuration.date})\n\n`;
  md += renderCurationMarkdown(latestCuration, true);

  md += `---\n\n`;
  md += `## Archives\n\n`;
  md += `All past selections are permanently preserved under [\`archives/\`](archives/):\n\n`;

  const archivesRoot = path.join(baseDir, "archives");
  if (fs.existsSync(archivesRoot)) {
    const years = fs.readdirSync(archivesRoot).filter((f) => !f.startsWith(".") && fs.statSync(path.join(archivesRoot, f)).isDirectory()).sort().reverse();
    if (years.length > 0) {
      md += `| Year / Month | Reports | Latest Days |\n`;
      md += `|:---|:---:|:---|\n`;

      for (const y of years) {
        const yearDir = path.join(archivesRoot, y);
        const months = fs.readdirSync(yearDir).filter((f) => !f.startsWith(".") && fs.statSync(path.join(yearDir, f)).isDirectory()).sort().reverse();
        for (const m of months) {
          const monthDir = path.join(yearDir, m);
          const dayFiles = fs.readdirSync(monthDir).filter((f) => f.endsWith(".md")).sort().reverse();
          const dayLinks = dayFiles.slice(0, 5).map((df) => `[\`${df.replace(".md", "")}\`](archives/${y}/${m}/${df})`).join(", ");
          md += `| **${y} / ${m}** | ${dayFiles.length} | ${dayLinks} |\n`;
        }
      }
      md += `\n`;
    }
  }

  md += `## Evaluation Criteria\n\n`;
  md += `Every candidate repo must pass 7 automated quality filters:\n\n`;
  md += `1. **OSI-Approved License:** Must have an official open-source license (MIT, Apache-2.0, GPL, BSD, etc.).\n`;
  md += `2. **Original Software (No Forks):** Duplicates, mirrors, and forks are excluded.\n`;
  md += `3. **Anti-Spam & Anti-Tutorial:** Homework, cheat sheets, interview prep, and static awesome-lists are filtered out.\n`;
  md += `4. **Fresh Momentum:** Created in the last 30 days or pushed in the last 72 hours.\n`;
  md += `5. **Quality Description:** Must include a meaningful description (>= 20 characters).\n`;
  md += `6. **Stack Diversity:** Balanced spread across Rust, Go, TypeScript, Python, Zig, and C.\n`;
  md += `7. **Balanced Scoring:** Categorized into Top Picks, AI/ML, DevTools, Web, and Hidden Gems (< 250 stars).\n\n`;

  md += `---\n\n`;
  md += `<div align="center">\n`;
  md += `<sub>Automatically curated every day at 00:00 UTC via <a href="https://github.com/lulushuz/Awesome-Daily-OpenSource/actions">GitHub Actions</a>.</sub>\n`;
  md += `</div>\n`;

  return md;
}
