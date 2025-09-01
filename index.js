// Importer les modules nécessaires
require("dotenv").config(); // Pour charger les variables d'environnement depuis le fichier .env
const { Client, GatewayIntentBits, Events } = require("discord.js");
const slashCommandHandler = require("./handlers/slashCommandHandler");

// Créer un nouveau client Discord
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
  console.log(`Connecté en tant que ${client.user.tag}!`);
});

// Se connecter à Discord avec le token du bot
client.login(process.env.DISCORD_TOKEN);
