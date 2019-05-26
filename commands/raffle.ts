import { commandProps, RoleNames, config, roleIds } from "../bot";
import { messageHandleFunction, messageHandleProps } from "../legacy/messageHandler";
import {
  Message,
  Client,
  MessageOptions,
  RichEmbed,
  User,
  TextChannel,
  DMChannel,
  GroupDMChannel
} from "discord.js";
import { writeJsonFile, readJsonFile, checkIfFileExists } from "../controller/JSONController";
import { getState } from "../controller/stateController";
import * as fs from "fs";

let props = {
  description: "Trägt den Nutzer ins Raffle ein",
  name: "raffle",
  roles: [RoleNames.spinner, RoleNames.trusted],
  usage: `[${config.prefix}raffle]`
} as messageHandleProps;

export const raffle = {
  ...props,
  execute: ({ discord: { message, client }, custom }: commandProps) =>
    handleRaffleRequest(message, client),
  detailedInformation: {
    embed: {
      color: 0x3abeff,
      title: `${props.name}`,
      fields: [
        { name: "Nutzung", value: props.usage },
        {
          name: "Kurzbeschreibung",
          value: props.description
        },
        {
          name: "Beschreibung",
          value: `Mit ${config.prefix}${
            props.name
          } wird der Nutzer in die Liste der Rafflenamen eingetragen. Nach einem Zeitraum wird daraus der Gewinner gezogen und bekanntgegeben.`
        }
      ]
    } as RichEmbed
  }
} as messageHandleFunction;

interface raffleItem {
  clientname: string;
  id: string;
  hasEnteredRaffle: boolean;
  enteringDate: Date;
}

const getRandomWinner = () => {
  function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return new Promise((resolve, reject) => {
    if (fs.existsSync(config.raffleFileName)) {
      readJsonFile(config.raffleFileName).then(data => {
        if ((data as any).empty !== undefined) {
          const userList = data;
        } else reject("Es scheint, als hätte keiner hat am Raffle teilgenommen :(");
      });
    } else reject({ caller: "getRandomWinner", error: "Raffle Datei existiert nicht." });
  }) as Promise<string>;
};

const writeEntryAndSendMessages = (
  userOfRequest: User,
  messageChannel: TextChannel | DMChannel | GroupDMChannel
) =>
  new Promise((resolve, reject) => {
    writeEntryForUser(userOfRequest)
      .then(() => {
        messageChannel
          .send("User wurde dem Raffle hinzugefügt")
          .then((msg: Message) => msg.deletable && msg.delete(5000).catch(err => console.log(err)));
      })
      .catch(err => {
        if (typeof err === "string") {
          messageChannel
            .send(err)
            .then(
              (msg: Message) => msg.deletable && msg.delete(5000).catch(err => console.log(err))
            )
            .catch(err => console.log(err));
          return resolve();
        } else {
          console.log({ caller: "writeEntryAndSendMessages", error: err });
          return reject();
        }
      });
  }) as Promise<void>;

const writeEntryForUser = (userOfRequest: User) =>
  new Promise((resolve, reject) => {
    readJsonFile(config.raffleFileName)
      .then((users: raffleItem[]) => {
        addUserToRaffle(userOfRequest, users)
          .then(resolve)
          .catch(reject);
      })
      .catch(reject);
  }) as Promise<void>;

const addUserToRaffle = (userOfRequest: User, users: raffleItem[]) => {
  return new Promise((resolve, reject) => {
    const userList = users;
    if (
      (userList as any).empty === undefined &&
      userList.some(usr => usr.id === userOfRequest.id && usr.hasEnteredRaffle)
    ) {
      return reject("User ist bereits in der Liste und nimmt teil");
    } else {
      let newUserList =
        (userList as any).empty !== undefined
          ? [
              {
                clientname: userOfRequest.username,
                id: userOfRequest.id,
                hasEnteredRaffle: true,
                enteringDate: new Date()
              }
            ]
          : [
              ...userList,
              {
                clientname: userOfRequest.username,
                id: userOfRequest.id,
                hasEnteredRaffle: true,
                enteringDate: new Date()
              }
            ];
      writeJsonFile(config.raffleFileName, JSON.stringify(newUserList))
        .then(() => {
          return resolve();
        })
        .catch(err => {
          return reject({ caller: "addUserToRaffle", error: err });
        });
    }
  }) as Promise<void>;
};

const handleRaffleRequest = (message: Message, client: Client) => {
  const userOfRequest = message.author;
  const messageChannel = message.channel;

  message.deletable && message.delete(250).catch(err => console.log(err));

  if (fs.existsSync(config.raffleFileName)) {
    writeEntryAndSendMessages(userOfRequest, messageChannel).catch(err =>
      console.log({ caller: "handleRaffleRequest", error: err })
    );
  } else {
    writeJsonFile(config.raffleFileName, JSON.stringify({ empty: true }))
      .then(() =>
        writeEntryAndSendMessages(userOfRequest, messageChannel).catch(err =>
          console.log({ caller: "handleRaffleRequest", error: err })
        )
      )
      .catch(err => console.log(err));
  }
};