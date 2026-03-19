import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import type { Command } from "../types.js";

export const untimeoutCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("رفع التقييد عن عضو")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("العضو المراد رفع التقييد عنه").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("سبب رفع التقييد").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const target = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") ?? "لم يتم تحديد سبب";

    if (!target || typeof target === "string") {
      await interaction.reply({ content: "❌ لم يتم العثور على هذا العضو في السيرفر.", flags: MessageFlags.Ephemeral });
      return;
    }

    if (!target.isCommunicationDisabled()) {
      await interaction.reply({ content: "❌ هذا العضو غير مقيّد حالياً.", flags: MessageFlags.Ephemeral });
      return;
    }

    await target.timeout(null, reason);
    await interaction.reply({
      content: `✅ تم رفع التقييد عن **${target.user.tag}**.\n**السبب:** ${reason}`,
    });
  },
};
