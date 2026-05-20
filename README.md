# StreamerStalker Bot

Custom Twitch & Discord bot with OBS integration, Twitch moderation tools, channel point reward handling, and an Electron-based song request media player.

## Overview
StreamerStalker is a Node.js-based integration bot that connects:

- Twitch Chat
- Twitch API
- Discord
- OBS WebSocket
- Electron Media Player

It was developed to meet the specific automation and moderation needs of a Twitch live streamer.

This bot provides moderation tools, channel point reward automation, cross-platform messaging, camera/microphone automation during live streams, and a custom desktop media player for handling viewer song requests.

---

## Features

### Twitch
- Custom chat command system
- Channel point reward handling
- Timeout stacking logic (shared state)
- OAuth token management & automatic refresh
- Twitch Helix API integration

### OBS Integration
- WebSocket connection lifecycle management
- Automatic reconnect handling
- Wide camera activation with auto-revert timer
- Microphone mute with countdown overlay
- Dynamic overlay text animation

### Discord
- Slash command support
- Permission-based message relay
- Discord <> Twitch chat bridge

### Electron Media Player
- Desktop-based song request player
- Stream-safe media playback controls
- Queue management for viewer requests
- Integrated with Twitch chat workflows
- Designed for live stream music automation

### System
- Centralized environment validation
- Shared in-memory runtime state
- Graceful shutdown handling
- Structured logging

## Architecture

This project follows a modular integration-based architecture:

- **Dependency Injection** for Twitch reward handlers
- **Singleton OBS Controller** encapsulating WebSocket logic
- **Shared Runtime State** for consistent timeout stacking across commands and rewards
- **Centralized Configuration Layer** with environment validation
- **Separation of Concerns** between Twitch, Discord, OBS, Electron media systems, and core runtime layers

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create environment file

Copy:
```bash
.env.example
```

To:
```bash
.env
```

Fill in the required credentials.

### 3. Run the bot
```bash
npm start
```

## Environment Variables

Configuration is validated at startup.

Missing required variables will throw an error and prevent the bot from starting.

Make sure the .env file is properly set up before running. Use the .env.example as reference.

## Chat Token Storage

User OAuth tokens are persisted locally in:

src/config/tokens/twitch-user-tokens.json

By default, if the file doesn't exist, it will be automatically created.

The tokens directory must exist prior to runtime.

The tokens file is excluded from version control.

## Technologies

- Node.js
- Express
- Electron
- Twitch Helix API
- Comfy.js
- tmi.js
- Discord.js
- OBS WebSocket
