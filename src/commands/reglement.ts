import {
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";

const DEFAULT_RULES = [
  "**1. Respect et courtoisie**\nTraitez tous les membres avec respect. Les insultes, provocations et discriminations sont interdites.",
  "**2. Contenu approprié**\nAucun contenu choquant, illégal, haineux ou réservé aux adultes n'est autorisé.",
  "**3. Pas de spam**\nÉvitez le flood, les mentions abusives, la publicité et les messages répétitifs.",
  "**4. Utilisez les bons salons**\nPubliez vos messages dans les salons correspondant à leur sujet.",
  "**5. Respect du staff**\nSuivez les consignes de l'équipe de modération. En cas de désaccord, contactez-la calmement en privé.",
  "**6. Sécurité**\nNe partagez jamais d'informations personnelles ou confidentielles.",
].join("\n\n");

export const data = new SlashCommandBuilder()
  .setName("reglement")
  .setDescription("Publie le règlement du serveur dans un embed.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setDMPermission(false)
  .addStringOption((option) =>
    option
      .setName("titre")
      .setDescription("Titre de l'embed (facultatif)")
      .setMaxLength(256),
  )
  .addStringOption((option) =>
    option
      .setName("texte")
      .setDescription("Règlement personnalisé (facultatif)")
      .setMaxLength(4000),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.inCachedGuild()) return;

  const title = interaction.options.getString("titre") ?? "📜 Règlement du serveur";
  const rules = interaction.options.getString("texte") ?? DEFAULT_RULES;
  const embed = new EmbedBuilder()
    .setColor(0x1e7d34)
    .setTitle(title)
    .setDescription(rules)
    .setFooter({
      text: `En restant sur ${interaction.guild.name}, vous acceptez ce règlement.`,
    })
    .setTimestamp();

  await interaction.channel?.send({ embeds: [embed] });
  return interaction.reply({
    content: "✅ Le règlement a été publié.",
    flags: MessageFlags.Ephemeral,
  });
}
