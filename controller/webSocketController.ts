import { fillStateProp } from "./stateController";
import { readJsonFile, writeJsonFile, checkIfFileExists } from "./JSONController";
import { lovooUserEntry } from "./botController";

export const handleWebSocketMessage = (wsMessage: any) => {
  try {
    if (
      (handlePayloadType as any)[wsMessage.type] !== undefined &&
      typeof (handlePayloadType as any)[wsMessage.type] === "function"
    ) {
      (handlePayloadType as any)[wsMessage.type](wsMessage.payload);
    } else throw `could not find function for ${wsMessage.type}`;
  } catch (error) {
    console.log(error);
  }
};

const handlePayloadType = {
  loadLovoo: (payload: any) => loadLovoo(payload)
};

const loadLovoo = (payload: any) =>
  fillStateProp("lovooArray", payload)
    .then(async newState => {
      try {
        console.log(checkIfFileExists("lovoouser.json"));
        const json = await readJsonFile("lovoouser.json");
        const resp = await writeJsonFile(
          "lovoouser.json",
          JSON.stringify([...((json as lovooUserEntry[]) || []), ...payload])
        );
        console.log(resp);
      } catch (error) {
        console.error(error);
        return;
      }
      console.log(newState);
    })
    .catch(error => console.log(error));
