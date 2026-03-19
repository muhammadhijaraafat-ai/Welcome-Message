import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  MessageFlags,
  EmbedBuilder,
} from "discord.js";
import type { Command } from "../types.js";

export const roleCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("role")
    .setDescription("إعطاء أو سحب رتبة من عضو")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName("give")
        .setDescription("إعطاء رتبة لعضو")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("العضو المراد إعطاؤه الرتبة").setRequired(true)
        )
        .addRoleOption((opt) =>
          opt.setName("role").setDescription("الرتبة المراد إعطاؤها").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("سحب رتبة من عضو")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("العضو المراد سحب الرتبة منه").setRequired(true)
        )
        .addRoleOption((opt) =>
          opt.setName("role").setDescription("الرتبة المراد سحبها").setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ هذا الأمر يعمل داخل السيرفرات فقط.", flags: MessageFlags.Ephemeral });
      return;
    }

    const sub = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser("user", true);
    const role = interaction.options.getRole("role", true);
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
      await interaction.reply({ content: "❌ لم يتم العثور على العضو في السيرفر.", flags: MessageFlags.Ephemeral });
      return;
    }

    const botMember = interaction.guild.members.me;
    if (!botMember) {
      await interaction.reply({ content: "❌ حدث خطأ داخلي.", flags: MessageFlags.Ephemeral });
      return;
    }

    if (role.managed) {
      await interaction.reply({ content: "❌ لا يمكن إدارة هذه الرتبة لأنها مرتبطة بتكامل خارجي.", flags: MessageFlags.Ephemeral });
      return;
    }

    if (role.position >= botMember.roles.highest.position) {
      await interaction.reply({ content: "❌ لا يمكنني إدارة هذه الرتبة لأنها أعلى من رتبتي.", flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === "give") {
      if (member.roles.cache.has(role.id)) {
        await interaction.reply({ content: `❌ العضو <@${member.id}> يملك هذه الرتبة بالفعل.`, flags: MessageFlags.Ephemeral });
        return;
      }

      await member.roles.add(role);

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("✅ تم إعطاء الرتبة")
        .addFields(
          { name: "👤 العضو", value: `<@${member.id}>`, inline: true },
          { name: "🎖️ الرتبة", value: `<@&${role.id}>`, inline: true },
          { name: "🛡️ المشرف", value: `<@${interaction.user.id}>`, inline: false }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else {
      if (!member.roles.cache.has(role.id)) {
        await interaction.reply({ content: `❌ العضو <@${member.id}> لا يملك هذه الرتبة أصلاً.`, flags: MessageFlags.Ephemeral });
        return;
      }

      await member.roles.remove(role);

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("🗑️ تم سحب الرتبة")
        .addFields(
          { name: "👤 العضو", value: `<@${member.id}>`, inline: true },
          { name: "🎖️ الرتبة", value: `<@&${role.id}>`, inline: true },
          { name: "🛡️ المشرف", value: `<@${interaction.user.id}>`, inline: false }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};
