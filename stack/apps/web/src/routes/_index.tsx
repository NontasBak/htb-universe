/**
 * Index Route
 * Redirects to the main dashboard
 */

import { Navigate } from "react-router";
import type { Route } from "./+types/_index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "HTB Universe - Practice & Exam Preparation" },
    { name: "description", content: "Find practice machines and modules for Hack The Box certifications" },
  ];
}

export default function Home() {
  return <Navigate to="/dashboard" replace />;
}
