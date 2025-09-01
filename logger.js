const winston = require("winston");
const path = require("path");

// Définir le niveau de log à partir des variables d'environnement, avec 'info' par défaut
const level = process.env.LOG_LEVEL || "info";

const logger = winston.createLogger({
  level: level,
  // Format des logs
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }), // Pour logger la stack trace des erreurs
    winston.format.splat(),
    winston.format.json() // Logger en format JSON
  ),
  // Où envoyer les logs (transports)
  transports: [
    // - Écrire tous les logs de niveau 'info' et inférieur dans `combined.log`
    // - Écrire tous les logs de niveau 'error' et inférieur dans `error.log`
    new winston.transports.File({
      filename: path.join(__dirname, "logs", "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "logs", "combined.log"),
    }),
  ],
});

// Si nous ne sommes pas en production, logger aussi dans la console
// avec un format plus lisible.
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Créer un flux pour que Morgan puisse écrire dans les logs de Winston
logger.stream = {
  write: function (message, encoding) {
    // Utilise le niveau 'info' pour les logs de Morgan
    logger.info(message.trim());
  },
};

module.exports = logger;
