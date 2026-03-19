import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, MessageFlags, TextChannel } from "discord.js";
import type { Command } from "../types.js";

export const slowmodeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("تفعيل أو إيقاف الوضع البطيء في القناة الحالية")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption((opt) =>
      opt
        .setName("seconds")
        .setDescription("التأخير بالثواني (0 للإيقاف، الحد الأقصى 21600)")
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const seconds = interaction.options.getInteger("seconds", true);

    if (!(interaction.channel instanceof TextChannel)) {
      await interaction.reply({ content: "❌ هذا الأمر يعمل في قنوات النصوص فقط.", flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.channel.setRateLimitPerUser(seconds, `تم التعيين بواسطة ${interaction.user.tag}`);

    if (seconds === 0) {
      await interaction.reply({ content: "✅ تم **إيقاف** الوضع البطيء في هذه القناة." });
    } else {
      await interaction.reply({ content: `✅ تم تفعيل الوضع البطيء بمقدار **${seconds} ثانية** في هذه القناة.` });
    }
  },
};
