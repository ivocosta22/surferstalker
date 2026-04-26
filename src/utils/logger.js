/**
 * logger.js
 *
 * Centralized logging utility.
 *
 * Features:
 * - Timestamped log output
 * - ANSI color support
 * - Standardized service tags (TWITCH, DISCORD, OBS, SYSTEM)
 * - Error stack logging
 *
 * This ensures consistent and readable logs across the application.
 */

// ============================================================
// ANSI escape codes for colors
// ============================================================
const LOG_COLORS = {
  default: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
}

// ============================================================
// Neutral Service Tags
// These remain uncolored
// ============================================================
const NEUTRAL_TAGS = ['[TWITCH]','[DISCORD]', '[OBS]', '[SYSTEM]', '[PLAYER]']


// ============================================================
// Logger Function
// ============================================================

/**
 * Logs a formatted message with timestamp and optional color.
 *
 * @param {keyof typeof LOG_COLORS} color - Color name
 * @param {string} text - Log message
 * @param {Error|null} [error=null] - Optional error object
 */
function logColor(color, text, error = null) {
  const time = new Date().toISOString().replace('T', ' ').split('.')[0]
  const timestamp = `[${time}]`
  const chosenColor = LOG_COLORS[color] || LOG_COLORS.default
  const matchingTag = NEUTRAL_TAGS.find(tag => text.startsWith(tag))
  let output
  
  if (matchingTag) {
    const rest = text.slice(matchingTag.length).trim()
    output = `${LOG_COLORS.default}${timestamp} ${matchingTag} ${chosenColor}${rest}${LOG_COLORS.default}`
  } else {
    output = `${LOG_COLORS.default}${timestamp} ${chosenColor}${text}${LOG_COLORS.default}`
  }
  console.log(output)

  if (error) {
    console.error(`${LOG_COLORS.red}${error?.stack || error}${LOG_COLORS.default}`)
  }
}

module.exports = { logColor }