/**
 * Custom hook for managing URL search parameters
 * Syncs filter state with URL for shareable links
 */

import { useSearchParams } from "react-router";
import { useCallback, useMemo } from "react";
import type { FilterMode, DashboardUrlParams } from "@/types";

export function useUrlParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse URL params into typed object
  const params = useMemo<DashboardUrlParams>(() => {
    return {
      tab: (searchParams.get("tab") as FilterMode) || undefined,
      exam: searchParams.get("exam") || undefined,
      module: searchParams.get("module") || undefined,
      vulnerabilities: searchParams.get("vulnerabilities") || undefined,
      modules: searchParams.get("modules") || undefined,
      page: searchParams.get("page") || undefined,
    };
  }, [searchParams]);

  // Update URL params
  const updateParams = useCallback(
    (newParams: Partial<DashboardUrlParams>) => {
      const current = Object.fromEntries(searchParams.entries());

      // Merge with existing params
      const updated: Record<string, string> = { ...current, ...newParams };

      // Remove undefined/null values
      Object.keys(updated).forEach((key) => {
        if (updated[key] === undefined || updated[key] === null || updated[key] === "") {
          delete updated[key];
        }
      });

      setSearchParams(updated);
    },
    [searchParams, setSearchParams]
  );

  // Clear all params
  const clearParams = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  // Set tab and clear other filter params
  const setTab = useCallback(
    (tab: FilterMode) => {
      setSearchParams({ tab, page: "1" });
    },
    [setSearchParams]
  );

  // Set page number
  const setPage = useCallback(
    (page: number) => {
      updateParams({ page: page.toString() });
    },
    [updateParams]
  );

  return {
    params,
    updateParams,
    clearParams,
    setTab,
    setPage,
  };
}
