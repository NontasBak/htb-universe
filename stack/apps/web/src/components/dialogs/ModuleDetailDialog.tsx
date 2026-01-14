/**
 * ModuleDetailDialog
 * Displays detailed information about a module in a dialog
 * Shows description, units, vulnerabilities, and related machines
 */

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen, FileText, MonitorPlay, GraduationCap, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import api from "@/lib/api/client";
import type { ModuleWithDetails, Unit } from "@/types";

interface ModuleDetailDialogProps {
  moduleId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onCompletionChange?: (moduleId: number, completed: boolean) => void;
}

export function ModuleDetailDialog({
  moduleId,
  isOpen,
  onClose,
  onCompletionChange,
}: ModuleDetailDialogProps) {
  const { data: session } = authClient.useSession();
  const [module, setModule] = useState<ModuleWithDetails | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (moduleId && isOpen) {
      fetchModuleDetails();
      if (session) {
        checkCompletionStatus();
      }
    }
  }, [moduleId, isOpen, session]);

  const fetchModuleDetails = async () => {
    if (!moduleId) return;

    setLoading(true);
    setError(null);

    try {
      const [moduleData, unitsData] = await Promise.all([
        api.getModuleById(moduleId),
        api.getModuleUnits(moduleId),
      ]);
      setModule(moduleData);
      setUnits(unitsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load module details");
    } finally {
      setLoading(false);
    }
  };

  const checkCompletionStatus = async () => {
    if (!moduleId || !session) return;

    try {
      const { completed } = await api.isModuleCompleted(moduleId);
      setIsCompleted(completed);
    } catch (err) {
      // Silently fail - user might not be authenticated
      console.error("Failed to check completion status:", err);
    }
  };

  const toggleCompletion = async () => {
    if (!moduleId || !session) return;

    setIsUpdating(true);
    try {
      if (isCompleted) {
        await api.uncompleteModule(moduleId);
        setIsCompleted(false);
        toast.success("Module unmarked as completed");
        if (onCompletionChange) {
          onCompletionChange(moduleId, false);
        }
      } else {
        await api.completeModule(moduleId);
        setIsCompleted(true);
        toast.success("Module marked as completed");
        if (onCompletionChange) {
          onCompletionChange(moduleId, true);
        }
      }
    } catch (err) {
      toast.error("Failed to update completion status");
    } finally {
      setIsUpdating(false);
    }
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-500 hover:bg-green-600";
      case "medium":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "hard":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getUnitTypeIcon = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case "article":
        return FileText;
      case "interactive":
        return MonitorPlay;
      case "video":
        return MonitorPlay;
      default:
        return FileText;
    }
  };

  // Sort units by sequence_order
  const sortedUnits = [...units].sort((a, b) => {
    const orderA = a.sequence_order ?? 999;
    const orderB = b.sequence_order ?? 999;
    return orderA - orderB;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl! max-h-[85vh] w-[90vw]">
        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : module ? (
          <ScrollArea className="max-h-[75vh] pr-4">
            <DialogHeader>
              <div className="flex items-start gap-3 pr-8">
                {module.image ? (
                  <img
                    src={module.image}
                    alt={module.name || "Module"}
                    className="h-16 w-16 rounded object-cover shrink-0"
                  />
                ) : (
                  <BookOpen className="h-8 w-8 shrink-0 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-2xl">
                    {module.name || "Unnamed Module"}
                  </DialogTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {module.difficulty && (
                      <Badge className={getDifficultyColor(module.difficulty)}>
                        {module.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Action Button */}
            {session && (
              <div className="mt-4">
                <Button
                  variant={isCompleted ? "default" : "outline"}
                  size="sm"
                  onClick={toggleCompletion}
                  disabled={isUpdating}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Circle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="space-y-6 mt-6">
              {/* Description */}
              {module.description && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {module.description}
                  </p>
                </div>
              )}

              <Separator />

              {/* Units */}
              {sortedUnits.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Units ({sortedUnits.length})
                  </h3>
                  <div className="space-y-2">
                    {sortedUnits.map((unit, index) => {
                      const UnitIcon = getUnitTypeIcon(unit.type);
                      return (
                        <div
                          key={unit.id}
                          className="flex items-center gap-3 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <span className="text-sm font-mono text-muted-foreground w-6">
                            {unit.sequence_order ?? index + 1}
                          </span>
                          <UnitIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="flex-1">
                          <span className="text-sm font-medium">
                            {unit.name || `Unit ${unit.id}`}
                          </span>
                          {unit.type && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {unit.type}
                            </Badge>
                          )}
                        </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Vulnerabilities */}
              {module.vulnerabilities && module.vulnerabilities.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Vulnerabilities Covered ({module.vulnerabilities.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {module.vulnerabilities.map((vuln) => (
                      <Badge key={vuln.id} variant="secondary">
                        {vuln.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Exams */}
              {module.exams && module.exams.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Relevant for Exams ({module.exams.length})
                  </h3>
                  <div className="space-y-2">
                    {module.exams.map((exam) => (
                      <div
                        key={exam.id}
                        className="flex items-center gap-2 p-2 rounded-md border bg-card"
                      >
                        <GraduationCap className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {exam.name || `Exam ${exam.id}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Machines */}
              {module.machines && module.machines.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Practice Machines ({module.machines.length})
                  </h3>
                  <div className="space-y-2">
                    {module.machines.map((machine) => (
                      <div
                        key={machine.id}
                        className="flex items-center justify-between p-2 rounded-md border bg-card"
                      >
                        <span className="text-sm font-medium">
                          {machine.name || `Machine ${machine.id}`}
                        </span>
                        <div className="flex gap-2">
                          {machine.os && (
                            <Badge variant="outline" className="text-xs">
                              {machine.os}
                            </Badge>
                          )}
                          {machine.difficulty && (
                            <Badge variant="secondary" className="text-xs">
                              {machine.difficulty}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External Link */}
              {module.url && (
                <div className="pt-2">
                  <a
                    href={module.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 h-8 px-2.5 rounded-none border border-border bg-background hover:bg-muted hover:text-foreground transition-colors text-xs font-medium w-full"
                  >
                    <span>View on HTB Academy</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
