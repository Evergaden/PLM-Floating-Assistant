Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[System.Windows.Forms.Application]::EnableVisualStyles()

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$toolPath = Join-Path $scriptDir 'replace-userscript-copy.js'

$form = New-Object System.Windows.Forms.Form
$form.Text = 'PLM 界面文案批量修改'
$form.StartPosition = 'CenterScreen'
$form.Size = New-Object System.Drawing.Size(980, 690)
$form.MinimumSize = New-Object System.Drawing.Size(820, 580)
$form.BackColor = [System.Drawing.Color]::FromArgb(247, 248, 252)
$form.Font = New-Object System.Drawing.Font('Microsoft YaHei UI', 9)

$title = New-Object System.Windows.Forms.Label
$title.Text = '界面文案批量修改'
$title.Font = New-Object System.Drawing.Font('Microsoft YaHei UI', 17, [System.Drawing.FontStyle]::Bold)
$title.ForeColor = [System.Drawing.Color]::FromArgb(79, 53, 164)
$title.Location = New-Object System.Drawing.Point(24, 20)
$title.AutoSize = $true
$form.Controls.Add($title)

$intro = New-Object System.Windows.Forms.Label
$intro.Text = '把页面上当前看到的完整文字粘贴到左边，在右边填写新文字。工具能自动识别源码里的中文和 Unicode 转义。'
$intro.ForeColor = [System.Drawing.Color]::FromArgb(100, 88, 125)
$intro.Location = New-Object System.Drawing.Point(27, 58)
$intro.Size = New-Object System.Drawing.Size(910, 38)
$form.Controls.Add($intro)

$grid = New-Object System.Windows.Forms.DataGridView
$grid.Location = New-Object System.Drawing.Point(26, 98)
$grid.Size = New-Object System.Drawing.Size(912, 300)
$grid.Anchor = 'Top,Left,Right'
$grid.BackgroundColor = [System.Drawing.Color]::White
$grid.BorderStyle = 'FixedSingle'
$grid.AutoSizeRowsMode = 'AllCells'
$grid.RowHeadersVisible = $false
$grid.AllowUserToAddRows = $true
$grid.AllowUserToDeleteRows = $true
$grid.SelectionMode = 'CellSelect'
$grid.MultiSelect = $false
$grid.AutoGenerateColumns = $false

$fromColumn = New-Object System.Windows.Forms.DataGridViewTextBoxColumn
$fromColumn.Name = 'from'
$fromColumn.HeaderText = '当前界面文字（完整粘贴）'
$fromColumn.Width = 390
$fromColumn.AutoSizeMode = 'Fill'
$fromColumn.FillWeight = 48
$fromColumn.DefaultCellStyle.WrapMode = 'True'
$grid.Columns.Add($fromColumn) | Out-Null

$toColumn = New-Object System.Windows.Forms.DataGridViewTextBoxColumn
$toColumn.Name = 'to'
$toColumn.HeaderText = '要改成的新文字'
$toColumn.Width = 390
$toColumn.AutoSizeMode = 'Fill'
$toColumn.FillWeight = 48
$toColumn.DefaultCellStyle.WrapMode = 'True'
$grid.Columns.Add($toColumn) | Out-Null

$countColumn = New-Object System.Windows.Forms.DataGridViewTextBoxColumn
$countColumn.Name = 'expected'
$countColumn.HeaderText = '出现次数'
$countColumn.Width = 76
$countColumn.AutoSizeMode = 'None'
$grid.Columns.Add($countColumn) | Out-Null
$form.Controls.Add($grid)

for ($i = 0; $i -lt 4; $i++) {
  $rowIndex = $grid.Rows.Add()
  $grid.Rows[$rowIndex].Cells['expected'].Value = '1'
}

$previewButton = New-Object System.Windows.Forms.Button
$previewButton.Text = '① 检查匹配'
$previewButton.Location = New-Object System.Drawing.Point(26, 414)
$previewButton.Size = New-Object System.Drawing.Size(150, 38)
$previewButton.FlatStyle = 'Flat'
$previewButton.BackColor = [System.Drawing.Color]::White
$previewButton.ForeColor = [System.Drawing.Color]::FromArgb(96, 54, 216)
$previewButton.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(184, 164, 243)
$form.Controls.Add($previewButton)

$applyButton = New-Object System.Windows.Forms.Button
$applyButton.Text = '② 写入正式脚本'
$applyButton.Location = New-Object System.Drawing.Point(188, 414)
$applyButton.Size = New-Object System.Drawing.Size(165, 38)
$applyButton.FlatStyle = 'Flat'
$applyButton.BackColor = [System.Drawing.Color]::FromArgb(109, 53, 232)
$applyButton.ForeColor = [System.Drawing.Color]::White
$applyButton.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(109, 53, 232)
$form.Controls.Add($applyButton)

$hint = New-Object System.Windows.Forms.Label
$hint.Text = '相同文字只出现一次时保持 1；如果确实要同时修改两处，就填 2。'
$hint.ForeColor = [System.Drawing.Color]::FromArgb(126, 113, 148)
$hint.Location = New-Object System.Drawing.Point(370, 425)
$hint.Size = New-Object System.Drawing.Size(560, 24)
$form.Controls.Add($hint)

