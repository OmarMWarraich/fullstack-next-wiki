import Link from "next/link";
import { ArrowRight, FileText, ImageIcon, Sparkles, Users } from "lucide-react";
import { getAdminOverview } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const overviewCardMeta = [
  {
    key: "articles",
    label: "Articles",
    description: "Published and draft entries currently in the wiki.",
    icon: FileText,
  },
  {
    key: "users",
    label: "Authors",
    description: "Synced Stack users available for article ownership.",
    icon: Users,
  },
  {
    key: "summaries",
    label: "AI Summaries",
    description: "Articles with generated short summaries attached.",
    icon: Sparkles,
  },
  {
    key: "uploads",
    label: "Uploads",
    description: "Articles with a stored image URL from the upload flow.",
    icon: ImageIcon,
  },
] as const;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              A read-only view of content volume, author coverage, summary
              coverage, uploads, and pageview activity.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {overview.totals.publishedArticles} published
            </Badge>
            <Badge variant="outline">{overview.totals.draftArticles} drafts</Badge>
            <Badge>{overview.totals.pageviews} pageviews</Badge>
          </div>
        </CardHeader>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewCardMeta.map((item) => {
          const Icon = item.icon;
          const value = overview.totals[item.key];

          return (
            <Card key={item.key}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardDescription>{item.label}</CardDescription>
                    <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
                  </div>
                  <div className="rounded-full border bg-muted/40 p-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Content</CardTitle>
            <CardDescription>
              Latest article updates with summary, upload, and pageview context.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.recentArticles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No articles are available yet.
              </p>
            ) : (
              overview.recentArticles.map((article) => (
                <div
                  key={article.id}
                  className="rounded-lg border p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-medium text-foreground">{article.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {article.author ?? "Unknown author"} • {formatDate(article.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={article.published ? "secondary" : "outline"}>
                        {article.published ? "Published" : "Draft"}
                      </Badge>
                      <Badge variant={article.hasSummary ? "default" : "outline"}>
                        {article.hasSummary ? "Summary" : "No summary"}
                      </Badge>
                      <Badge variant={article.hasUpload ? "default" : "outline"}>
                        {article.hasUpload ? "Image" : "No image"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                    <span>{article.pageviews} total pageviews</span>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/wiki/${article.id}`}>
                        Open article
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coverage</CardTitle>
              <CardDescription>
                Article-level completion for summaries and uploaded images.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Summary coverage</span>
                  <span>{overview.coverage.summaries}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${overview.coverage.summaries}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Upload coverage</span>
                  <span>{overview.coverage.uploads}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${overview.coverage.uploads}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Most Viewed</CardTitle>
              <CardDescription>
                Top articles ranked by the Redis-backed pageview counter.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview.topArticles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tracked articles are available yet.
                </p>
              ) : (
                overview.topArticles.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {article.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {article.author ?? "Unknown author"}
                      </p>
                    </div>
                    <Badge variant="secondary">{article.pageviews}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}