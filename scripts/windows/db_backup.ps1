# ===============================
# UTF-8 強制（絵文字対応）
# ===============================
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ===== 設定 =====
$Container = "media-server-db"        # docker ps で見えるコンテナ名
$User = "prisma"
$Database = "media_server"
$BackupDir = Join-Path $HOME "media-server" "backups" # 保存先
# =================

Write-Host "=== MySQL Docker Backup ===" -ForegroundColor Cyan

# 日時
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupDir\$Database`_$Timestamp.sql"
$TempContainerPath = "/tmp/temp_$($Database)_$($Timestamp).sql"

# ディレクトリ作成
if (!(Test-Path $BackupDir)) {
    Write-Host "Creating backup directory: $BackupDir"
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# パスワード入力
$SecurePwd = Read-Host "Enter MySQL password for [$User]" -AsSecureString
$PlainPwd = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePwd)
)

# 環境変数に設定
$env:MYSQL_PWD = $PlainPwd

try {
    Write-Host "Starting mysqldump..." -ForegroundColor Yellow

    # 1. mysqldump 実行 (-e で環境変数を注入)
    # 2>$null を外すとエラー時に MySQL 側が出す詳細理由が見えるようになります
    docker exec -e "MYSQL_PWD=$PlainPwd" $Container `
        mysqldump -u $User --single-transaction --result-file="$TempContainerPath" $Database

    if ($LASTEXITCODE -ne 0) {
        throw "mysqldump command failed with exit code $LASTEXITCODE"
    }

    # 2. ホストへコピー
    docker cp "${Container}:${TempContainerPath}" $BackupFile

    # 3. ファイル存在とサイズチェック
    if (!(Test-Path $BackupFile) -or (Get-Item $BackupFile).Length -eq 0) {
        throw "Backup file is empty or was not copied correctly."
    }

    Write-Host "`n✅ Backup completed successfully" -ForegroundColor Green
    Write-Host "File: $BackupFile ($("{0:N2}" -f ((Get-Item $BackupFile).Length / 1KB)) KB)"
}
catch {
    Write-Host "`n❌ Error: $_" -ForegroundColor Red
    if (Test-Path $BackupFile) { Remove-Item $BackupFile }
}
finally {
    Write-Host "`nCleaning up temporary data..." -ForegroundColor Gray
    
    # コンテナ内の一時ファイルを削除
    docker exec $Container rm "$TempContainerPath" 2>$null
    
    # ホスト側のパスワード環境変数を削除
    if (Get-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue) {
        Remove-Item Env:\MYSQL_PWD
    }
    
    $PlainPwd = $null
    [System.GC]::Collect() # メモリ上のパスワード痕跡をクリア
}
