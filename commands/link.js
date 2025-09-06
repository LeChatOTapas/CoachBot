const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../db");

// Prepared statements
const selectByDiscordId = db.prepare(
  "SELECT * FROM users WHERE discord_id = ?"
);
const insertWaitingUser = db.prepare(
  `INSERT INTO users (discord_id, username, status, coachfoot_id, pseudo, players_json)
   VALUES (@discord_id, @username, 'waiting', NULL, NULL, NULL)`
);
const updateToWaiting = db.prepare(
  `UPDATE users
   SET status = 'waiting', coachfoot_id = NULL, pseudo = NULL, players_json = NULL, username = @username
   WHERE discord_id = @discord_id`
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription("Lie votre compte Discord à votre compte CoachFoot."),
  async execute(interaction) {
    const discordId = interaction.user.id;
    const username = interaction.user.username;
    const link = `https://coachfoot.com/api/link?username=${discordId}`;

    try {
      const userEntry = selectByDiscordId.get(discordId);

      // Vérifier si l'utilisateur est déjà connecté
      if (userEntry && userEntry.status === "connected") {
        const alreadyLinkedEmbed = new EmbedBuilder()
          .setColor(0xffcc00)
          .setTitle("Compte déjà lié")
          .setDescription(
            "Votre compte Discord est déjà associé à un compte CoachFoot."
          )
          .addFields({
            name: "ID CoachFoot",
            value: `\`${userEntry.coachfoot_id}\``,
          })
          .setTimestamp();

        return interaction.reply({
          embeds: [alreadyLinkedEmbed],
          ephemeral: true,
        });
      }

      // Si l'utilisateur n'est pas connecté, continuer comme avant
      // le lien a déjà été défini plus haut

      if (userEntry) {
        // Mettre à jour l'entrée existante en 'waiting' et réinitialiser les champs de lien
        updateToWaiting.run({ discord_id: discordId, username });
      } else {
        // Ajouter une nouvelle entrée en 'waiting'
        insertWaitingUser.run({ discord_id: discordId, username });
      }

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("Lien de votre compte")
        .setDescription(
          `Cliquez sur le lien ci-dessous pour lier votre compte CoachFoot.\n\n**Attention :** Ce lien est unique et personnel.`
        )
        .addFields({ name: "Votre lien", value: link })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } catch (error) {
      console.error(
        "Erreur avec la gestion de la base de données ou l'envoi de la réponse:",
        error
      );
      await interaction.reply({
        content:
          "Une erreur est survenue lors de la création de votre lien. Veuillez réessayer.",
        ephemeral: true,
      });
    }
  },
};
