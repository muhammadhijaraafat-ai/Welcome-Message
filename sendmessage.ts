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

const COLORS: Record<string, number> = {
  red:    0xe74c3c,
  blue:   0x3498db,
  green:  0x2ecc71,
  gold:   0xf1c40f,
  purple: 0x9b59b6,
  pink:   0xe91e8c,
  white:  0xffffff,
  black:  0x2c2f33,
};

export const sendmessageCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("sendmessage")
    .setDescription("Send a styled message as the bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setDescription("The channel to send the message in")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("message")
        .setDescription("The message content")
        .setRequired(true)
        .setMaxLength(2000)
    )
    .addStringOption((opt) =>
      opt
        .setName("title")
        .setDescription("Optional title for the message")
        .setRequired(false)
        .setMaxLength(256)
    )
    .addStringOption((opt) =>
      opt
        .setName("color")
        .setDescription("Accent color of the message (default: gold)")
        .setRequired(false)
        .addChoices(
          { name: "🔴 Red",    value: "red"    },
          { name: "🔵 Blue",   value: "blue"   },
          { name: "🟢 Green",  value: "green"  },
          { name: "🟡 Gold",   value: "gold"   },
          { name: "🟣 Purple", value: "purple" },
          { name: "🩷 Pink",   value: "pink"   },
          { name: "⚪ White",  value: "white"  },
          { name: "⚫ Black",  value: "black"  },
        )
    )
    .addStringOption((opt) =>
      opt
        .setName("footer")
        .setDescription("Optional footer text")
        .setRequired(false)
        .setMaxLength(128)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ This command only works inside a server.", flags: MessageFlags.Ephemeral });
      return;
    }

    const channel   = interaction.options.getChannel("channel", true) as TextChannel;
    const message   = interaction.options.getString("message", true);
    const title     = interaction.options.getString("title") ?? null;
    const colorKey  = interaction.options.getString("color") ?? "gold";
    const footer    = interaction.options.getString("footer") ?? null;

    const color = COLORS[colorKey] ?? COLORS.gold;
    const guildIconUrl = interaction.guild.iconURL({ size: 64 }) ?? undefined;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setDescription(message)
      .setTimestamp();

    if (title) embed.setTitle(title);

    if (footer) {
      embed.setFooter({ text: footer, iconURL: guildIconUrl });
    } else {
      embed.setFooter({ text: interaction.guild.name, iconURL: guildIconUrl });
    }

    try {
      await channel.send({ embeds: [embed] });
      await interaction.reply({
        content: `✅ Message sent to ${channel}.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.error("[SendMessage] Failed to send message:", err);
      await interaction.reply({
        content: "❌ Failed to send the message. Make sure I have permission to send messages in that channel.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
