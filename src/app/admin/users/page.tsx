import { setUserAdminAccess } from "@/app/actions/admin";
import { getAdminUsers } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Review recent Stack users, sync coverage, authored content, and
            project-level admin access.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>
            Granting admin access applies the Stack project permission used by
            the protected admin routes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            users.map((user) => (
              <div key={user.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {user.name ?? user.email ?? user.id}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user.email ?? "No primary email"} • joined {formatDate(user.signedUpAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={user.isAdmin ? "default" : "outline"}>
                      {user.isAdmin ? "Admin" : "Standard"}
                    </Badge>
                    <Badge variant={user.synced ? "secondary" : "outline"}>
                      {user.synced ? "Synced" : "Not synced"}
                    </Badge>
                    <Badge variant="outline">{user.articleCount} articles</Badge>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <form action={setUserAdminAccess}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input
                      type="hidden"
                      name="enabled"
                      value={user.isAdmin ? "false" : "true"}
                    />
                    <Button size="sm" variant={user.isAdmin ? "outline" : "default"}>
                      {user.isAdmin ? "Revoke Admin" : "Grant Admin"}
                    </Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}