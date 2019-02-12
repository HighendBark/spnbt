import { commandProps, RoleNames, config, roleIds } from "../bot";
import {
  writeHelpMessage,
  getStreamFromYouTubeLink,
  audioQueueElement,
  addToQueue
} from "../controller/shared";
import { messageHandleFunction } from "../legacy/messageHandler";
import { Message, Client } from "discord.js";

export const add = {
  name: "add",
  description: "Fügt Sound zu Playlist hinzu",
  usage: `[${config.prefix}add url]`,
  roles: [RoleNames.spinner, roleIds.trusted],
  execute: ({ discord: { message, client }, custom }) => addToAudioQueue(message, client)
} as messageHandleFunction;

const addToAudioQueue = (message: Message, client: Client) =>
  getStreamFromYouTubeLink(message)
    .then((audioElement: audioQueueElement) => addToQueue(audioElement))
    .catch(error => console.log(error));
