const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../db");

const deleteByDiscordId = db.prepare("DELETE FROM users WHERE discord_id = ?");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unlink")
    .setDescription(
      "Supprime vos données liées et dissocie votre compte CoachFoot."
    ),
  async execute(interaction) {
    const discordId = interaction.user.id;

    try {
      const result = deleteByDiscordId.run(discordId);

      if (result.changes > 0) {
        const embed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("Compte dissocié")
          .setDescription(
            "Vos données ont été supprimées et votre compte a été dissocié. Vous pouvez relancer /link à tout moment."
          )
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = new EmbedBuilder()
          .setColor(0xf1c40f)
          .setTitle("Aucune donnée trouvée")
          .setDescription(
            "Aucune association existante n'a été trouvée pour votre compte. Vous pouvez utiliser /link pour commencer."
          )
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      console.error("Erreur lors de la suppression des données:", error);
      return interaction.reply({
        content:
          "Une erreur s'est produite lors de la dissociation. Veuillez réessayer plus tard.",
        ephemeral: true,
      });
    }
  },
};
