const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../db");

const selectByDiscordId = db.prepare(
  "SELECT discord_id, username, status, coachfoot_id, pseudo, players_json FROM users WHERE discord_id = ?"
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription(
      "Affiche votre profil CoachFoot, ou celui d'un autre utilisateur si mentionné."
    )
    .addUserOption((option) =>
      option
        .setName("utilisateur")
        .setDescription("Utilisateur à consulter")
        .setRequired(false)
    ),
  async execute(interaction) {
    const targetUser =
      interaction.options.getUser("utilisateur") || interaction.user;
    const discordId = targetUser.id;

    try {
      const row = selectByDiscordId.get(discordId);

      if (!row) {
        const embed = new EmbedBuilder()
          .setColor(0xf1c40f)
          .setTitle("Profil introuvable")
          .setDescription(
            targetUser.id === interaction.user.id
              ? "Aucun profil trouvé. Utilisez /link pour démarrer la liaison."
              : "Impossible d'afficher ce profil, cette personne n'a pas lié son compte Discord et CoachFoot."
          )
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Si on consulte quelqu'un d'autre et que son compte n'est pas lié, bloquer l'affichage
      if (
        targetUser.id !== interaction.user.id &&
        (row.status !== "connected" || !row.coachfoot_id)
      ) {
        const embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("Profil non accessible")
          .setDescription(
            "Impossible d'afficher ce profil, cette personne n'a pas lié son compte Discord et CoachFoot."
          )
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Parse players if present
      let playersList = [];
      if (row.players_json) {
        try {
          const parsed = JSON.parse(row.players_json);
          if (Array.isArray(parsed)) {
            playersList = parsed;
          }
        } catch (_) {}
      }

      const playersCount = playersList.length;
      let playersPreview = "Aucun joueur enregistré.";
      if (playersCount > 0) {
        const items = playersList.slice(0, 10).map((p) => {
          if (typeof p === "string" || typeof p === "number") return `• ${p}`;
          if (p && typeof p === "object") {
            // Try common fields
            const label = p.name || p.pseudo || p.username || p.id || null;
            return `• ${label ?? JSON.stringify(p).slice(0, 60)}`;
          }
          return "• [item]";
        });
        playersPreview = `${playersCount} joueurs enregistrés.\n${items.join(
          "\n"
        )}${playersCount > 10 ? `\n… et ${playersCount - 10} de plus` : ""}`;
      }

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(
          targetUser.id === interaction.user.id
            ? "Votre profil CoachFoot"
            : `Profil de ${targetUser.username}`
        )
        .addFields(
          { name: "Discord", value: `@${targetUser.username}`, inline: true },
          {
            name: "Pseudo CoachFoot",
            value: row.pseudo ? `\`${row.pseudo}\`` : "Non lié",
            inline: true,
          },
          { name: "Players", value: playersPreview }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
      return interaction.reply({
        content:
          "Une erreur s'est produite lors de l'affichage du profil. Veuillez réessayer plus tard.",
        ephemeral: true,
      });
    }
  },
};
