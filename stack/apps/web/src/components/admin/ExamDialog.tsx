import { useState, useEffect } from "react";
import { api } from "../../lib/api/client";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { toast } from "sonner";

interface ExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: any;
  onSuccess: () => void;
}

export function ExamDialog({ open, onOpenChange, exam, onSuccess }: ExamDialogProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [availableEntities, setAvailableEntities] = useState<any>({
    modules: [],
  });

  // Form data for general info
  const [formData, setFormData] = useState({
    name: "",
    logo: "",
  });

  // Relationship data
  const [selectedModules, setSelectedModules] = useState<number[]>([]);

  // Load available entities and existing relationships
  useEffect(() => {
    if (open) {
      loadAvailableEntities();
      if (exam) {
        loadExistingData();
      } else {
        resetForm();
      }
    }
  }, [exam, open]);

  const loadAvailableEntities = async () => {
    try {
      const entities = await api.admin.getAvailableEntities();
      setAvailableEntities(entities);
    } catch (error) {
      console.error("Error loading entities:", error);
    }
  };

  const loadExistingData = async () => {
    if (!exam) return;

    setFormData({
      name: exam.name || "",
      logo: exam.logo || "",
    });

    try {
      const relationships = await api.admin.getExamRelationships(exam.id);
      setSelectedModules(relationships.modules.map((m: any) => m.id));
    } catch (error) {
      console.error("Error loading relationships:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      logo: "",
    });
    setSelectedModules([]);
    setActiveTab("general");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let examId: number;

      if (exam) {
        await api.admin.updateExam(exam.id, formData);
        examId = exam.id;
        toast.success("Exam updated successfully");
      } else {
        const response = await api.admin.createExam(formData);
        examId = response.id;
        toast.success("Exam created successfully");
      }

      // Update relationships
      await api.admin.updateExamModules(examId, selectedModules);

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(`Failed to ${exam ? "update" : "create"} exam`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId: number) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-[85vw] lg:!max-w-[1000px] max-h-[95vh] overflow-hidden flex flex-col w-full">
        <DialogHeader>
          <DialogTitle>{exam ? "Edit Exam" : "Create Exam"}</DialogTitle>
          <DialogDescription>
            {exam ? "Update exam details and relationships" : "Add a new exam to the platform"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="inline-flex h-9 items-center justify-start bg-muted p-1 text-muted-foreground w-full shrink-0">
            <TabsTrigger value="general" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow">General</TabsTrigger>
            <TabsTrigger value="modules" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow">Modules</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden mt-4">
            <ScrollArea className="flex-1 pr-4 min-h-[400px] max-h-[calc(95vh-250px)]">
              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input
                    id="logo"
                    type="url"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value || "" })}
                    placeholder="https://..."
                  />
                </div>

                {formData.logo && (
                  <div className="space-y-2">
                    <Label>Logo Preview</Label>
                    <div className="border rounded-md p-4 flex items-center justify-center">
                      <img src={formData.logo} alt="Logo preview" className="h-24 object-contain" />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="modules" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Select Required Modules ({selectedModules.length} selected)</Label>
                  <p className="text-sm text-muted-foreground">
                    Select the modules that are required for this exam
                  </p>
                  <div className="border rounded-md p-4 max-h-96 overflow-y-auto space-y-2">
                    {availableEntities.modules?.length > 0 ? (
                      availableEntities.modules.map((module: any) => (
                        <div key={module.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`module-${module.id}`}
                            checked={selectedModules.includes(module.id)}
                            onCheckedChange={() => toggleModule(module.id)}
                          />
                          <label
                            htmlFor={`module-${module.id}`}
                            className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {module.name}
                            {module.difficulty && (
                              <Badge variant="outline" className="ml-2">
                                {module.difficulty}
                              </Badge>
                            )}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No modules available</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : exam ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
