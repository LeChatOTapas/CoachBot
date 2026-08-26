import { Client, GatewayIntentBits, Events, PermissionFlagsBits } from "discord.js";
import { Hono } from "hono";
import logger from "./logger.js";
import slashCommandHandler from "./handlers/slashCommandHandler.js";
import linkRoute from "./api/link.js";
import { registerCommands } from "./registerCommands.js";

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

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || message.content.trim().toLowerCase() !== "+upd") return;
  if (!message.inGuild() || !message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
    await message.reply("Cette commande est réservée aux administrateurs.");
    return;
  }

  try {
    const applicationId = client.application?.id;
    if (!applicationId) throw new Error("Application Discord indisponible");
    const deployment = await registerCommands(applicationId);
    await message.reply(
      `✅ ${deployment.count} commandes slash synchronisées (${deployment.scope}).`,
    );
  } catch (error) {
    logger.error("Échec de +upd :", error);
    await message.reply("❌ Impossible de synchroniser les commandes slash. Consulte les logs.");
  }
});

client.once(Events.ClientReady, async () => {
  logger.info(`Connecté en tant que ${client.user!.tag}!`);
  (globalThis as any).__discordClient = client;

  try {
    const deployment = await registerCommands(client.application.id);
    logger.info(
      `${deployment.count} commandes slash synchronisées (${deployment.scope}) pour l'application ${client.application.id}.`,
    );
  } catch (error) {
    logger.error("Impossible de synchroniser les commandes slash :", error);
  }
});

const discordToken = process.env.DISCORD_TOKEN;
if (!discordToken) throw new Error("DISCORD_TOKEN must be set");

client.login(discordToken);
