/**
 * MachineCard
 * Displays a machine with its key information
 * Clickable to open detailed view
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Monitor, CheckCircle2, ThumbsUp, ThumbsDown, type LucideIcon } from "lucide-react";
import type { Machine } from "@/types";
import { cn } from "@/lib/utils";

interface MachineCardProps {
  machine: Machine;
  onClick: (machine: Machine) => void;
  completed?: boolean;
  liked?: boolean | null;
  onToggleComplete?: (machineId: number, currentlyCompleted: boolean) => void;
  onToggleLike?: (machineId: number, liked: boolean) => void;
  isUpdating?: boolean;
  showLikeButtons?: boolean; // Control whether to show like/dislike buttons
}

export function MachineCard({
  machine,
  onClick,
  completed = false,
  liked = null,
  onToggleComplete,
  onToggleLike,
  isUpdating = false,
  showLikeButtons = false
}: MachineCardProps) {
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

  const getOSIcon = (os: string | null): LucideIcon => {
    // All OS types use Monitor icon for consistency
    return Monitor;
  };

  const OSIcon = getOSIcon(machine.os);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick(machine);
  };

  const handleToggleLike = (e: React.MouseEvent, newLiked: boolean) => {
    e.stopPropagation();
    if (onToggleLike && !isUpdating) {
      onToggleLike(machine.id, newLiked);
    }
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
        completed && "border-green-500 border-2"
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {machine.image && (
            <img
              src={machine.image}
              alt={machine.name || "Machine"}
              className="h-12 w-12 rounded object-cover shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1">
              {machine.name || "Unnamed Machine"}
            </CardTitle>
            {machine.synopsis && (
              <CardDescription className="line-clamp-2 text-sm mt-1">
                {machine.synopsis}
              </CardDescription>
            )}
          </div>
          <OSIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {machine.difficulty && (
            <Badge className={getDifficultyColor(machine.difficulty)}>
              {machine.difficulty}
            </Badge>
          )}
          {machine.os && (
            <Badge variant="outline">
              {machine.os}
            </Badge>
          )}
          {completed && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>

        {/* Like buttons - only show when showLikeButtons prop is true */}
        {showLikeButtons && onToggleLike && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant={liked === true ? "default" : "outline"}
              size="sm"
              onClick={(e) => handleToggleLike(e, true)}
              disabled={isUpdating || !completed}
              className="flex-1"
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Like
            </Button>
            <Button
              variant={liked === false ? "destructive" : "outline"}
              size="sm"
              onClick={(e) => handleToggleLike(e, false)}
              disabled={isUpdating || !completed}
              className="flex-1"
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              Dislike
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
