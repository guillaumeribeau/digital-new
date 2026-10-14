$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()
$projectRoot = Split-Path -Parent $PSScriptRoot
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source

$form = New-Object System.Windows.Forms.Form
$form.Text = 'NOVA - Creer le compte administrateur'
$form.ClientSize = New-Object System.Drawing.Size(510, 430)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.Font = New-Object System.Drawing.Font('Segoe UI', 10)

$intro = New-Object System.Windows.Forms.Label
$intro.Text = "Votre base locale est connectee.`r`nChoisissez les identifiants de votre compte administrateur."
$intro.SetBounds(24, 18, 460, 52)
$form.Controls.Add($intro)

$fields = @{}
$definitions = @(
    @('email', 'Adresse e-mail', 82),
    @('name', 'Nom affiche', 146),
    @('password', 'Mot de passe (14 a 128 caracteres)', 210),
    @('confirmation', 'Confirmer le mot de passe', 274)
)
foreach ($definition in $definitions) {
    $label = New-Object System.Windows.Forms.Label
    $label.Text = $definition[1]
    $label.SetBounds(24, $definition[2], 460, 24)
    $form.Controls.Add($label)
    $field = New-Object System.Windows.Forms.TextBox
    $field.SetBounds(24, ($definition[2] + 25), 460, 28)
    $field.MaxLength = if ($definition[0] -eq 'email') { 254 } elseif ($definition[0] -eq 'name') { 100 } else { 128 }
    if ($definition[0] -in @('password', 'confirmation')) { $field.UseSystemPasswordChar = $true }
    $fields[$definition[0]] = $field
    $form.Controls.Add($field)
}

$status = New-Object System.Windows.Forms.Label
$status.SetBounds(24, 342, 460, 30)
$form.Controls.Add($status)
$button = New-Object System.Windows.Forms.Button
$button.Text = 'Creer le compte'
$button.SetBounds(294, 380, 190, 32)
$form.Controls.Add($button)
$form.AcceptButton = $button

$script:creationProcess = $null
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 250
$timer.Add_Tick({
    if ($script:creationProcess -and $script:creationProcess.HasExited) {
        $timer.Stop()
        $output = $script:outputTask.GetAwaiter().GetResult()
        $errorOutput = $script:errorTask.GetAwaiter().GetResult()
        $exitCode = $script:creationProcess.ExitCode
        $script:creationProcess.Dispose()
        $script:creationProcess = $null
        $button.Enabled = $true
        foreach ($field in $fields.Values) { $field.Enabled = $true }
        if ($exitCode -eq 0) {
            $fields.password.Clear()
            $fields.confirmation.Clear()
            $status.Text = 'Compte cree. Vous pouvez vous connecter.'
            [System.Windows.Forms.MessageBox]::Show("Compte cree !`r`nOuvrez http://localhost:3001 pour vous connecter avec votre e-mail et votre mot de passe.", 'NOVA', 'OK', 'Information') | Out-Null
            $form.Close()
        } else {
            $message = if ($errorOutput -match 'PASSWORD_MISMATCH') { 'Les deux mots de passe sont differents.' }
                elseif ($errorOutput -match 'INVALID_INPUT') { 'Verifiez votre e-mail, votre nom et la longueur du mot de passe.' }
                elseif ($errorOutput -match 'ADMIN_ALREADY_EXISTS') { 'Un compte administrateur existe deja. Connectez-vous avec ce compte.' }
                else { 'Creation impossible. Verifiez la connexion PostgreSQL locale.' }
            $status.Text = 'Le compte n''a pas ete cree.'
            [System.Windows.Forms.MessageBox]::Show($message, 'NOVA', 'OK', 'Warning') | Out-Null
        }
    }
})
$button.Add_Click({
    if ($fields.password.Text.Length -lt 14 -or $fields.name.Text.Trim().Length -lt 2 -or $fields.email.Text -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$') {
        [System.Windows.Forms.MessageBox]::Show('Entrez un e-mail valide, un nom et un mot de passe d''au moins 14 caracteres.', 'NOVA', 'OK', 'Warning') | Out-Null
        return
    }
    if ($fields.password.Text -cne $fields.confirmation.Text) {
        [System.Windows.Forms.MessageBox]::Show('Les deux mots de passe sont differents.', 'NOVA', 'OK', 'Warning') | Out-Null
        return
    }
    try {
        $start = New-Object System.Diagnostics.ProcessStartInfo
        $start.FileName = $nodePath
        $start.Arguments = '--import tsx scripts/create-admin.ts --json-stdin'
        $start.WorkingDirectory = $projectRoot
        $start.UseShellExecute = $false
        $start.CreateNoWindow = $true
        $start.RedirectStandardInput = $true
        $start.RedirectStandardOutput = $true
        $start.RedirectStandardError = $true
        $script:creationProcess = New-Object System.Diagnostics.Process
        $script:creationProcess.StartInfo = $start
        $script:creationProcess.Start() | Out-Null
        $script:outputTask = $script:creationProcess.StandardOutput.ReadToEndAsync()
        $script:errorTask = $script:creationProcess.StandardError.ReadToEndAsync()
        $payload = @{ email = $fields.email.Text; name = $fields.name.Text; password = $fields.password.Text; confirmation = $fields.confirmation.Text } | ConvertTo-Json -Compress
        $payloadBytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
        $script:creationProcess.StandardInput.BaseStream.Write($payloadBytes, 0, $payloadBytes.Length)
        $script:creationProcess.StandardInput.BaseStream.Flush()
        $script:creationProcess.StandardInput.Close()
        $payload = $null
        [Array]::Clear($payloadBytes, 0, $payloadBytes.Length)
        $button.Enabled = $false
        foreach ($field in $fields.Values) { $field.Enabled = $false }
        $status.Text = 'Creation du compte en cours...'
        $timer.Start()
    } catch {
        if ($script:creationProcess) {
            try { if (-not $script:creationProcess.HasExited) { $script:creationProcess.Kill() } } catch { }
            $script:creationProcess.Dispose()
            $script:creationProcess = $null
        }
        [System.Windows.Forms.MessageBox]::Show('Impossible de lancer la creation du compte. Verifiez que Node.js est installe.', 'NOVA', 'OK', 'Error') | Out-Null
    }
})
$form.Add_FormClosing({
    param($sender, $eventArgs)
    if ($script:creationProcess) { $eventArgs.Cancel = $true }
})
$form.Add_Shown({ $fields.email.Focus() })
[System.Windows.Forms.Application]::Run($form)
$timer.Dispose()
$form.Dispose()
