const express = require("express");
const router = express.Router();
const logger = require("../logger");
const db = require("../db");

// Prepared statements
const selectByDiscordId = db.prepare(
  "SELECT * FROM users WHERE discord_id = ?"
);
const selectByCoachFootIdNotDiscord = db.prepare(
  "SELECT * FROM users WHERE coachfoot_id = ? AND discord_id <> ?"
);
const insertUser = db.prepare(
  `INSERT INTO users (discord_id, username, status, coachfoot_id, pseudo, players_json)
   VALUES (@discord_id, @username, @status, @coachfoot_id, @pseudo, @players_json)`
);
const updateUserLink = db.prepare(
  `UPDATE users
   SET status = 'connected', coachfoot_id = @coachfoot_id, pseudo = @pseudo, players_json = @players_json
   WHERE discord_id = @discord_id`
);

// Cette route répondra à POST /link/
router.post("/", (req, res) => {
  const { discord_id, coachfoot_id, pseudo, players, username } = req.body;
  logger.info(
    `Received validation request for discord_id: ${discord_id}, coachfoot_id: ${coachfoot_id}, pseudo: ${pseudo}, players: ${
      Array.isArray(players) ? players.length : typeof players
    }, username: ${username}`
  );

  if (!discord_id || !coachfoot_id) {
    logger.warn(
      `Validation request rejected: missing discord_id or coachfoot_id. Body: ${JSON.stringify(
        req.body
      )}`
    );
    return res
      .status(400)
      .json({ error: "discord_id et coachfoot_id sont requis." });
  }

  try {
    // Vérifier si le coachfoot_id est déjà utilisé par un autre compte
    const existingCoachFootUser = selectByCoachFootIdNotDiscord.get(
      coachfoot_id,
      discord_id
    );

    if (existingCoachFootUser) {
      logger.warn(
        `Validation rejected: coachfoot_id ${coachfoot_id} already linked to another Discord account (${existingCoachFootUser.discord_id}).`
      );
      return res.status(409).json({
        error: "Ce compte CoachFoot est déjà lié à un autre compte Discord.",
      });
    }

    const userRow = selectByDiscordId.get(discord_id);

    if (!userRow) {
      logger.warn(
        `Validation rejected: User with discord_id ${discord_id} not found in database.`
      );
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    if (userRow.status !== "waiting") {
      logger.warn(
        `Validation rejected: User ${discord_id} status is '${userRow.status}', not 'waiting'.`
      );
      return res.status(409).json({
        error: "Le statut de l'utilisateur n'est pas en attente de validation.",
      });
    }

    // Validation de type pour pseudo et players (facultatifs)
    if (pseudo !== undefined && typeof pseudo !== "string") {
      return res.status(400).json({ error: "pseudo doit être une chaîne." });
    }
    if (players !== undefined && !Array.isArray(players)) {
      return res.status(400).json({ error: "players doit être un tableau." });
    }

    const payload = {
      discord_id,
      coachfoot_id: String(coachfoot_id),
      username: userRow.username, // conserver le username enregistré à l'étape /link du bot
      status: "connected",
      pseudo: pseudo ?? null,
      players_json: players ? JSON.stringify(players) : null,
    };

    updateUserLink.run(payload);

    logger.info(
      `Successfully validated and linked discord_id ${discord_id} to coachfoot_id ${coachfoot_id}.`
    );
    res.status(201).json({ status: "validated" });
  } catch (error) {
    logger.error(
      `Error during validation for discord_id ${discord_id}:`,
      error
    );
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

module.exports = router;
