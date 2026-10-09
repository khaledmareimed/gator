import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { feeds, users } from "../schema.js";

export async function createFeed(name: string, url: string, userId: string) {
  const [result] = await db
    .insert(feeds)
    .values({ name, url, userId })
    .returning();

  return result;
}

export async function getFeedsWithUsers() {
  return db
    .select({ name: feeds.name, url: feeds.url, userName: users.name })
    .from(feeds)
    .innerJoin(users, eq(feeds.userId, users.id));
}

export async function getFeedByUrl(url: string) {
  const [result] = await db.select().from(feeds).where(eq(feeds.url, url));

  return result;
}
