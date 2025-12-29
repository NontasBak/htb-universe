/**
 * FilterPanel
 * Left column component containing filter tabs
 * Allows users to select different filtering modes and apply filters
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExamFilter } from "../filters/ExamFilter";
import { ModuleFilter } from "../filters/ModuleFilter";
import { VulnerabilityFilter } from "../filters/VulnerabilityFilter";
import { MachineDiscoveryFilter } from "../filters/MachineDiscoveryFilter";
import type { FilterMode, Exam, Module, Vulnerability } from "@/types";
import { useUrlParams } from "@/hooks/useUrlParams";
import { GraduationCap, BookOpen, ShieldAlert, Search } from "lucide-react";

interface FilterPanelProps {
  onFilterApply: (mode: FilterMode, filters: any) => void;
  isLoading?: boolean;
  isPreloading?: boolean;
  exams: Exam[];
  modules: Module[];
  vulnerabilities: Vulnerability[];
}

export function FilterPanel({
  onFilterApply,
  isLoading,
  isPreloading,
  exams,
  modules,
  vulnerabilities
}: FilterPanelProps) {
  const { params, setTab } = useUrlParams();
  const activeTab = params.tab || "exam";

  const handleTabChange = (value: string) => {
    setTab(value as FilterMode);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Resources</CardTitle>
        <CardDescription>
          Find machines, modules, and learning paths based on your goals
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2 gap-2 p-1 bg-muted/50 mb-4 h-auto!">
            <TabsTrigger
              value="exam"
              className="flex flex-col items-center gap-1.5 py-3 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-auto!"
            >
              <GraduationCap className="h-4 w-4" />
              <span>Exam Prep</span>
            </TabsTrigger>
            <TabsTrigger
              value="module"
              className="flex flex-col items-center gap-1.5 py-3 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-auto!"
            >
              <BookOpen className="h-4 w-4" />
              <span>Practice</span>
            </TabsTrigger>
            <TabsTrigger
              value="vulnerability"
              className="flex flex-col items-center gap-1.5 py-3 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-auto!"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Vulnerability</span>
            </TabsTrigger>
            <TabsTrigger
              value="machines"
              className="flex flex-col items-center gap-1.5 py-3 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-auto!"
            >
              <Search className="h-4 w-4" />
              <span>Discovery</span>
            </TabsTrigger>
          </TabsList>

          <div>
            <TabsContent value="exam" className="mt-0">
              <ExamFilter
                onApply={onFilterApply}
                isLoading={isLoading}
                isPreloading={isPreloading}
                exams={exams}
              />
            </TabsContent>

            <TabsContent value="module" className="mt-0">
              <ModuleFilter
                onApply={onFilterApply}
                isLoading={isLoading}
                isPreloading={isPreloading}
                modules={modules}
              />
            </TabsContent>

            <TabsContent value="vulnerability" className="mt-0">
              <VulnerabilityFilter
                onApply={onFilterApply}
                isLoading={isLoading}
                isPreloading={isPreloading}
                vulnerabilities={vulnerabilities}
              />
            </TabsContent>

            <TabsContent value="machines" className="mt-0">
              <MachineDiscoveryFilter
                onApply={onFilterApply}
                isLoading={isLoading}
                isPreloading={isPreloading}
                modules={modules}
              />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
