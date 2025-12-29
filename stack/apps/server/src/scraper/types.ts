/**
 * HTB API Response Types
 * Types for data structures returned by Hack The Box Academy and Labs APIs
 */

// ============================================================================
// Module Types (Academy API)
// ============================================================================

export interface ModuleSection {
  id: number;
  content_id: string;
  title: string;
  page: number;
  interactive: number;
  type: string; // "article" or "interactive"
  separator: string | null;
  group: string;
  is_completed: boolean;
  has_docker: boolean;
  has_vm: boolean;
  vhosts: unknown[];
}

export interface ModuleDifficulty {
  title: string;
  value: string;
}

export interface ModuleUrl {
  absolute: string;
  relative: string;
}

export interface RelatedMachine {
  id: number;
  name: string;
  os: string;
  difficulty: string;
  logo: string;
}

export interface ModuleRelated {
  machines: RelatedMachine[];
}

export interface ModuleData {
  id: number;
  name: string;
  description: string;
  difficulty: ModuleDifficulty;
  url: ModuleUrl;
  avatar?: string;
  logo?: string;
  sections: ModuleSection[];
  related?: ModuleRelated;
}

export interface ModuleApiResponse {
  data: ModuleData;
}

// ============================================================================
// Machine Types (Labs API)
// ============================================================================

export interface MachineInfo {
  id: number;
  name: string;
  os: string;
  difficulty: string;
  synopsis: string;
  avatar?: string;
  logo?: string;
}

export interface MachineApiResponse {
  info: MachineInfo;
}

// ============================================================================
// Machine Tags Types (Labs API)
// ============================================================================

export interface MachineTag {
  id: number;
  name: string;
  category: string; // "Area of Interest" | "Vulnerability" | "Language"
}

export interface MachineTagsApiResponse {
  info: MachineTag[];
}

// ============================================================================
// Exam Types (Academy API)
// ============================================================================

export interface ExamData {
  id: number;
  name: string;
  logo: string;
}

export interface ExamsApiResponse {
  data: ExamData[];
}

// ============================================================================
// Exam Modules Types (Academy API)
// ============================================================================

export interface ExamModule {
  id: number;
  name: string;
  description?: string;
}

export interface ExamModulesData {
  modules: ExamModule[];
}

export interface ExamModulesApiResponse {
  data: ExamModulesData;
}

// ============================================================================
// Database Insert Types
// ============================================================================

export interface ModuleInsert {
  id: number;
  name: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  url: string;
  image: string | null;
}

export interface UnitInsert {
  id: number;
  module_id: number;
  sequence_order: number;
  name: string;
  type: "Article" | "Interactive";
}

export interface MachineInsert {
  id: number;
  name: string;
  synopsis: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Insane";
  os: "Windows" | "Linux" | "Android" | "Solaris" | "OpenBSD" | "FreeBSD" | "Other";
  url: string;
  image: string | null;
}

export interface ExamInsert {
  id: number;
  name: string;
  logo: string | null;
}

export interface VulnerabilityInsert {
  id: number;
  name: string;
}

// ============================================================================
// Scraper Configuration
// ============================================================================

export interface ScraperConfig {
  htbCookie: string;
  htbBearer: string;
  delayBetweenRequests: number;
  maxModuleId: number;
  populateModuleVulnerabilities?: boolean;
}

// ============================================================================
// Scraper Statistics
// ============================================================================

export interface ScraperStats {
  modulesProcessed: number;
  unitsProcessed: number;
  machinesProcessed: number;
  examsProcessed: number;
  vulnerabilitiesProcessed: number;
  errorsEncountered: number;
  startTime: Date;
  endTime?: Date;
}
