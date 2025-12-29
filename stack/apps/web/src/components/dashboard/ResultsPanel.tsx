/**
 * ResultsPanel
 * Right column component displaying filtered results with pagination
 * Handles both machines and modules display
 */

import type { Machine, Module } from "@/types";
import { MachineCard } from "../cards/MachineCard";
import { ModuleCard } from "../cards/ModuleCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, AlertTriangle, BookOpen, Monitor } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";

interface ResultsPanelProps {
  machines: Machine[];
  modules: Module[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
  onMachineClick: (machine: Machine) => void;
  onModuleClick: (module: Module) => void;
}

export function ResultsPanel({
  machines,
  modules,
  totalCount,
  currentPage,
  pageSize,
  isLoading,
  error,
  onPageChange,
  onMachineClick,
  onModuleClick,
}: ResultsPanelProps) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasResults = machines.length > 0 || modules.length > 0;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("ellipsis");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Empty state
  if (!isLoading && !hasResults && !error) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center space-y-4">
            <Search className="h-16 w-16 mx-auto text-muted-foreground" />
            <h3 className="text-xl font-semibold">No Results</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select filters from the left panel to find machines, modules, and learning resources.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-16 w-16 mx-auto text-destructive" />
            <h3 className="text-xl font-semibold">Error Loading Results</h3>
            <p className="text-muted-foreground max-w-md mx-auto">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      {hasResults && !isLoading && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modules Section */}
      {!isLoading && modules.length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Modules ({modules.length})
              </CardTitle>
            </CardHeader>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onClick={onModuleClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Separator if both sections exist */}
      {!isLoading && modules.length > 0 && machines.length > 0 && (
        <Separator className="my-8" />
      )}

      {/* Machines Section */}
      {!isLoading && machines.length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Machines ({machines.length})
              </CardTitle>
            </CardHeader>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {machines.map((machine) => (
              <MachineCard
                key={machine.id}
                machine={machine}
                onClick={onMachineClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && hasResults && totalPages > 1 && (
        <div className="flex justify-center pt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {getPageNumbers().map((pageNum, idx) => (
                <PaginationItem key={idx}>
                  {pageNum === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => onPageChange(pageNum)}
                      isActive={pageNum === currentPage}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
