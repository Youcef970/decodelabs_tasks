# Remote Access — checks RDP, WinRM, and remote management settings
$findings = @()

try {
    $rdpKey = Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server" -ErrorAction Stop
    $rdpEnabled = $rdpKey.fDenyTSConnections -eq 0

    if ($rdpEnabled) {
        $nlaKey = Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp" -ErrorAction SilentlyContinue
        $nlaEnabled = $nlaKey.UserAuthentication -eq 1

        if (-not $nlaEnabled) {
            $findings += @{
                title = "RDP Enabled Without Network Level Authentication"
                description = "Remote Desktop Protocol is enabled but Network Level Authentication (NLA) is not required. Without NLA, unauthenticated users can reach the login screen and exploit pre-auth vulnerabilities (e.g. BlueKeep CVE-2019-0708)."
                severity = "Critical"
                category = "Remote Access"
                recommendation = "Enable NLA: System Properties > Remote > Allow connections only from computers running Remote Desktop with NLA. Or: Set UserAuthentication=1 in registry."
                evidence = "fDenyTSConnections=0 (RDP enabled), UserAuthentication=0 (NLA disabled)"
                cvssScore = 9.4
            }
        } else {
            $findings += @{
                title = "Remote Desktop Protocol (RDP) Enabled"
                description = "RDP is enabled with NLA. While NLA is a good control, RDP exposure should be limited to VPN-only access and monitored for brute-force attempts."
                severity = "Medium"
                category = "Remote Access"
                recommendation = "Restrict RDP to VPN/trusted IPs via Windows Firewall rules. Enable RDP account lockout and consider changing from default port 3389."
                evidence = "fDenyTSConnections=0, UserAuthentication=1 (NLA enabled)"
                cvssScore = 5.3
            }
        }
    }
} catch {}

try {
    $winrm = Get-Service -Name WinRM -ErrorAction SilentlyContinue
    if ($winrm -and $winrm.Status -eq "Running") {
        $findings += @{
            title = "Windows Remote Management (WinRM) Service Running"
            description = "WinRM (PowerShell Remoting) is active. If not required for management, this exposes the system to remote command execution attempts."
            severity = "Medium"
            category = "Remote Access"
            recommendation = "If not needed, disable WinRM: Stop-Service WinRM; Set-Service WinRM -StartupType Disabled; Disable-PSRemoting -Force"
            evidence = "Get-Service WinRM => Status: Running, StartType: $($winrm.StartType)"
            cvssScore = 5.5
        }
    }
} catch {}

try {
    $sshService = Get-Service -Name sshd -ErrorAction SilentlyContinue
    if ($sshService -and $sshService.Status -eq "Running") {
        $findings += @{
            title = "OpenSSH Server Running"
            description = "OpenSSH Server (sshd) is active on this Windows machine. Ensure it is properly secured with key-based authentication and the latest OpenSSH version."
            severity = "Low"
            category = "Remote Access"
            recommendation = "Disable password authentication for SSH, use key-based auth only. Restrict to specific users/IPs in sshd_config."
            evidence = "Get-Service sshd => Status: Running"
            cvssScore = 3.8
        }
    }
} catch {}

$findings | ConvertTo-Json -Depth 3
