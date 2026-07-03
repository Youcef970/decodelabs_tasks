# USB Devices — checks USB storage policy and connected devices
$findings = @()

try {
    $usbStorPolicy = Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Services\USBSTOR" -ErrorAction SilentlyContinue
    if ($usbStorPolicy -and $usbStorPolicy.Start -ne 4) {
        $findings += @{
            title = "USB Storage Devices Not Restricted"
            description = "USB mass storage devices (flash drives, external hard drives) are not blocked by policy. Uncontrolled USB access enables data exfiltration and BadUSB/malware introduction attacks."
            severity = "Medium"
            category = "USB Devices"
            recommendation = "Restrict USB storage via Group Policy: Computer Configuration > Administrative Templates > System > Removable Storage Access > Deny all access. Or set registry: HKLM\SYSTEM\CurrentControlSet\Services\USBSTOR\Start = 4"
            evidence = "HKLM\SYSTEM\CurrentControlSet\Services\USBSTOR\Start = $($usbStorPolicy.Start) (4 = disabled)"
            cvssScore = 5.2
        }
    }
} catch {}

try {
    $usbDevices = Get-PnpDevice -Class USB -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq "OK" }
    $storageDevices = $usbDevices | Where-Object { $_.FriendlyName -match "storage|disk|drive|flash|thumb" -and $_.FriendlyName -notmatch "hub|root|controller" }

    if ($storageDevices.Count -gt 0) {
        foreach ($dev in $storageDevices) {
            $findings += @{
                title = "USB Storage Device Connected: $($dev.FriendlyName)"
                description = "A USB storage device '$($dev.FriendlyName)' is currently connected. Connected removable media can be used to exfiltrate data or introduce malware."
                severity = "Low"
                category = "USB Devices"
                recommendation = "Remove unused USB devices and implement a USB device whitelist policy."
                evidence = "Get-PnpDevice: $($dev.FriendlyName) (InstanceId: $($dev.InstanceId))"
                cvssScore = 3.5
            }
        }
    }
} catch {}

$findings | ConvertTo-Json -Depth 3
