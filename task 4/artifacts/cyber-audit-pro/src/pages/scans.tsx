import { useState } from "react";
import { Link } from "wouter";
import { useListScans, useDeleteScan, getListScansQueryKey, getGetStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Search, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ScansPage() {
  const queryClient = useQueryClient();
  const { data: scans, isLoading } = useListScans();
  const deleteScan = useDeleteScan();
  const [searchTerm, setSearchTerm] = useState("");

  const handleDelete = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this scan report?")) return;
    deleteScan.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListScansQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
      }
    });
  };

  const filteredScans = scans?.filter(s => 
    s.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scan History</h1>
          <p className="text-muted-foreground mt-1">Complete record of all security audits.</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle>All Scans</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search hostname or label..."
                className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur z-10">
                <TableRow>
                  <TableHead className="w-[200px]">Hostname / Label</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Findings Breakdown</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScans?.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell className="font-medium">
                      {scan.hostname || scan.label}
                      {scan.os && <div className="text-xs text-muted-foreground font-normal">{scan.os}</div>}
                    </TableCell>
                    <TableCell>
                      <span className={`text-lg font-bold grade-${scan.grade.toLowerCase()}`}>
                        {scan.grade}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-medium">{scan.score}</span> / 100
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Badge variant="outline" className={scan.criticalCount > 0 ? "severity-critical border-transparent" : "opacity-50 grayscale"}>
                          {scan.criticalCount} C
                        </Badge>
                        <Badge variant="outline" className={scan.highCount > 0 ? "severity-high border-transparent" : "opacity-50 grayscale"}>
                          {scan.highCount} H
                        </Badge>
                        <Badge variant="outline" className={scan.mediumCount > 0 ? "severity-medium border-transparent" : "opacity-50 grayscale"}>
                          {scan.mediumCount} M
                        </Badge>
                        <Badge variant="outline" className={scan.lowCount > 0 ? "severity-low border-transparent" : "opacity-50 grayscale"}>
                          {scan.lowCount} L
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {scan.totalFindings}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(scan.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/scans/${scan.id}`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <FileText className="h-4 w-4" /> View
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(scan.id)}
                          disabled={deleteScan.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredScans?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No scans found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
