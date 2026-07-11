$ErrorActionPreference = "Stop"

$Target = "D:\Semester\Semester7\Skripsi\BAB1-5\183-Raka Bagaskara Putra.docx"
$OutDir = "D:\Semester\Semester7\Skripsi\Projek-Skripsi\analysis_outputs\docx_review_183"
$OutJson = Join-Path $OutDir "word_layout_audit_raw.json"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$wdActiveEndPageNumber = 3
$wdVerticalPositionRelativeToPage = 6
$wdStatisticPages = 2

function Clean-Text([string]$Text) {
    if ($null -eq $Text) { return "" }
    return (($Text -replace "[`r`n`t]+", " ") -replace "\s+", " ").Trim()
}

function Safe-Info($Range, [int]$Kind) {
    try {
        $value = $Range.Information($Kind)
        if ($value -eq -1) { return $null }
        return $value
    } catch {
        return $null
    }
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

$paragraphs = New-Object System.Collections.Generic.List[object]
for ($i = 1; $i -le $doc.Paragraphs.Count; $i++) {
    $p = $doc.Paragraphs.Item($i)
    $text = Clean-Text $p.Range.Text
    $style = ""
    try { $style = [string]$p.Style.NameLocal } catch {}
    $paragraphs.Add([ordered]@{
        index = $i
        start = $p.Range.Start
        end = $p.Range.End
        page = Safe-Info $p.Range $wdActiveEndPageNumber
        top = Safe-Info $p.Range $wdVerticalPositionRelativeToPage
        style = $style
        text = $text
    })
}

$tables = New-Object System.Collections.Generic.List[object]
for ($i = 1; $i -le $doc.Tables.Count; $i++) {
    $t = $doc.Tables.Item($i)
    $preview = Clean-Text $t.Range.Text
    if ($preview.Length -gt 250) { $preview = $preview.Substring(0, 250) }
    $tables.Add([ordered]@{
        index = $i
        start = $t.Range.Start
        end = $t.Range.End
        page = Safe-Info $t.Range $wdActiveEndPageNumber
        top = Safe-Info $t.Range $wdVerticalPositionRelativeToPage
        rows = $t.Rows.Count
        cols = $t.Columns.Count
        preview = $preview
    })
}

$inlineShapes = New-Object System.Collections.Generic.List[object]
for ($i = 1; $i -le $doc.InlineShapes.Count; $i++) {
    $s = $doc.InlineShapes.Item($i)
    $inlineShapes.Add([ordered]@{
        index = $i
        start = $s.Range.Start
        end = $s.Range.End
        page = Safe-Info $s.Range $wdActiveEndPageNumber
        top = Safe-Info $s.Range $wdVerticalPositionRelativeToPage
        width = $s.Width
        height = $s.Height
        alt = Clean-Text $s.AlternativeText
    })
}

$shapes = New-Object System.Collections.Generic.List[object]
for ($i = 1; $i -le $doc.Shapes.Count; $i++) {
    $s = $doc.Shapes.Item($i)
    $anchor = $s.Anchor
    $shapes.Add([ordered]@{
        index = $i
        start = $anchor.Start
        end = $anchor.End
        page = Safe-Info $anchor $wdActiveEndPageNumber
        top = Safe-Info $anchor $wdVerticalPositionRelativeToPage
        width = $s.Width
        height = $s.Height
        alt = Clean-Text $s.AlternativeText
    })
}

$result = [ordered]@{
    source = $Target
    pageCount = $doc.ComputeStatistics($wdStatisticPages)
    paragraphCount = $doc.Paragraphs.Count
    tableCount = $doc.Tables.Count
    inlineShapeCount = $doc.InlineShapes.Count
    shapeCount = $doc.Shapes.Count
    paragraphs = $paragraphs
    tables = $tables
    inlineShapes = $inlineShapes
    shapes = $shapes
}

$result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutJson -Encoding UTF8
Write-Output $OutJson
