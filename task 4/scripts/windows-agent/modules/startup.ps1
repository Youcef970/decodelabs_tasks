# Startup Programs — checks for suspicious startup entries
$findings = @()

$suspiciousKeywords = @("temp", "tmp", "appdata\local\temp", "downloads", "public", "update_helper", "svchost32", "winlogon32", "csrss32")

try {
    $regPaths = @(
        @{ path = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"; scope = "HKLM" },
        @{ path = "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"; scope = "HKCU" },
        @{ path = "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run"; scope = "HKLM (32-bit)" }
    )

    $suspiciousEntries = @()
    foreach ($reg in $regPaths) {
        try {
            $entries = Get-ItemProperty $reg.path -ErrorAction SilentlyContinue
            if ($entries) {
                $entries.PSObject.Properties | Where-Object { $_.Name -notmatch "^PS" } | ForEach-Object {
                    $val = $_.Value.ToLower()
                    foreach ($kw in $suspiciousKeywords) {
                        if ($val -like "*$kw*") {
                            $suspiciousEntries += @{ name = $_.Name; value = $_.Value; scope = $reg.scope }
                            break
                        }
                    }
                }
            }
        } catch {}
    }

    foreach ($entry in $suspiciousEntries) {
        $findings += @{
            title = "Suspicious Startup Entry Detected: $($entry.name)"
            description = "A startup registry entry '$($entry.name)' points to a suspicious path: '$($entry.value)'. Programs running from Temp or Downloads directories at startup are a common indicator of malware persistence."
            severity = "High"
            category = "Startup Programs"
            recommendation = "Investigate and remove suspicious startup entries. Use Autoruns (Sysinternals) for full visibility. Remove via regedit or 'msconfig > Startup'."
            evidence = "Registry $($entry.scope)\Run: $($entry.name) = $($entry.value)"
            cvssScore = 7.5
        }
    }

    $taskPaths = @("\", "\Microsoft\Windows\", "\Microsoft\Windows\Application Experience\")
    $suspiciousTasks = Get-ScheduledTask -ErrorAction SilentlyContinue | Where-Object {
        $action = $_.Actions | Select-Object -First 1
        $action -and $action.Execute -and ($action.Execute -like "*temp*" -or $action.Execute -like "*\Users\Public\*")
    }

    foreach ($task in $suspiciousTasks) {
        $findings += @{
            title = "Suspicious Scheduled Task: $($task.TaskName)"
            description = "Scheduled task '$($task.TaskName)' executes from a suspicious location. Malware often uses scheduled tasks for persistence."
            severity = "High"
            category = "Startup Programs"
            recommendation = "Review and remove suspicious scheduled tasks via Task Scheduler or: Unregister-ScheduledTask -TaskName '$($task.TaskName)'"
            evidence = "Get-ScheduledTask: '$($task.TaskName)' => Execute: $($task.Actions[0].Execute)"
            cvssScore = 7.8
        }
    }
} catch {}

$findings | ConvertTo-Json -Depth 3
