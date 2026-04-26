const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('playerAPI', {
  onState:          (cb)  => ipcRenderer.on('state', (_e, data) => cb(data)),
  skip:             ()    => ipcRenderer.send('skip'),
  togglePause:      ()    => ipcRenderer.send('toggle-pause'),
  setVolume:        (v)   => ipcRenderer.send('set-volume', v),
  clearQueue:       ()    => ipcRenderer.send('clear-queue'),
  removeFromQueue:  (i)   => ipcRenderer.send('remove-from-queue', i),
  toggleRequests:   ()    => ipcRenderer.send('toggle-requests'),
  setBackupPlaylist:(url) => ipcRenderer.send('set-backup-playlist', url),
  updateBackupPlaylist:(url) => ipcRenderer.send('update-backup-playlist', url)
})
