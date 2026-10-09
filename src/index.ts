import { readConfig, setUser } from "./config.js";
import {
  createUser,
  deleteAllUsers,
  getUserByName,
  getUsers,
} from "./lib/db/queries/users.js";
import { fetchFeed } from "./lib/rss.js";
import {
  createFeed,
  getFeedByUrl,
  getFeedsWithUsers,
} from "./lib/db/queries/feeds.js";
import {
  createFeedFollow,
  deleteFeedFollow,
  getFeedFollowsForUser,
} from "./lib/db/queries/feedFollows.js";
import type { Feed, User } from "./lib/db/schema.js";

export type CommandHandler = (
  cmdName: string,
  ...args: string[]
) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler>;

export function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler,
): void {
  registry[cmdName] = handler;
}

export async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const handler = registry[cmdName];

  if (!handler) {
    throw new Error(`Unknown command: ${cmdName}`);
  }

  await handler(cmdName, ...args);
}

async function handlerRegister(
  _cmdName: string,
  ...args: string[]
): Promise<void> {
  const name = args[0];

  if (!name) {
    throw new Error("Usage: register <name>");
  }

  const existingUser = await getUserByName(name);

  if (existingUser) {
    throw new Error(`User already exists: ${name}`);
  }

  const user = await createUser(name);
  setUser(readConfig(), name);

  console.log(`User created successfully: ${name}`);
  console.log(user);
}

async function handlerLogin(
  _cmdName: string,
  ...args: string[]
): Promise<void> {
  const name = args[0];

  if (!name) {
    throw new Error("Usage: login <name>");
  }

  const user = await getUserByName(name);

  if (!user) {
    throw new Error(`User does not exist: ${name}`);
  }

  setUser(readConfig(), name);
  console.log(`User logged in successfully: ${name}`);
}

async function handlerUsers(
  _cmdName: string,
  ..._args: string[]
): Promise<void> {
  const users = await getUsers();
  const currentUser = readConfig().currentUserName;

  for (const user of users) {
    const marker = user.name === currentUser ? " (current)" : "";
    console.log(`* ${user.name}${marker}`);
  }
}


async function handlerReset(
  _cmdName: string,
  ..._args: string[]
): Promise<void> {
  await deleteAllUsers();
  console.log("Database reset successfully.");
}

async function handlerAgg(
  _cmdName: string,
  ..._args: string[]
): Promise<void> {
  const feed = await fetchFeed("https://www.wagslane.dev/index.xml");
  console.log(JSON.stringify(feed, null, 2));
}

export type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

function middlewareLoggedIn(handler: UserCommandHandler): CommandHandler {
  return async (cmdName, ...args) => {
    const currentUserName = readConfig().currentUserName;
    const user = currentUserName && (await getUserByName(currentUserName));

    if (!user) {
      throw new Error("No user logged in");
    }

    await handler(cmdName, user, ...args);
  };
}

function printFeed(feed: Feed, user: User): void {
  console.log(`* ID:      ${feed.id}`);
  console.log(`* Created: ${feed.createdAt}`);
  console.log(`* Updated: ${feed.updatedAt}`);
  console.log(`* Name:    ${feed.name}`);
  console.log(`* URL:     ${feed.url}`);
  console.log(`* User:    ${user.name}`);
}

async function handlerAddFeed(
  _cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  const [name, url] = args;

  if (!name || !url) {
    throw new Error("Usage: addfeed <name> <url>");
  }

  const feed = await createFeed(name, url, user.id);
  console.log("Feed created successfully:");
  printFeed(feed, user);

  const follow = await createFeedFollow(user.id, feed.id);
  console.log(`${follow.userName} is now following ${follow.feedName}`);
}

async function handlerFeeds(
  _cmdName: string,
  ..._args: string[]
): Promise<void> {
  const feeds = await getFeedsWithUsers();

  for (const feed of feeds) {
    console.log(`* ${feed.name} (${feed.url}) by ${feed.userName}`);
  }
}

async function handlerFollow(
  _cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  const url = args[0];

  if (!url) {
    throw new Error("Usage: follow <url>");
  }

  const feed = await getFeedByUrl(url);

  if (!feed) {
    throw new Error(`Feed not found: ${url}`);
  }

  const follow = await createFeedFollow(user.id, feed.id);
  console.log(`${follow.userName} is now following ${follow.feedName}`);
}

async function handlerFollowing(
  _cmdName: string,
  user: User,
  ..._args: string[]
): Promise<void> {
  const follows = await getFeedFollowsForUser(user.id);

  for (const follow of follows) {
    console.log(`* ${follow.feedName}`);
  }
}

async function handlerUnfollow(
  _cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  const url = args[0];

  if (!url) {
    throw new Error("Usage: unfollow <url>");
  }

  const deleted = await deleteFeedFollow(user.id, url);

  if (deleted.length === 0) {
    throw new Error(`Not following feed: ${url}`);
  }

  console.log(`${user.name} unfollowed ${url}`);
}

const commands: CommandsRegistry = {};

registerCommand(commands, "reset", handlerReset);
registerCommand(commands, "register", handlerRegister);
registerCommand(commands, "login", handlerLogin);
registerCommand(commands, "users", handlerUsers);
registerCommand(commands, "agg", handlerAgg);
registerCommand(commands, "addfeed", middlewareLoggedIn(handlerAddFeed));
registerCommand(commands, "feeds", handlerFeeds);
registerCommand(commands, "follow", middlewareLoggedIn(handlerFollow));
registerCommand(commands, "following", middlewareLoggedIn(handlerFollowing));
registerCommand(commands, "unfollow", middlewareLoggedIn(handlerUnfollow));

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmdName = args[0];

  if (!cmdName) {
    throw new Error("Please provide a command");
  }

  await runCommand(commands, cmdName, ...args.slice(1));
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
