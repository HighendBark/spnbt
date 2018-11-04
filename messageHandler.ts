import {
  Attachment,
  Client,
  MessageOptions,
  Message,
  TextChannel,
  MessageCollector
} from "discord.js";
import { auth } from "./bot";
const auth: auth = require("./auth.json");
const Twitter = require("twitter");
import * as ytdl from "ytdl-core";
import { ReadStream } from "tty";

const twitterClient = new Twitter({
  consumer_key: auth.consumer_key,
  consumer_secret: auth.consumer_secret,
  access_token_key: auth.access_token_key,
  access_token_secret: auth.access_token_secret
});

export interface messageHandleObject {
  "!test": () => void;
  "!hallo": (message: Message, client?: Client) => void;
  "!daddy": (message: Message, client?: Client) => void;
  "!twitter": (message: Message, client?: Client) => void;
  "!help": (message: Message, client?: Client) => void;
  "!natalieneu": (message: Message, client?: Client) => void;
  "!inspire": (message: Message, client?: Client) => void;
  "!mindful": (message: Message, client?: Client) => void;
  "!flachbader": (message: Message, client?: Client) => void;
  "!play": (message: Message, client?: Client) => void;
  rigged: (message: Message, client?: Client) => void;
  "!pin": (message: Message, client?: Client) => void;
  "!wiki": (message: Message, client?: Client) => void;
  "!inspireMode": (message: Message, client?: Client) => void;
}

const helpText = [
  "Funktionen: ",
  "------------------------",
  "!help - Übersicht",
  "!daddy - Bildniss der Daddygames",
  "!natalieneu - neuster Tweet",
  '!twitter "hashtag" - holt sich die 5 neusten Tweets zum Hashtag',
  "!inspire - Zufällige KI generierter Quote",
  "!inspireMode - Zufällige KI generierter Quote; alle 2 Minuten",
  "!mindful - Zufällige KI generierte Mindful Session",
  "!flachbader - Flachbader Song",
  "!play url - Spielt Youtube URL ab",
  '!pin "message" user - Pinnt die Nachricht mit dem Aktuellen Datum an',
  '!wiki searchterm - Gibt eine Auswahl für den Begriff zurück => Nummer => "!link" eintippen wenn link gewünscht'
].join("\r");

let currentState = {
  isPlayingAudio: false,
  isInspiring: false
};

const repeatInspire: (message: Message) => void = (message: Message) => {
  return setTimeout(() => sendInspiringMessage(message).then(() => repeatInspire(message)), 120000);
};

const sendInspiringMessage = (message: Message) =>
  new Promise((resolve, reject) => {
    fetch("http://inspirobot.me/api?generate=true")
      .then(response => response.text())
      .then(data => {
        console.log(data);
        const attachment = new Attachment(data);
        message.channel
          .send(attachment as MessageOptions)
          .then(msg => {
            if (message.delete) message.delete();
            (msg as Message).delete(120000);
            return resolve();
          })
          .catch(error => reject(error));
      });
  });

