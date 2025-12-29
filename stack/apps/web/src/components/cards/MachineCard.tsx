/**
 * MachineCard
 * Displays a machine with its key information
 * Clickable to open detailed view
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, type LucideIcon } from "lucide-react";
import type { Machine } from "@/types";

interface MachineCardProps {
  machine: Machine;
  onClick: (machine: Machine) => void;
}

export function MachineCard({ machine, onClick }: MachineCardProps) {
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

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
      onClick={() => onClick(machine)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-1">
            {machine.name || "Unnamed Machine"}
          </CardTitle>
          <OSIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
        </div>
        {machine.synopsis && (
          <CardDescription className="line-clamp-2 text-sm">
            {machine.synopsis}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
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
        </div>
      </CardContent>
    </Card>
  );
}
