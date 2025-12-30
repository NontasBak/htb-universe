/**
 * ModuleCard
 * Displays a module with its key information
 * Clickable to open detailed view
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle2 } from "lucide-react";
import type { Module } from "@/types";
import { cn } from "@/lib/utils";

interface ModuleCardProps {
  module: Module;
  onClick: (module: Module) => void;
  completed?: boolean;
  onToggleComplete?: (moduleId: number, currentlyCompleted: boolean) => void;
  isUpdating?: boolean;
}

export function ModuleCard({
  module,
  onClick,
  completed = false,
  onToggleComplete,
  isUpdating = false
}: ModuleCardProps) {
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

  const handleCardClick = () => {
    onClick(module);
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
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1">
              {module.name || "Unnamed Module"}
            </CardTitle>
            {module.description && (
              <CardDescription className="line-clamp-2 text-sm mt-1">
                {module.description}
              </CardDescription>
            )}
          </div>
          <BookOpen className="h-5 w-5 shrink-0 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {module.difficulty && (
            <Badge className={getDifficultyColor(module.difficulty)}>
              {module.difficulty}
            </Badge>
          )}
          {completed && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
