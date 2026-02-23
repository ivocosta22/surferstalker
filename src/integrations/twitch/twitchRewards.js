/**
 * twitchRewards.js
 *
 * Channel Points reward handlers.
 *
 * Responsibilities:
 * - Listens for ComfyJS channel points reward events (via onChat)
 * - Triggers corresponding Twitch/OBS actions
 *
 */
const { twitch, twitchChannelPointsRewards } = require('../../config/env')
const { timeoutCommand } = require('./twitchCommands')

// ============================================================
// Constants
// ============================================================
const MUTE_5_MIN_MS = 5 * 60 * 1000
const MUTE_10_MIN_MS = 10 * 60 * 1000

// ============================================================
// Twitch Channel Points Rewards Event Handler
// Uses ComfyJS onChat with customReward metadata
// ============================================================
/**
 * Registers ComfyJS handlers for channel point redemptions.
 *
 * @param {object} deps
 * @param {any} deps.ComfyJS
 * @param {object} deps.botState Shared runtime state (must be shared across app)
 * @param {object} deps.obsController
 * @param {Function} deps.logColor
 */
function registerTwitchRewards({ ComfyJS, botState, obsController, logColor }) {
  if (!ComfyJS) throw new Error('registerTwitchRewards requires ComfyJS')
  if (!botState) throw new Error('registerTwitchRewards requires botState')
  if (!obsController) throw new Error('registerTwitchRewards requires obsController')
  if (!logColor) throw new Error('registerTwitchRewards requires logColor')

  const rewardCommandContext = Object.freeze({
    obsController,
    twitchChannelUserID: twitch.channelUserId,
    twitchBotUserID: twitch.botUserId,
    twitchBotAPIClientID: twitch.botClientId,
    botState,
    logColor
  })
  
  ComfyJS.onChat = async (user, message, flags, self, extra) => {

    if (self) return

    const rewardId = extra?.customRewardId
    if (!flags?.customReward || !rewardId) return

    try {
      // ------------------------------------------------------------
      // Song Request
      // ------------------------------------------------------------
      if (rewardId === twitchChannelPointsRewards.songRequest) {
        logColor('yellow', `[TWITCH] ⚠️ Channel Points Reward: Song Request`)
        ComfyJS.Say(`!sr ${message}`)
        return
      }

      // ------------------------------------------------------------
      // Timeout another user (via reward message text)
      // message is expected to be a username like "@user"
      // ------------------------------------------------------------
      if (rewardId === twitchChannelPointsRewards.timeout) {
        logColor('yellow', `[TWITCH] ⚠️ Channel Points Reward: Timeout`)

        if (!message?.trim()) return
        // Record who redeemed the reward for audit/logging/reason text
        rewardCommandContext.botState.commandCaller = user

        await timeoutCommand(rewardCommandContext, message)
        return
      }

      // ------------------------------------------------------------
      // Wide Camera Activation
      // ------------------------------------------------------------
      if (rewardId === twitchChannelPointsRewards.wideCam) {
        logColor('yellow', `[TWITCH] ⚠️ Channel Points Reward: Zoom and Wide Camera`)
        await obsController.activateWideCam()
        return
      }

      // ------------------------------------------------------------
      // Mute Mic for 5 Minutes
      // ------------------------------------------------------------
      if (rewardId === twitchChannelPointsRewards.mute5) {
        logColor('yellow', `[TWITCH] ⚠️ Channel Points Reward: Mute 5 Minutes`)
        await obsController.muteMicForDuration(MUTE_5_MIN_MS)
        return
      }

      // ------------------------------------------------------------
      // Mute Mic for 10 Minutes
      // ------------------------------------------------------------
      if (rewardId === twitchChannelPointsRewards.mute10) {
        logColor('yellow', `[TWITCH] ⚠️ Channel Points Reward: Mute 10 Minutes`)
        await obsController.muteMicForDuration(MUTE_10_MIN_MS)
        return
      }

    } catch (error) {
      logColor('red', `[TWITCH] ❌ Channel Points Reward error: ${error?.message || error}`)
    }
  }
}

module.exports = Object.freeze({ registerTwitchRewards })