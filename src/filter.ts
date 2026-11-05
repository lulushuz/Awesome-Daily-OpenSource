import { RawGitHubRepo } from "./types.js";

// Spam / Tutorial / List regex blacklists
const BLACKLIST_PATTERNS = [
  /\b(tutorial|course|lecture|bootcamp|homework|assignment)\b/i,
  /\b(awesome-[\w-]+|curated list|collection of awesome)\b/i,
  /\b(interview-prep|cheat-?sheet|leetcode|roadmap|study-?guide)\b/i,
  /\b(100-days-of|coding-challenge|learn-in-[\w-]+)\b/i,
  /\b(notes|blog-post|sample-code|boilerplate-only)\b/i,
  /\b(crack|keygen|hack-tool|free-download|bypass)\b/i,
];

// Open Source License IDs recognized as valid FOSS
const VALID_LICENSE_KEYS = new Set([
  "mit",
  "apache-2.0",
  "gpl-3.0",
  "gpl-2.0",
  "agpl-3.0",
  "lgpl-3.0",
  "bsd-2-clause",
  "bsd-3-clause",
  "mpl-2.0",
  "isc",
  "unlicense",
  "cc0-1.0",
]);

export function passesQualityFilter(repo: RawGitHubRepo): boolean {
  // 1. Must not be fork or archived
  if (repo.fork || repo.archived || repo.disabled) {
    return false;
  }

  // 2. Must have valid open source license
  if (!repo.license || !repo.license.key) {
    return false;
  }
  const licenseKey = repo.license.key.toLowerCase();
  if (!VALID_LICENSE_KEYS.has(licenseKey)) {
    return false;
  }

  // 3. Meaningful description required (at least 20 chars)
  if (!repo.description || repo.description.trim().length < 20) {
    return false;
  }

  const descAndName = `${repo.name} ${repo.description} ${(repo.topics || []).join(" ")}`;

  // 4. Blacklist filter (no tutorials, homeworks, awesome-lists, cheat-sheets)
  for (const pattern of BLACKLIST_PATTERNS) {
    if (pattern.test(descAndName)) {
      return false;
    }
  }

  // 5. Must have at least a primary language or sensible topics
  if (!repo.language && (!repo.topics || repo.topics.length === 0)) {
    return false;
  }

  // 6. Minimum stars threshold (avoid zero-effort repos)
  if (repo.stargazers_count < 10) {
    return false;
  }

  return true;
}

export function calculateCuratorScore(repo: RawGitHubRepo): number {
  let score = 0;

  // Star points (logarithmic scaling to avoid purely giant repos dominating)
  score += Math.log10(repo.stargazers_count + 1) * 25;

  // Fork points (shows people are cloning/contributing)
  score += Math.log10(repo.forks_count + 1) * 15;

  // Has custom homepage / docs
  if (repo.homepage && repo.homepage.startsWith("http")) {
    score += 10;
  }

  // Topics richness
  const topicCount = repo.topics?.length || 0;
  score += Math.min(topicCount * 2, 10);

  // Recency bonus: pushed within the last 72 hours
  const pushedDate = new Date(repo.pushed_at).getTime();
  const now = Date.now();
  const hoursSincePush = (now - pushedDate) / (1000 * 60 * 60);
  if (hoursSincePush < 72) {
    score += 15;
  } else if (hoursSincePush < 168) {
    score += 8;
  }

  // Description quality bonus
  const descLen = repo.description?.length || 0;
  if (descLen >= 50 && descLen <= 250) {
    score += 10;
  }

  return Math.round(score);
}
