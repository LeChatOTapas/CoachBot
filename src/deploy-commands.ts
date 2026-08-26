import { registerCommands } from "./registerCommands.js";

const clientId = Bun.env.CLIENT_ID;

if (!clientId) {
  throw new Error("CLIENT_ID must be set in .env");
}

const deployment = await registerCommands(clientId);
console.log(
  `${deployment.count} commande(s) synchronisée(s) (${deployment.scope}).`,
);
