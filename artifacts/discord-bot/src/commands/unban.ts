import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import type { Command } from "../types.js";

export const unbanCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("رفع الحظر عن مستخدم من السيرفر")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((opt) =>
      opt.setName("user_id").setDescription("معرّف المستخدم المراد رفع حظره").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("سبب رفع الحظر").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.options.getString("user_id", true);
    const reason = interaction.options.getString("reason") ?? "لم يتم تحديد سبب";

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ هذا الأمر يعمل داخل السيرفرات فقط.", flags: MessageFlags.Ephemeral });
      return;
    }

    try {
      const banInfo = await interaction.guild.bans.fetch(userId);
      await interaction.guild.members.unban(userId, reason);
      await interaction.reply({
        content: `✅ تم رفع الحظر عن **${banInfo.user.tag}**.\n**السبب:** ${reason}`,
      });
    } catch {
      await interaction.reply({ content: "❌ لم يتم العثور على حظر لهذا المعرّف.", flags: MessageFlags.Ephemeral });
    }
  },
};
