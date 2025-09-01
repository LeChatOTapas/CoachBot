const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Affiche la latence du bot et de l'API Discord."),
  async execute(interaction) {
    const sent = await interaction.reply({
      content: "Ping...",
      fetchReply: true,
    });
    const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("Pong! 🏓")
      .addFields(
        { name: "Latence du bot", value: `${botLatency}ms`, inline: true },
        { name: "Latence de l'API", value: `${apiLatency}ms`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ content: "", embeds: [embed] });
  },
};
