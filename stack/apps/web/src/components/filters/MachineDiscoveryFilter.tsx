/**
 * MachineDiscoveryFilter
 * Allows users to select multiple modules and find machines that cover all of them
 */

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { Module } from "@/types";
import { useUrlParams } from "@/hooks/useUrlParams";
import Loader from "@/components/loader";

interface MachineDiscoveryFilterProps {
  onApply: (mode: "machines", filters: { moduleIds: number[] }) => void;
  isLoading?: boolean;
  isPreloading?: boolean;
  modules: Module[];
}

export function MachineDiscoveryFilter({ onApply, isLoading, isPreloading, modules }: MachineDiscoveryFilterProps) {
  const { params, updateParams } = useUrlParams();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize selected IDs from URL params
  useEffect(() => {
    if (params.modules) {
      const ids = params.modules.split(",").map(Number).filter(Boolean);
      setSelectedIds(ids);
    }
  }, [params.modules]);

  // Auto-apply filter if modules are in URL params
  useEffect(() => {
    if (params.modules && modules.length > 0 && selectedIds.length > 0) {
      handleApply();
    }
  }, [params.modules, modules]);

  const handleApply = () => {
    if (selectedIds.length === 0) return;

    updateParams({ modules: selectedIds.join(","), page: "1" });
    onApply("machines", { moduleIds: selectedIds });
  };

  const handleToggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  // Filter modules based on search query
  const filteredModules = modules.filter((module) =>
    module.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected module objects for display
  const selectedModules = modules.filter((module) =>
    selectedIds.includes(module.id)
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Select Modules</Label>

        <Input
          type="text"
          placeholder="Search modules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {isPreloading ? (
          <div className="flex items-center justify-center py-8">
            <Loader />
          </div>
        ) : (
          <ScrollArea className="h-[240px] border p-4">
            <div className="space-y-3">
              {filteredModules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No modules found
                </p>
              ) : (
                filteredModules.map((module) => (
                  <div key={module.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`module-${module.id}`}
                      checked={selectedIds.includes(module.id)}
                      onCheckedChange={() => handleToggle(module.id)}
                    />
                    <label
                      htmlFor={`module-${module.id}`}
                      className="text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {module.name || `Module ${module.id}`}
                    </label>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        {/* Selected Items Display */}
        {selectedIds.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Selected ({selectedIds.length})
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-auto py-1 px-2 text-xs hover:text-destructive"
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedModules.map((module) => (
                <Badge
                  key={module.id}
                  variant="secondary"
                  className="text-xs pl-2 pr-1 py-1 gap-1"
                >
                  <span className="max-w-[200px] truncate">
                    {module.name || `Module ${module.id}`}
                  </span>
                  <button
                    onClick={() => handleToggle(module.id)}
                    className="hover:bg-secondary-foreground/20 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-md bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Find machines that cover ALL selected modules (intersection logic).
        </p>
      </div>

      <Button
        onClick={handleApply}
        disabled={selectedIds.length === 0 || isLoading || isPreloading}
        className="w-full h-10"
        size="default"
      >
        {isLoading ? "Loading..." : `Find Machines (${selectedIds.length} selected)`}
      </Button>
    </div>
  );
}
