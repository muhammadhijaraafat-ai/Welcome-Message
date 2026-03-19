import type { Client } from "discord.js";

export function onReady(client: Client): void {
  console.log(`[Bot] Logged in as ${client.user?.tag}`);
  console.log(`[Bot] Serving ${client.guilds.cache.size} guild(s)`);
}
