# System Information — collects real system info for the dashboard
$cs = Get-CimInstance Win32_ComputerSystem -ErrorAction SilentlyContinue
$os = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue
$cpu = Get-CimInstance Win32_Processor -ErrorAction SilentlyContinue | Select-Object -First 1
$bios = Get-CimInstance Win32_BIOS -ErrorAction SilentlyContinue

$uptimeSecs = if ($os) { (New-TimeSpan -Start $os.LastBootUpTime -End (Get-Date)).TotalSeconds } else { 0 }
$days  = [math]::Floor($uptimeSecs / 86400)
$hours = [math]::Floor(($uptimeSecs % 86400) / 3600)
$mins  = [math]::Floor(($uptimeSecs % 3600) / 60)

$info = @{
    hostname     = $env:COMPUTERNAME
    os           = if ($os) { "$($os.Caption) (Build $($os.BuildNumber))" } else { "Windows (unknown)" }
    architecture = if ($os) { $os.OSArchitecture } else { $env:PROCESSOR_ARCHITECTURE }
    cpu          = if ($cpu) { "$($cpu.Name.Trim()) ($($cpu.NumberOfCores) cores, $($cpu.NumberOfLogicalProcessors) logical)" } else { "Unknown" }
    ram          = if ($cs) { "$([math]::Round($cs.TotalPhysicalMemory / 1GB, 1)) GB" } else { "Unknown" }
    uptime       = "${days}d ${hours}h ${mins}m"
    domain       = if ($cs) { $cs.Domain } else { "WORKGROUP" }
    manufacturer = if ($cs) { $cs.Manufacturer } else { "Unknown" }
    model        = if ($cs) { $cs.Model } else { "Unknown" }
    biosVersion  = if ($bios) { $bios.SMBIOSBIOSVersion } else { "Unknown" }
}

$info | ConvertTo-Json -Depth 2
