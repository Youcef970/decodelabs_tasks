# Administrator Privileges — checks UAC settings and local admin group membership
$findings = @()

try {
    $uacKey = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" -ErrorAction Stop
    $uacEnabled = $uacKey.EnableLUA
    $promptBehaviorAdmin = $uacKey.ConsentPromptBehaviorAdmin
    $promptBehaviorUser = $uacKey.ConsentPromptBehaviorUser

    if ($uacEnabled -ne 1) {
        $findings += @{
            title = "User Account Control (UAC) Disabled"
            description = "UAC is completely disabled. All processes run with full administrator privileges without prompting, making privilege escalation trivial for any malware."
            severity = "Critical"
            category = "Administrator Privileges"
            recommendation = "Enable UAC: Set-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System' -Name EnableLUA -Value 1. Restart required."
            evidence = "HKLM:\...\Policies\System => EnableLUA: $uacEnabled"
            cvssScore = 9.3
        }
    } elseif ($promptBehaviorAdmin -eq 0) {
        $findings += @{
            title = "UAC Set to Never Notify (Administrators)"
            description = "UAC is configured to never prompt administrators for elevation. This is the lowest UAC security level, effectively bypassing privilege change notifications."
            severity = "High"
            category = "Administrator Privileges"
            recommendation = "Set UAC to 'Notify me only when apps try to make changes': Set ConsentPromptBehaviorAdmin to 5 in Local Security Policy."
            evidence = "HKLM:\...\Policies\System => ConsentPromptBehaviorAdmin: 0 (Never notify)"
            cvssScore = 7.2
        }
    }
} catch {}

try {
    $localAdmins = Get-LocalGroupMember -Group "Administrators" -ErrorAction SilentlyContinue
    $nonSystemAdmins = $localAdmins | Where-Object {
        $_.Name -notmatch "BUILTIN\\Administrator|BUILTIN\\Administrators|NT AUTHORITY" -and
        $_.ObjectClass -eq "User"
    }

    if ($nonSystemAdmins.Count -gt 2) {
        $names = ($nonSystemAdmins | Select-Object -ExpandProperty Name) -join ", "
        $findings += @{
            title = "Multiple Local Administrator Accounts Detected ($($nonSystemAdmins.Count))"
            description = "There are $($nonSystemAdmins.Count) non-system user accounts in the local Administrators group: $names. Excessive admin accounts increase the attack surface for privilege abuse."
            severity = "High"
            category = "Administrator Privileges"
            recommendation = "Remove unnecessary accounts from the Administrators group. Users should run as standard users and only elevate when needed."
            evidence = "Get-LocalGroupMember 'Administrators' => $names"
            cvssScore = 6.5
        }
    }
} catch {}

$findings | ConvertTo-Json -Depth 3
