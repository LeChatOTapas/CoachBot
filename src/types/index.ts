export interface User {
  discord_id: string;
  username: string;
  status: "waiting" | "connected";
  coachfoot_id: string | null;
  pseudo: string | null;
  club_name: string | null;
  players_json: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkTokenRow {
  token_id: string; // jti
  discord_id: string;
  expires_at: string; // ISO datetime
  used: number; // 0 or 1
}

export interface LinkRequestBody {
  token: string;
  coachfoot_id: string;
  pseudo: string;
  club_name?: string | null;
  players?: unknown[];
}

export interface Command {
  data: { name: string; toJSON(): unknown };
  execute(
    interaction: import("discord.js").ChatInputCommandInteraction,
  ): Promise<unknown>;
}
