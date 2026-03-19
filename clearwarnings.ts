import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { db, warningsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import type { Command } from "../types.js";

export const clearwarningsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("clearwarnings")
    .setDescription("حذف جميع تحذيرات عضو معين")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("العضو المراد مسح تحذيراته").setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const target = interaction.options.getUser("user", true);

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ هذا الأمر يعمل داخل السيرفرات فقط.", flags: MessageFlags.Ephemeral });
      return;
    }

    const deleted = await db
      .delete(warningsTable)
      .where(and(eq(warningsTable.guildId, interaction.guild.id), eq(warningsTable.userId, target.id)))
      .returning();

    await interaction.reply({
      content: `🗑️ تم حذف **${deleted.length}** تحذير(ات) لـ **${target.tag}**.`,
    });
  },
};
