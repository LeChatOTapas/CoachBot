import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { commands } from "./handlers/slashCommandHandler.js";

const token = Bun.env.DISCORD_TOKEN;
const clientId = Bun.env.CLIENT_ID;
const guildId = Bun.env.GUILD_ID;

if (!token || !clientId || !guildId) {
  throw new Error("DISCORD_TOKEN, CLIENT_ID and GUILD_ID must be set in .env");
}

const rest = new REST({ version: "10" }).setToken(token);
const body = commands.map((c) => c.data.toJSON());

// Clear global commands to avoid duplicates with guild commands
await rest.put(Routes.applicationCommands(clientId), { body: [] });
console.log("Commandes globales vidées.");

console.log(`Déploiement de ${body.length} commande(s) sur la guilde...`);
await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
console.log("Commandes rechargées avec succès.");
