"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, type AuthUser } from "@/context/AuthContext";
import { useTenantConfig } from "@/context/TenantConfigContext";
import { hrApi } from "@/lib/hrApi";
import { Module } from "@/types";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { featureFlags, loading: configLoading } = useTenantConfig();
  const router = useRouter();
  const pathname = usePathname();
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeModuleKey, setActiveModuleKey] = useState<string | null>(null);
  const [guardBlocked, setGuardBlocked] = useState(false);

  const frozenModuleKeys = useMemo(
    () => new Set(["erp", "hrms", "payroll", "reports", "platform", "licensing", "security"]),
    []
  );


  const enabledModules = useMemo(() => new Set(modules.map((m) => m.key)), [modules]);
  const hasModule = useCallback((key: string) => enabledModules.has(key), [enabledModules]);

  const getModuleKeyFromPath = useCallback((path: string) => {
    if (path.startsWith("/erp/hrms")) return "hrms";
    if (path.startsWith("/erp/payroll")) return "payroll";
    if (path.startsWith("/erp/reports")) return "reports";
    if (path.startsWith("/erp")) return "erp";
    if (path.startsWith("/platform")) return "platform";
    if (path.startsWith("/licensing")) return "licensing";
    if (path.startsWith("/security")) return "security";
    return null;
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const userRoles = useMemo(() => (user as AuthUser | null)?.roles || [], [user]);

  const isAdmin = useMemo(() => {
    return userRoles.some((role) =>
      ["admin", "superadmin", "systemadmin"].includes(role.toLowerCase())
    );
  }, [userRoles]);

  const featureFlagMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const flag of featureFlags || []) {
      if (!flag?.featureKey) continue;
      map.set(flag.featureKey.toLowerCase(), !!flag.isEnabled);
    }
    return map;
  }, [featureFlags]);

  const toFeatureKey = useCallback((path: string) =>
    path
      .replace(/^\/+/, "")
      .replace(/\/+/g, ".")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .toLowerCase(),
  []);

  const isFeatureAllowed = useCallback((keys: string[]) => {
    for (const key of keys) {
      const normalized = key.toLowerCase();
      if (!featureFlagMap.has(normalized)) continue;
      if (featureFlagMap.get(normalized) === false) {
        return false;
      }
    }
    return true;
  }, [featureFlagMap]);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("activeModuleKey") : null;
    const fromPath = getModuleKeyFromPath(pathname);
    setActiveModuleKey(fromPath || stored || "erp");
  }, [pathname, getModuleKeyFromPath]);

  // Helper: Get sub-modules/pages for each module
  type SubModuleLink = {
    key: string;
    name: string;
    path: string;
    icon?: string;
    group?: string;
  };

  type BackendModule = {
    key: string;
    name: string;
  };

  const getSubModulesForModule = useCallback((moduleKey: string) => {
    const hrmsSubModules = [
      { key: "hrms-dashboard", name: "HR Dashboard", path: "/erp/hrms", icon: "👥", group: "HRMS" },
      { key: "employees", name: "Employee Master", path: "/erp/hrms/employees", icon: "🧑‍💼", group: "HRMS" },
      { key: "attendance", name: "Attendance", path: "/erp/hrms/attendance", icon: "📋", group: "HRMS" },
      { key: "leave-management", name: "Leave Management", path: "/erp/hrms/leave", icon: "🏖️", group: "HRMS" },
    ];

    const payrollSubModules = [
      { key: "payroll-dashboard", name: "Payroll Dashboard", path: "/erp/payroll", icon: "💰", group: "Payroll" },
      { key: "salary-structures", name: "Salary Structures", path: "/erp/payroll/structures", icon: "📋", group: "Payroll" },
      { key: "components", name: "Components", path: "/erp/payroll/components", icon: "🧩", group: "Payroll" },
      { key: "payroll-runs", name: "Payroll Runs", path: "/erp/payroll/runs", icon: "▶️", group: "Payroll" },
      { key: "payslips", name: "Payslips", path: "/erp/payroll/payslips", icon: "📄", group: "Payroll" },
    ];

    const reportsSubModules = [
      { key: "reports-dashboard", name: "Reports Dashboard", path: "/erp/reports", icon: "📊", group: "Reports" },
      { key: "hr-reports", name: "HR Reports", path: "/erp/reports/hr", icon: "👥", group: "Reports" },
      { key: "payroll-reports", name: "Payroll Reports", path: "/erp/reports/payroll", icon: "💰", group: "Reports" },
      { key: "compliance-reports", name: "Compliance Reports", path: "/erp/reports/compliance", icon: "⚖️", group: "Reports" },
    ];

    const subModuleMap: Record<string, SubModuleLink[]> = {
      erp: [
        { key: "erp-dashboard", name: "ERP Dashboard", path: "/erp", icon: "🧭", group: "Core ERP" },
        { key: "customers", name: "Customers", path: "/erp/customers", icon: "🤝", group: "Sales & CRM" },
        { key: "sales-orders", name: "Sales Orders", path: "/erp/sales-orders", icon: "🧾", group: "Sales & CRM" },
        { key: "vendors", name: "Vendors", path: "/erp/vendors", icon: "🏭", group: "Purchase & Procurement" },
        { key: "purchase-orders", name: "Purchase Orders", path: "/erp/purchase-orders", icon: "🛒", group: "Purchase & Procurement" },
        { key: "items", name: "Items", path: "/erp/items", icon: "📦", group: "Inventory" },
        { key: "chart-of-accounts", name: "Chart of Accounts", path: "/erp/chart-of-accounts", icon: "📒", group: "Finance & Accounting" },
        ...hrmsSubModules,
        ...payrollSubModules,
        ...reportsSubModules,
      ],
      hrms: hrmsSubModules,
      payroll: payrollSubModules,
      reports: reportsSubModules,
      // LAYER 4: Business Modules (Client-facing, shown first)
      
      // LAYER 1: Platform / Core (Admin-only)
      platform: [
        { key: "platform-overview", name: "Platform Overview", path: "/platform", icon: "🧱" },
        { key: "companies", name: "Companies", path: "/platform/companies", icon: "🏢" },
        { key: "tenants", name: "Tenants", path: "/platform/tenants", icon: "🏛️" },
        { key: "projects", name: "Projects / Cost Centers", path: "/platform/projects", icon: "📁" },
        { key: "users", name: "Users", path: "/platform/users", icon: "👤" },
        { key: "roles", name: "Roles & Policies", path: "/platform/roles", icon: "🛡️" },
        { key: "settings", name: "Settings", path: "/platform/settings", icon: "⚙️" },
        { key: "feature-flags", name: "Feature Flags", path: "/platform/feature-flags", icon: "🚩" },
        { key: "contact-submissions", name: "Contact Submissions", path: "/platform/contact-submissions", icon: "📨" },
        { key: "audit-logs", name: "Audit Logs", path: "/platform/audit-logs", icon: "🧭" },
      ],
      
      // LAYER 2: Modules & Licensing (Product control)
      licensing: [
        { key: "licensing-overview", name: "Licensing Overview", path: "/licensing", icon: "📚" },
        { key: "module-catalog", name: "Module Catalog", path: "/licensing/catalog", icon: "📦" },
        { key: "subscriptions", name: "Subscriptions", path: "/licensing/subscriptions", icon: "🧾" },
        { key: "integrations", name: "API Keys & Integrations", path: "/licensing/integrations", icon: "🔑" },
      ],
      
      // LAYER 3: Authentication & Security (Identity layer)
      security: [
        { key: "security-overview", name: "Security Overview", path: "/security", icon: "🔒" },
        { key: "refresh-tokens", name: "Refresh Tokens", path: "/security/sessions", icon: "♻️" },
        { key: "device-sessions", name: "Device Sessions", path: "/security/devices", icon: "📱" },
        { key: "password-policies", name: "Password Policies", path: "/security/password-policies", icon: "🔏" },
      ],
    };

    return subModuleMap[moduleKey] || [];
  }, []);

  useEffect(() => {
    const fetchModulesAndVersion = async () => {
      if (!user) return;
      try {
        setModulesLoading(true);
        
        // Fetch modules from backend
        const modulesRes = await hrApi.modules.getEnabled();
        const modulesData = (modulesRes.data.modules || []) as BackendModule[];
        const filteredModules = modulesData.filter((module) => frozenModuleKeys.has(module.key));
        
        // Transform backend modules to include routing
        const transformedModules: Module[] = filteredModules.map((module) => ({
          key: module.key,
          name: module.name,
          isEnabled: true,
          subModules: getSubModulesForModule(module.key),
        }));
        
        setModules(transformedModules);

        // Fetch app version
        try {
          const versionRes = await hrApi.system.getVersion();
          setAppVersion(versionRes.version || "1.0.0");
        } catch {
          // Version fetch failed, use default
        }
      } catch (error) {
        console.error("Failed to fetch modules:", error);
        setModules([]);
      } finally {
        setModulesLoading(false);
      }
    };

    fetchModulesAndVersion();
  }, [user, refreshKey, frozenModuleKeys, getSubModulesForModule]);

  useEffect(() => {
    if (loading || !user) return;
    if (modulesLoading || configLoading) return;

    const moduleKey = getModuleKeyFromPath(pathname);
    if (moduleKey && !hasModule(moduleKey)) {
      setGuardBlocked(true);
      router.replace("/not-authorized");
      return;
    }

    const adminOnlyModules = new Set(["platform", "licensing", "security"]);
    if (moduleKey && adminOnlyModules.has(moduleKey) && !isAdmin) {
      setGuardBlocked(true);
      router.replace("/not-authorized");
      return;
    }

    const normalizedPath = toFeatureKey(pathname);
    const featureKeys = [
      moduleKey ? moduleKey : "",
      moduleKey ? `module:${moduleKey}` : "",
      normalizedPath ? `page:${normalizedPath}` : "",
      normalizedPath,
    ].filter(Boolean);

    if (!isFeatureAllowed(featureKeys)) {
      setGuardBlocked(true);
      router.replace("/not-authorized");
      return;
    }

    if (guardBlocked) {
      setGuardBlocked(false);
    }
  }, [
    loading,
    user,
    modulesLoading,
    configLoading,
    pathname,
    isAdmin,
    hasModule,
    getModuleKeyFromPath,
    toFeatureKey,
    isFeatureAllowed,
    router,
    guardBlocked,
  ]);

  if (loading || !user || modulesLoading || configLoading || guardBlocked) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Global Topbar */}
      <Topbar
        user={user}
        modules={modules}
        appVersion={appVersion}
        onRefresh={() => setRefreshKey((prev) => prev + 1)}
        onLogout={logout}
      />

      {/* App Shell: Sidebar + Content */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar: Collapsible & Hierarchy-driven */}
        <Sidebar
          modules={modules}
          isLoading={modulesLoading}
          activeModuleKey={activeModuleKey}
          onModuleChange={(key) => {
            setActiveModuleKey(key);
            if (typeof window !== "undefined") {
              window.localStorage.setItem("activeModuleKey", key);
            }
            if (key === "hrms") router.push("/erp/hrms");
            else if (key === "payroll") router.push("/erp/payroll");
            else if (key === "reports") router.push("/erp/reports");
            else if (key === "erp") router.push("/erp");
            else if (key === "platform") router.push("/platform");
            else if (key === "licensing") router.push("/licensing");
            else if (key === "security") router.push("/security");
          }}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
