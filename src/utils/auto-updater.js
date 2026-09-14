const { app, ipcMain, BrowserWindow } = require('electron');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

let isDownloading = false;
let currentUpdateInfo = null;

function sendToRenderer(channel, data) {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
        windows[0].webContents.send(channel, data);
    }
}

function isNewerVersion(remote, current) {
    const rParts = (remote || '').split('.').map(Number);
    const cParts = (current || '').split('.').map(Number);

    for (let i = 0; i < Math.max(rParts.length, cParts.length); i++) {
        const r = rParts[i] || 0;
        const c = cParts[i] || 0;
        if (r > c) return true;
        if (r < c) return false;
    }
    return false;
}

async function checkAppUpdates() {
    try {
        const currentVersion = app.getVersion();
        console.log(`[AutoUpdater] Current version: ${currentVersion}. Checking server for updates...`);

        const request = https.get('https://keycompanion.vercel.app/api/version', (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    if (data && data.success && data.version) {
                        const remoteVersion = data.version;
                        console.log(`[AutoUpdater] Remote version: ${remoteVersion}`);

                        if (isNewerVersion(remoteVersion, currentVersion)) {
                            currentUpdateInfo = {
                                version: remoteVersion,
                                downloadUrl: data.downloadUrl || 'https://keycompanion.vercel.app/download-installer',
                            };
                            sendToRenderer('update-available', currentUpdateInfo);
                            console.log(`[AutoUpdater] Update available! Remote: ${remoteVersion}, Current: ${currentVersion}`);
                        }
                    }
                } catch (e) {
                    console.warn('[AutoUpdater] Error parsing version JSON:', e.message);
                }
            });
        });

        request.on('error', (err) => {
            console.warn('[AutoUpdater] Failed to check for updates:', err.message);
        });
    } catch (err) {
        console.error('[AutoUpdater] Error during update check:', err.message);
    }
}

function downloadFile(url, destPath, onProgress) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const req = protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    return downloadFile(redirectUrl, destPath, onProgress).then(resolve).catch(reject);
                }
            }

            if (response.statusCode !== 200) {
                return reject(new Error(`Server returned HTTP status ${response.statusCode}`));
            }

            const totalSize = parseInt(response.headers['content-length'] || '0', 10);
            let downloadedSize = 0;
            const fileStream = fs.createWriteStream(destPath);

            response.on('data', (chunk) => {
                downloadedSize += chunk.length;
                fileStream.write(chunk);
                if (totalSize > 0 && onProgress) {
                    const percent = Math.round((downloadedSize / totalSize) * 100);
                    onProgress(percent);
                }
            });

            response.on('end', () => {
                fileStream.end();
                resolve(destPath);
            });

            response.on('error', (err) => {
                fs.unlink(destPath, () => {});
                reject(err);
            });
        });

        req.on('error', (err) => {
            fs.unlink(destPath, () => {});
            reject(err);
        });
    });
}

function setupAutoUpdaterIpcHandlers() {
    ipcMain.handle('trigger-download-update', async () => {
        if (isDownloading) {
            return { success: false, error: 'Download already in progress' };
        }

        const downloadUrl = currentUpdateInfo ? currentUpdateInfo.downloadUrl : 'https://keycompanion.vercel.app/download-installer';
        const tempExePath = path.join(os.tmpdir(), `KeyboardMaster-Setup-v${currentUpdateInfo ? currentUpdateInfo.version : 'latest'}.exe`);

        try {
            isDownloading = true;
            sendToRenderer('update-download-progress', { status: 'downloading', percent: 0 });
            console.log(`[AutoUpdater] Downloading update from ${downloadUrl} to ${tempExePath}...`);

            await downloadFile(downloadUrl, tempExePath, (percent) => {
                sendToRenderer('update-download-progress', { status: 'downloading', percent });
            });

            sendToRenderer('update-download-progress', { status: 'installing', percent: 100 });
            console.log(`[AutoUpdater] Download complete. Executing setup installer: ${tempExePath}`);

            // Launch setup executable cleanly
            const child = spawn(tempExePath, ['--updated', '/S'], {
                detached: true,
                stdio: 'ignore',
            });
            child.unref();

            // Quit current app so installer overwrites safely
            setTimeout(() => {
                app.quit();
            }, 1000);

            return { success: true };
        } catch (error) {
            console.error('[AutoUpdater] Update download failed:', error);
            isDownloading = false;
            sendToRenderer('update-download-progress', { status: 'error', error: error.message });
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('check-for-updates-manual', async () => {
        await checkAppUpdates();
        return { success: true };
    });
}

module.exports = {
    checkAppUpdates,
    setupAutoUpdaterIpcHandlers,
};
