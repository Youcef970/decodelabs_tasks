# Firewall — checks Windows Firewall status for all profiles
$findings = @()

try {
    $profiles = Get-NetFirewallProfile -ErrorAction Stop

    foreach ($profile in $profiles) {
        if (-not $profile.Enabled) {
            $sev = if ($profile.Name -eq "Public") { "Critical" } else { "High" }
            $cvss = if ($profile.Name -eq "Public") { 9.1 } else { 7.5 }
            $findings += @{
                title = "Windows Firewall Disabled on $($profile.Name) Profile"
                description = "The Windows Defender Firewall is disabled for the $($profile.Name) network profile. Inbound connections are unrestricted, exposing the system to network-based attacks."
                severity = $sev
                category = "Firewall"
                recommendation = "Enable the firewall for all profiles: Set-NetFirewallProfile -Profile $($profile.Name) -Enabled True"
                evidence = "Get-NetFirewallProfile -Name '$($profile.Name)' => Enabled: False"
                cvssScore = $cvss
            }
        }

        if ($profile.DefaultInboundAction -eq "Allow") {
            $findings += @{
                title = "Firewall Default Inbound Action Set to Allow on $($profile.Name)"
                description = "The $($profile.Name) firewall profile allows all inbound traffic by default. Only explicitly blocked traffic is denied."
                severity = "High"
                category = "Firewall"
                recommendation = "Change the default inbound action to Block: Set-NetFirewallProfile -Profile $($profile.Name) -DefaultInboundAction Block"
                evidence = "Get-NetFirewallProfile '$($profile.Name)' => DefaultInboundAction: Allow"
                cvssScore = 7.8
            }
        }
    }
} catch {
    $findings += @{
        title = "Firewall Status Check Failed"
        description = "Could not retrieve firewall profile status. Run as Administrator for full results."
        severity = "Medium"
        category = "Firewall"
        recommendation = "Run this script with Administrator privileges."
        evidence = "Get-NetFirewallProfile => Error: $($_.Exception.Message)"
        cvssScore = 4.0
    }
}

$findings | ConvertTo-Json -Depth 3
