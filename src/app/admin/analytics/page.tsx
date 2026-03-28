import { TrendingDown, TrendingUp } from "lucide-react";
import { getAdminAnalytics } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function getTrendLabel(delta: number): { label: string; icon: typeof TrendingUp } {
  return delta >= 0
    ? { label: `+${delta} vs yesterday`, icon: TrendingUp }
    : { label: `${delta} vs yesterday`, icon: TrendingDown };
}

export default async function AdminAnalyticsPage() {
  const analytics = await getAdminAnalytics();
  const trend = getTrendLabel(analytics.deltaFromYesterday);
  const TrendIcon = trend.icon;
  const maxDayTotal = Math.max(...analytics.dailyPageviews.map((day) => day.total), 1);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>
            Aggregate pageview reporting backed by Redis totals and daily
            snapshots captured during article reads.
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total pageviews</CardDescription>
            <CardTitle className="text-3xl">{analytics.totalPageviews}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Last 7 days</CardDescription>
            <CardTitle className="text-3xl">{analytics.sevenDayPageviews}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Today</CardDescription>
            <CardTitle className="text-3xl">{analytics.todayPageviews}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Average daily</CardDescription>
            <CardTitle className="text-3xl">{analytics.averageDailyPageviews}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Pageview Trend</CardTitle>
                <CardDescription>
                  Seven-day site totals. New history starts accumulating as pageviews are recorded.
                </CardDescription>
              </div>
              <Badge variant={analytics.deltaFromYesterday >= 0 ? "secondary" : "outline"}>
                <TrendIcon className="mr-1 h-4 w-4" />
                {trend.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.dailyPageviews.map((day) => (
              <div key={day.date}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{day.date}</span>
                  <span>{day.total}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${Math.max((day.total / maxDayTotal) * 100, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Content</CardTitle>
            <CardDescription>
              Current leaders by total article pageviews.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.topArticles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pageview data has been recorded yet.
              </p>
            ) : (
              analytics.topArticles.map((article) => (
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
      </section>
    </div>
  );
}