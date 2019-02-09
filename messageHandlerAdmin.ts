import { Message, Client, ChannelLogsQueryOptions, GuildMember, DMChannel } from "discord.js";
import { playAudio, helpTextTrusted } from "./messageHandlerTrusted";
import { helpTextPleb } from "./messageHandlerPleb";
import { channelIds, roleIds, userIds } from "./bot";
import { stripMemberOfAllRoles, State, getState, userToRename } from "./shared";
import { client } from "websocket";

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
  renameUser: (message: Message, client?: Client, global?: any) => void;
  getLovooAmount: (message: Message, client?: Client) => void;
  bulkDelete: (message: Message, client?: Client) => void;
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
  renameUser: (message: Message, client?: Client, global?: State) =>
    renameUser(message, client, global),
  getLovooAmount: (message: Message, client?: Client) => getLovooAmount(message, client),
  bulkDelete: (message: Message, client?: Client) => bulkDelete(message, client)
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
  "!renameUser - nennt User um zu angegebenen Namen / toggle ob dies automatisch passieren soll - !renameUser @[user] [nickname]",
  "!getLovooAmount - gibt die Anzahl der Lovoo-User im 'Speicher' zurück.",
  "!bulkDelete - filtert die letzten 25 Nachrichten nach der ID und löscht diese (Außer gepinnte Nachrichten) - !bulkDelte @[user] ?[anzahl]"
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

const bulkDelete = (message: Message, client: Client) => {
  let [userId, anzahl] = message.content.slice("!renameUser ".length).split(" ");
  userId = userId
    .replace(/<@/g, "")
    .replace(/!/g, "")
    .replace(/>/g, "");
  let parsedAnzahl = anzahl ? parseInt(anzahl) : undefined;
  if (parsedAnzahl > 100) {
    parsedAnzahl = 100;
  }
  console.log({ userid: userId });
  if (message.guild.members.some(member => member.id === userId)) {
    message.channel.fetchMessages({ limit: parsedAnzahl || 25 }).then(msgs => {
      let messagesToBeDeleted = msgs.filter(
        message => message.author.id === userId && !message.pinned
      );
      messagesToBeDeleted.deleteAll();
      message.deletable && message.delete(500);
    });
  } else message.deletable && message.delete(2500);
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

const renameUser = (message: Message, client: Client, currentState: State) => {
  let [userId, nicknameToSet] = message.content.slice("!renameUser ".length).split(" ");
  console.log({ userid: userId, nickname: nicknameToSet });
  userId = userId
    .replace(/<@/g, "")
    .replace(/!/g, "")
    .replace(/>/g, "");
  if (message.guild.members.some(member => member.id === userId)) {
    console.log("user gefunden");
    if (currentState.renameUser.some(userRe => userRe.id === userId)) {
      currentState.renameUser = currentState.renameUser.map(userRe => {
        if (userRe.id === userId) {
          return { ...userRe, isBeingRenamed: !userRe.isBeingRenamed };
        } else return userRe;
      });
    } else
      currentState.renameUser.push({
        id: userId,
        isBeingRenamed: true,
        renameTo: nicknameToSet
      } as userToRename);

    let user = currentState.renameUser.find(user => user.id === userId);
    if (user.isBeingRenamed) {
      message.guild.members.get(user.id).setNickname(nicknameToSet);
      console.log("Werde nun User umbennen");
    } else {
      message.guild.members
        .get(user.id)
        .setNickname(message.guild.members.get(user.id).user.username);
      console.log("Werde nun User nichtmehr umbennen");
    }
  } else
    message.channel
      .send("User nicht gefunden")
      .then((msg: Message) => msg.deletable && msg.delete(15000));
  message.deletable && message.delete(500);
  return console.log(currentState.renameUser);
};

const poopCommand = (message: Message, client: Client) => {
  message.delete(250);
  let userToAssignRoleToID = message.content.slice("!moveAndKeep ".length);
  userToAssignRoleToID = !!~userToAssignRoleToID.indexOf("<@")
    ? userToAssignRoleToID
        .replace(/<@/g, "")
        .replace(/!/g, "")
        .replace(/>/g, "")
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
    ? userToMoveId
        .replace(/<@/g, "")
        .replace(/!/g, "")
        .replace(/>/g, "")
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
