import {
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";

const RULE_FIELDS = [
  {
    name: "🤝 1. Respect et comportement",
    value:
      "Restez courtois avec tous les membres. Les insultes, menaces, provocations, humiliations, discriminations, propos haineux et harcèlement sont interdits, y compris en message privé.",
  },
  {
    name: "🔞 2. Contenus interdits",
    value:
      "Aucun contenu sexuel, pornographique, suggestif, violent, choquant, illégal ou faisant l'apologie de comportements dangereux. Cela concerne les messages, images, vidéos, liens, pseudos et avatars.",
  },
  {
    name: "📨 3. Publicité et démarchage",
    value:
      "La publicité, le recrutement et le démarchage sont interdits sans autorisation du staff. N'envoyez pas d'invitations vers d'autres serveurs et ne contactez pas les membres en privé pour promouvoir un serveur, service ou produit.",
  },
  {
    name: "💬 4. Spam et utilisation des salons",
    value:
      "Pas de flood, messages répétés, majuscules abusives, mentions inutiles, réactions en masse ou commandes utilisées pour déranger. Utilisez chaque salon selon son sujet et évitez le hors-sujet.",
  },
  {
    name: "🔐 5. Sécurité et vie privée",
    value:
      "Ne partagez aucune information personnelle ou confidentielle, qu'elle vous appartienne ou concerne quelqu'un d'autre. Les arnaques, liens malveillants, tentatives de phishing et usurpations d'identité entraînent une exclusion immédiate.",
  },
  {
    name: "🎙️ 6. Salons vocaux",
    value:
      "Respectez la parole des autres. Les cris, bruits volontaires, soundboards abusifs, enregistrements sans consentement et déplacements destinés à perturber sont interdits.",
  },
  {
    name: "🛡️ 7. Modération",
    value:
      "Respectez les décisions du staff et ne contournez pas une sanction avec un autre compte. Si vous souhaitez contester une décision, faites-le calmement en privé auprès de l'équipe de modération.",
  },
  {
    name: "⚖️ 8. Règles générales",
    value:
      "Les Conditions d'utilisation et règles de Discord s'appliquent également. Le staff peut intervenir face à tout comportement nuisible non mentionné ici. Selon la gravité : avertissement, mute, expulsion ou bannissement.",
  },
];

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
  const customRules = interaction.options.getString("texte");
  const embed = new EmbedBuilder()
    .setColor(0x1e7d34)
    .setTitle(title)
    .setDescription(
      customRules ??
        "Bienvenue ! Pour préserver un espace agréable et sécurisé, chaque membre doit respecter les règles suivantes.",
    )
    .setFooter({
      text: `En restant sur ${interaction.guild.name}, vous acceptez ce règlement.`,
    })
    .setTimestamp();

  if (!customRules) embed.addFields(RULE_FIELDS);

  await interaction.channel?.send({ embeds: [embed] });
  return interaction.reply({
    content: "✅ Le règlement a été publié.",
    flags: MessageFlags.Ephemeral,
  });
}
