import { Message, Client, ChannelLogsQueryOptions, GuildMember, DMChannel } from "discord.js";
import { playAudio, helpTextTrusted } from "./messageHandlerTrusted";
import { helpTextPleb } from "./messageHandlerPleb";
import { channelIds, roleIds, userIds } from "./bot";
import { stripMemberOfAllRoles, globalObject, getState } from "./shared";

export interface messageHandleObjectAdmin {
  help: (message: Message, client?: Client) => void;
  leavevoice: (message: Message, client?: Client) => void;
  joinvoice: (message: Message, client?: Client) => void;
  knock: (message: Message, client?: Client) => void;
  cheer: (message: Message, client?: Client) => void;
  playLoud: (message: Message, client?: Client) => void;
  clearFails: (message: Message, client?: Client) => void;
  moveAndKeep: (message: Message, client?: Client) => void;
  test: (message: Message, client?: Client) => void;
  poop: (message: Message, client?: Client) => void;
  renameAdrian: (message: Message, client?: Client, global?: any) => void;
  getLovooAmount: (message: Message, client?: Client) => void;
}

export const messageHandleObjectAdmin = {
  help: (message: Message) => writeHelpMessage(message),
  leavevoice: (message: Message) => leaveVoiceChannel(message),
  joinvoice: (message: Message, client?: Client) => enterVoiceChannel(message, client),
  knock: (message: Message) => playKnockSound(message),
  cheer: (message: Message) => playCheer(message),
  playLoud: (message: Message) => {
    let url = message.content.slice("!playLoud ".length);
    if (!!~url.indexOf('"')) {
      url = url.replace('"', "");
    }
    playAudio(message, true, url, undefined, 1);
  },
  clearFails: (message: Message, client?: Client) => clearFailedCommands(message, client),
  moveAndKeep: (message: Message, client?: Client) => moveAndKeepUserInChannel(message, client),
  test: (message: Message, client?: Client) => executeTestFunction(message, client),
  poop: (message: Message, client?: Client) => poopCommand(message, client),
  renameAdrian: (message: Message, client?: Client, global?: globalObject) =>
    renameAdrian(message, client, global),
  getLovooAmount: (message: Message, client?: Client) => getLovooAmount(message, client)
} as messageHandleObjectAdmin;

export const helpTextSpinner = [
  "===============",
  "Funktionen für Spinner: ",
  "------------------------",
  "!help - Übersicht",
  "!leavevoice - lässt den Bot den VoiceChannel verlassen",
  "!joinvoice - lässt den Bot den VoiceChannel beitreten",
  "!knock - spielt Klopfgeräusch ab",
  "!cheer - spielt weiblichen Jubel ab",
  "!playLoud - gleich wie !play, nur laut",
  "!clearFails - löscht alle gefailten commands",
  "!moveAndKeep  - Moved einen User in die Stille Treppe und behält ihn dort",
  "!test - zum testen von Funktionen; wechselt stetig; bitte vorsichtig benutzen",
  "!poop - weist eine Person der Poopgruppe zu",
  "!renameAdrian - nennt Adrian um zu 'Omniadrimon' / toggle ob dies automatisch passieren soll",
  "!getLovooAmount - gibt die Anzahl der Lovoo-User im 'Speicher' zurück."
].join("\r");

const writeHelpMessage = async (message: Message) => {
  try {
    message.author.createDM().then(channel => {
      channel.send(helpTextSpinner);
      channel.send(helpTextTrusted);
      channel.send(helpTextPleb);
      channel.send("------------------------");
      channel.send(`Habe einen schönen Tag ${message.author.username}!`);
    });
    message.delete();
  } catch (error) {
    return console.log(error);
  }
};

const executeTestFunction = (message: Message, client: Client) => {
  console.log("TEST");

  message.deletable && message.delete(250);
};

const getLovooAmount = (message: Message, client: Client) => {
  let currentState = getState();
  if (currentState.lovooArray) {
    message.channel
      .send(`Derzeit vorhandene User: ${currentState.lovooArray.length}`)
      .then((msg: Message) => msg.deletable && msg.delete(60000))
      .catch(error => console.log({ caller: "getLovooAmount", error: error }));
  }
  message.deletable && message.delete(250);
};

