"use client";

import { Module } from "@/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export interface SidebarProps {
  modules: Module[];
  isLoading?: boolean;
  activeModuleKey?: string | null;
  onModuleChange?: (key: string) => void;
}

export function Sidebar({ modules, isLoading = false, activeModuleKey, onModuleChange }: SidebarProps) {
  const pathname = usePathname();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(["erp"]));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showModuleMenu, setShowModuleMenu] = useState(false);
  const moduleMenuRef = useRef<HTMLDivElement>(null);

  const getModuleIcon = (moduleKey: string, isCollapsedView: boolean) => {
    const sizeClass = isCollapsedView ? "w-6 h-6" : "w-5 h-5";
    switch (moduleKey) {
      case "erp":
        return (
          <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4v16" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 10h16" />
          </svg>
        );
      case "hrms":
        return (
          <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20h10a2 2 0 002-2v-5H5v5a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7a3 3 0 106 0 3 3 0 00-6 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13a7 7 0 0114 0" />
          </svg>
        );
      case "payroll":
        return (
          <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16v10H4z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11h8" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v6" />
          </svg>
        );
      case "reports":
        return (
          <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19h16" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17V9" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17V5" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17v-7" />
          </svg>
        );
      case "platform":
        return (
          <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16v10H4z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V4h8v3" />
          </svg>
        );
      case "licensing":
        return (
          <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4z" />
          </svg>
        );
      case "security":
        return (
          <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.5 12a2.5 2.5 0 115 0v2.5h-5V12z" />
          </svg>
        );
      default:
        return (
          <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5h14v14H5z" />
          </svg>
        );
    }
  };

  const toggleModule = (moduleKey: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleKey)) {
        next.delete(moduleKey);
      } else {
        next.add(moduleKey);
      }
      return next;
    });
  };

  const isModuleActive = (module: Module): boolean => {
    if (module.subModules && module.subModules.length > 0) {
      return module.subModules.some((sub) =>
        pathname.startsWith(sub.path)
      );
    }
    return pathname.startsWith(`/app/${module.key}`);
  };

  // Group modules by hierarchy
  const businessKeys = useMemo(() => new Set(["erp", "hrms", "payroll", "reports"]), []);
  const businessModulesAll = modules.filter(m => businessKeys.has(m.key));
  const businessModules = activeModuleKey && businessKeys.has(activeModuleKey)
    ? businessModulesAll.filter((module) => module.key === activeModuleKey)
    : businessModulesAll;
  const platformModules = modules.filter(m => m.key === "platform");
  const licensingModules = modules.filter(m => m.key === "licensing");
  const securityModules = modules.filter(m => m.key === "security");

  const effectiveExpandedModules = useMemo(() => {
    const next = new Set(expandedModules);
    if (activeModuleKey && businessKeys.has(activeModuleKey)) {
      next.add(activeModuleKey);
    }
    return next;
  }, [expandedModules, activeModuleKey, businessKeys]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moduleMenuRef.current && !moduleMenuRef.current.contains(e.target as Node)) {
        setShowModuleMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeModuleName =
    businessModulesAll.find((module) => module.key === activeModuleKey)?.name || "ERP";

  const renderModule = (module: Module) => {
    const isActive = isModuleActive(module);
    const isExpanded = effectiveExpandedModules.has(module.key);
    const hasSubModules = module.subModules && module.subModules.length > 0;
    const subModules = module.subModules || [];
    const hasGrouping = subModules.some((sub) => Boolean(sub.group));
    const groupedSubModules = hasGrouping
      ? subModules.reduce(
          (acc: { label: string; items: typeof subModules }[], sub) => {
            const label = sub.group || "Other";
            const existing = acc.find((group) => group.label === label);
            if (existing) {
              existing.items.push(sub);
            } else {
              acc.push({ label, items: [sub] });
            }
            return acc;
          },
          []
        )
      : [{ label: "", items: subModules }];

    return (
      <div key={module.key} className="mb-1">
        {hasSubModules ? (
          <>
            <button
              onClick={() => toggleModule(module.key)}
              className={`w-full flex items-center rounded-lg transition group ${
                isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
              } ${
                isActive
                  ? "bg-white text-slate-900 ring-1 ring-blue-200"
                  : "text-slate-700 hover:bg-white"
              }`}
              title={isCollapsed ? module.name : undefined}
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="flex-shrink-0 text-slate-600">
                  {getModuleIcon(module.key, isCollapsed)}
                </span>
                {!isCollapsed && <span className="truncate">{module.name}</span>}
              </span>
              {!isCollapsed && (
                <svg
                  className={`w-4 h-4 flex-shrink-0 transition ${isExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              )}
            </button>
            {!isCollapsed && isExpanded && (
              <div className="mt-2 space-y-1 ml-3">
                {groupedSubModules.map((group) => (
                  <div key={`${module.key}-${group.label || "default"}`} className="space-y-1">
                    {group.label && (
                      <div className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {group.label}
                      </div>
                    )}
                    {group.items.map((sub) => (
                      <Link
                        key={sub.key}
                        href={sub.path}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition ${
                          pathname === sub.path
                            ? "bg-blue-50 text-blue-800"
                            : "text-slate-600 hover:bg-white hover:text-slate-900"
                        }`}
                      >
                        {sub.icon && <span className="text-base flex-shrink-0">{sub.icon}</span>}
                        <span className="truncate">{sub.name}</span>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <Link
            href={module.subModules?.[0]?.path || `/app/${module.key}`}
            className={`flex items-center rounded-lg transition ${
              isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
            } ${
              isActive
                ? "bg-white text-slate-900 ring-1 ring-blue-200"
                : "text-slate-700 hover:bg-white"
            }`}
            title={isCollapsed ? module.name : undefined}
          >
            <span className="flex-shrink-0 text-slate-600">
              {getModuleIcon(module.key, isCollapsed)}
            </span>
            {!isCollapsed && <span className="truncate">{module.name}</span>}
          </Link>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <aside className={`${isCollapsed ? "w-16" : "w-64"} flex-shrink-0 bg-white/80 border-r border-white/40 px-3 py-4 transition-all duration-200 shadow-[var(--erp-shadow)] backdrop-blur-xl`}>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 bg-gray-100 rounded-md animate-pulse" />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className={`${isCollapsed ? "w-16" : "w-64"} flex-shrink-0 bg-white/80 border-r border-white/40 flex flex-col transition-all duration-200 shadow-[var(--erp-shadow)] backdrop-blur-xl`}>
      {/* Collapse Toggle */}
      <div className="h-16 px-3 flex items-center justify-end border-b border-white/40">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={`w-4 h-4 transition ${isCollapsed ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto ${isCollapsed ? "px-2" : "px-3"} py-4`}>
        {!isCollapsed && businessModulesAll.length > 0 && (
          <div className="mb-4">
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Modules
            </div>
            <div className="relative" ref={moduleMenuRef}>
              <button
                onClick={() => setShowModuleMenu((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/80 border border-white/70 text-sm font-semibold text-slate-700 hover:bg-white transition"
              >
                <span className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-700">◆</span>
                  <span className="truncate">{activeModuleName}</span>
                </span>
                <span className="text-xs text-slate-400">Change</span>
              </button>
              {showModuleMenu && (
                <div className="mt-2 rounded-xl border border-white/70 bg-white shadow-lg">
                  {businessModulesAll.map((module) => (
                    <button
                      key={module.key}
                      onClick={() => {
                        onModuleChange?.(module.key);
                        setShowModuleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition ${
                        activeModuleKey === module.key
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {module.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {modules.length === 0 ? (
          !isCollapsed && (
            <div className="text-xs text-gray-400 text-center py-8">
              No modules available
            </div>
          )
        ) : (
          <div className="space-y-6">
            {/* Business Modules */}
            {businessModules.length > 0 && (
              <div>
                {!isCollapsed && (
                  <h3 className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">
                    Business
                  </h3>
                )}
                <div className="space-y-0.5">
                  {businessModules.map(renderModule)}
                </div>
              </div>
            )}

            {/* Admin Modules Separator */}
            {(platformModules.length > 0 || licensingModules.length > 0 || securityModules.length > 0) && (
              <div className="border-t border-gray-200 pt-4">
                {!isCollapsed && (
                  <h3 className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">
                    Admin
                  </h3>
                )}
                <div className="space-y-0.5 opacity-90">
                  {platformModules.map(renderModule)}
                  {licensingModules.map(renderModule)}
                  {securityModules.map(renderModule)}
                </div>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="px-3 py-3 border-t border-white/40">
          <div className="px-3 py-2 bg-white/70 rounded-md">
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{modules.length}</span> modules enabled
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
