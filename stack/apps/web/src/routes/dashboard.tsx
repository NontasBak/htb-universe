/**
 * Dashboard Route
 * Main page of HTB Universe - publicly accessible
 * Contains 2-column layout with filters and results
 */

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { FilterPanel } from "@/components/dashboard/FilterPanel";
import { ResultsPanel } from "@/components/dashboard/ResultsPanel";
import { MachineDetailDialog } from "@/components/dialogs/MachineDetailDialog";
import { ModuleDetailDialog } from "@/components/dialogs/ModuleDetailDialog";
import { useUrlParams } from "@/hooks/useUrlParams";
import api from "@/lib/api/client";
import type { Machine, Module, Exam, Vulnerability, FilterMode } from "@/types";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export default function Dashboard() {
  const { params, setPage } = useUrlParams();
  const { data: session } = authClient.useSession();

  // Pre-fetched data for filters (loaded once on mount)
  const [exams, setExams] = useState<Exam[]>([]);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [isPreloading, setIsPreloading] = useState(true);

  // Results state
  const [machines, setMachines] = useState<Machine[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User completion data
  const [completedMachineIds, setCompletedMachineIds] = useState<Set<number>>(new Set());
  const [completedModuleIds, setCompletedModuleIds] = useState<Set<number>>(new Set());
  const [machineLikes, setMachineLikes] = useState<Map<number, boolean | null>>(new Map());
  const [isUpdating, setIsUpdating] = useState(false);

  // Global filters
  const [globalFilters, setGlobalFilters] = useState<{
    machineDifficulty?: string;
    moduleDifficulty?: string;
    os?: string;
    hideCompleted?: boolean;
  }>({});

  // Pagination
  const pageSize = 20;
  const currentPage = parseInt(params.page || "1");

  // Dialog state
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [isMachineDialogOpen, setIsMachineDialogOpen] = useState(false);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);

  // Filter state for re-fetching
  const [currentFilters, setCurrentFilters] = useState<{
    mode: FilterMode;
    filters: any;
  } | null>(null);

  // Pre-fetch all dropdown data on mount
  useEffect(() => {
    const preloadData = async () => {
      setIsPreloading(true);
      try {
        const [examsData, modulesData, vulnerabilitiesData] = await Promise.all([
          api.getExams(),
          api.getModules({ limit: 500 }), // Get all modules
          api.getVulnerabilities(),
        ]);

        setExams(examsData);
        setAllModules(modulesData.data || modulesData);
        setVulnerabilities(vulnerabilitiesData);
      } catch (err) {
        console.error("Failed to preload filter data:", err);
        toast.error("Failed to load filter options");
      } finally {
        setIsPreloading(false);
      }
    };

    preloadData();
  }, []);

  // Fetch user completion data if logged in
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user) {
        setCompletedMachineIds(new Set());
        setCompletedModuleIds(new Set());
        setMachineLikes(new Map());
        return;
      }

      try {
        const [userMachines, userModules] = await Promise.all([
          api.getUserMachines(),
          api.getUserModules(),
        ]);

        // Process machines
        const machineIds = new Set<number>();
        const likes = new Map<number, boolean | null>();

        if (Array.isArray(userMachines)) {
          userMachines.forEach((item: any) => {
            const machineId = item.machine?.id || item.machine_id;
            if (machineId) {
              machineIds.add(machineId);
              likes.set(machineId, item.liked !== undefined ? item.liked : item.likes);
            }
          });
        }

        // Process modules
        const moduleIds = new Set<number>();
        if (Array.isArray(userModules)) {
          userModules.forEach((item: any) => {
            const moduleId = item.module?.id || item.module_id;
            if (moduleId) {
              moduleIds.add(moduleId);
            }
          });
        }

        setCompletedMachineIds(machineIds);
        setCompletedModuleIds(moduleIds);
        setMachineLikes(likes);
      } catch (err) {
        console.error("Failed to fetch user completion data:", err);
      }
    };

    fetchUserData();
  }, [session]);

  // Handle filter application
  const handleFilterApply = async (mode: FilterMode, filters: any) => {
    setCurrentFilters({ mode, filters });
    await fetchResults(mode, filters, 1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setPage(page);
    if (currentFilters) {
      fetchResults(currentFilters.mode, currentFilters.filters, page);
    }
  };

  // Fetch results based on filter mode
  const fetchResults = async (
    mode: FilterMode,
    filters: any,
    page: number,
    currentGlobalFilters = globalFilters
  ) => {
    setIsLoading(true);
    setError(null);
    setMachines([]);
    setModules([]);

    try {
      switch (mode) {
        case "exam": {
          // Fetch modules for the selected exam
          const response = await api.getExamModules(filters.examId, {
            limit: 1000, // Fetch more to allow client-side filtering
            offset: 0,
          });

          let modulesList = response.data || response;

          // Apply difficulty filter
          if (currentGlobalFilters.moduleDifficulty) {
            modulesList = modulesList.filter((m: Module) => m.difficulty === currentGlobalFilters.moduleDifficulty);
          }

          // Apply hide completed filter
          if (currentGlobalFilters.hideCompleted) {
            modulesList = modulesList.filter((m: Module) => !completedModuleIds.has(m.id));
          }

          // Paginate after filtering
          const offset = (page - 1) * pageSize;
          const totalFiltered = modulesList.length;
          const paginatedModules = modulesList.slice(offset, offset + pageSize);

          setModules(paginatedModules);
          setMachines([]);
          setTotalCount(totalFiltered);
          break;
        }

        case "module": {
          // Fetch machines for the selected module
          const response = await api.getMachines({
            modules: [filters.moduleId],
            difficulty: currentGlobalFilters.machineDifficulty,
            os: currentGlobalFilters.os,
            limit: 1000, // Fetch more to allow client-side filtering
            offset: 0,
          });

          let machinesList = response.data || response;

          // Apply hide completed filter
          if (currentGlobalFilters.hideCompleted) {
            machinesList = machinesList.filter((m: Machine) => !completedMachineIds.has(m.id));
          }

          // Paginate after filtering
          const offset = (page - 1) * pageSize;
          const totalFiltered = machinesList.length;
          const paginatedMachines = machinesList.slice(offset, offset + pageSize);

          setMachines(paginatedMachines);
          setModules([]);
          setTotalCount(totalFiltered);
          break;
        }

        case "vulnerability": {
          // Fetch both modules and machines with these vulnerabilities
          const [modulesResponse, machinesResponse] = await Promise.all([
            api.getModules({
              vulnerabilities: filters.vulnerabilityIds,
              difficulty: currentGlobalFilters.moduleDifficulty,
              limit: 1000, // Fetch more to allow client-side filtering
              offset: 0,
            }),
            api.getMachines({
              vulnerabilities: filters.vulnerabilityIds,
              difficulty: currentGlobalFilters.machineDifficulty,
              os: currentGlobalFilters.os,
              limit: 1000, // Fetch more to allow client-side filtering
              offset: 0,
            }),
          ]);

          let modulesList = modulesResponse.data || modulesResponse;
          let machinesList = machinesResponse.data || machinesResponse;

          // Apply hide completed filter
          if (currentGlobalFilters.hideCompleted) {
            modulesList = modulesList.filter((m: Module) => !completedModuleIds.has(m.id));
            machinesList = machinesList.filter((m: Machine) => !completedMachineIds.has(m.id));
          }

          // Combine results
          const allResults = [...modulesList, ...machinesList];
          const totalFiltered = allResults.length;

          // Paginate combined results
          const offset = (page - 1) * pageSize;
          const paginatedResults = allResults.slice(offset, offset + pageSize);
          const paginatedModules = paginatedResults.filter((item: any) => 'description' in item) as Module[];
          const paginatedMachines = paginatedResults.filter((item: any) => 'synopsis' in item) as Machine[];

          setModules(paginatedModules);
          setMachines(paginatedMachines);
          setTotalCount(totalFiltered);
          break;
        }

        case "machines": {
          // Fetch machines that cover all selected modules (intersection)
          const response = await api.getMachines({
            modules: filters.moduleIds,
            difficulty: currentGlobalFilters.machineDifficulty,
            os: currentGlobalFilters.os,
            limit: 1000, // Fetch more to allow client-side filtering
            offset: 0,
          });

          let machinesList = response.data || response;

          // Apply hide completed filter
          if (currentGlobalFilters.hideCompleted) {
            machinesList = machinesList.filter((m: Machine) => !completedMachineIds.has(m.id));
          }

          // Paginate after filtering
          const offset = (page - 1) * pageSize;
          const totalFiltered = machinesList.length;
          const paginatedMachines = machinesList.slice(offset, offset + pageSize);

          setMachines(paginatedMachines);
          setModules([]);
          setTotalCount(totalFiltered);
          break;
        }

        default:
          break;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch results";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle machine card click
  const handleMachineClick = (machine: Machine) => {
    setSelectedMachineId(machine.id);
    setIsMachineDialogOpen(true);
  };

  // Handle module card click
  const handleModuleClick = (module: Module) => {
    setSelectedModuleId(module.id);
    setIsModuleDialogOpen(true);
  };

  // Handle completion updates from dialogs
  const handleMachineCompletionFromDialog = (machineId: number, completed: boolean, liked?: boolean | null) => {
    if (completed) {
      setCompletedMachineIds((prev) => new Set(prev).add(machineId));
      if (liked !== undefined) {
        setMachineLikes((prev) => {
          const newMap = new Map(prev);
          newMap.set(machineId, liked);
          return newMap;
        });
      }
    } else {
      setCompletedMachineIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(machineId);
        return newSet;
      });
      setMachineLikes((prev) => {
        const newMap = new Map(prev);
        newMap.delete(machineId);
        return newMap;
      });
    }
    // Re-apply filters if hide completed is active
    if (globalFilters.hideCompleted && currentFilters) {
      fetchResults(currentFilters.mode, currentFilters.filters, currentPage);
    }
  };

  const handleModuleCompletionFromDialog = (moduleId: number, completed: boolean) => {
    if (completed) {
      setCompletedModuleIds((prev) => new Set(prev).add(moduleId));
    } else {
      setCompletedModuleIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(moduleId);
        return newSet;
      });
    }
    // Re-fetch results to update the list
    if (currentFilters) {
      fetchResults(currentFilters.mode, currentFilters.filters, currentPage);
    }
  };

  const handleMachineLikeFromDialog = (machineId: number, liked: boolean) => {
    setMachineLikes((prev) => {
      const newMap = new Map(prev);
      newMap.set(machineId, liked);
      return newMap;
    });
  };

  // Handle machine completion toggle
  const handleToggleMachineComplete = async (machineId: number, currentlyCompleted: boolean) => {
    if (!session?.user) {
      toast.error("Please log in to mark machines as completed");
      return;
    }

    setIsUpdating(true);
    try {
      if (currentlyCompleted) {
        await api.uncompleteMachine(machineId);
        setCompletedMachineIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(machineId);
          return newSet;
        });
        setMachineLikes((prev) => {
          const newMap = new Map(prev);
          newMap.delete(machineId);
          return newMap;
        });
        toast.success("Machine unmarked as completed");
      } else {
        await api.completeMachine(machineId);
        setCompletedMachineIds((prev) => new Set(prev).add(machineId));
        toast.success("Machine marked as completed");
      }
      // Re-fetch results to update the list
      if (currentFilters) {
        fetchResults(currentFilters.mode, currentFilters.filters, currentPage);
      }
    } catch (error) {
      toast.error("Failed to update machine completion");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle machine like toggle
  const handleToggleMachineLike = async (machineId: number, liked: boolean) => {
    if (!session?.user) {
      toast.error("Please log in to like machines");
      return;
    }

    setIsUpdating(true);
    try {
      await api.updateMachineLike(machineId, liked);
      setMachineLikes((prev) => {
        const newMap = new Map(prev);
        newMap.set(machineId, liked);
        return newMap;
      });
      toast.success(liked ? "Machine liked!" : "Machine disliked");
    } catch (error) {
      toast.error("Failed to update machine like status");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle module completion toggle
  const handleToggleModuleComplete = async (moduleId: number, currentlyCompleted: boolean) => {
    if (!session?.user) {
      toast.error("Please log in to mark modules as completed");
      return;
    }

    setIsUpdating(true);
    try {
      if (currentlyCompleted) {
        await api.uncompleteModule(moduleId);
        setCompletedModuleIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(moduleId);
          return newSet;
        });
        toast.success("Module unmarked as completed");
      } else {
        await api.completeModule(moduleId);
        setCompletedModuleIds((prev) => new Set(prev).add(moduleId));
        toast.success("Module marked as completed");
      }
      // Re-fetch results to update the list
      if (currentFilters) {
        fetchResults(currentFilters.mode, currentFilters.filters, currentPage);
      }
    } catch (error) {
      toast.error("Failed to update module completion");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle global filters change
  const handleGlobalFiltersChange = (filters: {
    machineDifficulty?: string;
    moduleDifficulty?: string;
    os?: string;
    hideCompleted?: boolean;
  }) => {
    setGlobalFilters(filters);
    // Re-fetch results with new filters (pass filters directly to avoid stale state)
    if (currentFilters) {
      fetchResults(currentFilters.mode, currentFilters.filters, 1, filters);
      setPage(1);
    }
  };

  return (
    <>
      <DashboardLayout
        filterPanel={
          <FilterPanel
            onFilterApply={handleFilterApply}
            isLoading={isLoading}
            isPreloading={isPreloading}
            exams={exams}
            modules={allModules}
            vulnerabilities={vulnerabilities}
            globalFilters={globalFilters}
            onGlobalFiltersChange={handleGlobalFiltersChange}
          />
        }
        resultsPanel={
          <ResultsPanel
            machines={machines}
            modules={modules}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            isLoading={isLoading}
            error={error}
            onPageChange={handlePageChange}
            onMachineClick={handleMachineClick}
            onModuleClick={handleModuleClick}
            completedMachineIds={completedMachineIds}
            completedModuleIds={completedModuleIds}
            machineLikes={machineLikes}
            onToggleMachineComplete={session?.user ? handleToggleMachineComplete : undefined}
            onToggleModuleComplete={session?.user ? handleToggleModuleComplete : undefined}
            onToggleMachineLike={session?.user ? handleToggleMachineLike : undefined}
            isUpdating={isUpdating}
          />
        }
      />

      {/* Detail Dialogs */}
      <MachineDetailDialog
        machineId={selectedMachineId}
        isOpen={isMachineDialogOpen}
        onClose={() => setIsMachineDialogOpen(false)}
        onCompletionChange={handleMachineCompletionFromDialog}
        onLikeChange={handleMachineLikeFromDialog}
      />

      <ModuleDetailDialog
        moduleId={selectedModuleId}
        isOpen={isModuleDialogOpen}
        onClose={() => setIsModuleDialogOpen(false)}
        onCompletionChange={handleModuleCompletionFromDialog}
      />
    </>
  );
}
