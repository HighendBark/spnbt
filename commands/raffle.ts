import { commandProps, mappedRoles, config, roleIds, auth, userIds } from "../bot";
import { messageHandleFunction, messageHandleProps } from "../legacy/messageHandler";
import {
  Message,
  Client,
  MessageOptions,
  RichEmbed,
  User,
  TextChannel,
  DMChannel,
  GroupDMChannel,
  GuildMember,
  MessageCollector,
} from "discord.js";
import { writeJsonFile, readJsonFile, checkIfFileExists } from "../controller/JSONController";
import * as fs from "fs";
import { sliceMessageFromCommand } from "../controller/helpController";

export interface raffleItem {
  clientname: string;
  id: string;
  hasEnteredRaffle: boolean;
  enteringDate: Date;
}

let props = {
  description: "Trägt den Nutzer ins Raffle ein",
  name: "raffle",
  roles: [mappedRoles.spinner, mappedRoles.trusted, mappedRoles.raffleTeilnehmer],
  usage: `[${config.prefix}raffle]`,
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
          value: props.description,
        },
        {
          name: "Beschreibung",
          value: `Mit ${config.prefix}${props.name} wird der Nutzer in die Liste der Rafflenamen eingetragen.\nBisher Täglich um 20:15 wird daraus der Gewinner gezogen und bekanntgegeben.\n`,
        },
        {
          name: "Im Falle dass du gewinnst",
          value: `Solltest du gewinnen, wirst du 5 Minuten Zeit haben, deinen Gewinn zu akzeptieren.\nDies tust du, indem du auf die DM von Bernd mit einem "j" antwortest\n(ohne die Anführungszeichen)\nDu kannst den Gewinn auch ablehnen, dann wird dieser am nächsten Tag erneut verlost.`,
        },
        {
          name: "Derzeitiger Gewinn",
          value: `Folgendes gibt es derzeit zu gewinnen:\n${
            config.raffleWinDescription !== -1 ? config.raffleWinDescription : "Nichts :("
          }`,
        },
      ],
    } as RichEmbed,
  },
} as messageHandleFunction;

