# Running Services — checks for risky or unnecessary services
$findings = @()

$riskyServices = @(
    @{ name = "Telnet"; displayName = "Telnet"; severity = "Critical"; cvss = 9.0; reason = "Telnet transmits all data including passwords in plaintext." },
    @{ name = "TlntSvr"; displayName = "Telnet Server"; severity = "Critical"; cvss = 9.0; reason = "Telnet server exposes the system to cleartext credential theft." },
    @{ name = "RemoteRegistry"; displayName = "Remote Registry"; severity = "High"; cvss = 7.8; reason = "Allows remote modification of the Windows Registry by network users." },
    @{ name = "SNMP"; displayName = "SNMP Service"; severity = "Medium"; cvss = 5.5; reason = "SNMP v1/v2c uses community strings that are transmitted in plaintext." },
    @{ name = "SharedAccess"; displayName = "Internet Connection Sharing"; severity = "Medium"; cvss = 5.0; reason = "ICS can bypass network security controls and expose internal systems." },
    @{ name = "Fax"; displayName = "Fax"; severity = "Low"; cvss = 2.5; reason = "Fax service is rarely needed and increases the attack surface." },
    @{ name = "XboxGipSvc"; displayName = "Xbox Accessory Management"; severity = "Low"; cvss = 2.0; reason = "Xbox services on enterprise systems increase unnecessary attack surface." }
)

try {
    foreach ($svc in $riskyServices) {
        $service = Get-Service -Name $svc.name -ErrorAction SilentlyContinue
        if ($service -and $service.Status -eq "Running") {
            $findings += @{
                title = "Risky Service Running: $($svc.displayName)"
                description = "$($svc.reason) This service is currently active and accepting connections."
                severity = $svc.severity
                category = "Running Services"
                recommendation = "Stop and disable this service: Stop-Service '$($svc.name)'; Set-Service '$($svc.name)' -StartupType Disabled"
                evidence = "Get-Service '$($svc.name)' => Status: Running, StartType: $($service.StartType)"
                cvssScore = $svc.cvss
            }
        }
    }
} catch {}

$findings | ConvertTo-Json -Depth 3