export const messageHandleObject = {
  "!help": async (message: Message, client?: Client) => {
    try {
      const msg = await message.reply(helpText);
      message.delete();
      (msg as Message).delete(30000);
    } catch (error) {
      return console.log(error);
    }
  },
  "!test": () => console.log("Hallo welt!"),
  "!knock": (message: Message, client?: Client) => {
    if (!currentState.isPlayingAudio) {
      message.delete();
      currentState.isPlayingAudio = true;
      try {
        const stream = ytdl("https://www.youtube.com/watch?v=ZqNpXJwgO8o", {
          filter: "audioonly"
        });
        const voiceChannel = message.member.voiceChannel;
        if (!voiceChannel) return;
        voiceChannel
          .join()
          .then(connection => {
            const dispatcher = connection.playStream(stream, {
              volume: 1,
              seek: 0
            });
            dispatcher.on("end", end => {
              // voiceChannel.leave();
              currentState.isPlayingAudio = false;
            });
          })
          .catch(error => console.log(error));
      } catch (error) {
        message.channel
          .send(`Could not play link; Invalid Link?`)
          .then(msg => {
            message.delete();
            (msg as Message).delete(8000);
          })
          .catch(error => console.log(error));
      }
    } else return;
  },
  "!hallo": async (message: Message, client?: Client) => {
    try {
      const msg = await message.reply(`hallo.`);
      message.delete();
      (msg as Message).delete(120000);
    } catch (error) {
      return console.log(error);
    }
  },
  "!daddy": async (message: Message, client?: Client) => {
    const attachment = new Attachment(
      "https://media.discordapp.net/attachments/403672009353199620/500799691647090688/66cb2f9c-d18f-4073-a84a-835d79f3e3e0.png"
    );
    try {
      const msg = await message.channel.send(attachment as MessageOptions);
      message.delete();
      (msg as Message).delete(120000);
    } catch (error) {
      return console.log(error);
    }
  },
  "!twitter": (message: Message, client?: Client) => {
    let hashtag = message.content.split('"')[1];
    const maxCount = 5;
    let currentCount = 0;
    console.log(`Listening to: ${hashtag}`);
    message.delete();
    twitterClient.stream("statuses/filter", { track: hashtag }, function(stream: ReadStream) {
      (client.channels.get("403672009353199620") as TextChannel)
        .send(`Listening to: ${hashtag}`)
        .then(msg => {
          (msg as Message).delete(120000);
        })
        .catch(error => console.log(error));
      stream.on("data", function(event: any) {
        if (currentCount >= maxCount) {
          (client.channels.get("403672009353199620") as TextChannel)
            .send(`No longer Listening`)
            .then(msg => {
              (msg as Message).delete(120000);
            })
            .catch(error => console.log(error));
          return stream.destroy();
        }
        currentCount++;
        console.log(event);
        (client.channels.get("403672009353199620") as TextChannel)
          .send(
            `
            ${event.user.name}: ${
              event["extended_tweet"] !== undefined ? event.extended_tweet : event.text
            }`
          )
          .then(msg => {
            (msg as Message).delete(120000);
          })
          .catch(error => console.log(error));
      });
      stream.on("error", function(error: any) {
        throw error;
      });
    });
  },
  "!natalieneu": (message: Message, client?: Client) => {
    twitterClient.get(
      "statuses/user_timeline",
      { user_id: "1053658318743441408", count: 3 },
      (error: any, tweets: any, response: any) => {
        tweets.forEach(async (element: any) => {
          try {
            const msg = await message.channel.send(element.text);
            message.delete();
            (msg as Message).delete(120000);
          } catch (error) {
            return console.log(error);
          }
        });
      }
    );
  },
  "!inspireMode": (message: Message, client?: Client) => {
    if (!currentState.isInspiring) {
      let messageCopy = { ...message } as Message;
      return sendInspiringMessage(message)
        .then(() => {
          currentState.isInspiring = true;
          return repeatInspire(messageCopy);
        })
        .catch(error => console.error(error));
    } else {
      message.channel
        .send(`Is already Inspiring~`)
        .then(msg => {
          message.delete();
          (msg as Message).delete(8000);
        })
        .catch(error => console.log(error));
    }
  },
  "!inspire": (message: Message, client?: Client) => sendInspiringMessage(message),
  "!mindful": (message: Message, client?: Client) => {
    if (!currentState.isPlayingAudio) {
      message.delete();
      currentState.isPlayingAudio = true;
      fetch(
        "http://inspirobot.me/api?generateFlow=1&sessionID=a473f800-395a-4e38-9766-1227cf8b2299"
      )
        .then(response => response.json())
        .then(data => {
          const voiceChannel = message.member.voiceChannel;
          let textAndImages = data.data;
          voiceChannel
            .join()
            .then(connection => {
              fetch(data.mp3 as any)
                .then(response => response.body)
                .then(stream => {
                  const dispatcher = connection.playStream(stream as any, {
                    volume: 0.45,
                    seek: 0
                  });
                  console.log(textAndImages);
                  let qoutes = textAndImages.filter((element: any) => element.type === "quote");
                  qoutes.forEach((quote: any) => {
                    setTimeout(
                      () =>
                        message.channel
                          .send(quote.text)
                          .then(msg => {
                            (msg as Message).delete(45000);
                          })
                          .catch(error => console.log(error)),
                      quote.time * 1000 - 250
                    );
                  });
                  dispatcher.on("end", end => {
                    // voiceChannel.leave();
                    currentState.isPlayingAudio = false;
                  });
                })
                .catch(error3 => console.log(error3));
            })
            .catch(error2 => console.log(error2));
        })
        .catch(error1 => console.log(error1));
    }
  },
  "!flachbader": (message: Message, client?: Client) => {
    if (!currentState.isPlayingAudio) {
      currentState.isPlayingAudio = true;
      message.delete();
      const voiceChannel = message.member.voiceChannel;
      voiceChannel
        .join()
        .then(connection => {
          const stream = ytdl("https://www.youtube.com/F62LEVZYMog", {
            filter: "audioonly",
            begin: "1m17s"
          });
          const dispatcher = connection.playStream(stream, {
            volume: 0.25,
            seek: 0
          });
          dispatcher.on("end", end => {
            // voiceChannel.leave();
            currentState.isPlayingAudio = false;
          });
        })
        .catch(error => console.log(error));
    } else return;
  },
  "!play": (message: Message, client?: Client) => {
    if (!currentState.isPlayingAudio) {
      try {
        currentState.isPlayingAudio = true;
        let url = message.content.slice("!play ".length);
        if (!!~url.indexOf('"')) {
          url = url.replace('"', "");
        }
        const stream = ytdl(url, {
          filter: "audioonly"
        });
        if (stream === undefined) return;
        const voiceChannel = message.member.voiceChannel;
        if (voiceChannel.connection !== undefined && voiceChannel.connection !== null) {
          const dispatcher = voiceChannel.connection.playStream(stream, {
            volume: 0.25,
            seek: 0
          });
          dispatcher.on("end", end => {
            message.delete();
            // voiceChannel.leave();
            currentState.isPlayingAudio = false;
          });
        } else {
          voiceChannel
            .join()
            .then(connection => {
              const dispatcher = connection.playStream(stream, {
                volume: 0.25,
                seek: 0
              });
              dispatcher.on("end", end => {
                message.delete();
                // voiceChannel.leave();
                currentState.isPlayingAudio = false;
              });
            })
            .catch(error => console.log(error));
        }
      } catch (error) {
        console.log(error);
        currentState.isPlayingAudio = false;
        message.channel
          .send(`Could not play link; Invalid Link?`)
          .then(msg => {
            message.delete();
            (msg as Message).delete(8000);
          })
          .catch(error => console.log(error));
      }
    } else {
      console.log(currentState);
      return console.log("Something went wrong;");
    }
  },
  rigged: (message: Message, client?: Client) => {
    const attachment = new Attachment(
      "https://images-na.ssl-images-amazon.com/images/I/71GV79NPpZL._UX425_.jpg"
    );
    message
      .reply(attachment as MessageOptions)
      .then(msg => {
        message.delete();
        (msg as Message).delete(120000);
      })
      .catch(error => console.log(error));
  },
  "!pin": (message: Message, client?: Client) => {
    let splitMessage = message.content.split('"');
    let messageContent = splitMessage[1];
    let messageUser = splitMessage[2].replace(" ", "");
    let currentDate = new Date();
    let { day, month, year } = {
      day: currentDate.getDate(),
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear()
    };
    message.channel
      .send(`"${messageContent}" - ${messageUser}, ${day}.${month}.${year}`)
      .then(msg => {
        message.delete();
        (msg as Message).pin();
      })
      .catch(error => console.log(error));
  },
  "!wiki": (message: Message, client?: Client) => {
    let stringToSearch = message.content.slice("!wiki ".length);
    if (!!~stringToSearch.indexOf('"')) {
      stringToSearch = stringToSearch.replace('"', "");
    }
    if (stringToSearch !== "" && stringToSearch !== undefined) {
      fetch(
        `https://de.wikipedia.org/w/api.php?&origin=*&action=opensearch&search=${stringToSearch}&limit=12`
      )
        .then(resp => resp.json())
        .then(data => {
          const [searchTerm, headLines, descriptions, links] = data;
          message
            .reply(
              `will wissen, 'was ist ${searchTerm} tho?' => \r ${headLines
                .map(
                  (headline: string, idx: number) =>
                    !~descriptions[idx].indexOf(`steht für:`) ? idx + ": " + headline + "\r " : ""
                )
                .join("")}`
            )
            .then(msg => {
              message.delete();
              let timeToDeletion = 20000;
              let lastItem: number = undefined;
              const collector = new MessageCollector(
                message.channel,
                m => m.author.id === message.author.id,
                { time: timeToDeletion }
              );
              collector.on("collect", (followUpMessage: Message) => {
                if (followUpMessage.content === "!link" && lastItem !== undefined) {
                  followUpMessage.delete();
                  followUpMessage
                    .reply(links[lastItem])
                    .then(fmsg => (fmsg as Message).delete(120000));
                }
                let messageNumber = parseInt(followUpMessage.content);
                if (messageNumber <= headLines.length) {
                  lastItem = messageNumber;
                  followUpMessage.delete();
                  followUpMessage
                    .reply(descriptions[messageNumber])
                    .then(fmsg => (fmsg as Message).delete(120000));
                }
              });
              (msg as Message).delete(timeToDeletion);
            })
            .catch(error => console.log(error));
        });
    }
  }
} as messageHandleObject;
