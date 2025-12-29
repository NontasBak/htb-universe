/**
 * DashboardLayout
 * Main 2-column layout for the HTB Universe dashboard
 * Left: Filter panel | Right: Results panel
 */

import type { ReactNode } from "react";

interface DashboardLayoutProps {
  filterPanel: ReactNode;
  resultsPanel: ReactNode;
}

export function DashboardLayout({ filterPanel, resultsPanel }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Main container with padding */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Left Column - Filters */}
          <aside className="w-full lg:w-[380px] lg:shrink-0">
            <div className="sticky top-6">
              {filterPanel}
            </div>
          </aside>

          {/* Right Column - Results */}
          <main className="flex-1 min-w-0">
            {resultsPanel}
          </main>
        </div>
      </div>
    </div>
  );
}
