## GuidSwap.ps1
##
## Reads a file, finds any GUIDs in the file, and swaps them for a NewGUID
##

$filename = "C:\Users\joshu\Documents\GitHub\JPLogistics_C152\Project Files\src\JPLogistics_C152\SimObjects\Airplanes\Asobo_C152\model\Cessna152_interior.XML"
$outputFilename = "C:\Users\joshu\Documents\GitHub\JPLogistics_C152\Project Files\src\JPLogistics_C152\SimObjects\Airplanes\Asobo_C152\model\Cessna152_interior.XML"

$text = [string]::join([environment]::newline, (get-content -path $filename))

$sbNew = new-object system.text.stringBuilder

$pattern = "[a-fA-F0-9]{8}-([a-fA-F0-9]{4}-){3}[a-fA-F0-9]{12}"

$lastStart = 0
$null = ([regex]::matches($text, $pattern) | %{
    $sbNew.Append($text.Substring($lastStart, $_.Index - $lastStart))
    $guid = [system.guid]::newguid()
    $sbNew.Append($guid)
    $lastStart = $_.Index + $_.Length
})
$null = $sbNew.Append($text.Substring($lastStart))

$sbNew.ToString() | out-file -encoding ASCII $outputFilename

Write-Output "Interior Done"

$filename = "C:\Users\joshu\Documents\GitHub\JPLogistics_C152\Project Files\src\JPLogistics_C152\SimObjects\Airplanes\Asobo_C152\model\C152.XML"
$outputFilename = "C:\Users\joshu\Documents\GitHub\JPLogistics_C152\Project Files\src\JPLogistics_C152\SimObjects\Airplanes\Asobo_C152\model\C152.XML"

$text = [string]::join([environment]::newline, (get-content -path $filename))

$sbNew = new-object system.text.stringBuilder

$pattern = "[a-fA-F0-9]{8}-([a-fA-F0-9]{4}-){3}[a-fA-F0-9]{12}"

$lastStart = 0
$null = ([regex]::matches($text, $pattern) | %{
    $sbNew.Append($text.Substring($lastStart, $_.Index - $lastStart))
    $guid = [system.guid]::newguid()
    $sbNew.Append($guid)
    $lastStart = $_.Index + $_.Length
})
$null = $sbNew.Append($text.Substring($lastStart))

$sbNew.ToString() | out-file -encoding ASCII $outputFilename

Write-Output "Done"