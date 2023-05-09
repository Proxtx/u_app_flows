import { clients, refreshClients } from "../../private/clients.js";

export class App {
  client;

  constructor(config) {
    this.config = config;
    this.findClient();
  }

  async updateDefinitions() {
    if (!this.client) await this.findClient();
    if (!this.client) return;
    let result = await this.client.request("http", "request", [
      "POST",
      this.config.url,
      JSON.stringify({
        arguments: [this.config.pwd],
        export: "listFlows",
        module: "public/flow.js",
      }),
      "application/json",
    ]);

    for (let functionName in this.definitions.methods)
      delete this[functionName];
    this.updateDefinitions.methods = {};

    if (!result.result.success) return;

    let flows;
    try {
      flows = JSON.parse(result.result.response).data;
    } catch {
      return;
    }

    if (!flows) return;

    for (let flowName of flows) {
      this.definitions.methods[flowName] = {
        arguments: [
          {
            type: "bool",
            value: false,
            name: "Async",
          },
        ],
        name: flowName,
      };

      this[flowName] = async (async) => {
        return await this.client.request("http", "request", [
          "POST",
          this.config.url,
          JSON.stringify({
            arguments: [this.config.pwd, flowName],
            export: "runFlow" + (async ? "" : "Sync"),
            module: "public/flow.js",
          }),
          "application/json",
          10000000,
        ]);
      };
    }
  }

  async findClient() {
    await refreshClients();
    if (clients[this.config.client]) this.client = clients[this.config.client];
  }
}
