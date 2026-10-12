Add-Type -AssemblyName System.Windows.Forms
$form = New-Object System.Windows.Forms.Form
$form.Text = "MOMUS TEST"
$form.Width = 350
$form.Height = 180
$form.TopMost = $true
$form.StartPosition = "CenterScreen"

$lbl = New-Object System.Windows.Forms.Label
$lbl.Text = "Ekranda bu pencereyi goruyor musun?"
$lbl.Dock = "Fill"
$lbl.TextAlign = "MiddleCenter"
$form.Controls.Add($lbl)

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 4000
$timer.add_Tick({
    $form.Close()
})
$timer.Start()

[System.Windows.Forms.Application]::Run($form)
