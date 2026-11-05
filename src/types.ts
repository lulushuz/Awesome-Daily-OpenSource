export interface RawGitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics: string[];
  fork: boolean;
  archived: boolean;
  disabled: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string | null;
  } | null;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
}

export type RepoCategory = "top_pick" | "ai_ml" | "devtools_cli" | "web_fullstack" | "hidden_gem";

export interface CuratedRepo {
  id: string;
  name: string;
  fullName: string;
  owner: {
    username: string;
    avatarUrl: string;
    githubUrl: string;
  };
  description: string;
  pitch: string;
  repoUrl: string;
  homepageUrl?: string;
  primaryLanguage: string;
  stars: number;
  forks: number;
  openIssues: number;
  licenseName: string;
  tags: string[];
  category: RepoCategory;
  categoryLabel: string;
  curatorScore: number;
  createdAt: string;
  pushedAt: string;
}

export interface DailyCuration {
  date: string; // YYYY-MM-DD
  year: string;
  month: string;
  monthName: string;
  timestamp: string;
  totalCount: number;
  categories: {
    id: RepoCategory;
    title: string;
    description: string;
    repos: CuratedRepo[];
  }[];
}
