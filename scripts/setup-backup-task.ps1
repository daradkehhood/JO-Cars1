Write-Host "==============================" -ForegroundColor Cyan
Write-Host "   JO Cars - اعداد النسخ التلقائي" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ScriptPath = Join-Path $ProjectRoot "scripts\auto-backup.js"
$NodeExe = "node"
$TaskName = "JO Cars Auto Backup"
$TaskDescription = "نسخ احتياطي تلقائي لقاعدة بيانات JO Cars كل 6 ساعات مع إرسال الإيميل"

Write-Host "📁 مسار المشروع: $ProjectRoot" -ForegroundColor Yellow
Write-Host "📜 مسار السكريبت: $ScriptPath" -ForegroundColor Yellow
Write-Host ""

# Check if script exists
if (-not (Test-Path $ScriptPath)) {
    Write-Host "❌ خطأ: السكريبت غير موجود!" -ForegroundColor Red
    exit 1
}

# Test the script first
Write-Host "🧪 جاري اختبار السكريبت..." -ForegroundColor Yellow
try {
    $testResult = & $NodeExe $ScriptPath 2>&1
    Write-Host $testResult -ForegroundColor Gray
}
catch {
    Write-Host "⚠️ فشل اختبار السكريبت (قد يكون بسبب إعدادات الإيميل)" -ForegroundColor Yellow
    Write-Host "سيتم متابعة الإعداد على أي حال..." -ForegroundColor Yellow
}

Write-Host ""

# Remove existing task if it exists
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "🗑️ جاري حذف المهمة القديمة..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "✅ تم حذف المهمة القديمة" -ForegroundColor Green
}

# Create the scheduled task
$Action = New-ScheduledTaskAction -Execute $NodeExe -Argument "`"$ScriptPath`"" -WorkingDirectory $ProjectRoot
$Trigger = New-ScheduledTaskTrigger -Daily -At "00:00" -RepetitionInterval (New-TimeSpan -Hours 6) -RepetitionDuration (New-TimeSpan -Days 365)
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable:$true
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

try {
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Description $TaskDescription -Force
    Write-Host "✅ تم إنشاء المهمة بنجاح!" -ForegroundColor Green
    Write-Host ""

    $task = Get-ScheduledTask -TaskName $TaskName
    Write-Host "📋 تفاصيل المهمة:" -ForegroundColor Cyan
    Write-Host "   - الاسم: $TaskName" -ForegroundColor White
    Write-Host "   - التنفيذ: $NodeExe" -ForegroundColor White
    Write-Host "   - السكريبت: $ScriptPath" -ForegroundColor White
    Write-Host "   - التكرار: كل 6 ساعات" -ForegroundColor White
    Write-Host "   - الحالة: $($task.State)" -ForegroundColor White
    Write-Host ""

    Write-Host "📧 مهم: تأكد من تعيين EMAIL_PASS في ملف .env!" -ForegroundColor Magenta
    Write-Host "للحصول على كلمة مرور التطبيق من Gmail:" -ForegroundColor Magenta
    Write-Host "   1. افتح https://myaccount.google.com/security" -ForegroundColor Gray
    Write-Host "   2. فعّل التحقق بخطوتين (2FA)" -ForegroundColor Gray
    Write-Host "   3. اذهب لكلمة مرور التطبيقات (App Passwords)" -ForegroundColor Gray
    Write-Host "   4. اختر Mail و Windows Computer" -ForegroundColor Gray
    Write-Host "   5. انسخ كلمة المرور وضعها في .env: EMAIL_PASS=..." -ForegroundColor Gray
    Write-Host ""

    Write-Host "🔍 لعرض حالة المهمة لاحقاً:" -ForegroundColor Cyan
    Write-Host "   Get-ScheduledTask -TaskName '$TaskName' | fl" -ForegroundColor Gray
    Write-Host ""

    Write-Host "🔄 لاختبار السكريبت يدوياً:" -ForegroundColor Cyan
    Write-Host "   node scripts\auto-backup.js" -ForegroundColor Gray
}
catch {
    Write-Host "❌ فشل إنشاء المهمة: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "حاول تشغيل PowerShell كمسؤول (Run as Administrator)" -ForegroundColor Yellow
}
