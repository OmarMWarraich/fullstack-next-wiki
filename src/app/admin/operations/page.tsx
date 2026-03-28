import { getAdminOperationsStatus } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function getBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "healthy":
      return "default";
    case "configured":
      return "secondary";
    case "degraded":
      return "destructive";
    default:
      return "outline";
  }
}

export default async function AdminOperationsPage() {
  const operations = await getAdminOperationsStatus();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operations</CardTitle>
          <CardDescription>
            Service health, queue visibility, and the key runtime toggles behind
            article summaries and caching.
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Service Checks</CardTitle>
            <CardDescription>
              Live checks are used for the database and Redis. Email and AI are
              reported from current environment wiring.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {operations.serviceChecks.map((service) => (
              <div
                key={service.name}
                className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{service.name}</p>
                  <p className="text-sm text-muted-foreground">{service.detail}</p>
                </div>
                <Badge variant={getBadgeVariant(service.status)}>
                  {service.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary Queue</CardTitle>
              <CardDescription>
                Pending coverage for the scheduled summary generation route.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm uppercase tracking-wide text-muted-foreground">
                  Pending articles
                </p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {operations.summaryQueue.pendingArticles}
                </p>
              </div>

              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                <p>
                  Summary model: <span className="font-medium text-foreground">{operations.summaryQueue.summaryModel}</span>
                </p>
                <p className="mt-2">
                  Cron secret: {operations.summaryQueue.cronProtected ? "configured" : "missing"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cache Keys</CardTitle>
              <CardDescription>
                Current naming used by the app for list caching and per-article pageviews.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-lg border p-3">
                <p className="font-medium text-foreground">Article list cache</p>
                <p>{operations.cache.articlesKey}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="font-medium text-foreground">Pageview key pattern</p>
                <p>{operations.cache.pageviewPattern}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}