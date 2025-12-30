/**
 * FilterPanel
 * Left column component containing filter tabs
 * Allows users to select different filtering modes and apply filters
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
  globalFilters?: {
    machineDifficulty?: string;
    moduleDifficulty?: string;
    os?: string;
    hideCompleted?: boolean;
  };
  onGlobalFiltersChange?: (filters: {
    machineDifficulty?: string;
    moduleDifficulty?: string;
    os?: string;
    hideCompleted?: boolean;
  }) => void;
}

export function FilterPanel({
  onFilterApply,
  isLoading,
  isPreloading,
  exams,
  modules,
  vulnerabilities,
  globalFilters = {},
  onGlobalFiltersChange
}: FilterPanelProps) {
  const { params, setTab } = useUrlParams();
  const activeTab = params.tab || "exam";

  const [machineDifficulty, setMachineDifficulty] = useState<string>(globalFilters.machineDifficulty || "all");
  const [moduleDifficulty, setModuleDifficulty] = useState<string>(globalFilters.moduleDifficulty || "all");
  const [os, setOs] = useState<string>(globalFilters.os || "all");
  const [hideCompleted, setHideCompleted] = useState<boolean>(globalFilters.hideCompleted || false);

  const handleTabChange = (value: string) => {
    setTab(value as FilterMode);
  };

  const handleMachineDifficultyChange = (value: string | null) => {
    const newValue = value || "all";
    setMachineDifficulty(newValue);
    if (onGlobalFiltersChange) {
      onGlobalFiltersChange({
        machineDifficulty: newValue === "all" ? undefined : newValue,
        moduleDifficulty: moduleDifficulty === "all" ? undefined : moduleDifficulty,
        os: os === "all" ? undefined : os,
        hideCompleted
      });
    }
  };

  const handleModuleDifficultyChange = (value: string | null) => {
    const newValue = value || "all";
    setModuleDifficulty(newValue);
    if (onGlobalFiltersChange) {
      onGlobalFiltersChange({
        machineDifficulty: machineDifficulty === "all" ? undefined : machineDifficulty,
        moduleDifficulty: newValue === "all" ? undefined : newValue,
        os: os === "all" ? undefined : os,
        hideCompleted
      });
    }
  };

  const handleOsChange = (value: string | null) => {
    const newValue = value || "all";
    setOs(newValue);
    if (onGlobalFiltersChange) {
      onGlobalFiltersChange({
        machineDifficulty: machineDifficulty === "all" ? undefined : machineDifficulty,
        moduleDifficulty: moduleDifficulty === "all" ? undefined : moduleDifficulty,
        os: newValue === "all" ? undefined : newValue,
        hideCompleted
      });
    }
  };

  const handleHideCompletedChange = (checked: boolean) => {
    setHideCompleted(checked);
    if (onGlobalFiltersChange) {
      onGlobalFiltersChange({
        machineDifficulty: machineDifficulty === "all" ? undefined : machineDifficulty,
        moduleDifficulty: moduleDifficulty === "all" ? undefined : moduleDifficulty,
        os: os === "all" ? undefined : os,
        hideCompleted: checked
      });
    }
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

        {/* Additional Filters */}
        <Separator className="my-6" />
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Additional Filters</h3>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Machine Difficulty</Label>
            <Select value={machineDifficulty} onValueChange={handleMachineDifficultyChange}>
              <SelectTrigger>
                <SelectValue>
                  {machineDifficulty === "all" ? "-" : machineDifficulty}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
                <SelectItem value="Insane">Insane</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Module Difficulty</Label>
            <Select value={moduleDifficulty} onValueChange={handleModuleDifficultyChange}>
              <SelectTrigger>
                <SelectValue>
                  {moduleDifficulty === "all" ? "-" : moduleDifficulty}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Operating System</Label>
            <Select value={os} onValueChange={handleOsChange}>
              <SelectTrigger>
                <SelectValue>
                  {os === "all" ? "-" : os}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All OS</SelectItem>
                <SelectItem value="Windows">Windows</SelectItem>
                <SelectItem value="Linux">Linux</SelectItem>
                <SelectItem value="Android">Android</SelectItem>
                <SelectItem value="FreeBSD">FreeBSD</SelectItem>
                <SelectItem value="OpenBSD">OpenBSD</SelectItem>
                <SelectItem value="Solaris">Solaris</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hide-completed"
              checked={hideCompleted}
              onCheckedChange={handleHideCompletedChange}
            />
            <Label
              htmlFor="hide-completed"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Hide completed items
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
