# Windows Defender — checks antivirus and real-time protection status
$findings = @()

try {
    $status = Get-MpComputerStatus -ErrorAction Stop

    if (-not $status.RealTimeProtectionEnabled) {
        $findings += @{
            title = "Windows Defender Real-Time Protection Disabled"
            description = "Real-time protection is turned off. Malware, ransomware, and viruses can execute without being detected or blocked."
            severity = "Critical"
            category = "Windows Defender"
            recommendation = "Enable real-time protection: Windows Security > Virus & threat protection > Manage settings > Real-time protection: On."
            evidence = "Get-MpComputerStatus => RealTimeProtectionEnabled: False"
            cvssScore = 9.0
        }
    }

    if (-not $status.AntivirusEnabled) {
        $findings += @{
            title = "Windows Defender Antivirus Disabled"
            description = "Antivirus protection is fully disabled on this system, providing no protection against known malware signatures."
            severity = "Critical"
            category = "Windows Defender"
            recommendation = "Enable Windows Defender Antivirus via Windows Security or re-enable via Group Policy."
            evidence = "Get-MpComputerStatus => AntivirusEnabled: False"
            cvssScore = 9.3
        }
    }

    if (-not $status.BehaviorMonitorEnabled) {
        $findings += @{
            title = "Windows Defender Behavior Monitoring Disabled"
            description = "Behavior monitoring (heuristic detection) is off, reducing detection capability against novel and zero-day threats."
            severity = "Medium"
            category = "Windows Defender"
            recommendation = "Enable behavior monitoring: Set-MpPreference -DisableBehaviorMonitoring \$false"
            evidence = "Get-MpComputerStatus => BehaviorMonitorEnabled: False"
            cvssScore = 5.5
        }
    }

    if (-not $status.IoavProtectionEnabled) {
        $findings += @{
            title = "Windows SmartScreen / Download Scan Disabled"
            description = "Scanning of downloaded files (IOAV) is disabled. Malicious email attachments and drive-by downloads bypass detection."
            severity = "Medium"
            category = "Windows Defender"
            recommendation = "Enable download scanning: Set-MpPreference -DisableIOAVProtection \$false"
            evidence = "Get-MpComputerStatus => IoavProtectionEnabled: False"
            cvssScore = 5.9
        }
    }

    $daysSinceUpdate = ((Get-Date) - $status.AntivirusSignatureLastUpdated).Days
    if ($daysSinceUpdate -gt 3) {
        $findings += @{
            title = "Windows Defender Signatures Outdated ($daysSinceUpdate days old)"
            description = "Virus definitions are $daysSinceUpdate days old. New malware families released since the last update will not be detected."
            severity = "High"
            category = "Windows Defender"
            recommendation = "Update signatures immediately: Update-MpSignature or via Windows Security > Virus & threat protection > Check for updates."
            evidence = "Get-MpComputerStatus => AntivirusSignatureLastUpdated: $($status.AntivirusSignatureLastUpdated)"
            cvssScore = 7.1
        }
    }
} catch {
    $findings += @{
        title = "Windows Defender Status Unavailable"
        description = "Could not query Windows Defender status. The service may be stopped or replaced by a third-party AV. Run as Administrator for full results."
        severity = "Medium"
        category = "Windows Defender"
        recommendation = "Run this script as Administrator to access Windows Defender status."
        evidence = "Get-MpComputerStatus => Error: $($_.Exception.Message)"
        cvssScore = 4.0
    }
}

$findings | ConvertTo-Json -Depth 3
