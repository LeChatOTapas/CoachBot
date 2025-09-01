const fs = require("node:fs");
const path = require("node:path");
const { Collection, MessageFlags } = require("discord.js");

module.exports = (client) => {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, "..", "commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[AVERTISSEMENT] La commande à ${filePath} manque une propriété "data" ou "execute" requise.`
      );
    }
  }

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `Aucune commande correspondant à ${interaction.commandName} n'a été trouvée.`
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content:
            "Une erreur s'est produite lors de l'exécution de cette commande !",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content:
            "Une erreur s'est produite lors de l'exécution de cette commande !",
          ephemeral: true,
        });
      }
    }
  });
};
