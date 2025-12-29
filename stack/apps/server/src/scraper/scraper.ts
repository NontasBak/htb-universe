/**
 * HTB Universe Scraper Service
 * Main orchestration logic for fetching and storing HTB data
 */

import type { Pool } from "mysql2/promise";
import { HTBHttpClient, sleep } from "./http-client.js";
import { ScraperDatabase } from "./database.js";
import type {
  ModuleInsert,
  UnitInsert,
  MachineInsert,
  ExamInsert,
  RelatedMachine,
  ScraperStats,
  ScraperConfig,
} from "./types.js";

// ============================================================================
// Main Scraper Class
// ============================================================================

export class HTBScraper {
  private httpClient: HTBHttpClient;
  private database: ScraperDatabase;
  private config: ScraperConfig;
  private stats: ScraperStats;

  constructor(pool: Pool, config: ScraperConfig) {
    this.httpClient = new HTBHttpClient({
      htbCookie: config.htbCookie,
      htbBearer: config.htbBearer,
    });
    this.database = new ScraperDatabase(pool);
    this.config = config;
    this.stats = {
      modulesProcessed: 0,
      unitsProcessed: 0,
      machinesProcessed: 0,
      examsProcessed: 0,
      vulnerabilitiesProcessed: 0,
      errorsEncountered: 0,
      startTime: new Date(),
    };
  }

  // ==========================================================================
  // Main Orchestration Methods
  // ==========================================================================

  /**
   * Run the complete scraping process
   */
  async run(): Promise<void> {
    console.log("\n🚀 Starting HTB Universe Scraper...\n");

    try {
      // Step 1: Scrape modules and related machines
      console.log("📚 Step 1: Scraping modules and machines...");
      const machineModuleRelationships = await this.scrapeModulesAndMachines();

      // Step 2: Scrape exams
      console.log("\n🎓 Step 2: Scraping exams...");
      await this.scrapeExams();

      // Step 3: Insert machine-module relationships
      console.log("\n🔗 Step 3: Inserting machine-module relationships...");
      await this.database.insertMachineModuleRelationships(machineModuleRelationships);

      // Step 4: Scrape machine tags and populate vulnerabilities
      console.log("\n🏷️  Step 4: Scraping machine tags and vulnerabilities...");
      await this.scrapeMachineTags();

      // Step 5: Scrape module-exam relationships
      console.log("\n📋 Step 5: Scraping module-exam relationships...");
      await this.scrapeModuleExamRelationships();

      this.stats.endTime = new Date();
      this.printStats();
      console.log("\n✅ All scraping completed successfully!\n");
    } catch (error) {
      console.error("\n❌ Scraping failed:", error instanceof Error ? error.message : error);
      throw error;
    }
  }

  // ==========================================================================
  // Step 1: Modules and Machines
  // ==========================================================================

  /**
   * Scrape all modules and their related machines
   */
  private async scrapeModulesAndMachines(): Promise<Array<{ machineId: number; moduleId: number }>> {
    const allMachines = new Set<string>();
    const machineModuleRelationships: Array<{ machineId: number; moduleId: number }> = [];

    for (let moduleId = 1; moduleId <= this.config.maxModuleId; moduleId++) {
      try {
        const moduleData = await this.httpClient.fetchModuleData(moduleId);

        if (moduleData) {
          // Transform and insert module
          const moduleInsert = this.transformModuleData(moduleData);
          await this.database.insertModule(moduleInsert);
          this.stats.modulesProcessed++;

          // Insert units (sections)
          if (moduleData.sections && moduleData.sections.length > 0) {
            const units = this.transformUnitsData(moduleData.sections, moduleData.id);
            await this.database.insertUnits(units);
            this.stats.unitsProcessed += units.length;
          }

          // Collect related machines
          const relatedMachines = moduleData.related?.machines || [];
          relatedMachines.forEach((machine) => {
            const machineKey = JSON.stringify({
              id: machine.id,
              name: machine.name,
              os: machine.os,
              difficulty: machine.difficulty,
              logo: machine.logo,
            });
            allMachines.add(machineKey);

            // Store relationship for later insertion
            machineModuleRelationships.push({
              machineId: machine.id,
              moduleId: moduleData.id,
            });
          });
        }

        await sleep(this.config.delayBetweenRequests);
      } catch (error) {
        console.error(`Error processing module ${moduleId}:`, error instanceof Error ? error.message : error);
        this.stats.errorsEncountered++;
      }
    }

    // Process unique machines
    console.log(`\n📦 Found ${allMachines.size} unique machines to process`);
    for (const machineStr of allMachines) {
      try {
        const machine: RelatedMachine = JSON.parse(machineStr);
        await this.processMachine(machine);
        this.stats.machinesProcessed++;
        await sleep(this.config.delayBetweenRequests);
      } catch (error) {
        console.error(`Error processing machine:`, error instanceof Error ? error.message : error);
        this.stats.errorsEncountered++;
      }
    }

    return machineModuleRelationships;
  }

