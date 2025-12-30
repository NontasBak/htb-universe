/**
 * Frontend TypeScript types for HTB Universe
 * These types match the backend API responses
 */

// ============================================================================
// CORE ENTITY TYPES
// ============================================================================

export type MachineDifficulty = "Easy" | "Medium" | "Hard" | "Insane";
export type MachineOS = "Windows" | "Linux" | "Android" | "Solaris" | "OpenBSD" | "FreeBSD" | "Other";
export type ModuleDifficulty = "Easy" | "Medium" | "Hard";
export type UnitType = "Article" | "Interactive";

export interface Machine {
  id: number;
  name: string | null;
  synopsis: string | null;
  difficulty: MachineDifficulty | null;
  os: MachineOS | null;
  url: string | null;
  image: string | null;
}

export interface MachineWithStatus extends Machine {
  completed?: boolean;
  liked?: boolean | null;
}

export interface Module {
  id: number;
  name: string | null;
  description: string | null;
  difficulty: ModuleDifficulty | null;
  url: string | null;
  image: string | null;
}

export interface ModuleWithStatus extends Module {
  completed?: boolean;
}

export interface Unit {
  id: number;
  module_id: number;
  sequence_order: number | null;
  name: string | null;
  type: UnitType | null;
}

export interface Exam {
  id: number;
  name: string | null;
  logo: string | null;
}

export interface Vulnerability {
  id: number;
  name: string | null;
}

// ============================================================================
// EXTENDED TYPES WITH RELATIONSHIPS
// ============================================================================

export interface MachineWithDetails extends Machine {
  vulnerabilities?: Vulnerability[];
  languages?: string[];
  areasOfInterest?: string[];
  modules?: Module[];
}

export interface ModuleWithDetails extends Module {
  units?: Unit[];
  vulnerabilities?: Vulnerability[];
  exams?: Exam[];
  machines?: Machine[];
}

export interface ExamWithDetails extends Exam {
  modules?: Module[];
}

export interface VulnerabilityWithDetails extends Vulnerability {
  modules?: Module[];
  machines?: Machine[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ApiError {
  error: string;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export type FilterMode = "exam" | "module" | "vulnerability" | "machines";

export interface FilterState {
  mode: FilterMode;
  examId: number | null;
  moduleId: number | null;
  vulnerabilityIds: number[];
  moduleIds: number[];
}

export interface MachineFilterParams {
  difficulty?: MachineDifficulty;
  os?: MachineOS;
  vulnerabilities?: number[];
  modules?: number[];
  search?: string;
  limit?: number;
  offset?: number;
  hideCompleted?: boolean;
}

export interface ModuleFilterParams {
  difficulty?: ModuleDifficulty;
  vulnerabilities?: number[];
  exams?: number[];
  search?: string;
  limit?: number;
  offset?: number;
  hideCompleted?: boolean;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface ResultsState {
  machines: Machine[];
  modules: Module[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
}

export interface DetailDialogState {
  type: "machine" | "module" | null;
  id: number | null;
  isOpen: boolean;
}

// ============================================================================
// STATISTICS TYPES
// ============================================================================

export interface GlobalStatistics {
  totalUsers: number;
  totalMachines: number;
  totalModules: number;
  totalExams: number;
  totalVulnerabilities: number;
  popularMachines: Array<{
    id: number;
    name: string;
    completions: number;
  }>;
  popularModules: Array<{
    id: number;
    name: string;
    completions: number;
  }>;
}

// ============================================================================
// URL PARAMS TYPES
// ============================================================================

export interface DashboardUrlParams {
  tab?: FilterMode;
  exam?: string;
  module?: string;
  vulnerabilities?: string;
  modules?: string;
  page?: string;
  machineDifficulty?: string;
  moduleDifficulty?: string;
  os?: string;
  hideCompleted?: string;
}

export interface UserCompletionData {
  completedMachineIds: Set<number>;
  completedModuleIds: Set<number>;
  machineLikes: Map<number, boolean | null>;
}
