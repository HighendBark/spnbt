import { commandProps, mappedRoles, config } from "../bot";
import { loadCommands, chunk } from "../controller/botController";
import { messageHandleFunction } from "../legacy/messageHandler";
import { getState, setState, State } from "../controller/stateController";

export const reloadCommands = {
  name: "reloadCommands",
  description: "Stößt einen Reload der Funktionsmodule an.",
  usage: `[${config.prefix}reloadCommands]`,
  roles: [mappedRoles.spinner, mappedRoles.trusted],
  execute: (props: commandProps) => reloadCommand(props)
} as messageHandleFunction;
const reloadCommand = ({ discord: { message, client }, custom }: commandProps) => {
  const oldState = getState();
  setState({ commands: undefined }).then(emptyState => {
    console.log(emptyState);
    loadCommands()
      .then(commands => {
        setState({ commands: commands }).then(newState => {
          console.log(getDifference(newState, oldState));
          message.author.createDM().then(channel => {
            channel.send("Folgende Befehle sind geladen:");
            channel.send("------------------------------------");
            let commandNameList = chunk(newState.commands.map(cmd => cmd.name), 5);
            commandNameList.map(chun => {
              channel.send((chun.length > 0 && [...chun, "-"]) || "Keine?");
            });
          });
        });
      })
      .catch(error => {
        console.log("Fehler im reload");
        console.log(error);
        setState(oldState);
      });
  });
  message.delete(250);
};

const getDifference = (newState: State, oldState: State) => {
  return newState.commands
    .filter(cmd => {
      let oldCommand = oldState.commands.filter(entry => entry.name == cmd.name);
      if (oldCommand.first() !== undefined)
        return Object.keys(cmd).some(key => (cmd as any)[key] !== (oldCommand.first() as any)[key]);
      return true;
    })
    .map(entry => entry.name);
};
