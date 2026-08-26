import {
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";

const RULE_SECTIONS = [
  {
    title: "🤝 Vivre ensemble",
    color: 0x3498db,
    description:
      "**Respect avant tout**\n" +
      "Soyez courtois. Les insultes, menaces, provocations, discriminations et le harcèlement ne sont pas tolérés.\n\n" +
      "**Gardez les échanges agréables**\n" +
      "Évitez le flood, les majuscules abusives, les mentions inutiles et les messages répétés.",
  },
  {
    title: "🔞 Contenu et sécurité",
    color: 0xe74c3c,
    description:
      "**Un serveur tout public**\n" +
      "Les contenus sexuels, pornographiques, suggestifs, violents, choquants ou illégaux sont interdits — y compris dans les liens, avatars et pseudos.\n\n" +
      "**Protégez votre vie privée**\n" +
      "Ne partagez aucune donnée personnelle. Les arnaques, liens malveillants, tentatives de phishing et usurpations d'identité entraînent une exclusion.",
  },
  {
    title: "📨 Publicité et salons",
    color: 0xf39c12,
    description:
      "**Aucun démarchage**\n" +
      "La publicité, le recrutement, les invitations vers d'autres serveurs et la promotion en message privé sont interdits sans accord du staff.\n\n" +
      "**Chaque salon a son utilité**\n" +
      "Respectez le sujet des salons. En vocal, pas de cris, bruits volontaires, soundboards abusifs ou enregistrements sans consentement.",
  },
  {
    title: "🛡️ Modération et sanctions",
    color: 0x9b59b6,
    description:
      "**Respectez les décisions du staff**\n" +
      "Une contestation doit se faire calmement et en privé. Contourner une sanction avec un autre compte est interdit.\n\n" +
      "**Application du règlement**\n" +
      "Les règles de Discord restent applicables. Selon la gravité : rappel à l'ordre, avertissement, mute, expulsion ou bannissement.",
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
  const headerEmbed = new EmbedBuilder()
    .setColor(0x1e7d34)
    .setTitle(title)
    .setDescription(
      customRules ??
        `Bienvenue sur **${interaction.guild.name}** !\n\nMerci de lire ces quelques règles. Elles permettent de conserver une communauté conviviale, sûre et agréable pour tout le monde.`,
    )
    .setTimestamp();

  const embeds = customRules
    ? [headerEmbed]
    : [
        headerEmbed,
        ...RULE_SECTIONS.map((section) =>
          new EmbedBuilder()
            .setColor(section.color)
            .setTitle(section.title)
            .setDescription(section.description),
        ),
        new EmbedBuilder()
          .setColor(0x1e7d34)
          .setDescription(
            `✅ **En restant sur ${interaction.guild.name}, vous acceptez ce règlement.**\nMerci de contribuer à la bonne ambiance du serveur !`,
          ),
      ];

  await interaction.channel?.send({ embeds });
  return interaction.reply({
    content: "✅ Le règlement a été publié.",
    flags: MessageFlags.Ephemeral,
  });
}
