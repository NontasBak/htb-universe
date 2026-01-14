/**
 * MachineDetailDialog
 * Displays detailed information about a machine in a dialog
 * Shows synopsis, vulnerabilities, languages, and related modules
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
import { ExternalLink, Monitor, CheckCircle2, Circle, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import api from "@/lib/api/client";
import type { MachineWithDetails } from "@/types";

interface MachineDetailDialogProps {
  machineId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onCompletionChange?: (machineId: number, completed: boolean, liked?: boolean | null) => void;
  onLikeChange?: (machineId: number, liked: boolean) => void;
}

export function MachineDetailDialog({
  machineId,
  isOpen,
  onClose,
  onCompletionChange,
  onLikeChange,
}: MachineDetailDialogProps) {
  const { data: session } = authClient.useSession();
  const [machine, setMachine] = useState<MachineWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (machineId && isOpen) {
      fetchMachineDetails();
      if (session) {
        checkCompletionStatus();
      }
    }
  }, [machineId, isOpen, session]);

  const fetchMachineDetails = async () => {
    if (!machineId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await api.getMachineById(machineId);
      setMachine(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load machine details");
    } finally {
      setLoading(false);
    }
  };

  const checkCompletionStatus = async () => {
    if (!machineId || !session) return;

    try {
      const status = await api.getMachineStatus(machineId);
      setIsCompleted(status.completed);
      setLiked(status.liked);
    } catch (err) {
      // Silently fail - user might not be authenticated
      console.error("Failed to check completion status:", err);
    }
  };

  const toggleCompletion = async () => {
    if (!machineId || !session) return;

    setIsUpdating(true);
    try {
      if (isCompleted) {
        await api.uncompleteMachine(machineId);
        setIsCompleted(false);
        setLiked(null);
        toast.success("Machine unmarked as completed");
        if (onCompletionChange) {
          onCompletionChange(machineId, false);
        }
      } else {
        await api.completeMachine(machineId);
        setIsCompleted(true);
        toast.success("Machine marked as completed");
        if (onCompletionChange) {
          onCompletionChange(machineId, true);
        }
      }
    } catch (err) {
      toast.error("Failed to update completion status");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleLike = async (newLiked: boolean) => {
    if (!machineId || !session || !isCompleted) return;

    setIsUpdating(true);
    try {
      await api.updateMachineLike(machineId, newLiked);
      setLiked(newLiked);
      toast.success(newLiked ? "Machine liked!" : "Machine disliked");
      if (onLikeChange) {
        onLikeChange(machineId, newLiked);
      }
    } catch (err) {
      toast.error("Failed to update like status");
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
        return "bg-orange-500 hover:bg-orange-600";
      case "insane":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

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
        ) : machine ? (
          <ScrollArea className="max-h-[75vh] pr-4">
            <DialogHeader>
              <div className="flex items-start gap-3 pr-8">
                {machine.image ? (
                  <img
                    src={machine.image}
                    alt={machine.name || "Machine"}
                    className="h-16 w-16 rounded object-cover shrink-0"
                  />
                ) : (
                  <Monitor className="h-8 w-8 shrink-0 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-2xl">
                    {machine.name || "Unnamed Machine"}
                  </DialogTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {machine.difficulty && (
                      <Badge className={getDifficultyColor(machine.difficulty)}>
                        {machine.difficulty}
                      </Badge>
                    )}
                    {machine.os && (
                      <Badge variant="outline">{machine.os}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Action Buttons */}
            {session && (
              <div className="flex flex-wrap gap-2 mt-4">
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
                {isCompleted && (
                  <>
                    <Button
                      variant={liked === true ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleLike(true)}
                      disabled={isUpdating}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Like
                    </Button>
                    <Button
                      variant={liked === false ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => toggleLike(false)}
                      disabled={isUpdating}
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Dislike
                    </Button>
                  </>
                )}
              </div>
            )}

            <div className="space-y-6 mt-6">
              {/* Synopsis */}
              {machine.synopsis && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Synopsis</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {machine.synopsis}
                  </p>
                </div>
              )}

              <Separator />

              {/* Vulnerabilities */}
              {machine.vulnerabilities && machine.vulnerabilities.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Vulnerabilities ({machine.vulnerabilities.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {machine.vulnerabilities.map((vuln) => (
                      <Badge key={vuln.id} variant="secondary">
                        {vuln.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {machine.languages && machine.languages.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Languages ({machine.languages.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {machine.languages.map((lang, idx) => (
                      <Badge key={idx} variant="outline">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Areas of Interest */}
              {machine.areasOfInterest && machine.areasOfInterest.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Areas of Interest ({machine.areasOfInterest.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {machine.areasOfInterest.map((area, idx) => (
                      <Badge key={idx} variant="outline">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Modules */}
              {machine.modules && machine.modules.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Related Modules ({machine.modules.length})
                  </h3>
                  <div className="space-y-2">
                    {machine.modules.map((module) => (
                      <div
                        key={module.id}
                        className="flex items-center justify-between p-2 rounded-md border bg-card"
                      >
                        <span className="text-sm font-medium">
                          {module.name || `Module ${module.id}`}
                        </span>
                        {module.difficulty && (
                          <Badge variant="secondary" className="text-xs">
                            {module.difficulty}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External Link */}
              {machine.url && (
                <div className="pt-2">
                  <a
                    href={machine.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 h-8 px-2.5 rounded-none border border-border bg-background hover:bg-muted hover:text-foreground transition-colors text-xs font-medium w-full"
                  >
                    <span>View on HTB</span>
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
