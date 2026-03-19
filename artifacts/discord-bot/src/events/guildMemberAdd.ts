import { GuildMember, TextChannel } from "discord.js";

const WELCOME_CHANNEL_NAME = "👋𝑾𝒆𝒍𝒄𝒐𝒎𝒆";
const AUTO_ROLE_NAME = "𝗙𝗰 𝗙𝗿𝗶𝗲𝗻𝗱𝘀 ⋅";

export async function handleGuildMemberAdd(member: GuildMember): Promise<void> {
  const { guild, user } = member;

  try {
    const autoRole = guild.roles.cache.find((r) => r.name === AUTO_ROLE_NAME);
    if (autoRole) {
      await member.roles.add(autoRole).catch((err) =>
        console.error(`[Welcome] Failed to assign role to ${user.tag}:`, err)
      );
    } else {
      console.warn(`[Welcome] Role "${AUTO_ROLE_NAME}" not found in guild ${guild.name}`);
    }
  } catch (err) {
    console.error("[Welcome] Error assigning auto role:", err);
  }

  try {
    const welcomeChannel = guild.channels.cache.find(
      (c) => c.name === WELCOME_CHANNEL_NAME && c.isTextBased()
    ) as TextChannel | undefined;

    if (!welcomeChannel) {
      console.warn(`[Welcome] Channel "${WELCOME_CHANNEL_NAME}" not found.`);
      return;
    }

    const memberCount = guild.memberCount;

    const message = [
      `𝗪𝗲𝗹𝗰𝗼𝗺𝗲 𝘁𝗼 𝗙𝗿𝗶𝗲𝗻𝗱𝘀 𝗖𝗼𝗺𝗺𝘂𝗻𝗶𝘁𝘆 ✧`,
      ``,
      `𝗠𝗲𝗺𝗯𝗲𝗿 <@${user.id}> ✧`,
      ``,
      `𝗖𝗼𝘂𝗻𝘁 (${memberCount})✧`,
      ``,
      `𝗘𝗻𝗷𝗼𝘆 𝘂𝘀𝗶𝗻𝗴 𝘁𝗵𝗲 𝘀𝗲𝗿𝘃𝗲𝗿 <a:hanyaCheer:1481209797545168978>`,
    ].join("\n");

    await welcomeChannel.send(message);
  } catch (err) {
    console.error("[Welcome] Error sending welcome message:", err);
  }
}
