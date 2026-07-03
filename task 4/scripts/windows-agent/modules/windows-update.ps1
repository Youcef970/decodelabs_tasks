# Windows Update — checks update service and recent update history
$findings = @()

try {
    $wuService = Get-Service -Name wuauserv -ErrorAction SilentlyContinue
    if ($wuService -and $wuService.Status -ne "Running" -and $wuService.StartType -eq "Disabled") {
        $findings += @{
            title = "Windows Update Service Disabled"
            description = "The Windows Update service (wuauserv) is disabled. The system cannot receive security patches, leaving it permanently vulnerable to known exploits."
            severity = "Critical"
            category = "Windows Updates"
            recommendation = "Enable the Windows Update service: Set-Service wuauserv -StartupType Automatic; Start-Service wuauserv"
            evidence = "Get-Service wuauserv => Status: $($wuService.Status), StartType: $($wuService.StartType)"
            cvssScore = 9.0
        }
    }
} catch {}

try {
    $session = New-Object -ComObject Microsoft.Update.Session -ErrorAction Stop
    $searcher = $session.CreateUpdateSearcher()
    $result = $searcher.Search("IsInstalled=0 AND Type='Software'")
    $pending = $result.Updates
    $criticalCount = ($pending | Where-Object { $_.MsrcSeverity -eq "Critical" }).Count
    $importantCount = ($pending | Where-Object { $_.MsrcSeverity -eq "Important" }).Count

    if ($pending.Count -gt 0) {
        $sev = if ($criticalCount -gt 0) { "Critical" } elseif ($importantCount -gt 0) { "High" } else { "Medium" }
        $cvss = if ($criticalCount -gt 0) { 9.2 } elseif ($importantCount -gt 0) { 7.8 } else { 5.0 }
        $findings += @{
            title = "Windows Update Pending Security Patches ($($pending.Count) updates)"
            description = "$($pending.Count) Windows updates are pending installation including $criticalCount Critical and $importantCount Important security patches. Unpatched systems are actively exploited by ransomware and APT groups."
            severity = $sev
            category = "Windows Updates"
            recommendation = "Install all pending updates immediately: Settings > Windows Update > Check for updates > Install all. Schedule automatic updates."
            evidence = "Windows Update API: $($pending.Count) pending updates ($criticalCount Critical, $importantCount Important)"
            cvssScore = $cvss
        }
    }
} catch {
    try {
        $hotfixes = Get-HotFix | Sort-Object InstalledOn -Descending
        $latestHotfix = $hotfixes | Select-Object -First 1
        if ($latestHotfix) {
            $daysSince = ((Get-Date) - [datetime]$latestHotfix.InstalledOn).Days
            if ($daysSince -gt 60) {
                $findings += @{
                    title = "No Windows Updates Installed in $daysSince Days"
                    description = "The last security update was installed $daysSince days ago. Systems should receive patches monthly at minimum."
                    severity = "High"
                    category = "Windows Updates"
                    recommendation = "Run Windows Update immediately and configure automatic updates."
                    evidence = "Get-HotFix => Last patch: $($latestHotfix.HotFixID) installed $($latestHotfix.InstalledOn)"
                    cvssScore = 7.8
                }
            }
        }
    } catch {}
}

$findings | ConvertTo-Json -Depth 3
