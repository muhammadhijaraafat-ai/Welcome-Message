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

export const lockCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("قفل قناة ومنع الإرسال فيها")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setDescription("القناة المراد قفلها (الافتراضي: القناة الحالية)")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("سبب القفل").setRequired(false)
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
        SendMessages: false,
      });

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("🔒 تم قفل القناة")
        .setDescription(`تم قفل هذه القناة بواسطة <@${interaction.user.id}>.`)
        .addFields({ name: "📋 السبب", value: reason })
        .setTimestamp();

      await target.send({ embeds: [embed] });
      await interaction.reply({
        content: `🔒 تم قفل ${target}.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.error("[Lock] Error:", err);
      await interaction.reply({ content: "❌ حدث خطأ أثناء محاولة قفل القناة.", flags: MessageFlags.Ephemeral });
    }
  },
};
