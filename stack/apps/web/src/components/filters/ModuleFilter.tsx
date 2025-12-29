/**
 * ModuleFilter
 * Allows users to select a module and find practice machines
 * Uses Combobox for searchable dropdown
 */

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Module } from "@/types";
import { useUrlParams } from "@/hooks/useUrlParams";
import Loader from "@/components/loader";

interface ModuleFilterProps {
  onApply: (mode: "module", filters: { moduleId: number }) => void;
  isLoading?: boolean;
  isPreloading?: boolean;
  modules: Module[];
}

export function ModuleFilter({ onApply, isLoading, isPreloading, modules }: ModuleFilterProps) {
  const { params, updateParams } = useUrlParams();
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(
    params.module ? parseInt(params.module) : null
  );
  const [open, setOpen] = useState(false);

  // Auto-apply filter if module is in URL params
  useEffect(() => {
    if (params.module && modules.length > 0) {
      handleApply();
    }
  }, [params.module, modules]);

  const handleApply = () => {
    if (!selectedModuleId) return;

    updateParams({ module: selectedModuleId.toString(), page: "1" });
    onApply("module", { moduleId: selectedModuleId });
  };

  const handleModuleSelect = (moduleId: number) => {
    setSelectedModuleId(moduleId);
    setOpen(false);
  };

  const selectedModule = modules.find((module) => module.id === selectedModuleId);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="module-select" className="text-sm font-semibold">Select a Module</Label>
        {isPreloading ? (
          <div className="flex items-center justify-center py-8">
            <Loader />
          </div>
        ) : (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              className="flex h-10 w-full items-center justify-between gap-1.5 rounded-md border border-border bg-background px-3 text-left text-sm font-normal transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              role="combobox"
              aria-expanded={open}
              disabled={isPreloading}
            >
              <span className="truncate">
                {selectedModule ? selectedModule.name : "Choose a module..."}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] max-w-[500px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search modules..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No module found.</CommandEmpty>
                  <CommandGroup>
                    {modules.map((module) => (
                      <CommandItem
                        key={module.id}
                        value={module.name || `Module ${module.id}`}
                        onSelect={() => handleModuleSelect(module.id)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            selectedModuleId === module.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="line-clamp-2">{module.name || `Module ${module.id}`}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="rounded-md bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Find practice machines that help you learn the concepts covered in this module.
        </p>
      </div>

      <Button
        onClick={handleApply}
        disabled={!selectedModuleId || isLoading || isPreloading}
        className="w-full h-10"
        size="default"
      >
        {isLoading ? "Loading..." : "Find Practice Machines"}
      </Button>
    </div>
  );
}
