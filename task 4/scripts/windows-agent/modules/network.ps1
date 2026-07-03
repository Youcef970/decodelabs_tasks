# Network Security — checks open ports, shares, DNS, and network config
$findings = @()

try {
    $riskyPorts = @(
        @{ port = 23; name = "Telnet"; severity = "Critical"; cvss = 9.0 },
        @{ port = 21; name = "FTP"; severity = "High"; cvss = 7.5 },
        @{ port = 3389; name = "RDP"; severity = "Medium"; cvss = 5.3 },
        @{ port = 5900; name = "VNC"; severity = "High"; cvss = 8.0 },
        @{ port = 445; name = "SMB"; severity = "High"; cvss = 8.1 },
        @{ port = 139; name = "NetBIOS"; severity = "Medium"; cvss = 5.0 },
        @{ port = 5985; name = "WinRM HTTP"; severity = "Medium"; cvss = 5.5 },
        @{ port = 5986; name = "WinRM HTTPS"; severity = "Low"; cvss = 3.0 }
    )

    $listeningPorts = netstat -an | Select-String "LISTENING" | ForEach-Object {
        ($_ -split '\s+')[3] -replace '.*:(\d+)$', '$1'
    }

    foreach ($rp in $riskyPorts) {
        if ($listeningPorts -contains [string]$rp.port) {
            $findings += @{
                title = "Port $($rp.port) ($($rp.name)) Listening on Network"
                description = "Port $($rp.port) ($($rp.name)) is open and listening. This service may expose the system to unauthorized access or exploitation."
                severity = $rp.severity
                category = "Network Security"
                recommendation = "If $($rp.name) is not required, disable the associated service and block port $($rp.port) in Windows Firewall."
                evidence = "netstat -an | LISTENING => 0.0.0.0:$($rp.port)"
                cvssScore = $rp.cvss
            }
        }
    }
} catch {}

try {
    $shares = Get-SmbShare -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -notmatch '^(ADMIN\$|C\$|IPC\$|print\$)$'
    }
    foreach ($share in $shares) {
        $findings += @{
            title = "Non-Default Network Share Detected: $($share.Name)"
            description = "A custom SMB share '$($share.Name)' at path '$($share.Path)' is accessible on the network. Misconfigured shares can expose sensitive data."
            severity = "Medium"
            category = "Network Security"
            recommendation = "Review share permissions for '$($share.Name)'. Remove if not needed or restrict access: Remove-SmbShare -Name '$($share.Name)'"
            evidence = "Get-SmbShare: Name=$($share.Name), Path=$($share.Path), Description=$($share.Description)"
            cvssScore = 4.8
        }
    }
} catch {}

try {
    $adapters = Get-DnsClientServerAddress -ErrorAction SilentlyContinue | Where-Object { $_.AddressFamily -eq 2 -and $_.ServerAddresses.Count -gt 0 }
    $publicDns = @("8.8.8.8","8.8.4.4","1.1.1.1","1.0.0.1","208.67.222.222","208.67.220.220","9.9.9.9")
    foreach ($adapter in $adapters) {
        foreach ($dns in $adapter.ServerAddresses) {
            if ($publicDns -contains $dns) {
                $findings += @{
                    title = "DNS Configured to Non-Corporate Server ($dns)"
                    description = "Network adapter '$($adapter.InterfaceAlias)' uses public DNS server $dns instead of a corporate DNS. This may bypass DNS-based security filtering and content policies."
                    severity = "Medium"
                    category = "Network Security"
                    recommendation = "Configure DNS to point to corporate/internal DNS servers that support filtering and logging."
                    evidence = "Get-DnsClientServerAddress: $($adapter.InterfaceAlias) => $dns"
                    cvssScore = 4.8
                }
                break
            }
        }
    }
} catch {}

$findings | ConvertTo-Json -Depth 3
