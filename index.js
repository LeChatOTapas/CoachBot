// Importer les modules nécessaires
require("dotenv").config(); // Pour charger les variables d'environnement depuis le fichier .env
const { Client, GatewayIntentBits, Events } = require("discord.js");
const slashCommandHandler = require("./handlers/slashCommandHandler");
const express = require("express");
const morgan = require("morgan");
const logger = require("./logger");
const linkRoute = require("./api/link"); // Importer la nouvelle route

// --- Configuration du serveur Express ---
const app = express();
app.use(express.json()); // Pour parser les corps de requête en JSON

// En développement, utiliser le format 'dev' pour des logs de requête colorés et concis dans la console
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Utiliser Morgan pour les logs HTTP, en le connectant à Winston pour les fichiers
app.use(morgan("combined", { stream: logger.stream }));
const port = process.env.PORT || 3000;

// Utiliser la route pour toutes les requêtes vers /link
app.use("/link", linkRoute);

// --- Configuration du client Discord ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Charger le gestionnaire de commandes
slashCommandHandler(client);

// Quand le client est prêt, afficher un message dans la console
client.once(Events.ClientReady, () => {
  logger.info(`Connecté en tant que ${client.user.tag}!`);
  // Démarrer le serveur Express une fois que le bot est connecté
  app.listen(port, () => {
    logger.info(`Serveur de validation écoutant sur http://localhost:${port}`);
  });
});

// Se connecter à Discord avec le token du bot
client.login(process.env.DISCORD_TOKEN);
