import * as websocket from "websocket";
import * as http from "http";

interface webSocketServerProps {
  port: number;
  onMessage: (message: any) => void;
}

export class websocketServer {
  webSocketsServerPort: number;
  Servers: any;
  onMessage: (message: any) => void;
  constructor({ port, onMessage }: webSocketServerProps) {
    this.webSocketsServerPort = port;
    this.Servers = {
      webSocketServer: websocket.server,
      httpServer: http.createServer((request, response) => {
        // Not important for us. We're writing WebSocket server,
        // not HTTP server
      })
    };
    this.onMessage = (message: any) => onMessage(message);
    this.initialise();
  }
  public initialise = () => {
    this.Servers.httpServer.listen(this.webSocketsServerPort, () => {
      console.log(new Date() + " Server is listening on port " + this.webSocketsServerPort);
    });
    this.Servers = {
      ...this.Servers,
      wsServer: new this.Servers.webSocketServer({
        httpServer: this.Servers.httpServer
      })
    };

    this.Servers.wsServer.on("request", (request: any) => {
      let that = this;
      console.log(new Date() + " Connection from origin " + request.origin + ".");
      // accept connection - you should check 'request.origin' to
      // make sure that client is connecting from your website
      // (http://en.wikipedia.org/wiki/Same_origin_policy)
      let connection = request.accept(null, request.origin);
      console.log(new Date() + " Connection accepted.");
      connection.on("message", function(message: any) {
        console.log("message received:");
        console.log(message);
        that.onMessage(JSON.parse(message.utf8Data));
      });
      // user disconnected
      connection.on("close", function(connection: any) {
        console.log("connection terminated: " + connection);
      });
    });
  };
}
