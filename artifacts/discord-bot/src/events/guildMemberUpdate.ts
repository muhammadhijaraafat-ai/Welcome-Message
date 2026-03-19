import { GuildMember, EmbedBuilder, TextChannel, ChannelType } from "discord.js";

const ROLE_LOG_CHANNEL = "𝑹𝒐𝒍𝒆𝒐𝒇𝒇𝒊𝒄𝒊𝒂𝒍";

export async function handleGuildMemberUpdate(
  oldMember: GuildMember,
  newMember: GuildMember
): Promise<void> {
  try {
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    const addedRoles = newRoles.filter((r) => !oldRoles.has(r.id) && r.id !== newMember.guild.id);
    const removedRoles = oldRoles.filter((r) => !newRoles.has(r.id) && r.id !== newMember.guild.id);

    if (addedRoles.size === 0 && removedRoles.size === 0) return;

    const logChannel = newMember.guild.channels.cache.find(
      (c) => c.name === ROLE_LOG_CHANNEL && c.type === ChannelType.GuildText
    ) as TextChannel | undefined;

    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("🎖️ تغيير في الرتب")
      .setThumbnail(newMember.user.displayAvatarURL({ size: 128 }))
      .addFields({ name: "👤 العضو", value: `<@${newMember.id}> — ${newMember.user.tag}`, inline: false });

    if (addedRoles.size > 0) {
      embed.addFields({
        name: "✅ رتب أُضيفت",
        value: addedRoles.map((r) => `<@&${r.id}>`).join(", "),
        inline: false,
      });
    }

    if (removedRoles.size > 0) {
      embed.addFields({
        name: "❌ رتب سُحبت",
        value: removedRoles.map((r) => `<@&${r.id}>`).join(", "),
        inline: false,
      });
    }

    embed
      .setFooter({ text: `معرّف العضو: ${newMember.id}` })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  } catch (err) {
    console.error("[RoleLog] Error logging role update:", err);
  }
}
