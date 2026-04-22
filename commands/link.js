// commands/link.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");

const COACHFOOT_API = process.env.COACHFOOT_API_URL; // https://coachfoot.com/api
const BOT_SECRET    = process.env.DISCORD_BOT_SECRET; // même valeur que dans .env Laravel

module.exports = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription("Lie votre compte Discord à votre compte CoachFoot."),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const discordId       = interaction.user.id;
    const discordUsername = interaction.user.username;

    try {
      // 1. Vérifier si déjà lié
      const statusRes = await fetch(`${COACHFOOT_API}/discord/status`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Bot-Secret": BOT_SECRET,
        },
        body: JSON.stringify({ discord_id: discordId }),
      });

      const statusData = await statusRes.json();

      if (statusData.linked) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xffcc00)
              .setTitle("Compte déjà lié")
              .setDescription("Votre compte Discord est déjà associé à CoachFoot.")
              .addFields(
                { name: "Pseudo", value: `\`${statusData.pseudo}\`` },
                { name: "ID CoachFoot", value: `\`${statusData.coachfoot_id}\`` }
              )
              .setTimestamp(),
          ],
        });
      }

      // 2. Générer un token de liaison
      const tokenRes = await fetch(`${COACHFOOT_API}/discord/token/generate`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Bot-Secret": BOT_SECRET,
        },
        body: JSON.stringify({
          discord_id:       discordId,
          discord_username: discordUsername,
        }),
      });

      if (!tokenRes.ok) {
        throw new Error(`Token generation failed: ${tokenRes.status}`);
      }

      const { link } = await tokenRes.json();

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e7d34)
            .setTitle("Lier votre compte CoachFoot")
            .setDescription(
              `Cliquez sur le lien ci-dessous pour connecter votre compte.\n\n` +
              `⏱️ Ce lien est valable **10 minutes** et à usage unique.`
            )
            .addFields({ name: "Votre lien", value: link })
            .setTimestamp(),
        ],
      });

    } catch (err) {
      console.error("Erreur /link :", err);
      return interaction.editReply({
        content: "Une erreur est survenue. Veuillez réessayer.",
      });
    }
  },
};
