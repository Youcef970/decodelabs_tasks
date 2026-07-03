# Browser Audit — checks installed browsers and versions
$findings = @()

$browserChecks = @(
    @{
        name = "Google Chrome"
        regKey = "HKLM:\SOFTWARE\Google\Chrome\BOM"
        altKey = "HKLM:\SOFTWARE\WOW6432Node\Google\Chrome\BOM"
        exePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
        minMajor = 120
    },
    @{
        name = "Mozilla Firefox"
        regKey = "HKLM:\SOFTWARE\Mozilla\Mozilla Firefox"
        exePath = "C:\Program Files\Mozilla Firefox\firefox.exe"
        minMajor = 121
    },
    @{
        name = "Microsoft Edge"
        regKey = "HKLM:\SOFTWARE\Microsoft\EdgeUpdate\Clients\{56EB18F8-B008-4CBD-B6D2-8C97FE7E9062}"
        exePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
        minMajor = 120
    }
)

foreach ($browser in $browserChecks) {
    try {
        if (Test-Path $browser.exePath) {
            $fileVersion = (Get-Item $browser.exePath).VersionInfo.ProductVersion
            $majorVersion = [int]($fileVersion -split '\.')[0]
            if ($majorVersion -lt $browser.minMajor) {
                $findings += @{
                    title = "Outdated Browser: $($browser.name) v$fileVersion"
                    description = "$($browser.name) version $fileVersion is outdated. Older browser versions contain unpatched vulnerabilities exploited via drive-by downloads, phishing pages, and malicious extensions."
                    severity = "High"
                    category = "Browser Audit"
                    recommendation = "Update $($browser.name) to the latest version. Open the browser > Help > About to trigger an update check."
                    evidence = "File version: $($browser.exePath) => $fileVersion (minimum recommended major: $($browser.minMajor))"
                    cvssScore = 7.5
                }
            }
        }
    } catch {}
}

try {
    $extensions = Get-ChildItem "HKCU:\SOFTWARE\Google\Chrome\Extensions" -ErrorAction SilentlyContinue
    if ($extensions.Count -gt 20) {
        $findings += @{
            title = "Excessive Chrome Extensions Installed ($($extensions.Count))"
            description = "$($extensions.Count) Chrome extensions are installed. Each extension has broad access to browser data. Malicious or compromised extensions can steal credentials and session tokens."
            severity = "Low"
            category = "Browser Audit"
            recommendation = "Review installed extensions via chrome://extensions and remove any unused or unrecognized extensions."
            evidence = "HKCU:\SOFTWARE\Google\Chrome\Extensions => $($extensions.Count) entries"
            cvssScore = 3.5
        }
    }
} catch {}

$findings | ConvertTo-Json -Depth 3