const writeEntryAndSendMessages = (
  userOfRequest: User,
  messageChannel: TextChannel | DMChannel | GroupDMChannel
) =>
  new Promise((resolve, reject) => {
    writeEntryForUser(userOfRequest)
      .then(() => {
        messageChannel.send(" du wurdest dem Raffle hinzugefügt! Viel Glück!", {
          reply: userOfRequest,
        } as MessageOptions);
      })
      .catch((err) => {
        if (typeof err === "string") {
          messageChannel
            .send(err, { reply: userOfRequest } as MessageOptions)
            .then(
              (msg: Message) => msg.deletable && msg.delete(5000).catch((err) => console.log(err))
            )
            .catch((err) => console.log(err));
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
        addUserToRaffle(userOfRequest, users).then(resolve).catch(reject);
      })
      .catch(reject);
  }) as Promise<void>;

const addUserToRaffle = (userOfRequest: User, users: raffleItem[]) => {
  return new Promise((resolve, reject) => {
    const userList = users;
    if (
      (userList as any).empty === undefined &&
      userList.some((usr) => usr.id === userOfRequest.id && usr.hasEnteredRaffle)
    ) {
      return reject(" du bist bereits in der Liste! Bald wird ein Sieger bekanntgegeben!");
    } else {
      let newUserList =
        (userList as any).empty !== undefined
          ? [
              {
                clientname: userOfRequest.username,
                id: userOfRequest.id,
                hasEnteredRaffle: true,
                enteringDate: new Date(),
              },
            ]
          : [
              ...userList,
              {
                clientname: userOfRequest.username,
                id: userOfRequest.id,
                hasEnteredRaffle: true,
                enteringDate: new Date(),
              },
            ];
      writeJsonFile(config.raffleFileName, JSON.stringify(newUserList))
        .then(() => {
          return resolve();
        })
        .catch((err) => {
          return reject({ caller: "addUserToRaffle", error: err });
        });
    }
  }) as Promise<void>;
};

const handleRaffleRequest = (message: Message, client: Client) => {
  let userOfRequest = message.author;
  const messageChannel = message.channel;
  if (message.member.roles.has(roleIds.spinner)) {
    if (message.mentions.users.size > 0) {
      userOfRequest = message.mentions.users.first();
      if (
        !message.guild.members
          .get(message.mentions.users.first().id)
          .roles.has(roleIds.raffleTeilnehmer)
      ) {
        message.guild.members
          .get(message.mentions.users.first().id)
          .addRole(roleIds.raffleTeilnehmer)
          .then((member) => {
            message.channel.send(
              `${message.author} hat dich soeben zum Raffle hinzugefügt und dir die neue Rolle ${
                message.guild.roles.get(roleIds.raffleTeilnehmer).name
              } zugewiesen. Viel Glück! 🍀`,
              { reply: member } as MessageOptions
            );
          });
      }
    } else {
      const { args } = sliceMessageFromCommand(message);
      if (args.length > 0) {
        if (args.some((entry) => entry === "win")) {
          message.deletable && message.delete();
          readJsonFile("./configs/config.json").then((content: config) => {
            messageChannel
              .send(`**Neuer Rafflewin!**\n\n---\nFolgendes gibt es zu Gewinnen:\n\n`)
              .then((msg) => messageChannel.send(`${content.raffleWinDescription}`));
          });
          return;
        }
        if (args.some((entry) => entry === "list")) {
          message.deletable && message.delete();
          let messageToSend: string | string[] = "Datei nicht gefunden";
          if (fs.existsSync(config.raffleFileName)) {
            return readJsonFile(config.raffleFileName).then((userlist: raffleItem[]) => {
              messageToSend =
                userlist &&
                userlist
                  .filter((usr) => usr.hasEnteredRaffle)
                  .map(
                    (entry) =>
                      `${entry.clientname}: ${new Date(entry.enteringDate).toLocaleDateString(
                        "de-DE",
                        {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}`
                  );
              return messageChannel.send(
                ["Folgende Personen haben sich im Raffle eingetragen:", ...messageToSend],
                { split: true }
              );
            });
          } else return messageChannel.send(messageToSend);
        }
        if (args.some((entry) => entry === "add")) {
          const raffleWinToAdd: { desc: string; key: string } = { desc: "Empty", key: "Empty" };

          userOfRequest.createDM().then((channel: DMChannel) => {
            const getDescription = () =>
              new Promise<void>((resolve, reject) => {
                try {
                  userOfRequest.send("Beschreibung des Gewinnes? **(Nicht der Key)**");
                  const messageCollector = new MessageCollector(
                    channel,
                    (message: Message) => message.author === channel.recipient,
                    { max: 1, time: 60000 * 5 }
                  );
                  messageCollector.on("collect", (element) => {
                    channel.send(`Beschreibung: **${element.content}**`);
                    raffleWinToAdd.desc = element.content;
                    return resolve();
                  });
                } catch (error) {
                  return reject({ caller: "raffle add", error: error });
                }
              });
            const getKey = () =>
              new Promise<void>((resolve, reject) => {
                try {
                  userOfRequest.send("Gewinn? **(Der Key)**");
                  const keyCollector = new MessageCollector(
                    channel,
                    (message: Message) => message.author === channel.recipient,
                    { max: 1, time: 60000 * 5 }
                  );
                  keyCollector.on("collect", (element) => {
                    channel.send(`Key: **${element.content}**`);
                    raffleWinToAdd.key = element.content;
                    return resolve();
                  });
                } catch (error) {
                  return reject({ caller: "raffle add", error: error });
                }
              });

            getDescription().then(() =>
              getKey().then(() => {
                channel.send(
                  [
                    `---`,
                    `Folgendes wird ins Raffle eingetragen: `,
                    `Beschreibung: **${raffleWinToAdd.desc}**`,
                    `Key: **${raffleWinToAdd.key}**`,
                    `_Bitte warten..._`,
                  ],
                  { split: true }
                );
                const writingFiles: Promise<any>[] = [
                  new Promise((resolve, reject) => {
                    readJsonFile("./configs/auth.json")
                      .then((content: auth) => {
                        const tempAuth: auth = { ...content, raffleWin: raffleWinToAdd.key };
                        resolve(
                          writeJsonFile("./configs/auth.json", JSON.stringify(tempAuth)).then(() =>
                            channel.send("Key eingetragen")
                          )
                        );
                      })
                      .catch((error) => {
                        console.log({ caller: "raffle add key", error: error });
                        return reject();
                      });
                  }) as Promise<Promise<any>>,
                  new Promise((resolve, reject) => {
                    readJsonFile("./configs/config.json").then((content: config) => {
                      const tempConfig: config = {
                        ...content,
                        raffleWinDescription: raffleWinToAdd.desc,
                      };
                      resolve(
                        writeJsonFile("./configs/config.json", JSON.stringify(tempConfig))
                          .then(() => channel.send("Beschreibung eingetragen"))
                          .catch((error) => {
                            console.log({ caller: "raffle add desc", error: error });
                            return reject(error);
                          })
                      );
                    });
                  }) as Promise<Promise<any>>,
                ];

                Promise.all(writingFiles).then(() => {
                  channel.send([`**Fertig**`, `Vielen Dank für die Nutzung vom Brot`], {
                    split: true,
                  });
                });
              })
            );

            message.deletable && message.delete();
          });
        }
        if (args.some((entry) => entry === "key")) {
          if (userOfRequest.id === userIds.olaf) {
            message.deletable && message.delete();
            readJsonFile("./configs/auth.json").then((content: auth) => {
              userOfRequest.send(content.raffleWin);
            });
          } else {
            userOfRequest.send("Dir fehlen die Rechte den Key einzusehen");
          }
        }
        if (args.some((entry) => entry === "desc")) {
          message.deletable && message.delete();
          readJsonFile("./configs/config.json").then((content: config) => {
            userOfRequest.send(content.raffleWinDescription);
          });
        }
        return;
      }
    }
  }

  message.deletable && message.delete(250).catch((err) => console.log(err));

  if (fs.existsSync(config.raffleFileName)) {
    writeEntryAndSendMessages(userOfRequest, messageChannel).catch((err) =>
      console.log({ caller: "handleRaffleRequest", error: err })
    );
  } else {
    writeJsonFile(config.raffleFileName, JSON.stringify({ empty: true }))
      .then(() =>
        writeEntryAndSendMessages(userOfRequest, messageChannel).catch((err) =>
          console.log({ caller: "handleRaffleRequest", error: err })
        )
      )
      .catch((err) => console.log(err));
  }
};
