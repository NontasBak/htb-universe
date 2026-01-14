/**
 * Profile Page
 * Allows authenticated users to view and manage their completed machines, modules, and exams
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import api from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import Loader from "@/components/loader";
import { Search, CheckCircle2, Award, BookOpen, Server, Monitor, Info, ThumbsUp, ThumbsDown } from "lucide-react";
import type { Machine, Module, Exam } from "@/types";
import { MachineDetailDialog } from "@/components/dialogs/MachineDetailDialog";
import { ModuleDetailDialog } from "@/components/dialogs/ModuleDetailDialog";

const ITEMS_PER_PAGE = 12;

export default function Profile() {
  const navigate = useNavigate();
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  // Data state
  const [allMachines, setAllMachines] = useState<Machine[]>([]);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [allExams, setAllExams] = useState<Exam[]>([]);

  // User completions
  const [completedMachineIds, setCompletedMachineIds] = useState<Set<number>>(new Set());
  const [completedModuleIds, setCompletedModuleIds] = useState<Set<number>>(new Set());
  const [completedExamIds, setCompletedExamIds] = useState<Set<number>>(new Set());
  const [machineLikes, setMachineLikes] = useState<Map<number, boolean | null>>(new Map());

  // Search state
  const [machineSearch, setMachineSearch] = useState("");
  const [moduleSearch, setModuleSearch] = useState("");
  const [examSearch, setExamSearch] = useState("");

  // Pagination state
  const [machinePage, setMachinePage] = useState(1);
  const [modulePage, setModulePage] = useState(1);
  const [examPage, setExamPage] = useState(1);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Dialog state
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);
  const [isMachineDialogOpen, setIsMachineDialogOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!sessionLoading && !session) {
      navigate("/login");
    }
  }, [session, sessionLoading, navigate]);

  // Load all data on mount
  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch all items and user completions in parallel
      const [
        machinesData,
        modulesData,
        examsData,
        userMachines,
        userModules,
        userExams,
      ] = await Promise.all([
        api.getMachines({ limit: 1000 }),
        api.getModules({ limit: 1000 }),
        api.getExams(),
        api.getUserMachines(),
        api.getUserModules(),
        api.getUserExams(),
      ]);

      setAllMachines(machinesData.data || machinesData);
      setAllModules(modulesData.data || modulesData);
      setAllExams(examsData);

      // Build completion sets and likes map
      const machineIds = new Set<number>();
      const likes = new Map<number, boolean | null>();

      if (Array.isArray(userMachines)) {
        userMachines.forEach((item: any) => {
          const machineId = item.machine?.id || item.machine_id;
          if (machineId) {
            machineIds.add(machineId);
            likes.set(machineId, item.liked !== undefined ? item.liked : item.likes);
          }
        });
      }

      setCompletedMachineIds(machineIds);
      setMachineLikes(likes);

      setCompletedModuleIds(
        new Set(userModules.map((item: any) => item.module.id))
      );
      setCompletedExamIds(
        new Set(userExams.map((item: any) => item.exam.id))
      );
    } catch (error) {
      console.error("Failed to load profile data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle machine completion
  const toggleMachine = async (machineId: number, currentlyCompleted: boolean) => {
    setIsUpdating(true);
    try {
      if (currentlyCompleted) {
        await api.uncompleteMachine(machineId);
        setCompletedMachineIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(machineId);
          return newSet;
        });
        setMachineLikes((prev) => {
          const newMap = new Map(prev);
          newMap.delete(machineId);
          return newMap;
        });
        toast.success("Machine unmarked as completed");
      } else {
        await api.completeMachine(machineId);
        setCompletedMachineIds((prev) => new Set(prev).add(machineId));
        toast.success("Machine marked as completed");
      }
    } catch (error) {
      toast.error("Failed to update machine completion");
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle machine like
  const toggleMachineLike = async (machineId: number, liked: boolean) => {
    setIsUpdating(true);
    try {
      await api.updateMachineLike(machineId, liked);
      setMachineLikes((prev) => {
        const newMap = new Map(prev);
        newMap.set(machineId, liked);
        return newMap;
      });
      toast.success(liked ? "Machine liked!" : "Machine disliked");
    } catch (error) {
      toast.error("Failed to update machine like status");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle machine completion updates from dialog
  const handleMachineCompletionFromDialog = (machineId: number, completed: boolean, liked?: boolean | null) => {
    if (completed) {
      setCompletedMachineIds((prev) => new Set(prev).add(machineId));
      if (liked !== undefined) {
        setMachineLikes((prev) => {
          const newMap = new Map(prev);
          newMap.set(machineId, liked);
          return newMap;
        });
      }
    } else {
      setCompletedMachineIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(machineId);
        return newSet;
      });
      setMachineLikes((prev) => {
        const newMap = new Map(prev);
        newMap.delete(machineId);
        return newMap;
      });
    }
  };

  // Handle machine like updates from dialog
  const handleMachineLikeFromDialog = (machineId: number, liked: boolean) => {
    setMachineLikes((prev) => {
      const newMap = new Map(prev);
      newMap.set(machineId, liked);
      return newMap;
    });
  };

  // Handle machine detail view
  const handleViewMachineDetails = (machineId: number) => {
    setSelectedMachineId(machineId);
    setIsMachineDialogOpen(true);
  };

  // Handle module detail view
  const handleViewModuleDetails = (moduleId: number) => {
    setSelectedModuleId(moduleId);
    setIsModuleDialogOpen(true);
  };

  // Handle module completion updates from dialog
  const handleModuleCompletionFromDialog = (moduleId: number, completed: boolean) => {
    if (completed) {
      setCompletedModuleIds((prev) => new Set(prev).add(moduleId));
    } else {
      setCompletedModuleIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(moduleId);
        return newSet;
      });
    }
  };

  // Toggle module completion
  const toggleModule = async (moduleId: number, currentlyCompleted: boolean) => {
    setIsUpdating(true);
    try {
      if (currentlyCompleted) {
        await api.uncompleteModule(moduleId);
        setCompletedModuleIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(moduleId);
          return newSet;
        });
        toast.success("Module unmarked as completed");
      } else {
        await api.completeModule(moduleId);
        setCompletedModuleIds((prev) => new Set(prev).add(moduleId));
        toast.success("Module marked as completed");
      }
    } catch (error) {
      toast.error("Failed to update module completion");
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle exam certification
  const toggleExam = async (examId: number, currentlyCompleted: boolean) => {
    setIsUpdating(true);
    try {
      if (currentlyCompleted) {
        await api.uncompleteExam(examId);
        setCompletedExamIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(examId);
          return newSet;
        });
        toast.success("Exam certification removed");
      } else {
        await api.completeExam(examId);
        setCompletedExamIds((prev) => new Set(prev).add(examId));
        toast.success("Exam marked as certified");
      }
    } catch (error) {
      toast.error("Failed to update exam certification");
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter functions
  const filteredMachines = allMachines.filter((m) =>
    m.name?.toLowerCase().includes(machineSearch.toLowerCase())
  );

  const filteredModules = allModules.filter((m) =>
    m.name?.toLowerCase().includes(moduleSearch.toLowerCase())
  );

  const filteredExams = allExams.filter((e) =>
    e.name?.toLowerCase().includes(examSearch.toLowerCase())
  );

  // Pagination helpers
  const getPaginatedItems = <T,>(items: T[], page: number): T[] => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return items.slice(start, end);
  };

  const getTotalPages = (itemCount: number): number => {
    return Math.ceil(itemCount / ITEMS_PER_PAGE);
  };

  const getPageNumbers = (currentPage: number, totalPages: number): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      if (totalPages > 1) pages.push(totalPages);
    }

    return pages;
  };

  // Paginated data
  const paginatedMachines = getPaginatedItems(filteredMachines, machinePage);
  const paginatedModules = getPaginatedItems(filteredModules, modulePage);
  const paginatedExams = getPaginatedItems(filteredExams, examPage);

  const machineTotalPages = getTotalPages(filteredMachines.length);
  const moduleTotalPages = getTotalPages(filteredModules.length);
  const examTotalPages = getTotalPages(filteredExams.length);

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

  if (sessionLoading || isLoading) {
    return <Loader />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your completed machines, modules, and certifications
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Machines</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedMachineIds.size}</div>
            <p className="text-xs text-muted-foreground">
              out of {allMachines.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedModuleIds.size}</div>
            <p className="text-xs text-muted-foreground">
              out of {allModules.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certifications</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedExamIds.size}</div>
            <p className="text-xs text-muted-foreground">
              out of {allExams.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="machines" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="machines">Machines</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
        </TabsList>

        {/* Machines Tab */}
        <TabsContent value="machines" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search machines..."
                value={machineSearch}
                onChange={(e) => {
                  setMachineSearch(e.target.value);
                  setMachinePage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredMachines.length} machine{filteredMachines.length !== 1 ? "s" : ""}
            </div>
          </div>

          {paginatedMachines.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedMachines.map((machine) => {
                  const isCompleted = completedMachineIds.has(machine.id);
                  const liked = machineLikes.get(machine.id);
                  return (
                    <Card
                      key={machine.id}
                      className={`transition-all flex flex-col ${isCompleted ? "border-green-500 border-2" : ""}`}
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
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => toggleMachine(machine.id, isCompleted)}
                              disabled={isUpdating}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base line-clamp-1">
                                {machine.name || "Unnamed Machine"}
                              </CardTitle>
                              {machine.synopsis && (
                                <CardDescription className="line-clamp-2 text-xs mt-1">
                                  {machine.synopsis}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                          <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 mt-auto">
                        <div className="flex flex-wrap gap-2">
                          {machine.difficulty && (
                            <Badge className={getDifficultyColor(machine.difficulty)}>
                              {machine.difficulty}
                            </Badge>
                          )}
                          {machine.os && (
                            <Badge variant="outline">{machine.os}</Badge>
                          )}
                          {isCompleted && (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>

                        {/* Action buttons row: Details, Like, Dislike */}
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewMachineDetails(machine.id)}
                            className="flex-1"
                          >
                            <Info className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                          <Button
                            variant={liked === true ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleMachineLike(machine.id, true)}
                            disabled={isUpdating || !isCompleted}
                            className="flex-1"
                            title={!isCompleted ? "Complete the machine first to like it" : ""}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Like
                          </Button>
                          <Button
                            variant={liked === false ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => toggleMachineLike(machine.id, false)}
                            disabled={isUpdating || !isCompleted}
                            className="flex-1"
                            title={!isCompleted ? "Complete the machine first to dislike it" : ""}
                          >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            Dislike
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {machineTotalPages > 1 && (
                <div className="flex justify-center pt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => machinePage > 1 && setMachinePage(machinePage - 1)}
                          className={machinePage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {getPageNumbers(machinePage, machineTotalPages).map((pageNum, idx) => (
                        <PaginationItem key={idx}>
                          {pageNum === "ellipsis" ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              onClick={() => setMachinePage(pageNum)}
                              isActive={pageNum === machinePage}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => machinePage < machineTotalPages && setMachinePage(machinePage + 1)}
                          className={machinePage === machineTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No machines found
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search modules..."
                value={moduleSearch}
                onChange={(e) => {
                  setModuleSearch(e.target.value);
                  setModulePage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredModules.length} module{filteredModules.length !== 1 ? "s" : ""}
            </div>
          </div>

          {paginatedModules.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedModules.map((module) => {
                  const isCompleted = completedModuleIds.has(module.id);
                  return (
                    <Card
                      key={module.id}
                      className={`transition-all flex flex-col ${isCompleted ? "border-green-500 border-2" : ""}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          {module.image && (
                            <img
                              src={module.image}
                              alt={module.name || "Module"}
                              className="h-12 w-12 rounded object-cover shrink-0"
                            />
                          )}
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => toggleModule(module.id, isCompleted)}
                              disabled={isUpdating}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base line-clamp-1">
                                {module.name || "Unnamed Module"}
                              </CardTitle>
                              {module.description && (
                                <CardDescription className="line-clamp-2 text-xs mt-1">
                                  {module.description}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                          <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 mt-auto">
                        <div className="flex flex-wrap gap-2">
                          {module.difficulty && (
                            <Badge className={getDifficultyColor(module.difficulty)}>
                              {module.difficulty}
                            </Badge>
                          )}
                          {isCompleted && (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>

                        {/* View details button */}
                        <div className="pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewModuleDetails(module.id)}
                            className="w-full"
                          >
                            <Info className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {moduleTotalPages > 1 && (
                <div className="flex justify-center pt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => modulePage > 1 && setModulePage(modulePage - 1)}
                          className={modulePage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {getPageNumbers(modulePage, moduleTotalPages).map((pageNum, idx) => (
                        <PaginationItem key={idx}>
                          {pageNum === "ellipsis" ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              onClick={() => setModulePage(pageNum)}
                              isActive={pageNum === modulePage}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => modulePage < moduleTotalPages && setModulePage(modulePage + 1)}
                          className={modulePage === moduleTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No modules found
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exams..."
                value={examSearch}
                onChange={(e) => {
                  setExamSearch(e.target.value);
                  setExamPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredExams.length} exam{filteredExams.length !== 1 ? "s" : ""}
            </div>
          </div>

          {paginatedExams.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedExams.map((exam) => {
                  const isCompleted = completedExamIds.has(exam.id);
                  return (
                    <Card
                      key={exam.id}
                      className={`transition-all flex flex-col ${isCompleted ? "border-green-500 border-2" : ""}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          {exam.logo && (
                            <img
                              src={exam.logo}
                              alt={exam.name || "Exam"}
                              className="h-12 w-12 rounded object-contain shrink-0"
                            />
                          )}
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => toggleExam(exam.id, isCompleted)}
                              disabled={isUpdating}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base line-clamp-1">
                                {exam.name || "Unnamed Exam"}
                              </CardTitle>
                            </div>
                          </div>
                          <Award className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent className="mt-auto">
                        <div className="flex flex-wrap gap-2">
                          {isCompleted && (
                            <Badge variant="default" className="bg-green-600">
                              <Award className="h-3 w-3 mr-1" />
                              Certified
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {examTotalPages > 1 && (
                <div className="flex justify-center pt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => examPage > 1 && setExamPage(examPage - 1)}
                          className={examPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {getPageNumbers(examPage, examTotalPages).map((pageNum, idx) => (
                        <PaginationItem key={idx}>
                          {pageNum === "ellipsis" ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              onClick={() => setExamPage(pageNum)}
                              isActive={pageNum === examPage}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => examPage < examTotalPages && setExamPage(examPage + 1)}
                          className={examPage === examTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No exams found
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Machine Detail Dialog */}
      <MachineDetailDialog
        machineId={selectedMachineId}
        isOpen={isMachineDialogOpen}
        onClose={() => setIsMachineDialogOpen(false)}
        onCompletionChange={handleMachineCompletionFromDialog}
        onLikeChange={handleMachineLikeFromDialog}
      />

      {/* Module Detail Dialog */}
      <ModuleDetailDialog
        moduleId={selectedModuleId}
        isOpen={isModuleDialogOpen}
        onClose={() => setIsModuleDialogOpen(false)}
        onCompletionChange={handleModuleCompletionFromDialog}
      />
    </div>
  );
}
