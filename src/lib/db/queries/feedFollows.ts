import { and, eq, inArray } from "drizzle-orm";
import { db } from "../index.js";
import { feedFollows, feeds, users } from "../schema.js";

function selectFeedFollowsWithNames() {
  return db
    .select({
      id: feedFollows.id,
      createdAt: feedFollows.createdAt,
      updatedAt: feedFollows.updatedAt,
      userId: feedFollows.userId,
      feedId: feedFollows.feedId,
      userName: users.name,
      feedName: feeds.name,
    })
    .from(feedFollows)
    .innerJoin(users, eq(feedFollows.userId, users.id))
    .innerJoin(feeds, eq(feedFollows.feedId, feeds.id));
}

export async function createFeedFollow(userId: string, feedId: string) {
  const [newFollow] = await db
    .insert(feedFollows)
    .values({ userId, feedId })
    .returning();

  const [result] = await selectFeedFollowsWithNames().where(
    eq(feedFollows.id, newFollow.id),
  );

  return result;
}

export async function getFeedFollowsForUser(userId: string) {
  return selectFeedFollowsWithNames().where(eq(feedFollows.userId, userId));
}

export async function deleteFeedFollow(userId: string, url: string) {
  return db
    .delete(feedFollows)
    .where(
      and(
        eq(feedFollows.userId, userId),
        inArray(
          feedFollows.feedId,
          db.select({ id: feeds.id }).from(feeds).where(eq(feeds.url, url)),
        ),
      ),
    )
    .returning();
}
