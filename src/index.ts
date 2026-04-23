import { Client, GatewayIntentBits, Events } from "discord.js";
import { Hono } from "hono";
import logger from "./logger.js";
import slashCommandHandler from "./handlers/slashCommandHandler.js";
import linkRoute from "./api/link.js";

// ── HTTP server (Hono on Bun) ──────────────────────────────────────────────
const honoApp = new Hono();
honoApp.route("/api/link", linkRoute);

const port = Number(process.env.PORT) || 3000;
Bun.serve({ fetch: honoApp.fetch, port });
logger.info(`HTTP server listening on port ${port}`);

// ── Discord client ─────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

slashCommandHandler(client);

client.once(Events.ClientReady, () => {
  logger.info(`Connecté en tant que ${client.user!.tag}!`);
});

const discordToken = process.env.DISCORD_TOKEN;
if (!discordToken) throw new Error("DISCORD_TOKEN must be set");

client.login(discordToken);
