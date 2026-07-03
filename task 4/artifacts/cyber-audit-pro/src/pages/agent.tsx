import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Terminal, Settings, CheckCircle2, ChevronRight, Server } from "lucide-react";

export default function AgentPage() {
  const handleDownload = () => {
    // Navigate directly to the download endpoint which returns the binary ZIP
    window.location.href = import.meta.env.BASE_URL + 'api/agent/download';
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agent Deployment</h1>
        <p className="text-muted-foreground mt-1">
          Deploy the lightweight PowerShell agent to Windows endpoints to collect security telemetry.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How it works</CardTitle>
              <CardDescription>Get up and running in under a minute. No installation required.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">1</div>
                <div>
                  <h3 className="font-semibold text-lg">Download the Agent Bundle</h3>
                  <p className="text-muted-foreground text-sm mt-1 mb-3">
                    Get the pre-configured zip file containing the audit scripts. It is already configured to securely communicate with this dashboard instance.
                  </p>
                  <Button onClick={handleDownload} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download Windows Agent
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold">2</div>
                <div>
                  <h3 className="font-semibold text-lg">Extract & Run</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Extract the ZIP file on the target Windows machine. Double-click the <code className="bg-muted px-1.5 py-0.5 rounded text-primary">run-audit.cmd</code> file. You do not need to open a PowerShell terminal manually.
                  </p>
                  <div className="mt-3 bg-black p-4 rounded-md border border-border/50 font-mono text-xs text-slate-300">
                    <div className="text-slate-500 mb-2"># The script will automatically elevate to Admin, run the audit, and post results</div>
                    <div>&gt; Invoking CyberAudit...</div>
                    <div>&gt; Checking OS Configuration... [OK]</div>
                    <div>&gt; Analyzing Firewall rules... [OK]</div>
                    <div className="text-emerald-400 mt-2">&gt; Scan complete. Payload submitted successfully.</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold">3</div>
                <div>
                  <h3 className="font-semibold text-lg">View Results Automatically</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    The agent pushes the JSON payload directly to the server. Results will instantly appear in the Dashboard and Scan History.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Terminal className="h-5 w-5 text-primary" />
                CLI Deployment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                For mass deployment via Intune or Group Policy, you can fetch and run the agent entirely in memory.
              </p>
              <div className="bg-black border border-primary/20 rounded p-3 overflow-x-auto">
                <code className="text-[10px] text-cyan-400 whitespace-nowrap">
                  iex ((New-Object System.Net.WebClient).DownloadString('http://server/api/agent/ps1'))
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5" />
                Scheduled Task
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                To run recurring audits, install the agent as a scheduled task. This requires administrative privileges.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Runs silently as SYSTEM</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Daily telemetry sync</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> No user interruption</li>
              </ul>
              <Button variant="outline" className="w-full mt-4 gap-2 text-xs">
                View Task XML <ChevronRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded">
                  <Server className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Server Endpoint</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">{window.location.origin}/api</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
