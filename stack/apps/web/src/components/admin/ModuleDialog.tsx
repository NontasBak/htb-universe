import { useState, useEffect } from "react";
import { api } from "../../lib/api/client";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
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
import { X, Trash2 } from "lucide-react";

interface ModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: any;
  onSuccess: () => void;
}

export function ModuleDialog({ open, onOpenChange, module, onSuccess }: ModuleDialogProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [availableEntities, setAvailableEntities] = useState<any>({
    machines: [],
    vulnerabilities: [],
    exams: [],
  });

  // Form data for general info
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    difficulty: "Easy",
    url: "",
    image: "",
  });

  // Relationship data
  const [selectedMachines, setSelectedMachines] = useState<number[]>([]);
  const [selectedVulnerabilities, setSelectedVulnerabilities] = useState<number[]>([]);
  const [selectedExams, setSelectedExams] = useState<number[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [newUnit, setNewUnit] = useState({ name: "", type: "Article", sequence_order: 1 });

  // Load available entities and existing relationships
  useEffect(() => {
    if (open) {
      loadAvailableEntities();
      if (module) {
        loadExistingData();
      } else {
        resetForm();
      }
    }
  }, [module, open]);

  const loadAvailableEntities = async () => {
    try {
      const entities = await api.admin.getAvailableEntities();
      setAvailableEntities(entities);
    } catch (error) {
      console.error("Error loading entities:", error);
    }
  };

  const loadExistingData = async () => {
    if (!module) return;

    setFormData({
      name: module.name || "",
      description: module.description || "",
      difficulty: module.difficulty || "Easy",
      url: module.url || "",
      image: module.image || "",
    });

    try {
      const relationships = await api.admin.getModuleRelationships(module.id);
      setSelectedMachines(relationships.machines.map((m: any) => m.id));
      setSelectedVulnerabilities(relationships.vulnerabilities.map((v: any) => v.id));
      setSelectedExams(relationships.exams.map((e: any) => e.id));
      setUnits(relationships.units || []);
    } catch (error) {
      console.error("Error loading relationships:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      difficulty: "Easy",
      url: "",
      image: "",
    });
    setSelectedMachines([]);
    setSelectedVulnerabilities([]);
    setSelectedExams([]);
    setUnits([]);
    setNewUnit({ name: "", type: "Article", sequence_order: 1 });
    setActiveTab("general");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let moduleId: number;

      if (module) {
        await api.admin.updateModule(module.id, formData);
        moduleId = module.id;
        toast.success("Module updated successfully");
      } else {
        const response = await api.admin.createModule(formData);
        moduleId = response.id;
        toast.success("Module created successfully");
      }

      // Update relationships
      await Promise.all([
        api.admin.updateModuleMachines(moduleId, selectedMachines),
        api.admin.updateModuleVulnerabilities(moduleId, selectedVulnerabilities),
        api.admin.updateModuleExams(moduleId, selectedExams),
      ]);

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(`Failed to ${module ? "update" : "create"} module`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMachine = (machineId: number) => {
    setSelectedMachines((prev) =>
      prev.includes(machineId) ? prev.filter((id) => id !== machineId) : [...prev, machineId]
    );
  };

  const toggleVulnerability = (vulnId: number) => {
    setSelectedVulnerabilities((prev) =>
      prev.includes(vulnId) ? prev.filter((id) => id !== vulnId) : [...prev, vulnId]
    );
  };

  const toggleExam = (examId: number) => {
    setSelectedExams((prev) =>
      prev.includes(examId) ? prev.filter((id) => id !== examId) : [...prev, examId]
    );
  };

  const addUnit = async () => {
    if (!newUnit.name.trim() || !module) {
      toast.error("Unit name is required");
      return;
    }

    try {
      await api.admin.createUnit({
        module_id: module.id,
        name: newUnit.name,
        type: newUnit.type,
        sequence_order: newUnit.sequence_order,
      });
      toast.success("Unit created successfully");
      // Reload units
      const relationships = await api.admin.getModuleRelationships(module.id);
      setUnits(relationships.units || []);
      setNewUnit({ name: "", type: "Article", sequence_order: units.length + 2 });
    } catch (error) {
      toast.error("Failed to create unit");
      console.error(error);
    }
  };

  const deleteUnit = async (unitId: number) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) return;

    try {
      await api.admin.deleteUnit(unitId);
      toast.success("Unit deleted successfully");
      setUnits(units.filter((u) => u.id !== unitId));
    } catch (error) {
      toast.error("Failed to delete unit");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-[85vw] lg:!max-w-[1000px] max-h-[95vh] overflow-hidden flex flex-col w-full">
        <DialogHeader>
          <DialogTitle>{module ? "Edit Module" : "Create Module"}</DialogTitle>
          <DialogDescription>
            {module ? "Update module details and relationships" : "Add a new module to the platform"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="inline-flex h-9 items-center justify-start bg-muted p-1 text-muted-foreground w-full shrink-0">
            <TabsTrigger value="general" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-active:bg-primary data-active:text-primary-foreground data-active:shadow">General</TabsTrigger>
            <TabsTrigger value="machines" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-active:bg-primary data-active:text-primary-foreground data-active:shadow">Machines</TabsTrigger>
            <TabsTrigger value="vulnerabilities" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-active:bg-primary data-active:text-primary-foreground data-active:shadow">Vulnerabilities</TabsTrigger>
            <TabsTrigger value="exams" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-active:bg-primary data-active:text-primary-foreground data-active:shadow">Exams</TabsTrigger>
            <TabsTrigger value="units" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-active:bg-primary data-active:text-primary-foreground data-active:shadow">Units</TabsTrigger>
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
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty *</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value || "Easy" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value || "" })}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value || "" })}
                    placeholder="https://..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="machines" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Select Machines ({selectedMachines.length} selected)</Label>
                  <div className="border rounded-md p-4 max-h-96 overflow-y-auto space-y-2">
                    {availableEntities.machines?.length > 0 ? (
                      availableEntities.machines.map((machine: any) => (
                        <div key={machine.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`machine-${machine.id}`}
                            checked={selectedMachines.includes(machine.id)}
                            onCheckedChange={() => toggleMachine(machine.id)}
                          />
                          <label
                            htmlFor={`machine-${machine.id}`}
                            className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {machine.name}
                            {machine.difficulty && (
                              <Badge variant="outline" className="ml-2">
                                {machine.difficulty}
                              </Badge>
                            )}
                            {machine.os && (
                              <Badge variant="outline" className="ml-2">
                                {machine.os}
                              </Badge>
                            )}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No machines available</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="vulnerabilities" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Select Vulnerabilities ({selectedVulnerabilities.length} selected)</Label>
                  <div className="border rounded-md p-4 max-h-96 overflow-y-auto space-y-2">
                    {availableEntities.vulnerabilities?.length > 0 ? (
                      availableEntities.vulnerabilities.map((vuln: any) => (
                        <div key={vuln.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`vuln-${vuln.id}`}
                            checked={selectedVulnerabilities.includes(vuln.id)}
                            onCheckedChange={() => toggleVulnerability(vuln.id)}
                          />
                          <label
                            htmlFor={`vuln-${vuln.id}`}
                            className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {vuln.name}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No vulnerabilities available</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="exams" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Select Exams ({selectedExams.length} selected)</Label>
                  <div className="border rounded-md p-4 max-h-96 overflow-y-auto space-y-2">
                    {availableEntities.exams?.length > 0 ? (
                      availableEntities.exams.map((exam: any) => (
                        <div key={exam.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`exam-${exam.id}`}
                            checked={selectedExams.includes(exam.id)}
                            onCheckedChange={() => toggleExam(exam.id)}
                          />
                          <label
                            htmlFor={`exam-${exam.id}`}
                            className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {exam.name}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No exams available</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="units" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <Label>Existing Units ({units.length})</Label>
                    <div className="border rounded-md p-4 max-h-64 overflow-y-auto space-y-2 mt-2">
                      {units.length > 0 ? (
                        units.map((unit: any) => (
                          <div key={unit.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex-1">
                              <p className="font-medium">{unit.name}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline">{unit.type}</Badge>
                                <Badge variant="outline">Order: {unit.sequence_order}</Badge>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteUnit(unit.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No units yet</p>
                      )}
                    </div>
                  </div>

                  {module && (
                    <div className="border rounded-md p-4 space-y-4">
                      <Label>Add New Unit</Label>
                      <div className="space-y-2">
                        <Input
                          placeholder="Unit name"
                          value={newUnit.name}
                          onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={newUnit.type}
                            onValueChange={(value) => setNewUnit({ ...newUnit, type: value || "Article" })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Article">Article</SelectItem>
                              <SelectItem value="Interactive">Interactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            placeholder="Order"
                            value={newUnit.sequence_order}
                            onChange={(e) =>
                              setNewUnit({ ...newUnit, sequence_order: parseInt(e.target.value) || 1 })
                            }
                          />
                        </div>
                        <Button type="button" onClick={addUnit} className="w-full">
                          Add Unit
                        </Button>
                      </div>
                    </div>
                  )}

                  {!module && (
                    <p className="text-sm text-muted-foreground">
                      Save the module first before adding units
                    </p>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : module ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
