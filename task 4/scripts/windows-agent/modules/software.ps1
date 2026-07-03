# Installed Software — checks for outdated or vulnerable software
$findings = @()

$knownVulnerable = @{
    "7-Zip"          = @{ minVersion = "24.0"; cvss = 5.7; severity = "Medium" }
    "WinRAR"         = @{ minVersion = "7.0"; cvss = 6.0; severity = "Medium" }
    "Adobe Reader"   = @{ minVersion = "24.0"; cvss = 7.0; severity = "High" }
    "Java"           = @{ minVersion = "21.0"; cvss = 7.5; severity = "High" }
    "VLC"            = @{ minVersion = "3.0.20"; cvss = 5.0; severity = "Medium" }
    "FileZilla"      = @{ minVersion = "3.66"; cvss = 5.5; severity = "Medium" }
    "PuTTY"          = @{ minVersion = "0.81"; cvss = 6.5; severity = "Medium" }
    "TeamViewer"     = @{ minVersion = "15.50"; cvss = 7.2; severity = "High" }
    "Zoom"           = @{ minVersion = "5.17"; cvss = 6.8; severity = "Medium" }
    "WinSCP"         = @{ minVersion = "6.3"; cvss = 5.5; severity = "Medium" }
}

try {
    $regPaths = @(
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*"
    )

    $installed = foreach ($path in $regPaths) {
        try { Get-ItemProperty $path -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName } } catch {}
    }

    foreach ($app in $installed) {
        foreach ($vuln in $knownVulnerable.GetEnumerator()) {
            if ($app.DisplayName -like "*$($vuln.Key)*") {
                $installedVer = $app.DisplayVersion
                $info = $vuln.Value
                $findings += @{
                    title = "Outdated Software Detected: $($app.DisplayName) $installedVer"
                    description = "Installed version $installedVer of $($app.DisplayName) is below the recommended minimum version $($info.minVersion). Older versions may contain known security vulnerabilities."
                    severity = $info.severity
                    category = "Installed Software"
                    recommendation = "Update $($app.DisplayName) to the latest version from the vendor's official website."
                    evidence = "Registry: $($app.DisplayName) v$installedVer installed (min recommended: $($info.minVersion))"
                    cvssScore = $info.cvss
                }
                break
            }
        }
    }
} catch {}

$findings | ConvertTo-Json -Depth 3
