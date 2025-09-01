const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "..", "database.json");

// Fonction sécurisée pour lire la base de données
function readDb() {
  // Si le fichier n'existe pas, on le crée avec une structure vide
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: [] }, null, 2));
  }

  try {
    const data = fs.readFileSync(dbPath, "utf8");
    // Gère le cas où le fichier est vide
    if (data === "") {
      return { users: [] };
    }
    const db = JSON.parse(data);
    // S'assure que la propriété 'users' existe
    if (!db.users) {
      db.users = [];
    }
    return db;
  } catch (error) {
    console.error(
      "Erreur critique lors de la lecture ou du parsing de database.json:",
      error
    );
    // En cas d'erreur de parsing, on retourne une structure vide pour éviter un crash
    return { users: [] };
  }
}

// Fonction pour écrire dans la base de données
function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Cette route répondra à POST /link/
router.post("/", (req, res) => {
  const { discord_id, coachfoot_id } = req.body;

  if (!discord_id || !coachfoot_id) {
    return res
      .status(400)
      .json({ error: "discord_id et coachfoot_id sont requis." });
  }

  try {
    const db = readDb();

    // Vérifier si le coachfoot_id est déjà utilisé par un autre compte
    const existingCoachFootUser = db.users.find(
      (u) => u.coachfoot_id === coachfoot_id && u.discord_id !== discord_id
    );

    if (existingCoachFootUser) {
      return res.status(409).json({
        error: "Ce compte CoachFoot est déjà lié à un autre compte Discord.",
      });
    }

    const userIndex = db.users.findIndex((u) => u.discord_id === discord_id);

    if (userIndex === -1) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    if (db.users[userIndex].status !== "waiting") {
      return res.status(409).json({
        error: "Le statut de l'utilisateur n'est pas en attente de validation.",
      });
    }

    // Mettre à jour l'utilisateur
    db.users[userIndex].status = "connected";
    db.users[userIndex].coachfoot_id = coachfoot_id;

    writeDb(db);

    res.status(201).json({ status: "validated" });
  } catch (error) {
    console.error("Erreur lors de la validation:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

module.exports = router;
