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

const KICK_LOG_CHANNEL = "𝑲𝒊𝒄𝒌";

export const kickCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("طرد عضو من السيرفر")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("العضو المراد طرده").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("سبب الطرد").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const target = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") ?? "لم يتم تحديد سبب";

    if (!target || typeof target === "string") {
      await interaction.reply({ content: "❌ لم يتم العثور على هذا العضو في السيرفر.", flags: MessageFlags.Ephemeral });
      return;
    }

    const moderator = interaction.guild!.members.cache.get(interaction.user.id);
    if (target.roles.highest.position >= (moderator?.roles.highest.position ?? 0)) {
      await interaction.reply({ content: "❌ لا يمكنك طرد عضو يملك رتبة أعلى منك أو مساوية لك.", flags: MessageFlags.Ephemeral });
      return;
    }

    if (!target.kickable) {
      await interaction.reply({ content: "❌ لا يمكنني طرد هذا العضو. قد يكون لديه رتبة أعلى مني.", flags: MessageFlags.Ephemeral });
      return;
    }

    await target.kick(reason);
    await interaction.reply({
      content: `✅ تم طرد **${target.user.tag}** من السيرفر.\n**السبب:** ${reason}`,
    });

    try {
      const guild = interaction.guild!;
      const logChannel = guild.channels.cache.find(
        (c) => c.name === KICK_LOG_CHANNEL && c.type === ChannelType.GuildText
      ) as TextChannel | undefined;

      if (!logChannel) return;

      const logEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("👢 سجل الطرد")
        .addFields(
          { name: "👤 العضو المطرود", value: `${target.user.tag}`, inline: true },
          { name: "🆔 معرّف العضو", value: target.user.id, inline: true },
          { name: "🛡️ المشرف", value: `${interaction.user.tag}`, inline: false },
          { name: "📋 السبب", value: reason, inline: false }
        )
        .setThumbnail(target.user.displayAvatarURL({ size: 128 }))
        .setFooter({ text: `معرّف المشرف: ${interaction.user.id}` })
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    } catch (err) {
      console.error("[Kick] Failed to send kick log:", err);
    }
  },
};
