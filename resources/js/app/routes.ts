import { createBrowserRouter, redirect } from "react-router";
import { Layout } from "./components/Layout";
import { HomePage } from "./components/HomePage";
import { BrowseResearch } from "./components/BrowseResearch";
import { ResearchDetails } from "./components/ResearchDetails";
import { AgenciesDirectory } from "./components/AgenciesDirectory";
import { AgencyProfile } from "./components/AgencyProfile";
import { AboutPage } from "./components/AboutPage";
import { AgencyLogin } from "./components/AgencyLogin";
import { SuperAdminLogin } from "./components/SuperAdminLogin";
import { AgencyAdminLayout } from "./components/AgencyAdminLayout";
import { AgencyAdminDashboard } from "./components/AgencyAdminDashboard";
import { ResearchRepository } from "./components/admin/ResearchRepository";
import { UploadResearch } from "./components/admin/UploadResearch";
import { AccessRequests } from "./components/admin/AccessRequests";
import { Analytics } from "./components/admin/Analytics";
import { AgencyProfileAdmin } from "./components/admin/AgencyProfileAdmin";
import { AgencySettings } from "./components/admin/AgencySettings";
import { ResearchMetadata } from "./components/admin/ResearchMetadata";
import { AccessControlManagement } from "./components/admin/AccessControlManagement";
import { NotificationsActivityLog } from "./components/admin/NotificationsActivityLog";
import { DraftVersionManagement } from "./components/admin/DraftVersionManagement";
import { ArchiveManagement } from "./components/admin/ArchiveManagement";
import { SuperAdminLayout } from "./components/SuperAdminLayout";
import { SuperAdminDashboard } from "./components/SuperAdminDashboard";
import { AgencyManagement } from "./components/super-admin/AgencyManagement";
import { AdminUsers } from "./components/super-admin/AdminUsers";
import { SystemResearch } from "./components/super-admin/SystemResearch";
import { ResearchModeration } from "./components/super-admin/ResearchModeration";
import { AccessMonitoring } from "./components/super-admin/AccessMonitoring";
import { SystemAnalytics } from "./components/super-admin/SystemAnalytics";
import { ActivityLogs } from "./components/super-admin/ActivityLogs";
import { RBACManagement } from "./components/super-admin/RBACManagement";
import { SecurityCenter } from "./components/super-admin/SecurityCenter";
import { SAArchive } from "./components/super-admin/SAArchive";
import { PlatformSettings } from "./components/super-admin/PlatformSettings";
import { NotFound } from "./components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "browse", Component: BrowseResearch },
      { path: "research/:id", Component: ResearchDetails },
      { path: "agencies", Component: AgenciesDirectory },
      { path: "agencies/:id", Component: AgencyProfile },
      { path: "about", Component: AboutPage },
      { path: "login", Component: AgencyLogin },
    ],
  },
  {
    path: "/admin/login",
    Component: SuperAdminLogin,
  },
  {
    path: "/admin",
    Component: SuperAdminLayout,
    children: [
      { index: true, loader: () => redirect("/admin/dashboard"), Component: () => null },
      { path: "dashboard", Component: SuperAdminDashboard },
      { path: "agencies", Component: AgencyManagement },
      { path: "users", Component: AdminUsers },
      { path: "research", Component: SystemResearch },
      { path: "moderation", Component: ResearchModeration },
      { path: "access-monitoring", Component: AccessMonitoring },
      { path: "analytics", Component: SystemAnalytics },
      { path: "activity", Component: ActivityLogs },
      { path: "rbac", Component: RBACManagement },
      { path: "security", Component: SecurityCenter },
      { path: "archive", Component: SAArchive },
      { path: "settings", Component: PlatformSettings },
    ],
  },
  {
    path: "/agency",
    Component: AgencyAdminLayout,
    children: [
      { index: true, loader: () => redirect("/agency/dashboard"), Component: () => null },
      { path: "dashboard", Component: AgencyAdminDashboard },
      { path: "research", Component: ResearchRepository },
      { path: "research/:id/edit", Component: ResearchMetadata },
      { path: "research/:id/access-control", Component: AccessControlManagement },
      { path: "research/:id/versions", Component: DraftVersionManagement },
      { path: "upload", Component: UploadResearch },
      { path: "access-requests", Component: AccessRequests },
      { path: "archive", Component: ArchiveManagement },
      { path: "analytics", Component: Analytics },
      { path: "profile", Component: AgencyProfileAdmin },
      { path: "settings", Component: AgencySettings },
      { path: "notifications", Component: NotificationsActivityLog },
    ],
  },
  // Legacy redirects
  {
    path: "/system-admin/login",
    loader: () => redirect("/admin/login"),
    Component: () => null,
  },
  {
    path: "/system/*",
    loader: () => redirect("/admin/dashboard"),
    Component: () => null,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);