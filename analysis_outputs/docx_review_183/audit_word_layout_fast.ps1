$ErrorActionPreference = "Stop"

$Target = "D:\Semester\Semester7\Skripsi\BAB1-5\183-Raka Bagaskara Putra.docx"
$OutDir = "D:\Semester\Semester7\Skripsi\Projek-Skripsi\analysis_outputs\docx_review_183"
$OutJson = Join-Path $OutDir "word_layout_audit_fast.json"
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

function Is-Relevant-Title([string]$Text, [string]$Style) {
    if ($Text -match "^(Gambar|Tabel)\s+\d+(\.|\.|:|\s)") { return $true }
    if ($Style -match "Heading|Judul") { return $true }
    if ($Text -match "^\d+(\.\d+){1,4}\s+\S") { return $true }
    return $false
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

$titles = New-Object System.Collections.Generic.List[object]
for ($i = 1; $i -le $doc.Paragraphs.Count; $i++) {
    $p = $doc.Paragraphs.Item($i)
    $text = Clean-Text $p.Range.Text
    if ([string]::IsNullOrWhiteSpace($text)) { continue }
    $style = ""
    try { $style = [string]$p.Style.NameLocal } catch {}
    if (Is-Relevant-Title $text $style) {
        $titles.Add([ordered]@{
            index = $i
            start = $p.Range.Start
            end = $p.Range.End
            page = Safe-Info $p.Range $wdActiveEndPageNumber
            top = Safe-Info $p.Range $wdVerticalPositionRelativeToPage
            style = $style
            text = $text
        })
    }
}

$tables = New-Object System.Collections.Generic.List[object]
for ($i = 1; $i -le $doc.Tables.Count; $i++) {
    $t = $doc.Tables.Item($i)
    $preview = Clean-Text $t.Range.Text
    if ($preview.Length -gt 180) { $preview = $preview.Substring(0, 180) }
    $cols = $null
    try { $cols = $t.Columns.Count } catch {}
    $tables.Add([ordered]@{
        kind = "table"
        index = $i
        start = $t.Range.Start
        end = $t.Range.End
        page = Safe-Info $t.Range $wdActiveEndPageNumber
        top = Safe-Info $t.Range $wdVerticalPositionRelativeToPage
        rows = $t.Rows.Count
        cols = $cols
        preview = $preview
    })
}

$objects = New-Object System.Collections.Generic.List[object]
for ($i = 1; $i -le $doc.InlineShapes.Count; $i++) {
    $s = $doc.InlineShapes.Item($i)
    $objects.Add([ordered]@{
        kind = "inlineShape"
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
for ($i = 1; $i -le $doc.Shapes.Count; $i++) {
    $s = $doc.Shapes.Item($i)
    $anchor = $s.Anchor
    $objects.Add([ordered]@{
        kind = "shape"
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
    titles = $titles
    tables = $tables
    objects = $objects
}

$result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutJson -Encoding UTF8
Write-Output $OutJson
