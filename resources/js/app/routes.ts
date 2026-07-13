import { createElement, lazy } from "react";
import { createBrowserRouter, redirect } from "react-router";
import { useAgencyContext } from "./hooks/useAgencyContext";
import { hasEveryPermission, type AgencyPermission } from "./lib/permissions";
import { PermissionDenied } from "./components/shared/PermissionDenied";

function component<T extends Record<string, unknown>>(loader: () => Promise<T>, name: keyof T) {
    return lazy(async () => {
        const module = await loader();
        return { default: module[name] as React.ComponentType };
    });
}

function agencyPage(
    Page: React.ComponentType,
    ...permissions: readonly AgencyPermission[]
): React.ComponentType {
    function ProtectedAgencyPage() {
        const { user } = useAgencyContext();
        return hasEveryPermission(user, permissions) ? createElement(Page) : createElement(PermissionDenied);
    }

    ProtectedAgencyPage.displayName = `ProtectedAgencyPage(${permissions.join(",")})`;
    return ProtectedAgencyPage;
}

const Layout = component(() => import("./components/Layout"), "Layout");
const HomePage = component(() => import("./components/HomePage"), "HomePage");
const BrowseResearch = component(() => import("./components/BrowseResearch"), "BrowseResearch");
const ResearchDetails = component(() => import("./components/ResearchDetails"), "ResearchDetails");
const AgenciesDirectory = component(() => import("./components/AgenciesDirectory"), "AgenciesDirectory");
const AgencyProfile = component(() => import("./components/AgencyProfile"), "AgencyProfile");
const AboutPage = component(() => import("./components/AboutPage"), "AboutPage");
const HelpPage = component(() => import("./components/PublicInfoPages"), "HelpPage");
const ContactPage = component(() => import("./components/PublicInfoPages"), "ContactPage");
const PrivacyPage = component(() => import("./components/PublicInfoPages"), "PrivacyPage");
const TermsPage = component(() => import("./components/PublicInfoPages"), "TermsPage");
const AgencyLogin = component(() => import("./components/AgencyLogin"), "AgencyLogin");
const ResetPassword = component(() => import("./components/ResetPassword"), "ResetPassword");
const ChangePassword = component(() => import("./components/ChangePassword"), "ChangePassword");
const AgencyAdminLayout = component(() => import("./components/AgencyAdminLayout"), "AgencyAdminLayout");
const AgencyAdminDashboard = component(
    () => import("./components/AgencyAdminDashboard"),
    "AgencyAdminDashboard",
);
const ResearchRepository = component(
    () => import("./components/admin/ResearchRepository"),
    "ResearchRepository",
);
const UploadResearch = component(() => import("./components/admin/UploadResearch"), "UploadResearch");
const AccessRequests = component(() => import("./components/admin/AccessRequests"), "AccessRequests");
const Analytics = component(() => import("./components/admin/Analytics"), "Analytics");
const AgencyProfileAdmin = component(
    () => import("./components/admin/AgencyProfileAdmin"),
    "AgencyProfileAdmin",
);
const AgencySettings = component(() => import("./components/admin/AgencySettings"), "AgencySettings");
const ResearchMetadata = component(() => import("./components/admin/ResearchMetadata"), "ResearchMetadata");
const AccessControlManagement = component(
    () => import("./components/admin/AccessControlManagement"),
    "AccessControlManagement",
);
const NotificationsActivityLog = component(
    () => import("./components/admin/NotificationsActivityLog"),
    "NotificationsActivityLog",
);
const DraftVersionManagement = component(
    () => import("./components/admin/DraftVersionManagement"),
    "DraftVersionManagement",
);
const ArchiveManagement = component(
    () => import("./components/admin/ArchiveManagement"),
    "ArchiveManagement",
);
const AgencyDashboardRoute = agencyPage(AgencyAdminDashboard, "documents.view");
const ResearchRepositoryRoute = agencyPage(ResearchRepository, "documents.view");
const ResearchMetadataRoute = agencyPage(ResearchMetadata, "documents.view", "documents.update");
const AccessControlRoute = agencyPage(AccessControlManagement, "documents.view", "documents.update");
const DraftVersionRoute = agencyPage(DraftVersionManagement, "documents.view");
const UploadResearchRoute = agencyPage(UploadResearch, "documents.create");
const AccessRequestsRoute = agencyPage(AccessRequests, "access_requests.manage");
const ArchiveRoute = agencyPage(ArchiveManagement, "documents.view");
const AnalyticsRoute = agencyPage(Analytics, "documents.view");
const AgencyProfileRoute = agencyPage(AgencyProfileAdmin, "agency.manage");
const AgencySettingsRoute = agencyPage(AgencySettings, "agency.manage");
const SuperAdminLogin = component(() => import("./components/SuperAdminLogin"), "SuperAdminLogin");
const SuperAdminLayout = component(() => import("./components/SuperAdminLayout"), "SuperAdminLayout");
const SuperAdminDashboard = component(
    () => import("./components/SuperAdminDashboard"),
    "SuperAdminDashboard",
);
const AgencyManagement = component(
    () => import("./components/super-admin/AgencyManagement"),
    "AgencyManagement",
);
const AdminUsers = component(() => import("./components/super-admin/AdminUsers"), "AdminUsers");
const SystemResearch = component(() => import("./components/super-admin/SystemResearch"), "SystemResearch");
const ResearchModeration = component(
    () => import("./components/super-admin/ResearchModeration"),
    "ResearchModeration",
);
const AccessMonitoring = component(
    () => import("./components/super-admin/AccessMonitoring"),
    "AccessMonitoring",
);
const SystemAnalytics = component(
    () => import("./components/super-admin/SystemAnalytics"),
    "SystemAnalytics",
);
const ActivityLogs = component(() => import("./components/super-admin/ActivityLogs"), "ActivityLogs");
const RBACManagement = component(() => import("./components/super-admin/RBACManagement"), "RBACManagement");
const SecurityCenter = component(() => import("./components/super-admin/SecurityCenter"), "SecurityCenter");
const SAArchive = component(() => import("./components/super-admin/SAArchive"), "SAArchive");
const PlatformSettings = component(
    () => import("./components/super-admin/PlatformSettings"),
    "PlatformSettings",
);
const NotFound = component(() => import("./components/NotFound"), "NotFound");

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
            { path: "help", Component: HelpPage },
            { path: "contact", Component: ContactPage },
            { path: "privacy", Component: PrivacyPage },
            { path: "terms", Component: TermsPage },
            { path: "login", Component: AgencyLogin },
        ],
    },
    { path: "/reset-password/:token", Component: ResetPassword },
    { path: "/change-password", Component: ChangePassword },
    { path: "/admin/login", Component: SuperAdminLogin },
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
            { path: "dashboard", Component: AgencyDashboardRoute },
            { path: "research", Component: ResearchRepositoryRoute },
            { path: "research/:id/edit", Component: ResearchMetadataRoute },
            { path: "research/:id/access-control", Component: AccessControlRoute },
            { path: "research/:id/versions", Component: DraftVersionRoute },
            { path: "upload", Component: UploadResearchRoute },
            { path: "access-requests", Component: AccessRequestsRoute },
            { path: "archive", Component: ArchiveRoute },
            { path: "analytics", Component: AnalyticsRoute },
            { path: "profile", Component: AgencyProfileRoute },
            { path: "settings", Component: AgencySettingsRoute },
            { path: "notifications", Component: NotificationsActivityLog },
        ],
    },
    { path: "/system-admin/login", loader: () => redirect("/admin/login"), Component: () => null },
    { path: "/system/*", loader: () => redirect("/admin/dashboard"), Component: () => null },
    { path: "*", Component: NotFound },
]);
