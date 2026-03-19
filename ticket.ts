import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  MessageFlags,
  ChannelType,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  OverwriteType,
  TextChannel,
  CategoryChannel,
  Guild,
  User,
} from "discord.js";
import { db, ticketsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import type { Command } from "../types.js";

export const TICKET_TYPES: Record<string, string> = {
  general: "دعم عام",
  complaint: "📋 شكوى",
  suggestion: "💡 اقتراح",
  technical: "🔧 مشكلة تقنية",
  report: "👮 بلاغ عن مستخدم",
};

export const ticketCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("نظام التذاكر")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((sub) =>
      sub
        .setName("panel")
        .setDescription("إرسال لوحة التذاكر (للمشرفين فقط)")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("القناة التي سيُرسل فيها البانل (الافتراضي: القناة الحالية)")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("close")
        .setDescription("إغلاق التذكرة الحالية")
        .addStringOption((opt) =>
          opt.setName("reason").setDescription("سبب الإغلاق").setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("إضافة مستخدم إلى التذكرة الحالية")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("المستخدم المراد إضافته").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("إزالة مستخدم من التذكرة الحالية")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("المستخدم المراد إزالته").setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ هذا الأمر يعمل داخل السيرفرات فقط.", flags: MessageFlags.Ephemeral });
      return;
    }

    const sub = interaction.options.getSubcommand();
    if (sub === "panel") await handlePanel(interaction);
    else if (sub === "close") await handleClose(interaction);
    else if (sub === "add") await handleAdd(interaction);
    else if (sub === "remove") await handleRemove(interaction);
  },
};

async function handlePanel(interaction: ChatInputCommandInteraction): Promise<void> {
  const member = interaction.guild!.members.cache.get(interaction.user.id);
  if (!member?.permissions.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({ content: "❌ هذا الأمر للمسؤولين فقط.", flags: MessageFlags.Ephemeral });
    return;
  }

  const targetChannel = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel;

  const embed = new EmbedBuilder()
    .setAuthor({ name: "🎫 نظام التذاكر" })
    .setTitle("قوانين التذاكر")
    .setColor(0xff0000)
    .setThumbnail(interaction.guild!.iconURL() ?? null)
    .setDescription(
      [
        "• لا تقم بفتح تذاكر بشكل متكرر أو غير ضروري.",
        "",
        "• افتح تذكرة فقط إذا كنت تحتاج فعلاً إلى مساعدة.",
        "",
        "• احترم أعضاء الفريق والطاقم الإداري.",
        "",
        "• لا تفتح أكثر من تذكرة للمشكلة نفسها.",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
        "**يجب عليك تعبئة البيانات قبل فتح التذكرة بشكل كامل**",
        "",
        "وخلاف ذلك حق للإدارة إغلاق التذكرة مباشرة.",
      ].join("\n")
    )
    .setFooter({ text: `Powered By | ${interaction.guild!.name}` });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("ticket_select")
    .setPlaceholder("اختر نوع التذكرة 🎫")
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel("دعم عام").setValue("general").setDescription("للاستفسارات والدعم العام"),
      new StringSelectMenuOptionBuilder().setLabel("شكوى").setValue("complaint").setEmoji("📋").setDescription("لتقديم شكوى ضد مستخدم"),
      new StringSelectMenuOptionBuilder().setLabel("اقتراح").setValue("suggestion").setEmoji("💡").setDescription("لتقديم اقتراح للسيرفر"),
      new StringSelectMenuOptionBuilder().setLabel("مشكلة تقنية").setValue("technical").setEmoji("🔧").setDescription("لمشاكل تقنية في السيرفر"),
      new StringSelectMenuOptionBuilder().setLabel("بلاغ عن مستخدم").setValue("report").setEmoji("👮").setDescription("للإبلاغ عن مستخدم مخالف")
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  await targetChannel.send({ embeds: [embed], components: [row] });
  await interaction.reply({ content: `✅ تم إرسال لوحة التذاكر إلى ${targetChannel}.`, flags: MessageFlags.Ephemeral });
}

