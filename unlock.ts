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

export const unlockCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("فتح قناة مقفلة والسماح بالإرسال فيها")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setDescription("القناة المراد فتحها (الافتراضي: القناة الحالية)")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("سبب الفتح").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ هذا الأمر يعمل داخل السيرفرات فقط.", flags: MessageFlags.Ephemeral });
      return;
    }

    const target = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel;
    const reason = interaction.options.getString("reason") ?? "لم يتم تحديد سبب";

    try {
      await target.permissionOverwrites.edit(interaction.guild.id, {
        SendMessages: null,
      });

      const embed = new EmbedBuilder()
        .setColor(0x00cc44)
        .setTitle("🔓 تم فتح القناة")
        .setDescription(`تم فتح هذه القناة بواسطة <@${interaction.user.id}>.`)
        .addFields({ name: "📋 السبب", value: reason })
        .setTimestamp();

      await target.send({ embeds: [embed] });
      await interaction.reply({
        content: `🔓 تم فتح ${target}.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.error("[Unlock] Error:", err);
      await interaction.reply({ content: "❌ حدث خطأ أثناء محاولة فتح القناة.", flags: MessageFlags.Ephemeral });
    }
  },
};
