/**
 * ModuleCard
 * Displays a module with its key information
 * Clickable to open detailed view
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import type { Module } from "@/types";

interface ModuleCardProps {
  module: Module;
  onClick: (module: Module) => void;
}

export function ModuleCard({ module, onClick }: ModuleCardProps) {
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

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
      onClick={() => onClick(module)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-1">
            {module.name || "Unnamed Module"}
          </CardTitle>
          <BookOpen className="h-5 w-5 shrink-0 text-muted-foreground" />
        </div>
        {module.description && (
          <CardDescription className="line-clamp-2 text-sm">
            {module.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {module.difficulty && (
            <Badge className={getDifficultyColor(module.difficulty)}>
              {module.difficulty}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
