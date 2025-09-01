const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "..", "database.json");

// Fonction pour lire la base de données
function readDb() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: [] }, null, 2));
  }
  const data = fs.readFileSync(dbPath, "utf8");
  return JSON.parse(data);
}

// Fonction pour écrire dans la base de données
function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription("Lie votre compte Discord à votre compte CoachFoot."),
  async execute(interaction) {
    const discordId = interaction.user.id;
    const username = interaction.user.username;
    const link = `https://coachfoot.com/api/link?username=${discordId}`;

    try {
      const db = readDb();
      let userEntry = db.users.find((u) => u.discord_id === discordId);

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
          flags: MessageFlags.Ephemeral,
        });
      }

      // Si l'utilisateur n'est pas connecté, continuer comme avant
      const link = `https://coachfoot.com/api/link?username=${discordId}`;

      if (userEntry) {
        // Mettre à jour l'entrée existante si nécessaire
        userEntry.status = "waiting";
        userEntry.coachfoot_id = null; // Réinitialiser au cas où
      } else {
        // Ajouter une nouvelle entrée
        db.users.push({
          discord_id: discordId,
          username: username,
          status: "waiting",
          coachfoot_id: null,
        });
      }

      writeDb(db);

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
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error(
        "Erreur avec la gestion de la base de données ou l'envoi de la réponse:",
        error
      );
      await interaction.reply({
        content:
          "Une erreur est survenue lors de la création de votre lien. Veuillez réessayer.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
