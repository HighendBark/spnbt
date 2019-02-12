import { commandProps, RoleNames, config, roleIds } from "../bot";
import { writeHelpMessage, playAudio } from "../controller/shared";
import { messageHandleFunction } from "../legacy/messageHandler";

export const play = {
  name: "play",
  description: "zum playen von Funktionen; wechselt stetig; bitte vorsichtig benutzen",
  usage: `[${config.prefix}play url]`,
  roles: [RoleNames.spinner, roleIds.trusted],
  execute: ({ discord: { message, client }, custom }) => {
    let url = message.content.slice("!play ".length);
    if (!!~url.indexOf('"')) {
      url = url.replace('"', "");
    }
    playAudio(message, true, url);
  }
} as messageHandleFunction;
