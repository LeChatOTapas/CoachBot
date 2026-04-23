import { Collection } from "discord.js";
import type { Client, InteractionReplyOptions } from "discord.js";
import type { Command } from "../types/index.js";
import * as ping from "../commands/ping.js";
import * as link from "../commands/link.js";
import * as unlink from "../commands/unlink.js";
import * as profile from "../commands/profile.js";

export const commands: Command[] = [ping, link, unlink, profile];

const commandCollection = new Collection<string, Command>();
for (const command of commands) {
  commandCollection.set(command.data.name, command);
}

export default function slashCommandHandler(client: Client): void {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commandCollection.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`[SlashCommand:${interaction.commandName}]`, error);
      const msg: InteractionReplyOptions = {
        content:
          "Une erreur s'est produite lors de l'exécution de cette commande !",
        flags: "Ephemeral",
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    }
  });
}
