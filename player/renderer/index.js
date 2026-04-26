const btnRequests    = document.getElementById('requests-toggle')
const btnPause       = document.getElementById('btn-pause')
const btnSkip        = document.getElementById('btn-skip')
const btnClear       = document.getElementById('btn-clear')
const volumeSlider   = document.getElementById('volume-slider')
const volumeLabel    = document.getElementById('volume-label')
const botDot         = document.getElementById('bot-dot')
const botLabel       = document.getElementById('bot-label')
const thumbnail      = document.getElementById('thumbnail')
const thumbPlaceholder = document.getElementById('thumbnail-placeholder')
const trackInfo      = document.getElementById('track-info')
const trackTitle     = document.getElementById('track-title')
const trackRequester = document.getElementById('track-requester')
const idleMsg        = document.getElementById('idle-msg')
const queueList      = document.getElementById('queue-list')
const queueEmpty     = document.getElementById('queue-empty')
const queueCount     = document.getElementById('queue-count')
const backupInput      = document.getElementById('backup-input')
const backupModeDot    = document.getElementById('backup-mode-dot')
const btnBackupUpdate  = document.getElementById('btn-backup-update')

function thumbUrl(videoId) {
  return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null
}

function renderState({ current, queue, isPaused, botConnected, requestsEnabled, volume, backupPlaylistUrl, backupMode }) {
  // Volume — only sync if the user isn't actively dragging
  if (document.activeElement !== volumeSlider) {
    volumeSlider.value = volume
    volumeLabel.textContent = volume
  }

  // Requests toggle
  btnRequests.className = requestsEnabled ? 'enabled' : 'disabled'
  btnRequests.textContent = requestsEnabled ? '✅ Requests: ON' : '🔴 Requests: OFF'

  // Bot status
  botDot.classList.toggle('connected', botConnected)
  botLabel.textContent = botConnected ? 'Bot connected' : 'Bot offline'

  // Backup mode indicator
  backupModeDot.classList.toggle('active', backupMode)

  // Backup input (only update if user isn't focused on it)
  if (document.activeElement !== backupInput) {
    backupInput.value = backupPlaylistUrl || ''
  }

  // Now playing
  const hasContent = current || backupMode
  if (hasContent) {
    idleMsg.style.display = 'none'
    trackInfo.style.display = 'block'

    if (current) {
      trackTitle.textContent = current.title || current.url
      trackRequester.textContent = `Requested by ${current.requester}`
      const url = thumbUrl(current.videoId)
      if (url) {
        thumbnail.src = url
        thumbnail.classList.remove('hidden')
        thumbPlaceholder.style.display = 'none'
      } else {
        thumbnail.classList.add('hidden')
        thumbPlaceholder.style.display = 'flex'
      }
    } else {
      // Backup mode — no specific track info
      trackTitle.textContent = '🎵 Backup playlist'
      trackRequester.textContent = 'Shuffle & loop'
      thumbnail.classList.add('hidden')
      thumbPlaceholder.style.display = 'flex'
    }

    btnPause.disabled = false
    btnPause.textContent = isPaused ? '▶ Resume' : '⏸ Pause'
    btnSkip.disabled = false
  } else {
    idleMsg.style.display = 'block'
    trackInfo.style.display = 'none'
    thumbnail.classList.add('hidden')
    thumbPlaceholder.style.display = 'flex'
    btnPause.disabled = true
    btnPause.textContent = '▶ Play'
    btnSkip.disabled = true
  }

  // Queue
  btnClear.disabled = queue.length === 0
  queueCount.textContent = queue.length > 0 ? `(${queue.length})` : ''

  if (queue.length === 0) {
    queueEmpty.style.display = 'block'
    Array.from(queueList.querySelectorAll('.queue-item')).forEach(el => el.remove())
  } else {
    queueEmpty.style.display = 'none'
    Array.from(queueList.querySelectorAll('.queue-item')).forEach(el => el.remove())
    queue.forEach((track, index) => {
      const item = document.createElement('div')
      item.className = 'queue-item'

      const img = document.createElement('img')
      img.src = thumbUrl(track.videoId) || ''
      img.alt = ''
      img.onerror = () => { img.style.display = 'none' }

      const info = document.createElement('div')
      info.className = 'queue-item-info'

      const title = document.createElement('div')
      title.className = 'queue-item-title'
      title.textContent = track.title || track.url

      const requester = document.createElement('div')
      requester.className = 'queue-item-requester'
      requester.textContent = `by ${track.requester}`

      const removeBtn = document.createElement('button')
      removeBtn.className = 'queue-item-remove'
      removeBtn.textContent = '✕'
      removeBtn.title = 'Remove'
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        window.playerAPI.removeFromQueue(index)
      })

      info.appendChild(title)
      info.appendChild(requester)
      item.appendChild(img)
      item.appendChild(info)
      item.appendChild(removeBtn)
      queueList.appendChild(item)
    })
  }
}

// ── Controls ──────────────────────────────────────────────────────────────────

btnRequests.addEventListener('click', () => window.playerAPI.toggleRequests())
btnPause.addEventListener('click',    () => window.playerAPI.togglePause())
btnSkip.addEventListener('click',     () => window.playerAPI.skip())
btnClear.addEventListener('click',    () => window.playerAPI.clearQueue())

volumeSlider.addEventListener('input', () => {
  const v = Number(volumeSlider.value)
  volumeLabel.textContent = v
  window.playerAPI.setVolume(v)
})

// Backup playlist — save on blur/Enter (no immediate switch); Update button switches immediately
backupInput.addEventListener('blur', () => window.playerAPI.setBackupPlaylist(backupInput.value))
backupInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') backupInput.blur() })
btnBackupUpdate.addEventListener('click', () => window.playerAPI.updateBackupPlaylist(backupInput.value))

// ── State updates from main process ──────────────────────────────────────────

window.playerAPI.onState(renderState)
