// Import the discord.js module
import { Client, TextChannel, Message } from "discord.js";
import "isomorphic-fetch";
import {
  handleNameChange,
  handleVoiceStateUpdate,
  checkIfMemberHasntRolesAndAssignRoles,
  loadCommands,
  handleMessageCall,
  getUserDifferences
} from "./controller/botController";
import { websocketServer } from "./controller/server";
import { Clock } from "./controller/clock";
import "node-opus";
import { messageHandleFunction } from "./legacy/messageHandler";
import { fillStateProp, setState } from "./controller/stateController";
import { AudioQueue } from "./controller/audioQueue";
import { joke } from "./commands/joke";
import { getRandomWinner, handleRaffleTime } from "./commands/getRaffleWinner";
import { handleWebSocketMessage } from "./controller/webSocketController";
import * as path from "path";
import { Berndsite } from "./controller/websiteController";

const Twitter = require("twitter");
const auth: auth = require("../configs/auth.json");
export const config: config = require("../configs/config.json");
export const { roleIds, userIds, channelIds }: idObject = require("../configs/rolesanduser.json");

export interface config {
  prefix: string;
  helpPrefix: string;
  raffleFileName: string;
  raffleWinDescription: string | -1;
}

export interface auth {
  token: string;
  consumer_key: string;
  consumer_secret: string;
  access_token_key: string;
  access_token_secret: string;
  raffleWin: string | -1;
}

export interface ChannelIds {
  [key: string]: string;
  halloweltkanalText: string;
  kikaloungeText: string;
  kikaloungeVoice: string;
  donaulimesVoice: string;
  wanderdorfVoice: string;
  stilletreppeVoice: string;
  inspirationText: string;
}

export interface Roles {
  [key: string]: string;
  spinner: string;
  trusted: string;
  uninitiert: string;
  poop: string;
  raffleTeilnehmer: string;
}
export enum RoleNames {
  spinner = "spinner",
  trusted = "trusted",
  uninitiert = "uninitiert",
  poop = "poop",
  raffleTeilnehmer = "raffleTeilnehmer"
}

export interface UserIds {
  [key: string]: string;
  spinbot: string;
  marcel: string;
  justus: string;
  adrian: string;
  nils: string;
  olaf: string;
  franny: string;
}

export interface idObject {
  roleIds: Roles;
  userIds: UserIds;
  channelIds: ChannelIds;
}

export interface commandProps {
  discord: {
    message: Message;
    client?: Client;
  };
  custom?: {
    twitterClient?: Twitter;
    loadedCommands?: messageHandleFunction[];
    jokes?: { jokePosition: number; jokes: joke[] };
  };
}

export const twitterClient = new Twitter({
  consumer_key: auth.consumer_key,
  consumer_secret: auth.consumer_secret,
  access_token_key: auth.access_token_key,
  access_token_secret: auth.access_token_secret
});

export const audioQueue = new AudioQueue();
audioQueue.on("add", queue => {
  console.log("added something to the audioQueue");
  console.log("current queuelength: " + queue.length);
  audioQueue.play(audioQueue.shift());
});
audioQueue.on("play", song => console.log("now playing: " + song.message));
audioQueue.on("error", error => console.log(error));
audioQueue.on("finish", queue => console.log("current queuelength: " + queue.length));

export const clock = new Clock();
clock.initialise();
clock.getEmitter().on("lenny", () => {
  if (
    (client.channels.get(channelIds.kikaloungeText) as TextChannel).lastMessage.author.id ===
    userIds.justus
  ) {
    (client.channels.get(channelIds.kikaloungeText) as TextChannel).send("Hallo Justus ( ͡° ͜ʖ ͡°)");
  } else (client.channels.get(channelIds.kikaloungeText) as TextChannel).send(`( ͡° ͜ʖ ͡°)`);
});
clock.getEmitter().on("raffleTime", () => {
  return handleRaffleTime(client);
});
clock.getEmitter().on("raffleReminder", () =>
  (client.channels.get(channelIds.kikaloungeText) as TextChannel).send(
    `Vergesst nicht, euch ins Raffle einzutragen, mit ${
      config.prefix
    }raffle \n(Vorrausgesetzt ihr habt die Rolle - falls nicht, einen ${
      (client.channels.get(channelIds.kikaloungeText) as TextChannel).guild.roles.get(
        roleIds.spinner
      ).name
    } fragen) \n${
      config.raffleWinDescription !== -1
        ? "Zu Gewinnen gibt es: " + config.raffleWinDescription
        : ""
    }
      \nWeitere Infos: ${config.helpPrefix}raffle`
  )
);
fillStateProp("clock", clock);

let wsServer = undefined;
const website = new Berndsite();

// Create an instance of a Discord client
const client = new Client();
fillStateProp("reloadCommands", () => {
  loadCommands().then(commands => setState({ commands: commands }));
});
loadCommands().then(loadedCommands => {
  setState({ commands: loadedCommands }).then(state => {
    client.once("ready", () => {
      console.log("I am ready!");
      client.user.setActivity("mit deinen Gefühlen", { type: "PLAYING" });

      try {
        wsServer = new websocketServer({
          port: 8080,
          onMessage: (message: any) => handleWebSocketMessage(message)
        });
        website.start();
      } catch (error) {
        console.log(error);
      }
    });

    client.on("guildMemberAdd", member => {
      try {
        checkIfMemberHasntRolesAndAssignRoles(
          client,
          member,
          [roleIds.uninitiert, roleIds.poop],
          [roleIds.uninitiert]
        );
      } catch (error) {
        console.log(error);
      }
    });

    client.on("error", error => console.error(error));

    client.on("voiceStateUpdate", (oldMember, newMember) =>
      handleVoiceStateUpdate(oldMember, newMember, client)
    );

    client.on("guildMemberUpdate", (oldUser, newUser) => {
      getUserDifferences(oldUser, newUser);
      handleNameChange(newUser);
    });

    // Create an event listener for messages
    client.on("message", message => {
      try {
        handleMessageCall(message, client, twitterClient);
      } catch (error) {
        console.log(error);
        return console.log(`Konnte nicht verarbeiten: ${message.content.split(" ")[0]}`);
      }
    });

    client.on("disconnect", () => {
      console.log("Disconnect");
    });
  });
});

// Log our bot in using the token from https://discordapp.com/developers/applications/me
client.login(auth.token);
