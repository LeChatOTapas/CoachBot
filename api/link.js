const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "..", "database.json");

// Cette route répondra à POST /link/
router.post("/", (req, res) => {
  const { discord_id, coachfoot_id } = req.body;

  if (!discord_id || !coachfoot_id) {
    return res
      .status(400)
      .json({ error: "discord_id et coachfoot_id sont requis." });
  }

  try {
    const dbRaw = fs.readFileSync(dbPath, "utf8");
    const db = JSON.parse(dbRaw);

    const userIndex = db.users.findIndex((u) => u.discord_id === discord_id);

    if (userIndex === -1) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    if (db.users[userIndex].status !== "waiting") {
      return res
        .status(409)
        .json({
          error:
            "Le statut de l'utilisateur n'est pas en attente de validation.",
        });
    }

    // Mettre à jour l'utilisateur
    db.users[userIndex].status = "connected";
    db.users[userIndex].coachfoot_id = coachfoot_id;

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    res.status(201).json({ status: "validated" });
  } catch (error) {
    console.error("Erreur lors de la validation:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

module.exports = router;
