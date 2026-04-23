import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import db from "../db/index.js";
import { generateLinkToken } from "../utils/token.js";
import type { User } from "../types/index.js";

const selectByDiscordId = db.prepare(
  "SELECT * FROM users WHERE discord_id = ?",
);

export const data = new SlashCommandBuilder()
  .setName("link")
  .setDescription("Lie votre compte Discord à votre compte CoachFoot.");

export async function execute(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const username = interaction.user.username;

  try {
    const userEntry = selectByDiscordId.get(discordId) as User | undefined;

    if (userEntry?.status === "connected") {
      const embed = new EmbedBuilder()
        .setColor(0xffcc00)
        .setTitle("Compte déjà lié")
        .setDescription(
          "Votre compte Discord est déjà associé à un compte CoachFoot.",
        )
        .addFields(
          {
            name: "Pseudo CoachFoot",
            value: `\`${userEntry.pseudo ?? "Inconnu"}\``,
          },
          { name: "ID CoachFoot", value: `\`${userEntry.coachfoot_id}\`` },
        )
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
        flags: "Ephemeral",
      });
    }

    if (userEntry) {
      db.prepare(
        "UPDATE users SET status = 'waiting', coachfoot_id = NULL, pseudo = NULL, players_json = NULL, username = ? WHERE discord_id = ?",
      ).run(username, discordId);
    } else {
      db.prepare(
        "INSERT INTO users (discord_id, username, status, coachfoot_id, pseudo, players_json) VALUES (?, ?, 'waiting', NULL, NULL, NULL)",
      ).run(discordId, username);
    }

    const token = await generateLinkToken(discordId);
    const link = `https://coachfoot.com/api/link?token=${token}`;

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("Lien de votre compte")
      .setDescription(
        "Cliquez sur le lien ci-dessous pour lier votre compte CoachFoot.\n\n**Attention :** Ce lien expire dans 10 minutes et ne peut être utilisé qu'une seule fois.",
      )
      .addFields({ name: "Votre lien", value: link })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      flags: "Ephemeral",
    });
  } catch (error) {
    console.error("Erreur lors de la création du lien:", error);
    await interaction.reply({
      content:
        "Une erreur est survenue lors de la création de votre lien. Veuillez réessayer.",
      flags: "Ephemeral",
    });
  }
}