export async function createTicket(
  guild: Guild,
  user: User,
  ticketType: string,
  subject: string,
  details: string,
  reply: (content: string) => Promise<void>
): Promise<void> {
  const existing = await db
    .select()
    .from(ticketsTable)
    .where(and(eq(ticketsTable.guildId, guild.id), eq(ticketsTable.userId, user.id), eq(ticketsTable.status, "open")));

  if (existing.length > 0) {
    await reply(`❌ لديك تذكرة مفتوحة بالفعل: <#${existing[0].channelId}>`);
    return;
  }

  const [countResult] = await db
    .select({ value: count() })
    .from(ticketsTable)
    .where(eq(ticketsTable.guildId, guild.id));

  const ticketNumber = (countResult?.value ?? 0) + 1;
  const typeLabel = TICKET_TYPES[ticketType] ?? "🎫 تذكرة";
  const channelName = `ticket-${ticketNumber.toString().padStart(4, "0")}`;

  let category = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory &&
      (c.name.toLowerCase().includes("support") || c.name.toLowerCase().includes("دعم") || c.name.toLowerCase().includes("ticket"))
  ) as CategoryChannel | undefined;

  if (!category) {
    category = await guild.channels.create({
      name: "🎫 Support",
      type: ChannelType.GuildCategory,
    }) as CategoryChannel;
  }

  const HANDLER_ROLE_NAME = "Ticket Handler 〆";

  await guild.roles.fetch().catch(() => null);

  const handlerRole = guild.roles.cache.find((r) => r.name === HANDLER_ROLE_NAME);

  if (!handlerRole) {
    console.warn(`[Ticket] Role "${HANDLER_ROLE_NAME}" not found — tickets will only be visible to the opener.`);
  }

  const staffAllowPerms = ["ViewChannel", "SendMessages", "ReadMessageHistory", "ManageMessages"] as const;

  const permissionOverwrites: Parameters<typeof guild.channels.create>[0]["permissionOverwrites"] = [
    { id: guild.id, deny: ["ViewChannel"], type: OverwriteType.Role },
    { id: user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"], type: OverwriteType.Member },
  ];

  if (handlerRole) {
    guild.roles.cache
      .filter((r) => !r.managed && r.id !== guild.id && r.position >= handlerRole.position)
      .forEach((r) => {
        permissionOverwrites!.push({ id: r.id, allow: [...staffAllowPerms], type: OverwriteType.Role });
      });
  }

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category?.id,
    permissionOverwrites,
    topic: `تذكرة #${ticketNumber} | النوع: ${typeLabel} | ${user.tag}`,
  });

  await db.insert(ticketsTable).values({
    guildId: guild.id,
    channelId: channel.id,
    userId: user.id,
    ticketNumber,
    status: "open",
  });

  const embed = new EmbedBuilder()
    .setTitle(`${typeLabel} — تذكرة #${ticketNumber}`)
    .setColor(0xff0000)
    .addFields(
      { name: "👤 صاحب التذكرة", value: `<@${user.id}>`, inline: true },
      { name: "🏷️ نوع التذكرة", value: typeLabel, inline: true },
      { name: "📌 الموضوع", value: subject },
      { name: "📝 التفاصيل", value: details }
    )
    .setFooter({ text: `معرّف المستخدم: ${user.id}` })
    .setTimestamp();

  const closeButton = new ButtonBuilder()
    .setCustomId(`ticket_close_${channel.id}`)
    .setLabel("إغلاق التذكرة 🔒")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton);

  await channel.send({ content: `<@${user.id}>`, embeds: [embed], components: [row] });
  await reply(`✅ تم إنشاء تذكرتك: <#${channel.id}>`);
}

export async function closeTicket(
  guild: Guild,
  user: User,
  channelId: string,
  reason: string,
  replyFn: (content: string, embed?: EmbedBuilder) => Promise<void>
): Promise<void> {
  const [ticket] = await db
    .select()
    .from(ticketsTable)
    .where(and(eq(ticketsTable.channelId, channelId), eq(ticketsTable.status, "open")));

  if (!ticket) {
    await replyFn("❌ هذه القناة ليست تذكرة مفتوحة.");
    return;
  }

  const member = guild.members.cache.get(user.id);
  const isOwner = user.id === ticket.userId;
  const isStaff = member?.permissions.has(PermissionFlagsBits.ManageMessages) ?? false;

  if (!isOwner && !isStaff) {
    await replyFn("❌ يمكن فقط لصاحب التذكرة أو المشرفين إغلاقها.");
    return;
  }

  await db
    .update(ticketsTable)
    .set({ status: "closed", closedAt: new Date() })
    .where(eq(ticketsTable.channelId, channelId));

  const channel = guild.channels.cache.get(channelId) as TextChannel | undefined;

  const embed = new EmbedBuilder()
    .setTitle("🔒 تم إغلاق التذكرة")
    .setColor(0xff0000)
    .setDescription(`تم إغلاق التذكرة بواسطة <@${user.id}>.\n**السبب:** ${reason}`)
    .setTimestamp();

  await replyFn("", embed);

  setTimeout(async () => {
    try {
      await channel?.delete(`تذكرة مغلقة بواسطة ${user.tag}`);
    } catch { }
  }, 5000);
}

async function handleClose(interaction: ChatInputCommandInteraction): Promise<void> {
  const reason = interaction.options.getString("reason") ?? "لم يتم تحديد سبب";
  await closeTicket(
    interaction.guild!,
    interaction.user,
    interaction.channelId,
    reason,
    async (content, embed) => {
      if (embed) {
        await interaction.reply({ embeds: [embed] });
      } else {
        await interaction.reply({ content, flags: MessageFlags.Ephemeral });
      }
    }
  );
}

async function handleAdd(interaction: ChatInputCommandInteraction): Promise<void> {
  const target = interaction.options.getUser("user", true);
  const channel = interaction.channel as TextChannel;

  const [ticket] = await db
    .select()
    .from(ticketsTable)
    .where(and(eq(ticketsTable.channelId, interaction.channelId), eq(ticketsTable.status, "open")));

  if (!ticket) {
    await interaction.reply({ content: "❌ هذه القناة ليست تذكرة مفتوحة.", flags: MessageFlags.Ephemeral });
    return;
  }

  await channel.permissionOverwrites.create(target.id, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
  });
  await interaction.reply({ content: `✅ تمت إضافة <@${target.id}> إلى التذكرة.` });
}

async function handleRemove(interaction: ChatInputCommandInteraction): Promise<void> {
  const target = interaction.options.getUser("user", true);
  const channel = interaction.channel as TextChannel;

  const [ticket] = await db
    .select()
    .from(ticketsTable)
    .where(and(eq(ticketsTable.channelId, interaction.channelId), eq(ticketsTable.status, "open")));

  if (!ticket) {
    await interaction.reply({ content: "❌ هذه القناة ليست تذكرة مفتوحة.", flags: MessageFlags.Ephemeral });
    return;
  }

  if (target.id === ticket.userId) {
    await interaction.reply({ content: "❌ لا يمكنك إزالة صاحب التذكرة.", flags: MessageFlags.Ephemeral });
    return;
  }

  await channel.permissionOverwrites.delete(target.id);
  await interaction.reply({ content: `✅ تمت إزالة <@${target.id}> من التذكرة.` });
}
