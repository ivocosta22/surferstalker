/**
 * twitchCommands.js
 *
 * Defines all Twitch chat commands and moderation commands.
 *
 * Functionality:
 * - Chat interaction commands
 * - Twitch moderation commands
 * - OBS interaction commands
 * - Channel point timeout command
 *
 * All commands operate using injected context.
 */
const superfetch = require('node-superfetch')
const { twitch } = require('../../config/env')
const { getToken, getUser, getUserCategory } = require('./twitchAPI')

const WITHER_COOLDOWN_MS = 300_000

/**
 * Calculates stacking timeout duration and updates botState.
 *
 * @param {object} botState
 * @param {string} uname
 * @param {number} baseDuration seconds
 * @returns {number}
 */
function calculateTimeoutDuration(botState, uname, baseDuration) {

  if (!botState.timeouts) botState.timeouts = {}

  const now = Math.floor(Date.now() / 1000)

  const userData = botState.timeouts[uname]

  let timeoutDuration = baseDuration

  if (userData) {
    timeoutDuration =
      (now - userData.timestamp > userData.duration)
        ? baseDuration
        : userData.duration + baseDuration
  }

  botState.timeouts[uname] = {
    duration: timeoutDuration,
    timestamp: now
  }

  return timeoutDuration
}

/**
 * Creates Twitch chat commands for the bot.
 *
 * @param {object} context
 * @returns {Array<{name: string, response: function}>}
 */
