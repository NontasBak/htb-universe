/**
 * API Client for HTB Universe
 * Provides typed HTTP methods for interacting with the backend API
 */

let serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
if (serverUrl.endsWith("/")) serverUrl = serverUrl.slice(0, -1);
if (!serverUrl.endsWith("/api")) serverUrl = `${serverUrl}/api`;
const API_BASE_URL = serverUrl;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Network error",
      0
    );
  }
}

/**
 * Build query string from params object
 */
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        searchParams.append(key, value.join(","));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * API client methods
 */
export const api = {
  // ============================================================================
  // MACHINES
  // ============================================================================

  getMachines: async (params: {
    difficulty?: string;
    os?: string;
    retired?: boolean;
    free?: boolean;
    search?: string;
    vulnerabilities?: number[];
    modules?: number[];
    limit?: number;
    offset?: number;
  }) => {
    const query = buildQueryString(params);
    return fetchApi<any>(`/machines${query}`);
  },

  getMachineById: async (id: number) => {
    return fetchApi<any>(`/machines/${id}`);
  },

  // ============================================================================
  // MODULES
  // ============================================================================

  getModules: async (params: {
    difficulty?: string;
    tier?: number;
    search?: string;
    vulnerabilities?: number[];
    exams?: number[];
    limit?: number;
    offset?: number;
  }) => {
    const query = buildQueryString(params);
    return fetchApi<any>(`/modules${query}`);
  },

  getModuleById: async (id: number) => {
    return fetchApi<any>(`/modules/${id}`);
  },

  getModuleUnits: async (id: number) => {
    return fetchApi<any>(`/modules/${id}/units`);
  },

  // ============================================================================
  // EXAMS
  // ============================================================================

  getExams: async () => {
    return fetchApi<any>(`/exams`);
  },

  getExamById: async (id: number) => {
    return fetchApi<any>(`/exams/${id}`);
  },

  getExamModules: async (id: number, params?: { limit?: number; offset?: number }) => {
    const query = params ? buildQueryString(params) : "";
    return fetchApi<any>(`/exams/${id}/modules${query}`);
  },

  // ============================================================================
  // VULNERABILITIES
  // ============================================================================

  getVulnerabilities: async () => {
    return fetchApi<any>(`/vulnerabilities`);
  },

  getVulnerabilityById: async (id: number) => {
    return fetchApi<any>(`/vulnerabilities/${id}`);
  },

  // ============================================================================
  // STATISTICS
  // ============================================================================

  getGlobalStatistics: async () => {
    return fetchApi<any>(`/statistics/global`);
  },

  // ============================================================================
  // USER (Authenticated)
  // ============================================================================

  getCurrentUser: async () => {
    return fetchApi<any>(`/user/me`, {
      credentials: "include",
    });
  },

  getUserStatistics: async () => {
    return fetchApi<any>(`/user/statistics`, {
      credentials: "include",
    });
  },

  // User Machines
  getUserMachines: async () => {
    return fetchApi<any>(`/user/machines`, {
      credentials: "include",
    });
  },

  completeMachine: async (machineId: number, liked?: boolean) => {
    return fetchApi<any>(`/user/machines/${machineId}/complete`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ liked }),
    });
  },

  uncompleteMachine: async (machineId: number) => {
    return fetchApi<any>(`/user/machines/${machineId}/complete`, {
      method: "DELETE",
      credentials: "include",
    });
  },

  isMachineCompleted: async (machineId: number) => {
    return fetchApi<{ completed: boolean }>(`/user/machines/${machineId}/completed`, {
      credentials: "include",
    });
  },

  getMachineStatus: async (machineId: number) => {
    return fetchApi<{ completed: boolean; liked: boolean | null }>(`/user/machines/${machineId}/status`, {
      credentials: "include",
    });
  },

  updateMachineLike: async (machineId: number, liked: boolean) => {
    const result = await fetchApi<{ success: boolean }>(`/user/machines/${machineId}/like`, {
      method: "PUT",
      credentials: "include",
      body: JSON.stringify({ liked }),
    });

    if (!result.success) {
      throw new Error("Failed to update machine like status. Make sure the machine is marked as completed first.");
    }

    return result;
  },

  // User Modules
  getUserModules: async () => {
    return fetchApi<any>(`/user/modules`, {
      credentials: "include",
    });
  },

  completeModule: async (moduleId: number) => {
    return fetchApi<any>(`/user/modules/${moduleId}/complete`, {
      method: "POST",
      credentials: "include",
    });
  },

  uncompleteModule: async (moduleId: number) => {
    return fetchApi<any>(`/user/modules/${moduleId}/complete`, {
      method: "DELETE",
      credentials: "include",
    });
  },

  isModuleCompleted: async (moduleId: number) => {
    return fetchApi<{ completed: boolean }>(`/user/modules/${moduleId}/completed`, {
      credentials: "include",
    });
  },

  // User Exams
  getUserExams: async () => {
    return fetchApi<any>(`/user/exams`, {
      credentials: "include",
    });
  },

  completeExam: async (examId: number) => {
    return fetchApi<any>(`/user/exams/${examId}/complete`, {
      method: "POST",
      credentials: "include",
    });
  },

  uncompleteExam: async (examId: number) => {
    return fetchApi<any>(`/user/exams/${examId}/complete`, {
      method: "DELETE",
      credentials: "include",
    });
  },

  isExamCompleted: async (examId: number) => {
    return fetchApi<{ completed: boolean }>(`/user/exams/${examId}/completed`, {
      credentials: "include",
    });
  },

  getExamProgress: async (examId: number) => {
    return fetchApi<any>(`/user/exams/${examId}/progress`, {
      credentials: "include",
    });
  },

  // ============================================================================
  // HEALTH
  // ============================================================================

  getHealth: async () => {
    return fetchApi<any>(`/health`);
  },

  // ============================================================================
  // ADMIN - USER MANAGEMENT
  // ============================================================================

  admin: {
    // Users
    getUsers: async (params: { limit?: number; offset?: number } = {}) => {
      const query = buildQueryString(params);
      return fetchApi<any>(`/admin/users${query}`, {
        credentials: "include",
      });
    },

    getUserDetails: async (userId: number) => {
      return fetchApi<any>(`/admin/users/${userId}`, {
        credentials: "include",
      });
    },

    updateUserRole: async (userId: number, role: "User" | "Admin") => {
      return fetchApi<any>(`/admin/users/${userId}/role`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ role }),
      });
    },

    deleteUser: async (userId: number) => {
      return fetchApi<any>(`/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
    },

    // Machines
    createMachine: async (machine: any) => {
      return fetchApi<any>(`/admin/machines`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(machine),
      });
    },

    updateMachine: async (machineId: number, machine: any) => {
      return fetchApi<any>(`/admin/machines/${machineId}`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify(machine),
      });
    },

    deleteMachine: async (machineId: number) => {
      return fetchApi<any>(`/admin/machines/${machineId}`, {
        method: "DELETE",
        credentials: "include",
      });
    },

    // Modules
    createModule: async (module: any) => {
      return fetchApi<any>(`/admin/modules`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(module),
      });
    },

    updateModule: async (moduleId: number, module: any) => {
      return fetchApi<any>(`/admin/modules/${moduleId}`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify(module),
      });
    },

    deleteModule: async (moduleId: number) => {
      return fetchApi<any>(`/admin/modules/${moduleId}`, {
        method: "DELETE",
        credentials: "include",
      });
    },

    // Units
    createUnit: async (unit: any) => {
      return fetchApi<any>(`/admin/units`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(unit),
      });
    },

    updateUnit: async (unitId: number, unit: any) => {
      return fetchApi<any>(`/admin/units/${unitId}`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify(unit),
      });
    },

    deleteUnit: async (unitId: number) => {
      return fetchApi<any>(`/admin/units/${unitId}`, {
        method: "DELETE",
        credentials: "include",
      });
    },

    // Vulnerabilities
    createVulnerability: async (name: string) => {
      return fetchApi<any>(`/admin/vulnerabilities`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ name }),
      });
    },

    updateVulnerability: async (vulnId: number, name: string) => {
      return fetchApi<any>(`/admin/vulnerabilities/${vulnId}`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ name }),
      });
    },

    deleteVulnerability: async (vulnId: number) => {
      return fetchApi<any>(`/admin/vulnerabilities/${vulnId}`, {
        method: "DELETE",
        credentials: "include",
      });
    },

    // Exams
    createExam: async (exam: any) => {
      return fetchApi<any>(`/admin/exams`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(exam),
      });
    },

    updateExam: async (examId: number, exam: any) => {
      return fetchApi<any>(`/admin/exams/${examId}`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify(exam),
      });
    },

    deleteExam: async (examId: number) => {
      return fetchApi<any>(`/admin/exams/${examId}`, {
        method: "DELETE",
        credentials: "include",
      });
    },

    linkModulesToExam: async (examId: number, moduleIds: number[]) => {
      return fetchApi<any>(`/admin/exams/${examId}/modules`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ moduleIds }),
      });
    },

    // Statistics
    getPlatformStats: async () => {
      return fetchApi<any>(`/admin/stats`, {
        credentials: "include",
      });
    },

    // ============================================================================
    // RELATIONSHIP MANAGEMENT
    // ============================================================================

    // Get all available entities for relationship selection
    getAvailableEntities: async () => {
      return fetchApi<any>(`/admin/entities`, {
        credentials: "include",
      });
    },

    // Machine Relationships
    getMachineRelationships: async (machineId: number) => {
      return fetchApi<any>(`/admin/machines/${machineId}/relationships`, {
        credentials: "include",
      });
    },

    updateMachineModules: async (machineId: number, moduleIds: number[]) => {
      return fetchApi<any>(`/admin/machines/${machineId}/modules`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ moduleIds }),
      });
    },

    updateMachineVulnerabilities: async (machineId: number, vulnerabilityIds: number[]) => {
      return fetchApi<any>(`/admin/machines/${machineId}/vulnerabilities`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ vulnerabilityIds }),
      });
    },

    updateMachineLanguages: async (machineId: number, languages: string[]) => {
      return fetchApi<any>(`/admin/machines/${machineId}/languages`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ languages }),
      });
    },

    updateMachineAreas: async (machineId: number, areas: string[]) => {
      return fetchApi<any>(`/admin/machines/${machineId}/areas`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ areas }),
      });
    },

    // Module Relationships
    getModuleRelationships: async (moduleId: number) => {
      return fetchApi<any>(`/admin/modules/${moduleId}/relationships`, {
        credentials: "include",
      });
    },

    updateModuleMachines: async (moduleId: number, machineIds: number[]) => {
      return fetchApi<any>(`/admin/modules/${moduleId}/machines`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ machineIds }),
      });
    },

    updateModuleVulnerabilities: async (moduleId: number, vulnerabilityIds: number[]) => {
      return fetchApi<any>(`/admin/modules/${moduleId}/vulnerabilities`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ vulnerabilityIds }),
      });
    },

    updateModuleExams: async (moduleId: number, examIds: number[]) => {
      return fetchApi<any>(`/admin/modules/${moduleId}/exams`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ examIds }),
      });
    },

    // Exam Relationships
    getExamRelationships: async (examId: number) => {
      return fetchApi<any>(`/admin/exams/${examId}/relationships`, {
        credentials: "include",
      });
    },

    updateExamModules: async (examId: number, moduleIds: number[]) => {
      return fetchApi<any>(`/admin/exams/${examId}/modules-new`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ moduleIds }),
      });
    },

    // Vulnerability Relationships
    getVulnerabilityRelationships: async (vulnerabilityId: number) => {
      return fetchApi<any>(`/admin/vulnerabilities/${vulnerabilityId}/relationships`, {
        credentials: "include",
      });
    },

    updateVulnerabilityTools: async (vulnerabilityId: number, tools: string[]) => {
      return fetchApi<any>(`/admin/vulnerabilities/${vulnerabilityId}/tools`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ tools }),
      });
    },

    updateVulnerabilityMachines: async (vulnerabilityId: number, machineIds: number[]) => {
      return fetchApi<any>(`/admin/vulnerabilities/${vulnerabilityId}/machines`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ machineIds }),
      });
    },

    updateVulnerabilityModules: async (vulnerabilityId: number, moduleIds: number[]) => {
      return fetchApi<any>(`/admin/vulnerabilities/${vulnerabilityId}/modules`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ moduleIds }),
      });
    },
  },
};

export default api;
