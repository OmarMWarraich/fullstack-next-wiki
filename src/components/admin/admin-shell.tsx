"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminRouteItems } from "@/lib/admin/routes";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AdminShellProps = {
  children: React.ReactNode;
  userLabel: string;
};

export function AdminShell({ children, userLabel }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 lg:flex-row">
      <aside className="w-full lg:max-w-xs">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Admin Dashboard</CardTitle>
                <CardDescription>
                  Protected project-level tools for Wikimasters operators.
                </CardDescription>
              </div>
              <Badge>Admin</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Active Operator
              </p>
              <p className="mt-1 font-medium text-foreground">{userLabel}</p>
            </div>

            <nav className="space-y-2" aria-label="Admin navigation">
              {adminRouteItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex rounded-lg border p-3 transition-colors",
                      isActive
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <div className="mr-3 mt-0.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </CardContent>
        </Card>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}