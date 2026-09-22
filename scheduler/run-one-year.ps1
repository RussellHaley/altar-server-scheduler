param (
    [int]$Runs = 52
)

$fileName = "Schedule-$(Get-Date -Format 'yyyyMMdd').txt"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# Create or clear the file with UTF-8 encoding
[System.IO.File]::WriteAllText($fileName, "", $utf8NoBom)

for ($i = 0; $i -lt $Runs; $i++) {
    # Calculate next Sunday
    $today = Get-Date
    $daysUntilSunday = (7 - [int]$today.DayOfWeek) % 7
    if ($daysUntilSunday -eq 0 -and $today.TimeOfDay.TotalSeconds -gt 0) {
        $daysUntilSunday = 7
    }
    $nextSunday = $today.AddDays($daysUntilSunday + ($i * 7)).ToString('yyyy-MM-dd')
    
    # Write to file with UTF-8 encoding
    echo "Week Of: $nextSunday" >> $fileName
    lua .\sjnh-scheduler.lua >> $fileName
	echo "--------------------------------------`r`n" >> $fileName
}

Write-Host "Schedule file created: $fileName"
