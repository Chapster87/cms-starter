/**
 * THIS FILE IS AUTO-GENERATED. DO NOT EDIT DIRECTLY.
 * Run 'pnpm sync-types' to update.
 */

export type StorageProvider = "cloudinary" | "supabase" | "local";

export interface MediaAsset {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  file_name?: string;
  url: string;
  type: string;
  size: number;
  width?: number;
  height?: number;
  alt_text?: string;
  folder: string;
  tags: string[];
  storage_provider: StorageProvider;
  provider_metadata: Record<string, unknown>;
  created_by?: string;
}

export type CMSStatus = "published" | "draft" | "changed";

export interface SeoMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  noIndex?: boolean;
  ogImage?: MediaAsset;
  ogTitle?: string;
  ogDescription?: string;
}

export type NavigationItemType = "internal" | "external" | "static" | "group";

export interface NavigationItem {
  id: string;
  type: NavigationItemType;
  labelOverride?: string;
  linkedRecord?: {
    id: string;
    modelId: string;
    displayName?: string;
    slug?: string;
  };
  url?: string;
  openInNewTab?: boolean;
  noFollow?: boolean;
  routePath?: string;
  children?: NavigationItem[];
}

export type NavigationData = NavigationItem[];

export interface ModularContentBlock {
  id: string;
  type: string;
  data: unknown;
}

export type ModularContentData = ModularContentBlock[];

export interface StandingsRow {
  team_id: string;
  team_logo?: MediaAsset;
  team_name?: string;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  points_for?: number;
  points_against?: number;
  points_diff?: number;
  bonus_points?: number;
  points?: number;
  [key: string]: unknown;
}

export type StandingsData = StandingsRow[];

export interface Divisions {
  id: string;
  created_at: string;
  updated_at: string;
  status: CMSStatus;
  _draft?: unknown;
  short_name?: string;
  name: string;
  slug: string;
}

export interface Leagues {
  id: string;
  created_at: string;
  updated_at: string;
  status: CMSStatus;
  _draft?: unknown;
  name: string;
  slug: string;
  short_name?: string;
}

export interface Seasons {
  id: string;
  created_at: string;
  updated_at: string;
  status: CMSStatus;
  _draft?: unknown;
  year?: number;
  display_name?: string;
  season?: string;
  slug: string;
}

export interface Teams {
  id: string;
  created_at: string;
  updated_at: string;
  status: CMSStatus;
  _draft?: unknown;
  team_name: string;
  league?: Leagues;
  team_logo?: MediaAsset;
  short_name?: string;
  slug: string;
  division?: Divisions[];
  seasons?: Seasons[];
}

export interface Boom {
  id: string;
  created_at: string;
  updated_at: string;
  status: CMSStatus;
  _draft?: unknown;
}

export interface TestingCopy {
  id: string;
  created_at: string;
  updated_at: string;
  status: CMSStatus;
  _draft?: unknown;
}

export interface Testing {
  id: string;
  created_at: string;
  updated_at: string;
  status: CMSStatus;
  _draft?: unknown;
}

export interface SocialLinks {
  id: string;
  created_at: string;
  updated_at: string;
  status: CMSStatus;
  _draft?: unknown;
  link_tree?: NavigationData;
}

export interface Pages {
  id: string;
  created_at: string;
  updated_at: string;
  status: CMSStatus;
  _draft?: unknown;
  page_link?: Pages;
  title: string;
  color?: string;
  seo?: SeoMetadata;
  tag_list?: string[];
  navigation?: NavigationData;
  author?: Authors;
  standings_table?: StandingsData;
  long_text?: string;
  rich_text?: string;
  media?: MediaAsset;
  content_dynamic?: ModularContentData;
  slug: string;
}

export interface Authors {
  id: string;
  created_at: string;
  updated_at: string;
  status: CMSStatus;
  _draft?: unknown;
  name?: string;
  bio?: string;
  avatar_url?: string;
  created_by?: string;
  updated_by?: string;
  user_id?: unknown;
}

export interface SiteNavigation {
  id: string;
  created_at: string;
  updated_at: string;
  status: CMSStatus;
  _draft?: unknown;
  header?: NavigationData;
  footer?: NavigationData;
}

export interface Matches {
  id: string;
  created_at: string;
  updated_at: string;
  status: CMSStatus;
  _draft?: unknown;
  home_team: Teams;
  away_team: Teams;
  match_date_time: string;
  league: Leagues;
  division: Divisions;
  season: Seasons;
  match_type?: string;
  event_name: string;
  slug: string;
  home_team_score?: number;
  away_team_score?: number;
}

export interface Standings {
  id: string;
  created_at: string;
  updated_at: string;
  status: CMSStatus;
  _draft?: unknown;
  league: Leagues;
  season: Seasons;
  division: Divisions;
  league_standings: StandingsData;
}

export interface CMSModelMap {
  divisions: Divisions;
  leagues: Leagues;
  seasons: Seasons;
  teams: Teams;
  boom: Boom;
  testing_copy: TestingCopy;
  testing: Testing;
  social_links: SocialLinks;
  pages: Pages;
  authors: Authors;
  site_navigation: SiteNavigation;
  matches: Matches;
  standings: Standings;
}

export type CMSModelName = keyof CMSModelMap;
export type AnyCMSModel = CMSModelMap[CMSModelName];

/**
 * BLOCK TYPES
 */

export interface Test2 {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface Test {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface CMSBlockMap {
  test_2: Test2;
  test: Test;
}

export type CMSBlockName = keyof CMSBlockMap;
