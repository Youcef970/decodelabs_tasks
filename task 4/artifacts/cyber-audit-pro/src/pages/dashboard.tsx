import { Link } from "wouter";
import { useGetStats, useListScans } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, AlertTriangle, AlertOctagon, Activity, Download, ChevronRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: recentScans, isLoading: scansLoading } = useListScans({ limit: 5 });

  if (statsLoading || scansLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  // Empty state handling
  if (!stats || stats.totalScans === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-6 rounded-full bg-primary/10 p-6">
          <ShieldAlert className="h-16 w-16 text-primary" />
        </div>
        <h2 className="mb-2 text-3xl font-bold tracking-tight">No Scans Recorded</h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          Deploy the Windows agent to your infrastructure to begin collecting security telemetry. Results will appear here automatically.
        </p>
        <Link href="/agent">
          <Button size="lg" className="gap-2">
            <Download className="h-4 w-4" />
            Download Agent
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Security Posture</h1>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-500" />
          Last updated: {formatDate(stats.lastScanAt)}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-primary">
              {stats.averageScore?.toFixed(1) || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {stats.totalScans} total scans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Critical Findings</CardTitle>
            <AlertOctagon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-red-500">
              {stats.totalCritical}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires immediate action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High Findings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-orange-500">
              {stats.totalHigh}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Investigate soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monitored Assets</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{stats.totalScans}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total historical reports
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Score Trend</CardTitle>
            <CardDescription>Average security score over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.scoreTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="label" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  domain={[0, 100]} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Vulnerable Categories</CardTitle>
            <CardDescription>Areas requiring the most attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {stats.topCategories.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No vulnerabilities detected.
                </div>
              ) : (
                stats.topCategories.map((cat, i) => (
                  <div key={i} className="flex items-center">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{cat.category}</p>
                    </div>
                    <div className="font-mono text-sm">{cat.count} findings</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Scans</CardTitle>
            <CardDescription>Latest telemetry from agents</CardDescription>
          </div>
          <Link href="/scans">
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hostname</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Critical / High</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentScans?.map((scan) => (
                <TableRow key={scan.id}>
                  <TableCell className="font-medium">{scan.hostname || scan.label}</TableCell>
                  <TableCell>
                    <span className={`font-bold grade-${scan.grade.toLowerCase()}`}>
                      {scan.grade}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono">{scan.score}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {scan.criticalCount > 0 && (
                        <Badge variant="outline" className="severity-critical border-transparent">{scan.criticalCount}</Badge>
                      )}
                      {scan.highCount > 0 && (
                        <Badge variant="outline" className="severity-high border-transparent">{scan.highCount}</Badge>
                      )}
                      {scan.criticalCount === 0 && scan.highCount === 0 && (
                        <span className="text-muted-foreground text-sm">None</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(scan.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/scans/${scan.id}`}>
                      <Button variant="outline" size="sm">Report</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {recentScans?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No scans found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