const renameAdrian = (message: Message, client: Client, currentState: any) => {
  if (message.guild.members.get(userIds.adrian)) {
    if (currentState.renameAdrian !== undefined && currentState.renameAdrian) {
      console.log("Werde nun Adrian umbennen");
      message.guild.members.get(userIds.adrian).setNickname("Omniadrimon");
      currentState["renameAdrian"] = true;
    } else {
      console.log("Werde nun Adrian nichtmehr umbennen");
      currentState.renameAdrian = false;
    }
    message.delete(150);
    return console.log(currentState);
  } else
    message.channel.sendMessage("Adrian ist nicht online").then((msg: Message) => msg.delete(2500));
};

const poopCommand = (message: Message, client: Client) => {
  message.delete(250);
  let userToAssignRoleToID = message.content.slice("!moveAndKeep ".length);
  userToAssignRoleToID = !!~userToAssignRoleToID.indexOf("<@")
    ? userToAssignRoleToID.replace("<@", "").replace(">", "")
    : userToAssignRoleToID;
  userToAssignRoleToID = userToAssignRoleToID.replace(/\\/g, "").replace(" ", "");
  console.log(userToAssignRoleToID);
  message.guild
    .fetchMember(userToAssignRoleToID)
    .then(member =>
      stripMemberOfAllRoles(member).then((member: GuildMember) => member.addRole(roleIds.poop))
    );
};

const moveAndKeepUserInChannel = (message: Message, client: Client) => {
  message.delete(250);
  let userToMoveId = message.content.slice("!moveAndKeep ".length);
  userToMoveId = !!~userToMoveId.indexOf("<@")
    ? userToMoveId.replace("<@", "").replace(">", "")
    : userToMoveId;
  userToMoveId = userToMoveId.replace(/\\/g, "").replace(" ", "");
  console.log(userToMoveId);
  message.guild.fetchMember(userToMoveId).then(member => {
    member.setVoiceChannel(channelIds.stilletreppeVoice).then((member: GuildMember) => {
      message.guild.fetchMember(userToMoveId).then(member => member.setDeaf(true));
      client.on("voiceStateUpdate", (oldMember, newMember) => {
        if (member.id === oldMember.id && member.id === newMember.id) {
          if (
            oldMember.voiceChannel &&
            newMember.voiceChannel &&
            oldMember.voiceChannel.id !== newMember.voiceChannel.id
          ) {
            message.member.setVoiceChannel(channelIds.stilletreppeVoice);
          } else {
            return console.log("User nicht verschoben ");
          }
        }
      });
      member
        .createDM()
        .then((channel: DMChannel) =>
          channel.send("Du wurdest in den Stille Treppe Kanal verschoben")
        );
    });
  });
};

const playCheer = (message: Message) =>
  playAudio(message, true, "https://www.youtube.com/watch?v=Bel7uDcrIho");

const playKnockSound = (message: Message) =>
  playAudio(message, true, "https://www.youtube.com/watch?v=ZqNpXJwgO8o");

const clearFailedCommands = (message: Message, client: Client) => {
  message.channel.fetchMessages({ limit: 25 } as ChannelLogsQueryOptions).then(messages => {
    let messagesWithExclamation = messages.filter(msg => msg.content.slice(0, 1) === "!");
    messagesWithExclamation.forEach(element => {
      if (element.deletable) element.delete();
    });
  });
};

const enterVoiceChannel = (message: Message, client: Client) => {
  const voiceChannel = message.member.voiceChannel;
  message.delete();
  return voiceChannel.joinable ? voiceChannel.join().then(connection => connection) : false;
};

const leaveVoiceChannel = (message: Message) => {
  const voiceChannel = message.member.voiceChannel;
  message.delete();
  if (voiceChannel.connection !== undefined && voiceChannel.connection !== null) {
    voiceChannel.connection.disconnect();
  }
};
