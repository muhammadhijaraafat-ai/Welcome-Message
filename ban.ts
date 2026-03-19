import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  MessageFlags,
  EmbedBuilder,
  TextChannel,
  ChannelType,
} from "discord.js";
import type { Command } from "../types.js";

const BAN_LOG_CHANNEL = "𝑩𝒂𝒏";

export const banCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("حظر عضو من السيرفر")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("العضو المراد حظره").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("سبب الحظر").setRequired(false)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("delete_days")
        .setDescription("عدد أيام الرسائل المراد حذفها (0–7)")
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const target = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") ?? "لم يتم تحديد سبب";
    const deleteDays = interaction.options.getInteger("delete_days") ?? 0;

    if (!target || typeof target === "string") {
      await interaction.reply({ content: "❌ لم يتم العثور على هذا العضو في السيرفر.", flags: MessageFlags.Ephemeral });
      return;
    }

    const moderator = interaction.guild!.members.cache.get(interaction.user.id);
    if (target.roles.highest.position >= (moderator?.roles.highest.position ?? 0)) {
      await interaction.reply({ content: "❌ لا يمكنك حظر عضو يملك رتبة أعلى منك أو مساوية لك.", flags: MessageFlags.Ephemeral });
      return;
    }

    if (!target.bannable) {
      await interaction.reply({ content: "❌ لا يمكنني حظر هذا العضو. قد يكون لديه رتبة أعلى مني.", flags: MessageFlags.Ephemeral });
      return;
    }

    await target.ban({ reason, deleteMessageSeconds: deleteDays * 86400 });

    await interaction.reply({
      content: `🔨 تم حظر **${target.user.tag}** من السيرفر.\n**السبب:** ${reason}`,
    });

    try {
      const guild = interaction.guild!;
      const banLogChannel = guild.channels.cache.find(
        (c) => c.name === BAN_LOG_CHANNEL && c.type === ChannelType.GuildText
      ) as TextChannel | undefined;

      if (!banLogChannel) return;

      const logEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("🔨 سجل الحظر")
        .addFields(
          { name: "👤 المستخدم المحظور", value: `${target.user.tag}`, inline: true },
          { name: "🆔 معرّف المستخدم", value: target.user.id, inline: true },
          { name: "🛡️ المشرف", value: `${interaction.user.tag}`, inline: false },
          { name: "📋 السبب", value: reason, inline: false }
        )
        .setThumbnail(target.user.displayAvatarURL({ size: 128 }))
        .setFooter({ text: `معرّف المشرف: ${interaction.user.id}` })
        .setTimestamp();

      await banLogChannel.send({ embeds: [logEmbed] });
    } catch (err) {
      console.error("[Ban] Failed to send ban log:", err);
    }
  },
};