function createCommands(context) {
  if (!context) throw new Error('createCommands requires a context object')

  const {
    ComfyJS,
    obsController,
    twitchChannel,
    twitchChannelCaseSensitive,
    twitchChannelUserID,
    twitchBotUserID,
    twitchBotAPIClientID,
    userCooldown,
    botState,
    logColor = (...args) => console.log(...args)
  } = context

  // ============================================================
  // Initializes Bot State
  // ============================================================
  botState.startTime = botState.startTime || Date.now()
  botState.commandCaller = botState.commandCaller || null
  botState.timeouts = botState.timeouts || {}

  // ============================================================
  // Simple Commands
  // ============================================================

  const kickCommand = () => `https://kick.com/surferkiller`

  const playlistCommand = () => `Frenchcore: https://www.youtube.com/playlist?list=PLbRxpesByb8HUJGcLGDPmla296SDAS9td | Nostalgia: https://www.youtube.com/playlist?list=PLbRxpesByb8F8vh09GqN6siJS-S_yqQFB | Sextrance: https://www.youtube.com/playlist?list=PLbRxpesByb8EhNlUL7EKn5QAnyVudwIfG`

  const gamesCommand = () => `https://docs.google.com/spreadsheets/d/1_CKIaCLP_IbpAglM98tuiQkbwyO_oDgYcVxrmHbZNBo/edit?usp=sharing`

  const videosCommand = () => `You can insert videos here for Surfer to watch Sprite https://docs.google.com/document/d/1bxSoH8t5fFlTETAFe0xPk24fAA1hsHyH_-U0BrY1aBU/edit`

  const playSoundCommand = () => `Soundlist commands here: https://docs.google.com/spreadsheets/d/1HICBqgQjHlYHpJ_O6ws3LoWiVAJW9OHyeeBwYx14Gcs/edit?usp=sharing`
  
  const lurkCommand = () => `${botState.commandCaller} turned on lurk mode peepoBlanket`

  const unlurkCommand = () => `${botState.commandCaller} is back! PeepoCheer`

  const discordCommand = () => `You're In EZ Clap https://discord.gg/FM9b3m7wUy`

  const pentaCommand = () => `Surfer's Pentas in Synapse's channel here: https://youtu.be/qkZ2sukhVRU?t=266 - https://youtu.be/PStKAXach6Y?t=255 - https://youtu.be/lly9zvmxLF0?t=579`

  const trihardCommand = () => `When Surfer is on trihard mode, it means that he's focused 100% on the game. He will answer chat messages when dead/recalling. Surfer does not talk when in trihard mode.`

  const sickCommand = () => `Surfer is currently not sick. FeelsOkayMan`

  const pingCommand = () => {
    const totalSeconds = Math.floor((Date.now() - botState.startTime) / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `Pong. I have been stalking for ${minutes} minutes and ${seconds} seconds.`
  }

  const tuckCommand = (username) => {

    if (!username) return ''

    const uname = username.replace('@', '').toLowerCase()
    return `@${botState.commandCaller} tucked ${uname} to bed FeelsOkayMan 👉 🛏️`
  }

  const timeCommand = () => {
    const options = { timeZone: 'Europe/Lisbon', timeStyle: 'medium', hour12: false }
    return `It's currently ${new Date().toLocaleTimeString(undefined, options)} in Surfer's timezone Sime`
  }

  // ============================================================
  // Async Commands (Twitch API / ComfyJS)
  // ============================================================
  const soCommand = async (username) => {

    if (!username) return ''

    const uname = username.replace('@', '').toLowerCase()
    const category = await getUserCategory(uname)
    return `Check out ${uname} at https://twitch.tv/${uname}, they are playing ${category || 'something cool'}!`
  }

  const categoryCommand = async () => {
    const category = await getUserCategory(twitchChannel)
    return `@${twitchChannelCaseSensitive} is on the "${category || 'unknown'}" category.`
  }

  const witherCommand = async (username) => {
    if (!username) return ''

    if (userCooldown.has(botState.commandCaller)) {
      logColor('cyan', `[TWITCH] 🤡 ${botState.commandCaller} is on cooldown for wither.`)
      return `${botState.commandCaller} is on cooldown for wither... 🤡`
    }

    const uname = username.replace('@', '').toLowerCase()
    const timeoutDuration = calculateTimeoutDuration(botState, uname, 60)
    const randomNumber = Math.floor(Math.random() * 11)

    // 50/50 dodge chance
    if (randomNumber >= 5) {
      logColor('cyan', `[TWITCH] 🏃‍ ${uname} dodged the wither cast by ${botState.commandCaller}!`)
      if (botState.commandCaller !== twitchChannelCaseSensitive) {
        userCooldown.add(botState.commandCaller)
        setTimeout(() => userCooldown.delete(botState.commandCaller), WITHER_COOLDOWN_MS)
      }
      return `${uname} dodged the wither cast by ${botState.commandCaller}! 🤡`
    }

    try {
      const token = await getToken('user')
      const userID = await getUser(uname)

      if (!userID) {
        logColor('red', `[TWITCH] ❌ Could not find user ID for ${uname}, skipping wither`)
        return ''
      }

      const res = await superfetch
      .post(`${twitch.APIEndpoint}/moderation/bans`)
      .query({
        broadcaster_id: twitchChannelUserID,
        moderator_id: twitchBotUserID
      })
      .set('Authorization', `Bearer ${token}`)
      .set('Client-Id', twitchBotAPIClientID)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({
        data: {
          user_id: String(userID),
          duration: timeoutDuration,
          reason: `You have been withered by ${botState.commandCaller} in chat.`
        }
      }))

      if (res.status === 200) {
        logColor('cyan', `[TWITCH] 💀 ${uname} was withered by ${botState.commandCaller}.`)
        const displayText = `${uname} was withered by ${botState.commandCaller}.`
        if (obsController?.setWitherText) await obsController.setWitherText(displayText)
        if (obsController?.slideWitherTextInAllScenes) await obsController.slideWitherTextInAllScenes()
        return ''
      }

      logColor('red', `[TWITCH] ❌ Error withering ${uname}. Status: ${res.status} ${res.statusText}`)
      return ''

    } catch (error) {
      logColor('red', `[TWITCH] ❌ Error withering ${uname}: ${error.message}`)
      return ''
    }
  }
  const reconnectOBSCommand = async () => {
    if (botState.commandCaller !== twitchChannelCaseSensitive) return
    await obsController.connect((result) => ComfyJS?.Say?.(`${result}`))
  }

  const statusOBSCommand = async () => {
    if (botState.commandCaller !== twitchChannelCaseSensitive) return
    ComfyJS?.Say?.(`${obsController.getStatus()}`)
  }

  // ============================================================
  // Return Commands Array
  // ============================================================
  return Object.freeze([
    { name: 'ping', response: pingCommand },
    { name: 'wither', response: witherCommand },
    { name: 'kick', response: kickCommand },
    { name: 'playlist', response: playlistCommand },
    { name: 'games', response: gamesCommand },
    { name: 'gamelist', response: gamesCommand },
    { name: 'gameslist', response: gamesCommand },
    { name: 'time', response: timeCommand },
    { name: 'videos', response: videosCommand },
    { name: 'playsound', response: playSoundCommand },
    { name: 'sound', response: playSoundCommand },
    { name: 'sounds', response: playSoundCommand },
    { name: 'soundlist', response: playSoundCommand },
    { name: 'soundboard', response: playSoundCommand },
    { name: 'soundclips', response: playSoundCommand },
    { name: 'lurk', response: lurkCommand },
    { name: 'unlurk', response: unlurkCommand },
    { name: 'discord', response: discordCommand },
    { name: 'penta', response: pentaCommand },
    { name: 'pentakill', response: pentaCommand },
    { name: 'pentas', response: pentaCommand },
    { name: 'so', response: soCommand },
    { name: 'trihard', response: trihardCommand },
    { name: 'sick', response: sickCommand },
    { name: 'tuck', response: tuckCommand },
    { name: 'game', response: categoryCommand },
    { name: 'category', response: categoryCommand },
    { name: 'obsreconnect', response: reconnectOBSCommand },
    { name: 'obsstatus', response: statusOBSCommand }
  ])
}


