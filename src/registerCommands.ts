import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { commands } from "./handlers/slashCommandHandler.js";

export async function registerCommands(applicationId: string) {
  const token = Bun.env.DISCORD_TOKEN;
  const guildId = Bun.env.GUILD_ID;

  if (!token) throw new Error("DISCORD_TOKEN must be set");

  const rest = new REST({ version: "10" }).setToken(token);
  const body = commands.map((command) => command.data.toJSON());
  const route = guildId
    ? Routes.applicationGuildCommands(applicationId, guildId)
    : Routes.applicationCommands(applicationId);

  await rest.put(route, { body });
  return {
    count: body.length,
    scope: guildId ? `serveur ${guildId}` : "global",
  };
}
