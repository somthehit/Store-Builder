import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  children: ReactNode;
  className?: string;
}

interface SidebarItemProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  isActive?: boolean;
}

export function Sidebar({ children, className }: SidebarProps) {
  return (
    <div className={cn("w-64 bg-white shadow-lg border-r border-slate-200", className)}>
      <div className="flex h-full flex-col">
        {children}
      </div>
    </div>
  );
}

export function SidebarHeader({ children }: { children: ReactNode }) {
  return (
    <div className="p-6">
      {children}
    </div>
  );
}

export function SidebarContent({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 px-4 py-6 space-y-2">
      {children}
    </div>
  );
}

export function SidebarFooter({ children }: { children: ReactNode }) {
  return (
    <div className="p-4">
      <Separator className="mb-4" />
      {children}
    </div>
  );
}

export function SidebarItem({ href, icon, children, isActive }: SidebarItemProps) {
  const [location] = useLocation();
  const active = isActive ?? location === href;

  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
          active
            ? "bg-blue-50 text-blue-700"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        )}
      >
        {icon}
        <span className="ml-3">{children}</span>
      </a>
    </Link>
  );
}

export function SidebarGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {title}
      </h3>
      {children}
    </div>
  );
}
