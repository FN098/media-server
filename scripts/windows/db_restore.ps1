# ===============================
# UTF-8 強制（絵文字対応）
# ===============================
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ===== 設定 =====
$Container = "media-server-db"        # docker ps で見えるコンテナ名
$User = "root"
$SourceDir = Join-Path $HOME "media-server/backups" # 保存先
$TargetDB = "media_server_restore_test" # 復元先DB（既存 or 新規）
# =================

Write-Host "=== MySQL Docker Restore ===" -ForegroundColor Cyan

# 1. 最新のバックアップファイルを取得
$BackupFile = Get-ChildItem $SourceDir -Filter "*.sql" |
Sort-Object LastWriteTime -Descending |
Select-Object -First 1

if (-not $BackupFile) {
    Write-Host "❌ No backup file found in $SourceDir" -ForegroundColor Red
    exit 1
}

Write-Host "Using file: $($BackupFile.Name)"

$TempContainerPath = "/tmp/temp_restore_$($BackupFile.Name)"

# 2. パスワード入力
$SecurePwd = Read-Host "Enter MySQL password for [$User]" -AsSecureString
$PlainPwd = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePwd)
)

try {
    Write-Host "Preparing restore..." -ForegroundColor Yellow

    # 【重要】先にコンテナへファイルをコピー（文字化け回避）
    docker cp $BackupFile.FullName "${Container}:${TempContainerPath}"
    if ($LASTEXITCODE -ne 0) { throw "Failed to copy backup file to container." }

    # DBが存在しない場合に備えて作成（任意。不要ならコメントアウト）
    docker exec -e "MYSQL_PWD=$PlainPwd" $Container `
        mysql -u $User -e "CREATE DATABASE IF NOT EXISTS $TargetDB;"
    if ($LASTEXITCODE -ne 0) { throw "Failed to create database." }

    Write-Host "Restoring database..." -ForegroundColor Yellow

    # 【重要】コンテナ内のファイルを指定してmysql実行
    # -e でパスワード注入、< でファイル入力
    docker exec -e "MYSQL_PWD=$PlainPwd" -i $Container `
        sh -c "mysql -u $User $TargetDB < $TempContainerPath"

    if ($LASTEXITCODE -ne 0) {
        throw "Restore failed. Check database name and password."
    }

    Write-Host "`n✅ Restore completed successfully" -ForegroundColor Green
    Write-Host "Target Database: $TargetDB"

}
catch {
    Write-Host "`n❌ Error: $_" -ForegroundColor Red
}
finally {
    Write-Host "`nCleaning up temporary data..." -ForegroundColor Gray
    
    # コンテナ内の一時ファイルを削除
    docker exec $Container rm "$TempContainerPath" 2>$null
    
    # メモリと環境変数のクリーンアップ
    $PlainPwd = $null
    if (Get-Item Env:\MYSQL_PASSWORD -ErrorAction SilentlyContinue) {
        Remove-Item Env:\MYSQL_PASSWORD
    }
}