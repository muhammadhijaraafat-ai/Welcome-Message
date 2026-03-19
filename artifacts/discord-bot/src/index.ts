import http from "http";
import { Client, Collection, GatewayIntentBits, REST, Routes } from "discord.js";
import type { BotClient, Command } from "./types.js";
import { commands } from "./commands/index.js";
import { onReady } from "./events/ready.js";
import { handleInteraction } from "./events/interactionCreate.js";
import { handleGuildMemberAdd } from "./events/guildMemberAdd.js";
import { handleGuildMemberUpdate } from "./events/guildMemberUpdate.js";

const token = process.env.DISCORD_TOKEN ?? "MTQ4MzAwMTUwOTY4MjYxMDE5Ng.Gh5pXH.V7_Qv3YCqDLyHTIQOjzPJttbCMEzh9IGvTmVk8";
const clientId = process.env.DISCORD_CLIENT_ID ?? "1483001509682610196";
const port = parseInt(process.env.PORT ?? "8090");

if (!token) throw new Error("DISCORD_TOKEN is required");
if (!clientId) throw new Error("DISCORD_CLIENT_ID is required");

const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("OK - Bot is alive");
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.warn(`[Bot] Port ${port} already in use — keep-alive server skipped`);
  } else {
    console.error("[Bot] Keep-alive server error:", err);
  }
});

server.listen(port, () => {
  console.log(`[Bot] Keep-alive server on port ${port}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
}) as BotClient;

client.commands = new Collection<string, Command>();
for (const command of commands) {
  client.commands.set(command.data.name, command);
}

async function deployCommandsToGuilds(): Promise<void> {
  const rest = new REST().setToken(token!);
  const body = commands.map((c) => c.data.toJSON());

  for (const guild of client.guilds.cache.values()) {
    await rest.put(Routes.applicationGuildCommands(clientId!, guild.id), { body });
    console.log(`[Bot] Registered ${body.length} guild commands to: ${guild.name}`);
  }
}

client.once("clientReady", async (readyClient) => {
  onReady(readyClient);
  await deployCommandsToGuilds().catch((err) =>
    console.error("[Bot] Failed to register guild commands:", err)
  );
});

client.on("interactionCreate", handleInteraction);
client.on("guildMemberAdd", handleGuildMemberAdd);
client.on("guildMemberUpdate", handleGuildMemberUpdate);

client.login(token).catch((err) => {
  console.error("[Bot] Failed to start:", err);
  process.exit(1);
});
