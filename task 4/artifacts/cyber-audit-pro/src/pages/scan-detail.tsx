import { useParams, Link } from "wouter";
import { useGetScan } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Monitor, Cpu, Clock, HardDrive, Shield, ShieldAlert, AlertTriangle, AlertCircle, Info, Hash, AlertOctagon } from "lucide-react";
import { formatDate } from "@/lib/utils";

// Custom SVG Ring Progress Gauge
function ScoreGauge({ score, grade }: { score: number, grade: string }) {
  const radius = 60;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = "text-emerald-500";
  if (grade === "B") colorClass = "text-green-500";
  if (grade === "C") colorClass = "text-yellow-500";
  if (grade === "D") colorClass = "text-orange-500";
  if (grade === "F") colorClass = "text-red-500";

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
        <circle
          stroke="currentColor"
          className="text-muted/30"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="currentColor"
          className={`${colorClass} transition-all duration-1000 ease-in-out`}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-bold font-mono">{score}</span>
        <span className={`text-lg font-bold grade-${grade.toLowerCase()} leading-none`}>Grade {grade}</span>
      </div>
    </div>
  );
}

function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case "Critical": return <ShieldAlert className="h-5 w-5 text-red-500" />;
    case "High": return <AlertOctagon className="h-5 w-5 text-orange-500" />;
    case "Medium": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case "Low": return <AlertCircle className="h-5 w-5 text-blue-400" />;
    default: return <Info className="h-5 w-5 text-slate-400" />;
  }
}

export default function ScanDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { data: scan, isLoading, isError } = useGetScan(id, { query: { enabled: !!id } });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="col-span-1 h-64" />
          <Skeleton className="col-span-2 h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError || !scan) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md border border-destructive/20 flex items-center gap-3">
          <AlertTriangle />
          <div>
            <h3 className="font-bold">Scan Not Found</h3>
            <p className="text-sm">The requested scan report does not exist or has been deleted.</p>
          </div>
        </div>
        <Link href="/scans">
          <Button variant="outline" className="mt-4 gap-2"><ArrowLeft className="h-4 w-4"/> Back to Scans</Button>
        </Link>
      </div>
    );
  }

  // Group findings by category
  const groupedFindings = scan.findings.reduce((acc, finding) => {
    if (!acc[finding.category]) acc[finding.category] = [];
    acc[finding.category].push(finding);
    return acc;
  }, {} as Record<string, typeof scan.findings>);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/scans">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{(scan.systemInfo as any)?.hostname || scan.label}</h1>
          <p className="text-muted-foreground">Scanned on {formatDate(scan.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 flex flex-col items-center justify-center p-8 text-center bg-card/50 backdrop-blur">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">Security Posture</h3>
          <ScoreGauge score={scan.score} grade={scan.grade} />
          
          <div className="mt-8 grid grid-cols-2 gap-4 w-full text-left">
            <div className="bg-muted/50 rounded-md p-3">
              <div className="text-xs text-muted-foreground mb-1">Critical</div>
              <div className="text-xl font-mono text-red-500">{scan.criticalCount}</div>
            </div>
            <div className="bg-muted/50 rounded-md p-3">
              <div className="text-xs text-muted-foreground mb-1">High</div>
              <div className="text-xl font-mono text-orange-500">{scan.highCount}</div>
            </div>
            <div className="bg-muted/50 rounded-md p-3">
              <div className="text-xs text-muted-foreground mb-1">Medium</div>
              <div className="text-xl font-mono text-yellow-500">{scan.mediumCount}</div>
            </div>
            <div className="bg-muted/50 rounded-md p-3">
              <div className="text-xs text-muted-foreground mb-1">Total</div>
              <div className="text-xl font-mono">{scan.totalFindings}</div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scan.systemInfo ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1 flex items-center gap-1.5"><Monitor className="h-3 w-3"/> OS</div>
                  <div className="font-medium">{scan.systemInfo.os || "Unknown"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1 flex items-center gap-1.5"><Hash className="h-3 w-3"/> Architecture</div>
                  <div className="font-medium">{scan.systemInfo.architecture || "Unknown"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1 flex items-center gap-1.5"><Cpu className="h-3 w-3"/> CPU</div>
                  <div className="font-medium truncate" title={scan.systemInfo.cpu || "Unknown"}>{scan.systemInfo.cpu || "Unknown"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1 flex items-center gap-1.5"><HardDrive className="h-3 w-3"/> RAM</div>
                  <div className="font-medium">{scan.systemInfo.ram || "Unknown"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1 flex items-center gap-1.5"><Clock className="h-3 w-3"/> Uptime</div>
                  <div className="font-medium">{scan.systemInfo.uptime || "Unknown"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1 flex items-center gap-1.5"><Shield className="h-3 w-3"/> Domain</div>
                  <div className="font-medium">{scan.systemInfo.domain || "Workgroup"}</div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground py-8 text-center">No deep system info collected during this scan.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight border-b pb-2">Audit Findings</h2>
        
        {scan.findings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No vulnerabilities or misconfigurations detected.</p>
              <p className="text-sm mt-1">System conforms to the applied baseline policy.</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedFindings).map(([category, findings]) => (
            <Card key={category} className="overflow-hidden">
              <div className="bg-muted px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold">{category}</h3>
                <Badge variant="secondary">{findings.length} findings</Badge>
              </div>
              <div className="divide-y divide-border">
                {findings.map(finding => (
                  <div key={finding.id} className="p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5">
                        <SeverityIcon severity={finding.severity} />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="font-semibold text-base leading-tight">{finding.title}</h4>
                          <div className="flex gap-2 shrink-0">
                            {finding.cvssScore && (
                              <Badge variant="outline" className="font-mono">CVSS {finding.cvssScore}</Badge>
                            )}
                            <Badge variant="outline" className={`severity-${finding.severity.toLowerCase()} border-transparent`}>
                              {finding.severity}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{finding.description}</p>
                        
                        {finding.recommendation && (
                          <div className="mt-3 bg-primary/5 border border-primary/20 rounded-md p-3">
                            <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">Recommendation</div>
                            <div className="text-sm">{finding.recommendation}</div>
                          </div>
                        )}
                        
                        {finding.evidence && (
                          <div className="mt-2">
                            <div className="text-xs text-muted-foreground mb-1">Evidence / Check Value</div>
                            <pre className="text-xs bg-slate-950 p-2 rounded-md border text-slate-300 overflow-x-auto">
                              {finding.evidence}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
