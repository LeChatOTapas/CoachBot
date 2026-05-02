import { Hono } from "hono";
import logger from "../logger.js";
import db from "../db/index.js";
import { verifyLinkToken, consumeLinkToken } from "../utils/token.js";
import type { LinkRequestBody, User } from "../types/index.js";

/** Retire le suffixe [club] du nickname si présent */
function stripClubSuffix(nick: string): string {
  return nick.replace(/\s*\[[^\]]*\]\s*$/, "").trim();
}

function buildClubNickname(currentNick: string, clubName: string): string {
  const MAX_NICK_LEN = 32;
  const ELLIPSIS = "...";
  const baseNick = stripClubSuffix(currentNick).trim();
  const cleanClub = clubName.replace(/\s+/g, " ").trim();

  const truncateWithEllipsis = (value: string, maxLen: number): string => {
    if (maxLen <= 0) return "";
    if (value.length <= maxLen) return value;
    if (maxLen <= ELLIPSIS.length) return ELLIPSIS.slice(0, maxLen);
    return `${value.slice(0, maxLen - ELLIPSIS.length).trim()}${ELLIPSIS}`;
  };

  if (!cleanClub) {
    return truncateWithEllipsis(baseNick, MAX_NICK_LEN);
  }

  if (baseNick.length >= MAX_NICK_LEN) {
    return truncateWithEllipsis(baseNick, MAX_NICK_LEN);
  }

  const reserved = baseNick.length + 3;
  const maxClubLen = MAX_NICK_LEN - reserved;

  if (maxClubLen <= 0) {
    return baseNick;
  }

  const trimmedClub = truncateWithEllipsis(cleanClub, maxClubLen).trim();
  if (!trimmedClub) {
    return baseNick;
  }

  return `${baseNick} [${trimmedClub}]`;
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
    const normalizedClubName =
      typeof club_name === "string" ? club_name.trim() : "";
    if (!normalizedClubName) {
      logger.warn(
        `Nickname not updated for ${discord_id}: missing or empty club_name`,
      );
    } else if (!guildId) {
      logger.warn(
        `Nickname not updated for ${discord_id}: GUILD_ID is not configured`,
      );
    } else {
      const client: import("discord.js").Client | undefined =
        ((globalThis as any).__discordClient as import("discord.js").Client) ??
        discordClient;

      if (!client) {
        logger.warn(
          `Nickname not updated for ${discord_id}: Discord client is unavailable`,
        );
      } else {
        try {
          const guild = await client.guilds.fetch(guildId);
          const member = await guild.members.fetch(discord_id);
          const newNick = buildClubNickname(
            member.displayName,
            normalizedClubName,
          );

          if (member.displayName !== newNick) {
            await member.setNickname(newNick);
            logger.info(`Nickname updated for ${discord_id}: ${newNick}`);
          } else {
            logger.info(
              `Nickname already up-to-date for ${discord_id}: ${newNick}`,
            );
          }
        } catch (err) {
          logger.warn(`Failed to update nickname for ${discord_id}:`, err);
        }
      }
    }

    return c.json({ status: "validated" }, 201);
  } catch (error) {
    logger.error(`Error during link for discord_id ${discord_id}:`, error);
    return c.json({ error: "Erreur interne du serveur." }, 500);
  }
});

export default app;
