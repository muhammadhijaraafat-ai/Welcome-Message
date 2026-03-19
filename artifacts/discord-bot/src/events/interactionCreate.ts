import {
  Interaction,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import type { BotClient } from "../types.js";
import { createTicket, closeTicket } from "../commands/ticket.js";

export async function handleInteraction(interaction: Interaction): Promise<void> {
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "ticket_select") {
      const ticketType = interaction.values[0];

      const modal = new ModalBuilder()
        .setCustomId(`ticket_modal_${ticketType}`)
        .setTitle("تفاصيل التذكرة 🎫");

      const subjectInput = new TextInputBuilder()
        .setCustomId("ticket_subject")
        .setLabel("موضوع التذكرة")
        .setPlaceholder("اكتب موضوع التذكرة باختصار...")
        .setStyle(TextInputStyle.Short)
        .setMinLength(5)
        .setMaxLength(100)
        .setRequired(true);

      const detailsInput = new TextInputBuilder()
        .setCustomId("ticket_details")
        .setLabel("تفاصيل المشكلة أو الطلب")
        .setPlaceholder("اشرح مشكلتك أو طلبك بالتفصيل حتى نتمكن من مساعدتك...")
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(20)
        .setMaxLength(1000)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(subjectInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(detailsInput)
      );

      await interaction.showModal(modal);
    }
    return;
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith("ticket_modal_")) {
      const ticketType = interaction.customId.replace("ticket_modal_", "");
      const subject = interaction.fields.getTextInputValue("ticket_subject");
      const details = interaction.fields.getTextInputValue("ticket_details");

      if (!interaction.guild) return;
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      await createTicket(interaction.guild, interaction.user, ticketType, subject, details, async (content) => {
        await interaction.editReply({ content });
      });
    }
    return;
  }

  if (interaction.isButton()) {
    const { customId, guild, user } = interaction;

    if (customId.startsWith("ticket_close_")) {
      const channelId = customId.replace("ticket_close_", "");
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      if (!guild) return;
      await closeTicket(guild, user, channelId, "أُغلقت بواسطة الزر", async (content, embed) => {
        if (embed) {
          await interaction.channel?.send({ embeds: [embed] });
          await interaction.editReply({ content: "✅ جارٍ إغلاق التذكرة..." });
        } else {
          await interaction.editReply({ content });
        }
      });
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const client = interaction.client as BotClient;
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.warn(`[Bot] Unknown command: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`[Bot] Error executing /${interaction.commandName}:`, err);
    const msg = { content: "❌ حدث خطأ أثناء تنفيذ هذا الأمر.", flags: MessageFlags.Ephemeral };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
}