$output = New-Object System.Windows.Forms.TextBox
$output.Location = New-Object System.Drawing.Point(26, 466)
$output.Size = New-Object System.Drawing.Size(912, 142)
$output.Anchor = 'Top,Bottom,Left,Right'
$output.Multiline = $true
$output.ReadOnly = $true
$output.ScrollBars = 'Vertical'
$output.BackColor = [System.Drawing.Color]::White
$output.ForeColor = [System.Drawing.Color]::FromArgb(70, 61, 88)
$output.Font = New-Object System.Drawing.Font('Microsoft YaHei UI', 9)
$output.Text = '先填写上方表格，然后点击“检查匹配”。检查通过后再写入正式脚本。'
$form.Controls.Add($output)

$footer = New-Object System.Windows.Forms.Label
$footer.Text = '写入时会自动升级 userscript 版本并检查语法；不会修改压缩版文件，也不会自动提交 Git。'
$footer.ForeColor = [System.Drawing.Color]::FromArgb(139, 126, 158)
$footer.Location = New-Object System.Drawing.Point(27, 619)
$footer.Size = New-Object System.Drawing.Size(900, 24)
$footer.Anchor = 'Bottom,Left,Right'
$form.Controls.Add($footer)

function Get-ReplacementRows {
  $null = $grid.EndEdit()
  $items = New-Object System.Collections.Generic.List[object]
  foreach ($row in $grid.Rows) {
    if ($row.IsNewRow) { continue }
    $from = [string]$row.Cells['from'].Value
    $to = [string]$row.Cells['to'].Value
    $countText = [string]$row.Cells['expected'].Value
    if ([string]::IsNullOrWhiteSpace($from) -and [string]::IsNullOrWhiteSpace($to)) { continue }
    if ([string]::IsNullOrWhiteSpace($from) -or [string]::IsNullOrWhiteSpace($to)) {
      throw '每一行都必须同时填写“当前界面文字”和“新文字”。'
    }
    $expected = 1
    if (-not [string]::IsNullOrWhiteSpace($countText) -and -not [int]::TryParse($countText, [ref]$expected)) {
      throw '出现次数必须填写整数。'
    }
    if ($expected -lt 1) { throw '出现次数必须大于 0。' }
    $null = $items.Add([pscustomobject]@{ from = $from; to = $to; expected = $expected })
  }
  if ($items.Count -eq 0) { throw '请至少填写一条文案修改。' }
  return ,$items
}

function Invoke-CopyTool([bool]$WriteChanges) {
  try {
    $items = Get-ReplacementRows
    $tempPath = Join-Path ([System.IO.Path]::GetTempPath()) ('plm-ui-copy-' + [guid]::NewGuid().ToString('N') + '.json')
    $jsonInput = $items.ToArray()
    $json = ConvertTo-Json -InputObject $jsonInput -Depth 4
    [System.IO.File]::WriteAllText($tempPath, $json, (New-Object System.Text.UTF8Encoding($false)))

    $arguments = @($toolPath, '--config', $tempPath)
    if ($WriteChanges) { $arguments += '--write' }
    $quotedArguments = ($arguments | ForEach-Object { '"' + ($_ -replace '"', '\"') + '"' }) -join ' '

    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = 'node.exe'
    $processInfo.Arguments = $quotedArguments
    $processInfo.WorkingDirectory = $rootDir
    $processInfo.UseShellExecute = $false
    $processInfo.CreateNoWindow = $true
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    $processInfo.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $processInfo.StandardErrorEncoding = [System.Text.Encoding]::UTF8
    $process = [System.Diagnostics.Process]::Start($processInfo)
    $stdout = $process.StandardOutput.ReadToEnd()
    $stderr = $process.StandardError.ReadToEnd()
    $process.WaitForExit()
    Remove-Item -LiteralPath $tempPath -Force -ErrorAction SilentlyContinue

    $message = ($stdout + $stderr).Trim()
    if (-not $message) { $message = '工具没有返回结果。' }
    $output.Text = $message
    if ($process.ExitCode -ne 0) {
      $output.ForeColor = [System.Drawing.Color]::FromArgb(180, 55, 75)
      [System.Windows.Forms.MessageBox]::Show($message, '没有写入，请检查', 'OK', 'Warning') | Out-Null
      return
    }

    $output.ForeColor = [System.Drawing.Color]::FromArgb(46, 126, 79)
    if ($WriteChanges) {
      [System.Windows.Forms.MessageBox]::Show('文案已写入正式 userscript，版本号和语法检查也已完成。', '修改成功', 'OK', 'Information') | Out-Null
    }
  } catch {
    $output.ForeColor = [System.Drawing.Color]::FromArgb(180, 55, 75)
    $output.Text = $_.Exception.Message
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, '请检查填写内容', 'OK', 'Warning') | Out-Null
  }
}

$previewButton.Add_Click({ Invoke-CopyTool $false })
$applyButton.Add_Click({
  $answer = [System.Windows.Forms.MessageBox]::Show(
    '确定把表格中的文案写入 outputs/plm-material-summary.user.js 吗？',
    '确认写入正式脚本',
    'YesNo',
    'Question'
  )
  if ($answer -eq 'Yes') { Invoke-CopyTool $true }
})

if ($env:PFH_UI_COPY_EDITOR_VALIDATE_ONLY -eq '1') {
  Write-Output 'UI copy editor initialized successfully.'
  exit 0
}

[void]$form.ShowDialog()
