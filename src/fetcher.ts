import { RawGitHubRepo } from "./types.js";
import { passesQualityFilter } from "./filter.js";

function getIsoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

async function fetchFromGitHubSearch(query: string, token?: string): Promise<RawGitHubRepo[]> {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=40`;
  
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "GitCurator-Daily-Bot/1.0",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`GitHub API Warning (${res.status}): ${errText.slice(0, 150)}`);
      return [];
    }
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error("fetchFromGitHubSearch Network Error:", err);
    return [];
  }
}

export async function fetchCandidates(token?: string): Promise<RawGitHubRepo[]> {
  const date14DaysAgo = getIsoDateDaysAgo(14);
  const date30DaysAgo = getIsoDateDaysAgo(30);
  const date3DaysAgo = getIsoDateDaysAgo(3);

  console.log("🔍 GitHub API üzerinden son dönemin açık kaynak projeleri taranıyor...");

  const queries = [
    // 1. Son 14 günde açılmış ve yıldızlanan taze projeler
    `created:>${date14DaysAgo} stars:15..1500 fork:false archived:false`,
    // 2. Son 3 günde aktif commit almış ve büyüyen repolar
    `pushed:>${date3DaysAgo} created:>${date30DaysAgo} stars:25..2000 fork:false archived:false`,
    // 3. AI / LLM / Agent odaklı yeni açık kaynak projeler
    `(topic:llm OR topic:ai OR topic:agent) created:>${date30DaysAgo} stars:>15 fork:false archived:false`,
    // 4. Rust, Go, Zig ve CLI odaklı modern sistem araçları
    `(language:rust OR language:go OR language:zig) created:>${date30DaysAgo} stars:>15 fork:false archived:false`,
  ];

  const candidateMap = new Map<number, RawGitHubRepo>();

  for (const q of queries) {
    console.log(`  -> Sorgu: ${q.slice(0, 60)}...`);
    const items = await fetchFromGitHubSearch(q, token);
    for (const item of items) {
      if (!candidateMap.has(item.id)) {
        if (passesQualityFilter(item)) {
          candidateMap.set(item.id, item);
        }
      }
    }
    // Polite delay between search requests to respect GitHub API
    await new Promise((r) => setTimeout(r, 1200));
  }

  const result = Array.from(candidateMap.values());
  console.log(`✅ Kalite filtresinden geçen aday havuzu: ${result.length} repo.`);
  return result;
}
