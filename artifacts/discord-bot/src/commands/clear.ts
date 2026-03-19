import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, MessageFlags, TextChannel } from "discord.js";
import type { Command } from "../types.js";

export const clearCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("حذف عدد من الرسائل في القناة الحالية")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((opt) =>
      opt
        .setName("amount")
        .setDescription("عدد الرسائل المراد حذفها (1–100)")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .addUserOption((opt) =>
      opt.setName("user").setDescription("حذف رسائل مستخدم معين فقط").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const amount = interaction.options.getInteger("amount", true);
    const filterUser = interaction.options.getUser("user");

    if (!(interaction.channel instanceof TextChannel)) {
      await interaction.reply({ content: "❌ هذا الأمر يعمل في قنوات النصوص فقط.", flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const fetched = await interaction.channel.messages.fetch({ limit: 100 });
    let messages = [...fetched.values()];

    if (filterUser) {
      messages = messages.filter((m) => m.author.id === filterUser.id);
    }

    const toDelete = messages.slice(0, amount);
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const deletable = toDelete.filter((m) => m.createdTimestamp > twoWeeksAgo);

    if (deletable.length === 0) {
      await interaction.editReply({ content: "❌ لا توجد رسائل قابلة للحذف (الرسائل الأقدم من 14 يوماً لا يمكن حذفها بشكل جماعي)." });
      return;
    }

    const deleted = await interaction.channel.bulkDelete(deletable, true);
    await interaction.editReply({
      content: `🗑️ تم حذف **${deleted.size}** رسالة${filterUser ? ` من **${filterUser.tag}**` : ""}.`,
    });
  },
};