  /**
   * Process a single machine (fetch detailed data and insert)
   */
  private async processMachine(machine: RelatedMachine): Promise<void> {
    const machineData = await this.httpClient.fetchMachineData(machine.name);

    if (machineData) {
      const machineInsert: MachineInsert = {
        id: machine.id,
        name: machine.name,
        synopsis: machineData.synopsis,
        difficulty: this.normalizeDifficulty(machine.difficulty),
        os: this.normalizeOS(machine.os),
        url: `https://app.hackthebox.com/machines/${machine.name}`,
        image: machine.logo || null,
      };

      await this.database.insertMachine(machineInsert);
    }
  }

  // ==========================================================================
  // Step 2: Exams
  // ==========================================================================

  /**
   * Scrape all exams
   */
  private async scrapeExams(): Promise<void> {
    try {
      const exams = await this.httpClient.fetchExamsData();

      const examInserts: ExamInsert[] = exams.map((exam) => ({
        id: exam.id,
        name: exam.name,
        logo: exam.logo || null,
      }));

      await this.database.insertExams(examInserts);
      this.stats.examsProcessed = examInserts.length;
    } catch (error) {
      console.error("Error scraping exams:", error instanceof Error ? error.message : error);
      this.stats.errorsEncountered++;
    }
  }

  // ==========================================================================
  // Step 4: Machine Tags
  // ==========================================================================

  /**
   * Scrape machine tags (vulnerabilities, areas of interest, languages)
   */
  private async scrapeMachineTags(): Promise<void> {
    const machineIds = await this.database.getAllMachineIds();
    const globalVulnerabilities = new Map<number, string>();
    const allMachineTags: Array<{ machineId: number; tags: any[] }> = [];

    console.log(`Processing tags for ${machineIds.length} machines...`);

    // Step 4a: Fetch all tags and collect vulnerabilities
    console.log("Fetching machine tags...");
    for (const machineId of machineIds) {
      try {
        const tags = await this.httpClient.fetchMachineTags(machineId);

        if (tags.length > 0) {
          // Collect vulnerabilities
          tags.forEach((tag) => {
            if (tag.category === "Vulnerability") {
              globalVulnerabilities.set(tag.id, tag.name);
            }
          });

          // Store tags for later insertion
          allMachineTags.push({ machineId, tags });
          console.log(`✓ Fetched tags for machine ${machineId}`);
        }

        await sleep(this.config.delayBetweenRequests);
      } catch (error) {
        console.error(`Error fetching tags for machine ${machineId}:`, error instanceof Error ? error.message : error);
        this.stats.errorsEncountered++;
      }
    }

    // Step 4b: Insert all vulnerabilities first
    console.log("\nInserting vulnerabilities...");
    await this.database.insertVulnerabilities(globalVulnerabilities);
    this.stats.vulnerabilitiesProcessed = globalVulnerabilities.size;

    // Step 4c: Now insert machine-tag relationships
    console.log("\nCreating machine-tag relationships...");
    for (const { machineId, tags } of allMachineTags) {
      try {
        await this.database.insertMachineTagRelationships(machineId, tags);
        console.log(`✓ Created relationships for machine ${machineId}`);
      } catch (error) {
        console.error(`Error creating relationships for machine ${machineId}:`, error instanceof Error ? error.message : error);
        this.stats.errorsEncountered++;
      }
    }
  }

  // ==========================================================================
  // Step 5: Module-Exam Relationships
  // ==========================================================================

