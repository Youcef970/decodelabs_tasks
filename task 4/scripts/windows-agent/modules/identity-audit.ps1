# Identity Audit — checks local user accounts and guest account status
$findings = @()

try {
    $guestAccount = Get-LocalUser -Name "Guest" -ErrorAction SilentlyContinue
    if ($guestAccount -and $guestAccount.Enabled) {
        $findings += @{
            title = "Guest Account Is Enabled"
            description = "The built-in Guest account is enabled. This allows unauthenticated or low-privilege access to the system and shared resources without a password."
            severity = "High"
            category = "Identity Audit"
            recommendation = "Disable the Guest account via: Computer Management > Local Users and Groups > Users > Guest > right-click > Properties > check 'Account is disabled'."
            evidence = "Get-LocalUser 'Guest' | Select Enabled => Enabled: True"
            cvssScore = 7.2
        }
    }
} catch {}

try {
    $adminAccount = Get-LocalUser -Name "Administrator" -ErrorAction SilentlyContinue
    if ($adminAccount -and $adminAccount.Enabled) {
        $findings += @{
            title = "Built-in Administrator Account Is Enabled"
            description = "The built-in Administrator account is enabled. This well-known account name is a common target for brute-force attacks."
            severity = "Medium"
            category = "Identity Audit"
            recommendation = "Disable the built-in Administrator account and use a named administrator account instead. Run: Disable-LocalUser -Name 'Administrator'"
            evidence = "Get-LocalUser 'Administrator' | Select Enabled => Enabled: True"
            cvssScore = 5.5
        }
    }
} catch {}

try {
    $allUsers = Get-LocalUser | Where-Object { $_.Enabled -eq $true }
    $noPasswordRequired = $allUsers | Where-Object { $_.PasswordRequired -eq $false -and $_.Name -ne "Guest" }
    foreach ($u in $noPasswordRequired) {
        $findings += @{
            title = "User Account Without Password Requirement: $($u.Name)"
            description = "The account '$($u.Name)' does not require a password, allowing login without authentication."
            severity = "Critical"
            category = "Identity Audit"
            recommendation = "Set a strong password for '$($u.Name)' and enforce password requirements via Local Security Policy."
            evidence = "Get-LocalUser '$($u.Name)' => PasswordRequired: False"
            cvssScore = 9.0
        }
    }
} catch {}

$findings | ConvertTo-Json -Depth 3
