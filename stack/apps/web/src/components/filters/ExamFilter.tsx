/**
 * ExamFilter
 * Allows users to select an exam and find required modules
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
import type { Exam } from "@/types";
import { useUrlParams } from "@/hooks/useUrlParams";
import Loader from "@/components/loader";

interface ExamFilterProps {
  onApply: (mode: "exam", filters: { examId: number }) => void;
  isLoading?: boolean;
  isPreloading?: boolean;
  exams: Exam[];
}

export function ExamFilter({ onApply, isLoading, isPreloading, exams }: ExamFilterProps) {
  const { params, updateParams } = useUrlParams();
  const [selectedExamId, setSelectedExamId] = useState<number | null>(
    params.exam ? parseInt(params.exam) : null
  );
  const [open, setOpen] = useState(false);

  // Auto-apply filter if exam is in URL params
  useEffect(() => {
    if (params.exam && exams.length > 0) {
      handleApply();
    }
  }, [params.exam, exams]);

  const handleApply = () => {
    if (!selectedExamId) return;

    updateParams({ exam: selectedExamId.toString(), page: "1" });
    onApply("exam", { examId: selectedExamId });
  };

  const handleExamSelect = (examId: number) => {
    setSelectedExamId(examId);
    setOpen(false);
  };

  const selectedExam = exams.find((exam) => exam.id === selectedExamId);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="exam-select" className="text-sm font-semibold">Select an Exam</Label>
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
                {selectedExam ? selectedExam.name : "Choose an exam..."}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] max-w-[500px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search exams..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No exam found.</CommandEmpty>
                  <CommandGroup>
                    {exams.map((exam) => (
                      <CommandItem
                        key={exam.id}
                        value={exam.name || `Exam ${exam.id}`}
                        onSelect={() => handleExamSelect(exam.id)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            selectedExamId === exam.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="line-clamp-2">{exam.name || `Exam ${exam.id}`}</span>
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
          Find all modules required to prepare for this certification exam.
        </p>
      </div>

      <Button
        onClick={handleApply}
        disabled={!selectedExamId || isLoading || isPreloading}
        className="w-full h-10"
        size="default"
      >
        {isLoading ? "Loading..." : "Find Required Modules"}
      </Button>
    </div>
  );
}