/**
 * Times out a user via Twitch moderation API.
 * Used by channel point rewards.
 *
 * @param {object} context
 * @param {string} username
 * @returns {Promise<string>}
 */
const timeoutCommand = async (context, username) => {

  if (!username) return

  if (!context) throw new Error('timeoutCommand requires a context object')

    const {
      botState,
      logColor = (...args) => console.log(...args),
      obsController,
      twitchChannelUserID,
      twitchBotUserID,
      twitchBotAPIClientID
    } = context

    const uname = username.replace('@', '').toLowerCase()
    const timeoutDuration = calculateTimeoutDuration(botState, uname, 300)

    try {
      const token = await getToken('user')
      const userID = await getUser(uname)

      if (!userID) {
        logColor('red', `[TWITCH] ❌ Could not find user ID for ${uname}, skipping timeout`)
        return ''
      }

      const res = await superfetch
      .post(`${twitch.APIEndpoint}/moderation/bans`)
      .query({
        broadcaster_id: twitchChannelUserID,
        moderator_id: twitchBotUserID
      })
      .set('Authorization', `Bearer ${token}`)
      .set('Client-Id', twitchBotAPIClientID)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({
        data: {
          user_id: String(userID),
          duration: timeoutDuration,
          reason: `You have been timed out by ${botState.commandCaller} via channel points reward.`
        }
      }))

      if (res.status === 200) {
        logColor('cyan', `[TWITCH] 💀 ${uname} timed out by ${botState.commandCaller} via channel points.`)
        const displayText = `${uname} was timed out by ${botState.commandCaller} via channel points.`
        if (obsController?.setWitherText) await obsController.setWitherText(displayText)
        if (obsController?.slideWitherTextInAllScenes) await obsController.slideWitherTextInAllScenes()
        return ''
      }

      logColor('red', `[TWITCH] ❌ Error timing out ${uname}. Status: ${res.status} ${res.statusText}`)
      return ''

    } catch (error) {
      logColor('red', `[TWITCH] ❌ Error timing out ${uname}: ${error.message}`)
      return ''
    }
}

module.exports = Object.freeze({
  createCommands,
  timeoutCommand
})