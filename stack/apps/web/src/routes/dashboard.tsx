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

export default function Dashboard() {
  const { params, setPage } = useUrlParams();

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
  const fetchResults = async (mode: FilterMode, filters: any, page: number) => {
    setIsLoading(true);
    setError(null);
    setMachines([]);
    setModules([]);

    try {
      const offset = (page - 1) * pageSize;

      switch (mode) {
        case "exam": {
          // Fetch modules for the selected exam
          const response = await api.getExamModules(filters.examId, {
            limit: pageSize,
            offset,
          });

          const modulesList = response.data || response;
          setModules(modulesList);
          setMachines([]);
          setTotalCount(response.total || modulesList.length);
          break;
        }

        case "module": {
          // Fetch machines for the selected module
          const response = await api.getMachines({
            modules: [filters.moduleId],
            limit: pageSize,
            offset,
          });

          const machinesList = response.data || response;
          setMachines(machinesList);
          setModules([]);
          setTotalCount(response.total || machinesList.length);
          break;
        }

        case "vulnerability": {
          // Fetch both modules and machines with these vulnerabilities
          const [modulesResponse, machinesResponse] = await Promise.all([
            api.getModules({
              vulnerabilities: filters.vulnerabilityIds,
              limit: pageSize,
              offset,
            }),
            api.getMachines({
              vulnerabilities: filters.vulnerabilityIds,
              limit: pageSize,
              offset,
            }),
          ]);

          const modulesList = modulesResponse.data || modulesResponse;
          const machinesList = machinesResponse.data || machinesResponse;

          setModules(modulesList);
          setMachines(machinesList);
          setTotalCount(
            (modulesResponse.total || modulesList.length) +
            (machinesResponse.total || machinesList.length)
          );
          break;
        }

        case "machines": {
          // Fetch machines that cover all selected modules (intersection)
          const response = await api.getMachines({
            modules: filters.moduleIds,
            limit: pageSize,
            offset,
          });

          const machinesList = response.data || response;
          setMachines(machinesList);
          setModules([]);
          setTotalCount(response.total || machinesList.length);
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
          />
        }
      />

      {/* Detail Dialogs */}
      <MachineDetailDialog
        machineId={selectedMachineId}
        isOpen={isMachineDialogOpen}
        onClose={() => setIsMachineDialogOpen(false)}
      />

      <ModuleDetailDialog
        moduleId={selectedModuleId}
        isOpen={isModuleDialogOpen}
        onClose={() => setIsModuleDialogOpen(false)}
      />
    </>
  );
}
