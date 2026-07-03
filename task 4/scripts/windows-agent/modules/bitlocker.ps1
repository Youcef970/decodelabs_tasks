# BitLocker — checks drive encryption status
$findings = @()

try {
    $volumes = Get-BitLockerVolume -ErrorAction Stop

    foreach ($vol in $volumes) {
        if ($vol.VolumeStatus -ne "FullyEncrypted") {
            $sev = if ($vol.MountPoint -eq "C:") { "High" } else { "Medium" }
            $cvss = if ($vol.MountPoint -eq "C:") { 7.5 } else { 5.5 }
            $findings += @{
                title = "BitLocker Not Enabled on $($vol.MountPoint)"
                description = "Drive $($vol.MountPoint) is not fully encrypted (Status: $($vol.VolumeStatus)). If the device is lost or stolen, all data on this drive is accessible without authentication."
                severity = $sev
                category = "BitLocker"
                recommendation = "Enable BitLocker: Control Panel > System and Security > BitLocker Drive Encryption > Turn on BitLocker for $($vol.MountPoint)."
                evidence = "Get-BitLockerVolume '$($vol.MountPoint)' => VolumeStatus: $($vol.VolumeStatus), ProtectionStatus: $($vol.ProtectionStatus)"
                cvssScore = $cvss
            }
        }
    }

    if ($volumes.Count -eq 0) {
        $findings += @{
            title = "No BitLocker Volumes Detected"
            description = "No BitLocker-managed volumes found. System drives may be completely unencrypted."
            severity = "High"
            category = "BitLocker"
            recommendation = "Enable BitLocker encryption on all drives, starting with the system drive (C:)."
            evidence = "Get-BitLockerVolume => No volumes returned"
            cvssScore = 7.5
        }
    }
} catch {
    $findings += @{
        title = "BitLocker Not Available or Requires Admin"
        description = "BitLocker status could not be queried. This may indicate the feature is unavailable (Home edition) or the script requires Administrator privileges."
        severity = "Medium"
        category = "BitLocker"
        recommendation = "Run as Administrator. BitLocker is available on Windows 10/11 Pro, Enterprise, and Education editions only."
        evidence = "Get-BitLockerVolume => Error: $($_.Exception.Message)"
        cvssScore = 5.0
    }
}

$findings | ConvertTo-Json -Depth 3
