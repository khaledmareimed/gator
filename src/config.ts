
import fs from "fs";
import os from "os";
import path from "path";

export type Config = {
  dbUrl: string;
  currentUserName?: string;
};

function getConfigFilePath(): string {
  return path.join(os.homedir(), ".gatorconfig.json");
}

export function readConfig(): Config {
  const contents = fs.readFileSync(getConfigFilePath(), "utf-8");
  const raw: unknown = JSON.parse(contents);

  if (
    typeof raw !== "object" ||
    raw === null ||
    !("db_url" in raw) ||
    typeof raw.db_url !== "string"
  ) {
    throw new Error("Invalid config: db_url must be a string");
  }

  if (
    "current_user_name" in raw &&
    typeof raw.current_user_name !== "string"
  ) {
    throw new Error(
      "Invalid config: current_user_name must be a string",
    );
  }

  return {
    dbUrl: raw.db_url,
    currentUserName:
      "current_user_name" in raw
        ? raw.current_user_name
        : undefined,
  };
}

export function setUser(cfg: Config, userName: string): void {
  const raw: Record<string, string> = {
    db_url: cfg.dbUrl,
  };

  if (userName.length > 0) {
    raw.current_user_name = userName;
  }

  fs.writeFileSync(
    getConfigFilePath(),
    JSON.stringify(raw, null, 2),
    "utf-8",
  );
}