import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  MessageFlags,
  EmbedBuilder,
  TextChannel,
  ChannelType,
} from "discord.js";
import { db, warningsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import type { Command } from "../types.js";

const WARN_LOG_CHANNEL = "𝑾𝒂𝒓𝒏𝒊𝒏𝒈";

export const warnCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("إصدار تحذير لعضو في السيرفر")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("العضو المراد تحذيره").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("سبب التحذير").setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);

    if (!interaction.guild) {
      await interaction.reply({ content: "❌ هذا الأمر يعمل داخل السيرفرات فقط.", flags: MessageFlags.Ephemeral });
      return;
    }

    if (target.bot) {
      await interaction.reply({ content: "❌ لا يمكنك تحذير بوت.", flags: MessageFlags.Ephemeral });
      return;
    }

    const targetMember = await interaction.guild.members.fetch(target.id).catch(() => null);
    const moderator = interaction.guild.members.cache.get(interaction.user.id);

    if (targetMember && (targetMember.roles.highest.position >= (moderator?.roles.highest.position ?? 0))) {
      await interaction.reply({ content: "❌ لا يمكنك تحذير عضو يملك رتبة أعلى منك أو مساوية لك.", flags: MessageFlags.Ephemeral });
      return;
    }

    await db.insert(warningsTable).values({
      guildId: interaction.guild.id,
      userId: target.id,
      moderatorId: interaction.user.id,
      reason,
    });

    const [countResult] = await db
      .select({ value: count() })
      .from(warningsTable)
      .where(eq(warningsTable.userId, target.id));

    const totalWarnings = countResult?.value ?? 1;

    try {
      await target.send(`⚠️ لقد تلقيت تحذيراً في سيرفر **${interaction.guild.name}**.\n**السبب:** ${reason}`);
    } catch {
      // الرسائل الخاصة مغلقة
    }

    await interaction.reply({
      content: `⚠️ تم تحذير **${target.tag}**.\n**السبب:** ${reason}`,
    });

    try {
      const logChannel = interaction.guild.channels.cache.find(
        (c) => c.name === WARN_LOG_CHANNEL && c.type === ChannelType.GuildText
      ) as TextChannel | undefined;

      if (!logChannel) return;

      const logEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("⚠️ سجل التحذير")
        .addFields(
          { name: "👤 العضو المحذَّر", value: `${target.tag}`, inline: true },
          { name: "🆔 معرّف العضو", value: target.id, inline: true },
          { name: "🛡️ المشرف", value: `${interaction.user.tag}`, inline: false },
          { name: "📋 السبب", value: reason, inline: false },
          { name: "🔢 إجمالي التحذيرات", value: `${totalWarnings}`, inline: false }
        )
        .setThumbnail(target.displayAvatarURL({ size: 128 }))
        .setFooter({ text: `معرّف المشرف: ${interaction.user.id}` })
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    } catch (err) {
      console.error("[Warn] Failed to send warn log:", err);
    }
  },
};
