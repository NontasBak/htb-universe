/**
 * HTB API HTTP Client
 * Provides HTTP request helpers for Academy and Labs APIs
 */

import type {
  ModuleApiResponse,
  MachineApiResponse,
  MachineTagsApiResponse,
  ExamsApiResponse,
  ExamModulesApiResponse,
} from "./types.js";

// ============================================================================
// Configuration
// ============================================================================

export interface HttpClientConfig {
  htbCookie: string;
  htbBearer: string;
}

// ============================================================================
// Request Headers
// ============================================================================

function createModuleRequestHeaders(cookie: string): Record<string, string> {
  return {
    Accept: "application/json",
    "Accept-Language": "en-US,en;q=0.5",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    Cookie: cookie,
    Host: "academy.hackthebox.com",
    Pragma: "no-cache",
    Priority: "u=4",
    Referer: "https://academy.hackthebox.com/beta/module/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Gpc": "1",
    Te: "trailers",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0",
  };
}

function createMachineRequestHeaders(bearer: string): Record<string, string> {
  return {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.5",
    Authorization: bearer,
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    Host: "labs.hackthebox.com",
    Origin: "https://app.hackthebox.com",
    Pragma: "no-cache",
    Referer: "https://app.hackthebox.com/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "Sec-Gpc": "1",
    Te: "trailers",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0",
  };
}

function createExamRequestHeaders(cookie: string): Record<string, string> {
  return {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.5",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    Cookie: cookie,
    Host: "academy.hackthebox.com",
    Pragma: "no-cache",
    Referer: "https://academy.hackthebox.com/academy-relations/exams/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Gpc": "1",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0",
    "X-Requested-With": "XMLHttpRequest",
  };
}

// ============================================================================
// API Request Functions
// ============================================================================

export class HTBHttpClient {
  private config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = config;
  }

  /**
   * Fetch module data including sections (units)
   */
  async fetchModuleData(moduleId: number): Promise<ModuleApiResponse["data"] | null> {
    try {
      const response = await fetch(`https://academy.hackthebox.com/api/v2/modules/${moduleId}`, {
        headers: createModuleRequestHeaders(this.config.htbCookie),
      });

      if (response.status === 404) {
        console.log(`Module ${moduleId} not found - skipping`);
        return null;
      }

      if (!response.ok) {
        console.error(`Error fetching module ${moduleId}: HTTP ${response.status}`);
        return null;
      }

      const data = (await response.json()) as ModuleApiResponse;
      return data.data;
    } catch (error) {
      console.error(`Error fetching module ${moduleId}:`, error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Fetch machine data by machine name
   */
  async fetchMachineData(machineName: string): Promise<MachineApiResponse["info"] | null> {
    try {
      const response = await fetch(`https://labs.hackthebox.com/api/v4/machine/profile/${machineName}`, {
        headers: createMachineRequestHeaders(this.config.htbBearer),
      });

      if (!response.ok) {
        console.error(`Error fetching machine ${machineName}: HTTP ${response.status}`);
        return null;
      }

      const data = (await response.json()) as MachineApiResponse;
      return data.info;
    } catch (error) {
      console.error(`Error fetching machine ${machineName}:`, error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Fetch machine tags (vulnerabilities, languages, areas of interest)
   */
  async fetchMachineTags(machineId: number): Promise<MachineTagsApiResponse["info"]> {
    try {
      const response = await fetch(`https://labs.hackthebox.com/api/v4/machine/tags/${machineId}`, {
        headers: createMachineRequestHeaders(this.config.htbBearer),
      });

      if (!response.ok) {
        console.error(`Error fetching tags for machine ${machineId}: HTTP ${response.status}`);
        return [];
      }

      const data = (await response.json()) as MachineTagsApiResponse;
      return data.info || [];
    } catch (error) {
      console.error(
        `Error fetching tags for machine ${machineId}:`,
        error instanceof Error ? error.message : error
      );
      return [];
    }
  }

  /**
   * Fetch all exams
   */
  async fetchExamsData(): Promise<ExamsApiResponse["data"]> {
    try {
      const response = await fetch("https://academy.hackthebox.com/api/v2/external/public/labs/exams");

      if (!response.ok) {
        console.error(`Error fetching exams: HTTP ${response.status}`);
        return [];
      }

      const data = (await response.json()) as ExamsApiResponse;
      return data.data || [];
    } catch (error) {
      console.error(`Error fetching exams:`, error instanceof Error ? error.message : error);
      return [];
    }
  }

  /**
   * Fetch modules for a specific exam
   */
  async fetchExamModules(examId: number): Promise<ExamModulesApiResponse["data"]["modules"]> {
    try {
      const response = await fetch(
        `https://academy.hackthebox.com/api/v2/external/public/labs/relations/exams/${examId}`,
        {
          headers: createExamRequestHeaders(this.config.htbCookie),
        }
      );

      if (!response.ok) {
        console.error(`Error fetching modules for exam ${examId}: HTTP ${response.status}`);
        return [];
      }

      const data = (await response.json()) as ExamModulesApiResponse;
      return data.data?.modules || [];
    } catch (error) {
      console.error(
        `Error fetching modules for exam ${examId}:`,
        error instanceof Error ? error.message : error
      );
      return [];
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Sleep for a specified number of milliseconds
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
