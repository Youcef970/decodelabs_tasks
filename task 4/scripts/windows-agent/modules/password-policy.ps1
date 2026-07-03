# Password Policy — checks local password policy settings
$findings = @()

try {
    $policy = net accounts 2>$null
    $minLength = ($policy | Select-String "Minimum password length").ToString() -replace "[^0-9]"
    $maxAge    = ($policy | Select-String "Maximum password age").ToString() -replace "[^0-9]"
    $lockout   = ($policy | Select-String "Lockout threshold").ToString() -replace "[^0-9]"
    $history   = ($policy | Select-String "Length of password history").ToString() -replace "[^0-9]"

    if ([int]$minLength -lt 12) {
        $findings += @{
            title = "Weak Password Policy — Minimum Length Below 12"
            description = "The minimum password length is set to $minLength characters. Short passwords are vulnerable to brute-force and dictionary attacks."
            severity = "High"
            category = "Password Policy"
            recommendation = "Set minimum password length to 14+ characters via: Local Security Policy > Account Policies > Password Policy > Minimum password length."
            evidence = "net accounts => Minimum password length: $minLength"
            cvssScore = 6.8
        }
    }

    if ($lockout -eq "0" -or [int]$lockout -eq 0) {
        $findings += @{
            title = "Account Lockout Not Configured"
            description = "No account lockout threshold is set. Attackers can attempt unlimited password guesses without being locked out."
            severity = "High"
            category = "Password Policy"
            recommendation = "Set account lockout to 5 attempts via: Local Security Policy > Account Policies > Account Lockout Policy > Account lockout threshold: 5."
            evidence = "net accounts => Lockout threshold: Never"
            cvssScore = 7.0
        }
    }

    if ([int]$maxAge -gt 90 -or $maxAge -eq "Unlimited") {
        $findings += @{
            title = "Password Expiration Not Configured or Too Long"
            description = "Password maximum age is $maxAge days. Long-lived passwords increase the risk window if credentials are compromised."
            severity = "Medium"
            category = "Password Policy"
            recommendation = "Set maximum password age to 90 days: Local Security Policy > Account Policies > Password Policy > Maximum password age: 90."
            evidence = "net accounts => Maximum password age (days): $maxAge"
            cvssScore = 4.6
        }
    }

    if ([int]$history -lt 5) {
        $findings += @{
            title = "Password History Too Short"
            description = "Password history remembers only $history passwords, allowing users to quickly cycle back to old passwords."
            severity = "Low"
            category = "Password Policy"
            recommendation = "Set password history to remember at least 10 previous passwords."
            evidence = "net accounts => Length of password history maintained: $history"
            cvssScore = 3.1
        }
    }
} catch {}

$findings | ConvertTo-Json -Depth 3
