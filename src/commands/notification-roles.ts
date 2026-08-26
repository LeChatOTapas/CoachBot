import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Role,
} from "discord.js";

export const customIdPrefix = "notification-role:";

export const data = new SlashCommandBuilder()
  .setName("notification-roles")
  .setDescription("Publie un panneau permettant de choisir ses rôles de notification.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .setDMPermission(false)
  .addRoleOption((option) =>
    option.setName("role-1").setDescription("Premier rôle proposé").setRequired(true),
  )
  .addRoleOption((option) =>
    option.setName("role-2").setDescription("Deuxième rôle proposé"),
  )
  .addRoleOption((option) =>
    option.setName("role-3").setDescription("Troisième rôle proposé"),
  )
  .addRoleOption((option) =>
    option.setName("role-4").setDescription("Quatrième rôle proposé"),
  )
  .addRoleOption((option) =>
    option.setName("role-5").setDescription("Cinquième rôle proposé"),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.inCachedGuild()) return;

  const roles: Role[] = [];
  for (let index = 1; index <= 5; index += 1) {
    const role = interaction.options.getRole(`role-${index}`);
    if (role && !roles.some((item) => item.id === role.id)) roles.push(role);
  }

  const botMember = interaction.guild.members.me;
  const invalidRole = roles.find(
    (role) => role.managed || role.position >= botMember.roles.highest.position,
  );
  if (invalidRole) {
    return interaction.reply({
      content: `Je ne peux pas attribuer ${invalidRole}. Place ce rôle sous mon rôle le plus élevé.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0x1e7d34)
    .setTitle("🔔 Rôles de notification")
    .setDescription("Clique sur un bouton pour ajouter ou retirer le rôle correspondant.")
    .addFields({
      name: "Rôles disponibles",
      value: roles.map((role) => `• ${role}`).join("\n"),
    });
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    roles.map((role) =>
      new ButtonBuilder()
        .setCustomId(`${customIdPrefix}${role.id}`)
        .setLabel(role.name.slice(0, 80))
        .setEmoji("🔔")
        .setStyle(ButtonStyle.Secondary),
    ),
  );

  await interaction.channel?.send({ embeds: [embed], components: [row] });
  return interaction.reply({
    content: "Le panneau de rôles a été publié.",
    flags: MessageFlags.Ephemeral,
  });
}

export async function handleButton(interaction: ButtonInteraction) {
  if (!interaction.inCachedGuild()) return;

  const role = interaction.guild.roles.cache.get(
    interaction.customId.slice(customIdPrefix.length),
  );
  const botMember = interaction.guild.members.me;
  if (!role || role.managed || role.position >= botMember.roles.highest.position) {
    return interaction.reply({
      content: "Ce rôle n'existe plus ou je ne peux pas le gérer.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const member = await interaction.guild.members.fetch(interaction.user.id);
  const alreadyHasRole = member.roles.cache.has(role.id);
  if (alreadyHasRole) await member.roles.remove(role, "Panneau de notifications");
  else await member.roles.add(role, "Panneau de notifications");

  return interaction.reply({
    content: alreadyHasRole ? `${role} a été retiré.` : `${role} a été ajouté.`,
    flags: MessageFlags.Ephemeral,
  });
}