  /**
   * Scrape module-exam relationships
   */
  private async scrapeModuleExamRelationships(): Promise<void> {
    try {
      const examIds = await this.database.getAllExamIds();
      console.log(`Processing module-exam relationships for ${examIds.length} exams...`);

      for (const examId of examIds) {
        try {
          const modules = await this.httpClient.fetchExamModules(examId);
          const moduleIds = modules.map((m) => m.id);

          console.log(`Found ${moduleIds.length} modules for exam ${examId}`);
          await this.database.insertModuleExamRelationshipsForExam(examId, moduleIds);

          await sleep(this.config.delayBetweenRequests);
        } catch (error) {
          console.error(`Error processing exam ${examId}:`, error instanceof Error ? error.message : error);
          this.stats.errorsEncountered++;
        }
      }
    } catch (error) {
      console.error("Error scraping module-exam relationships:", error instanceof Error ? error.message : error);
      this.stats.errorsEncountered++;
    }
  }

  // ==========================================================================
  // Data Transformation Helpers
  // ==========================================================================

  /**
   * Transform API module data to database insert format
   */
  private transformModuleData(data: any): ModuleInsert {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      difficulty: this.normalizeModuleDifficulty(data.difficulty?.title || "Easy"),
      url: data.url?.absolute || "",
      image: data.avatar || data.logo || null,
    };
  }

  /**
   * Transform module sections to units
   */
  private transformUnitsData(sections: any[], moduleId: number): UnitInsert[] {
    return sections.map((section) => ({
      id: section.id,
      module_id: moduleId,
      sequence_order: section.page,
      name: section.title,
      type: this.normalizeUnitType(section.type),
    }));
  }

  /**
   * Normalize difficulty string for modules
   */
  private normalizeModuleDifficulty(difficulty: string): "Easy" | "Medium" | "Hard" {
    const normalized = difficulty.toLowerCase();
    if (normalized.includes("medium")) return "Medium";
    if (normalized.includes("hard")) return "Hard";
    return "Easy";
  }

  /**
   * Normalize difficulty string for machines
   */
  private normalizeDifficulty(difficulty: string): "Easy" | "Medium" | "Hard" | "Insane" {
    const normalized = difficulty.toLowerCase();
    if (normalized.includes("medium")) return "Medium";
    if (normalized.includes("hard")) return "Hard";
    if (normalized.includes("insane")) return "Insane";
    return "Easy";
  }

  /**
   * Normalize OS string
   */
  private normalizeOS(os: string): "Windows" | "Linux" | "Android" | "Solaris" | "OpenBSD" | "FreeBSD" | "Other" {
    const normalized = os.toLowerCase();
    if (normalized.includes("windows")) return "Windows";
    if (normalized.includes("linux")) return "Linux";
    if (normalized.includes("android")) return "Android";
    if (normalized.includes("solaris")) return "Solaris";
    if (normalized.includes("openbsd")) return "OpenBSD";
    if (normalized.includes("freebsd")) return "FreeBSD";
    return "Other";
  }

  /**
   * Normalize unit type
   */
  private normalizeUnitType(type: string): "Article" | "Interactive" {
    return type.toLowerCase() === "interactive" ? "Interactive" : "Article";
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  /**
   * Print scraping statistics
   */
  private printStats(): void {
    const duration = this.stats.endTime
      ? (this.stats.endTime.getTime() - this.stats.startTime.getTime()) / 1000
      : 0;

    console.log("\n" + "=".repeat(60));
    console.log("📊 Scraping Statistics");
    console.log("=".repeat(60));
    console.log(`Modules processed:         ${this.stats.modulesProcessed}`);
    console.log(`Units processed:           ${this.stats.unitsProcessed}`);
    console.log(`Machines processed:        ${this.stats.machinesProcessed}`);
    console.log(`Exams processed:           ${this.stats.examsProcessed}`);
    console.log(`Vulnerabilities processed: ${this.stats.vulnerabilitiesProcessed}`);
    console.log(`Errors encountered:        ${this.stats.errorsEncountered}`);
    console.log(`Duration:                  ${duration.toFixed(2)}s`);
    console.log("=".repeat(60) + "\n");
  }

  /**
   * Get current statistics
   */
  getStats(): ScraperStats {
    return { ...this.stats };
  }
}
