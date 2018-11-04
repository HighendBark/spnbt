// Import the discord.js module
import { Client } from "discord.js";
import "isomorphic-fetch";
import "opusscript";
import { messageHandleObjectTrusted } from "./messageHandlerTrusted";
import { messageHandleObjectAdmin } from "./messageHandlerAdmin";
import { messageHandleObjectPleb } from "./messageHandlerPleb";

const auth: auth = require("./auth.json");
export const { roleIds, userIds, channelIds }: idObject = require("./rolesanduser.json");

export interface auth {
  token: string;
  consumer_key: string;
  consumer_secret: string;
  access_token_key: string;
  access_token_secret: string;
}

export interface ChannelIds {
  halloweltkanalText: string;
  kikaloungeText: string;
  kikaloungeVoice: string;
  donaulimesVoice: string;
  wanderdorfVoice: string;
  stilletreppeVoice: string;
}

export interface Roles {
  spinner: string;
  trusted: string;
}

export interface UserIds {
  spinbot: string;
  marcel: string;
  justus: string;
  adrian: string;
  olaf: string;
}

export interface idObject {
  roleIds: Roles;
  userIds: UserIds;
  channelIds: ChannelIds;
}

// Create an instance of a Discord client
const client = new Client();

/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */
client.on("ready", () => {
  console.log("I am ready!");
});

export let currentState = {
  isPlayingAudio: false,
  isInspiring: false
};

// Create an event listener for messages
client.on("message", message => {
  if (
    (!message.member.roles.has(roleIds.trusted) && !message.member.roles.has(roleIds.spinner)) ||
    message.member.user.id === userIds.spinbot
  ) {
    return;
  }
  try {
    console.log(`${message.member.displayName}/${message.member.user.username}: ${message.content}
      `);
    console.log(
      `${message.content.slice(
        0,
        !!~message.content.indexOf(" ") ? message.content.indexOf(" ") : message.content.length
      )}`
    );

    if (message.member.roles.has(roleIds.spinner)) {
      if (
        typeof (messageHandleObjectAdmin as any)[
          `${message.content.slice(
            0,
            !!~message.content.indexOf(" ") ? message.content.indexOf(" ") : message.content.length
          )}`
        ] === "function"
      ) {
        return (messageHandleObjectAdmin as any)[
          `${message.content.slice(
            0,
            !!~message.content.indexOf(" ") ? message.content.indexOf(" ") : message.content.length
          )}`
        ](message, client);
      }
    }
    if (message.member.roles.has(roleIds.spinner) || message.member.roles.has(roleIds.trusted)) {
      if (
        typeof (messageHandleObjectTrusted as any)[
          `${message.content.slice(
            0,
            !!~message.content.indexOf(" ") ? message.content.indexOf(" ") : message.content.length
          )}`
        ](message, client) === "function"
      )
        return (messageHandleObjectTrusted as any)[
          `${message.content.slice(
            0,
            !!~message.content.indexOf(" ") ? message.content.indexOf(" ") : message.content.length
          )}`
        ](message, client);
    }

    if (
      typeof (messageHandleObjectPleb as any)[
        `${message.content.slice(
          0,
          !!~message.content.indexOf(" ") ? message.content.indexOf(" ") : message.content.length
        )}`
      ](message, client) === "function"
    ) {
      return (messageHandleObjectPleb as any)[
        `${message.content.slice(
          0,
          !!~message.content.indexOf(" ") ? message.content.indexOf(" ") : message.content.length
        )}`
      ](message, client);
    }
  } catch (error) {
    console.log(error);
    if (message.member.user.id === userIds.marcel) {
      message.react(client.emojis.get("508737241443729408"));
    }
    if (message.member.user.id === userIds.justus) {
      message.react(client.emojis.get("508737241930006561"));
    }
    if (message.member.user.id === userIds.olaf) {
      message.react("💕");
    }
    return console.log(
      `Konnte nicht verarbeiten: ${message.content.slice(
        0,
        !!~message.content.indexOf(" ") ? message.content.indexOf(" ") : message.content.length
      )}`
    );
  }
});

// Log our bot in using the token from https://discordapp.com/developers/applications/me
client.login(auth.token);
