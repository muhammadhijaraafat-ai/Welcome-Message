import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from "discord.js";
import { db, warningsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import type { Command } from "../types.js";

export const warningsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("عرض تحذيرات عضو معين")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("العضو المراد الاستعلام عن تحذيراته").setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const target = interaction.options.getUser("user", true);

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ هذا الأمر يعمل داخل السيرفرات فقط.", flags: MessageFlags.Ephemeral });
      return;
    }

    const results = await db
      .select()
      .from(warningsTable)
      .where(and(eq(warningsTable.guildId, interaction.guild.id), eq(warningsTable.userId, target.id)));

    if (results.length === 0) {
      await interaction.reply({ content: `✅ لا توجد تحذيرات لـ **${target.tag}**.` });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`⚠️ تحذيرات ${target.tag}`)
      .setColor(0xffa500)
      .setThumbnail(target.displayAvatarURL())
      .setDescription(`عدد التحذيرات: **${results.length}**`)
      .setFooter({ text: `معرّف المستخدم: ${target.id}` });

    const fields = results.slice(0, 25).map((w, i) => ({
      name: `تحذير #${i + 1} — ${w.createdAt.toLocaleDateString("ar-SA")}`,
      value: `**السبب:** ${w.reason}\n**بواسطة:** <@${w.moderatorId}>`,
    }));

    embed.addFields(fields);

    await interaction.reply({ embeds: [embed] });
  },
};
