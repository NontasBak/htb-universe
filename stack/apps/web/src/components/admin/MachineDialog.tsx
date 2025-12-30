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
import { X } from "lucide-react";

interface MachineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine: any;
  onSuccess: () => void;
}

export function MachineDialog({ open, onOpenChange, machine, onSuccess }: MachineDialogProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [availableEntities, setAvailableEntities] = useState<any>({
    modules: [],
    vulnerabilities: [],
  });

  // Form data for general info
  const [formData, setFormData] = useState({
    name: "",
    synopsis: "",
    difficulty: "Easy",
    os: "Linux",
    url: "",
    image: "",
  });

  // Relationship data
  const [selectedModules, setSelectedModules] = useState<number[]>([]);
  const [selectedVulnerabilities, setSelectedVulnerabilities] = useState<number[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [newLanguage, setNewLanguage] = useState("");
  const [areasOfInterest, setAreasOfInterest] = useState<string[]>([]);
  const [newArea, setNewArea] = useState("");

  // Load available entities and existing relationships
  useEffect(() => {
    if (open) {
      loadAvailableEntities();
      if (machine) {
        loadExistingData();
      } else {
        resetForm();
      }
    }
  }, [machine, open]);

  const loadAvailableEntities = async () => {
    try {
      const entities = await api.admin.getAvailableEntities();
      setAvailableEntities(entities);
    } catch (error) {
      console.error("Error loading entities:", error);
    }
  };

  const loadExistingData = async () => {
    if (!machine) return;

    setFormData({
      name: machine.name || "",
      synopsis: machine.synopsis || "",
      difficulty: machine.difficulty || "Easy",
      os: machine.os || "Linux",
      url: machine.url || "",
      image: machine.image || "",
    });

    try {
      const relationships = await api.admin.getMachineRelationships(machine.id);
      setSelectedModules(relationships.modules.map((m: any) => m.id));
      setSelectedVulnerabilities(relationships.vulnerabilities.map((v: any) => v.id));
      setLanguages(relationships.languages || []);
      setAreasOfInterest(relationships.areasOfInterest || []);
    } catch (error) {
      console.error("Error loading relationships:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      synopsis: "",
      difficulty: "Easy",
      os: "Linux",
      url: "",
      image: "",
    });
    setSelectedModules([]);
    setSelectedVulnerabilities([]);
    setLanguages([]);
    setAreasOfInterest([]);
    setNewLanguage("");
    setNewArea("");
    setActiveTab("general");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let machineId: number;

      if (machine) {
        await api.admin.updateMachine(machine.id, formData);
        machineId = machine.id;
        toast.success("Machine updated successfully");
      } else {
        const response = await api.admin.createMachine(formData);
        machineId = response.id;
        toast.success("Machine created successfully");
      }

      // Update relationships
      await Promise.all([
        api.admin.updateMachineModules(machineId, selectedModules),
        api.admin.updateMachineVulnerabilities(machineId, selectedVulnerabilities),
        api.admin.updateMachineLanguages(machineId, languages),
        api.admin.updateMachineAreas(machineId, areasOfInterest),
      ]);

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(`Failed to ${machine ? "update" : "create"} machine`);
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

  const toggleVulnerability = (vulnId: number) => {
    setSelectedVulnerabilities((prev) =>
      prev.includes(vulnId) ? prev.filter((id) => id !== vulnId) : [...prev, vulnId]
    );
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage("");
    }
  };

  const removeLanguage = (lang: string) => {
    setLanguages(languages.filter((l) => l !== lang));
  };

  const addArea = () => {
    if (newArea.trim() && !areasOfInterest.includes(newArea.trim())) {
      setAreasOfInterest([...areasOfInterest, newArea.trim()]);
      setNewArea("");
    }
  };

  const removeArea = (area: string) => {
    setAreasOfInterest(areasOfInterest.filter((a) => a !== area));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-[85vw] lg:!max-w-[1000px] max-h-[95vh] overflow-hidden flex flex-col w-full">
        <DialogHeader>
          <DialogTitle>{machine ? "Edit Machine" : "Create Machine"}</DialogTitle>
          <DialogDescription>
            {machine ? "Update machine details and relationships" : "Add a new machine to the platform"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="inline-flex h-9 items-center justify-start bg-muted p-1 text-muted-foreground w-full shrink-0">
            <TabsTrigger value="general" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-active:bg-primary data-active:text-primary-foreground data-active:shadow">General</TabsTrigger>
            <TabsTrigger value="modules" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-active:bg-primary data-active:text-primary-foreground data-active:shadow">Modules</TabsTrigger>
            <TabsTrigger value="vulnerabilities" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-active:bg-primary data-active:text-primary-foreground data-active:shadow">Vulnerabilities</TabsTrigger>
            <TabsTrigger value="languages" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-active:bg-primary data-active:text-primary-foreground data-active:shadow">Languages</TabsTrigger>
            <TabsTrigger value="areas" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-active:bg-primary data-active:text-primary-foreground data-active:shadow">Areas</TabsTrigger>
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
                  <Label htmlFor="synopsis">Synopsis *</Label>
                  <Textarea
                    id="synopsis"
                    value={formData.synopsis}
                    onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                    rows={5}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem value="Insane">Insane</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="os">Operating System *</Label>
                    <Select
                      value={formData.os}
                      onValueChange={(value) => setFormData({ ...formData, os: value || "Linux" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Linux">Linux</SelectItem>
                        <SelectItem value="Windows">Windows</SelectItem>
                        <SelectItem value="Android">Android</SelectItem>
                        <SelectItem value="Solaris">Solaris</SelectItem>
                        <SelectItem value="OpenBSD">OpenBSD</SelectItem>
                        <SelectItem value="FreeBSD">FreeBSD</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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

              <TabsContent value="modules" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Select Modules ({selectedModules.length} selected)</Label>
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

              <TabsContent value="languages" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Programming Languages</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a language (e.g., Python, PHP, JavaScript)"
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addLanguage();
                        }
                      }}
                    />
                    <Button type="button" onClick={addLanguage}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {languages.map((lang) => (
                      <Badge key={lang} variant="secondary" className="flex items-center gap-1">
                        {lang}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => removeLanguage(lang)}
                        />
                      </Badge>
                    ))}
                    {languages.length === 0 && (
                      <p className="text-sm text-muted-foreground">No languages added yet</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="areas" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Areas of Interest</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add an area of interest (e.g., Web, Network, Crypto)"
                      value={newArea}
                      onChange={(e) => setNewArea(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addArea();
                        }
                      }}
                    />
                    <Button type="button" onClick={addArea}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {areasOfInterest.map((area) => (
                      <Badge key={area} variant="secondary" className="flex items-center gap-1">
                        {area}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => removeArea(area)}
                        />
                      </Badge>
                    ))}
                    {areasOfInterest.length === 0 && (
                      <p className="text-sm text-muted-foreground">No areas of interest added yet</p>
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
                {loading ? "Saving..." : machine ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
