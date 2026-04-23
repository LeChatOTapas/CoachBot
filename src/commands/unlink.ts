import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import db from "../db/index.js";

export const data = new SlashCommandBuilder()
  .setName("unlink")
  .setDescription(
    "Supprime vos données liées et dissocie votre compte CoachFoot.",
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;

  try {
    const result = db
      .prepare("DELETE FROM users WHERE discord_id = ?")
      .run(discordId);
    db.prepare("DELETE FROM link_tokens WHERE discord_id = ?").run(discordId);

    if (result.changes > 0) {
      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("Compte dissocié")
        .setDescription(
          "Vos données ont été supprimées et votre compte a été dissocié. Vous pouvez relancer /link à tout moment.",
        )
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
        flags: "Ephemeral",
      });
    } else {
      const embed = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle("Aucune donnée trouvée")
        .setDescription(
          "Aucune association existante n'a été trouvée pour votre compte. Vous pouvez utiliser /link pour commencer.",
        )
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
        flags: "Ephemeral",
      });
    }
  } catch (error) {
    console.error("Erreur lors de la suppression des données:", error);
    return interaction.reply({
      content:
        "Une erreur s'est produite lors de la dissociation. Veuillez réessayer plus tard.",
      flags: "Ephemeral",
    });
  }
}
