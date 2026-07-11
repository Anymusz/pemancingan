$ErrorActionPreference = "Stop"

$Target = "D:\Semester\Semester7\Skripsi\BAB1-5\183-Raka Bagaskara Putra.docx"
$OutDir = "D:\Semester\Semester7\Skripsi\Projek-Skripsi\analysis_outputs\docx_review_183"
$OutJson = Join-Path $OutDir "word_pages_audit.json"
$OutText = Join-Path $OutDir "word_pages_text.txt"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$wdStatisticPages = 2
$wdGoToPage = 1
$wdGoToAbsolute = 1

function Clean-Text([string]$Text) {
    if ($null -eq $Text) { return "" }
    return (($Text -replace "[`r`t]+", " ") -replace "\u0007", " " -replace "\s+", " ").Trim()
}

function Page-Range($Doc, [int]$Page, [int]$PageCount) {
    $start = $Doc.GoTo($wdGoToPage, $wdGoToAbsolute, $Page).Start
    if ($Page -lt $PageCount) {
        $end = $Doc.GoTo($wdGoToPage, $wdGoToAbsolute, $Page + 1).Start - 1
    } else {
        $end = $Doc.Content.End
    }
    return $Doc.Range($start, $end)
}

function Lines-FromText([string]$Text) {
    $raw = $Text -split "[`r`n]+"
    $lines = @()
    foreach ($line in $raw) {
        $clean = Clean-Text $line
        if ($clean.Length -gt 0) { $lines += $clean }
    }
    return $lines
}

$word = [Runtime.InteropServices.Marshal]::GetActiveObject("Word.Application")
$doc = $null
for ($i = 1; $i -le $word.Documents.Count; $i++) {
    $candidate = $word.Documents.Item($i)
    if ($candidate.FullName -ieq $Target) {
        $doc = $candidate
        break
    }
}
if ($null -eq $doc) {
    throw "Target document is not open in Word: $Target"
}

$pageCount = $doc.ComputeStatistics($wdStatisticPages)
$pages = New-Object System.Collections.Generic.List[object]
$textOut = New-Object System.Collections.Generic.List[string]

for ($page = 1; $page -le $pageCount; $page++) {
    $range = Page-Range $doc $page $pageCount
    $lines = Lines-FromText $range.Text
    $first = @($lines | Select-Object -First 10)
    $last = @($lines | Select-Object -Last 10)
    $tableCount = 0
    $inlineShapeCount = 0
    $shapeCount = 0
    try { $tableCount = $range.Tables.Count } catch {}
    try { $inlineShapeCount = $range.InlineShapes.Count } catch {}
    try { $shapeCount = $range.ShapeRange.Count } catch {}

    $pages.Add([ordered]@{
        page = $page
        start = $range.Start
        end = $range.End
        lineCount = $lines.Count
        tableCount = $tableCount
        inlineShapeCount = $inlineShapeCount
        shapeCount = $shapeCount
        firstLines = $first
        lastLines = $last
    })
    $textOut.Add("--- PAGE $page ---")
    foreach ($line in $lines) { $textOut.Add($line) }
}

$result = [ordered]@{
    source = $Target
    pageCount = $pageCount
    paragraphCount = $doc.Paragraphs.Count
    tableCount = $doc.Tables.Count
    inlineShapeCount = $doc.InlineShapes.Count
    shapeCount = $doc.Shapes.Count
    pages = $pages
}

$result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutJson -Encoding UTF8
$textOut | Set-Content -LiteralPath $OutText -Encoding UTF8
Write-Output $OutJson
