import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import type { Command } from "../types.js";

const DURATION_LABELS: Record<string, string> = {
  "60": "دقيقة واحدة",
  "300": "5 دقائق",
  "600": "10 دقائق",
  "1800": "30 دقيقة",
  "3600": "ساعة واحدة",
  "21600": "6 ساعات",
  "43200": "12 ساعة",
  "86400": "يوم واحد",
  "259200": "3 أيام",
  "604800": "أسبوع واحد",
};

export const timeoutCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("تقييد عضو مؤقتاً في السيرفر")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("العضو المراد تقييده").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("duration")
        .setDescription("مدة التقييد")
        .setRequired(true)
        .addChoices(
          { name: "دقيقة واحدة", value: "60" },
          { name: "5 دقائق", value: "300" },
          { name: "10 دقائق", value: "600" },
          { name: "30 دقيقة", value: "1800" },
          { name: "ساعة واحدة", value: "3600" },
          { name: "6 ساعات", value: "21600" },
          { name: "12 ساعة", value: "43200" },
          { name: "يوم واحد", value: "86400" },
          { name: "3 أيام", value: "259200" },
          { name: "أسبوع واحد", value: "604800" }
        )
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("سبب التقييد").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const target = interaction.options.getMember("user");
    const durationKey = interaction.options.getString("duration", true);
    const reason = interaction.options.getString("reason") ?? "لم يتم تحديد سبب";
    const seconds = parseInt(durationKey, 10);
    const label = DURATION_LABELS[durationKey] ?? `${seconds} ثانية`;

    if (!target || typeof target === "string") {
      await interaction.reply({ content: "❌ لم يتم العثور على هذا العضو في السيرفر.", flags: MessageFlags.Ephemeral });
      return;
    }

    if (!target.moderatable) {
      await interaction.reply({ content: "❌ لا يمكنني تقييد هذا العضو. قد يكون لديه رتبة أعلى مني.", flags: MessageFlags.Ephemeral });
      return;
    }

    await target.timeout(seconds * 1000, reason);
    await interaction.reply({
      content: `⏱️ تم تقييد **${target.user.tag}** لمدة **${label}**.\n**السبب:** ${reason}`,
    });
  },
};
