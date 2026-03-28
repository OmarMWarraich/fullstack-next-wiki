import { setArticlePublishedState } from "@/app/actions/admin";
import { getAdminModerationQueue } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminModerationPage() {
  const queue = await getAdminModerationQueue();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Moderation Queue</CardTitle>
          <CardDescription>
            Review articles that are still drafts or are missing AI summaries
            before they are considered complete.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Queued Articles</CardTitle>
          <CardDescription>
            Publication state can be changed here. Summary generation remains
            controlled by the AI feature flag and batch job.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No articles currently need moderation.
            </p>
          ) : (
            queue.map((article) => (
              <div key={article.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{article.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {article.author ?? "Unknown author"} • {formatDate(article.updatedAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {article.reasons.map((reason) => (
                      <Badge key={reason} variant="outline">
                        {reason}
                      </Badge>
                    ))}
                    <Badge variant={article.published ? "secondary" : "outline"}>
                      {article.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-muted-foreground">
                    {article.pageviews} total pageviews
                  </div>
                  <form action={setArticlePublishedState}>
                    <input type="hidden" name="articleId" value={article.id} />
                    <input
                      type="hidden"
                      name="published"
                      value={article.published ? "false" : "true"}
                    />
                    <Button size="sm" variant={article.published ? "outline" : "default"}>
                      {article.published ? "Move To Draft" : "Publish Article"}
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