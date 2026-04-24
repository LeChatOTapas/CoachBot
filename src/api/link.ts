import { Hono } from "hono";
import logger from "../logger.js";
import db from "../db/index.js";
import { verifyLinkToken, consumeLinkToken } from "../utils/token.js";
import type { LinkRequestBody, User } from "../types/index.js";

/** Retire le suffixe [club] du nickname si présent */
function stripClubSuffix(nick: string): string {
  return nick.replace(/\s*\[[^\]]*\]\s*$/, "").trim();
}

/** Renvoie true si le nickname contient déjà un suffixe [xxx] */
function hasClubSuffix(nick: string): boolean {
  return /\[[^\]]+\]/.test(nick);
}

const app = new Hono();

app.post("/", async (c) => {
  // client Discord injecté par index.ts
  const discordClient: import("discord.js").Client | undefined = (c as any).env
    ?.discordClient;
  let body: LinkRequestBody;
  try {
    body = await c.req.json<LinkRequestBody>();
  } catch {
    return c.json({ error: "Corps de requête JSON invalide." }, 400);
  }

  const { token, coachfoot_id, pseudo, club_name, players } = body;

  if (!token || !coachfoot_id) {
    return c.json({ error: "token et coachfoot_id sont requis." }, 400);
  }

  if (typeof pseudo !== "string" || pseudo.trim() === "") {
    return c.json(
      { error: "pseudo est requis et doit être une chaîne non vide." },
      400,
    );
  }

  if (players !== undefined && !Array.isArray(players)) {
    return c.json({ error: "players doit être un tableau." }, 400);
  }

  let payload;
  try {
    payload = await verifyLinkToken(token);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token invalide";
    logger.warn(`Link rejected: ${message}`);
    return c.json({ error: message }, 401);
  }

  const { discord_id, jti } = payload;

  logger.info(
    `Received link request for discord_id: ${discord_id}, coachfoot_id: ${coachfoot_id}, pseudo: ${pseudo}`,
  );

  try {
    // Ensure coachfoot_id is not already linked to another Discord account
    const existingCoachFootUser = db
      .prepare("SELECT * FROM users WHERE coachfoot_id = ? AND discord_id <> ?")
      .get(coachfoot_id, discord_id) as User | undefined;

    if (existingCoachFootUser) {
      logger.warn(
        `Link rejected: coachfoot_id ${coachfoot_id} already linked to ${existingCoachFootUser.discord_id}`,
      );
      return c.json(
        {
          error: "Ce compte CoachFoot est déjà lié à un autre compte Discord.",
        },
        409,
      );
    }

    const userRow = db
      .prepare("SELECT * FROM users WHERE discord_id = ?")
      .get(discord_id) as User | undefined;

    if (!userRow) {
      logger.warn(`Link rejected: discord_id ${discord_id} not found`);
      return c.json({ error: "Utilisateur non trouvé." }, 404);
    }

    if (userRow.status !== "waiting") {
      logger.warn(
        `Link rejected: discord_id ${discord_id} status is '${userRow.status}'`,
      );
      return c.json(
        {
          error:
            "Le statut de l'utilisateur n'est pas en attente de validation.",
        },
        409,
      );
    }

    // Mark token as used (single-use)
    consumeLinkToken(jti);

    db.prepare(
      `UPDATE users SET status = 'connected', coachfoot_id = ?, pseudo = ?, club_name = ?, players_json = ? WHERE discord_id = ?`,
    ).run(
      String(coachfoot_id),
      pseudo.trim(),
      club_name ?? null,
      players ? JSON.stringify(players) : null,
      discord_id,
    );

    logger.info(
      `Successfully linked discord_id ${discord_id} to coachfoot_id ${coachfoot_id}`,
    );

    // Mettre à jour le nickname Discord sur le serveur principal uniquement
    const guildId = process.env.GUILD_ID;
    if (club_name && guildId) {
      try {
        const client: import("discord.js").Client | undefined = (
          globalThis as any
        ).__discordClient;
        if (client) {
          try {
            const guild = await client.guilds.fetch(guildId);
            const member = await guild.members.fetch(discord_id);
            if (!hasClubSuffix(member.displayName)) {
              const newNick = `${stripClubSuffix(member.displayName)} [${club_name}]`;
              await member.setNickname(newNick);
              logger.info(`Nickname updated for ${discord_id}: ${newNick}`);
            }
          } catch (_) {}
        }
      } catch (err) {
        logger.warn(`Failed to update nickname for ${discord_id}:`, err);
      }
    }

    return c.json({ status: "validated" }, 201);
  } catch (error) {
    logger.error(`Error during link for discord_id ${discord_id}:`, error);
    return c.json({ error: "Erreur interne du serveur." }, 500);
  }
});

export default app;
