import { commandProps, RoleNames, config } from "../bot";
import { messageHandleFunction } from "../legacy/messageHandler";
import { Message } from "discord.js";
import { playAudio } from "../controller/shared";

export const knock = {
  name: "knock",
  description: "Spielt ein binaurales Klopfgeräusch ab",
  usage: `[${config.prefix}knock]`,
  roles: [RoleNames.spinner],
  execute: ({ discord: { message, client }, custom }: commandProps) => playKnockSound(message)
} as messageHandleFunction;

const playKnockSound = (message: Message) =>
  playAudio(message, true, "https://www.youtube.com/watch?v=ZqNpXJwgO8o");
