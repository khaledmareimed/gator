import { XMLParser } from "fast-xml-parser";

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

const isStr = (v: unknown): v is string => typeof v === "string";

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
  const res = await fetch(feedURL, { headers: { "User-Agent": "gator" } });
  if (!res.ok) {
    throw new Error(`Failed to fetch feed: ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();

  const parsed = new XMLParser({ processEntities: false }).parse(xml);
  const channel = parsed?.rss?.channel;
  if (!channel) {
    throw new Error("Invalid feed: missing channel");
  }

  const { title, link, description } = channel;
  if (!isStr(title) || !isStr(link) || !isStr(description)) {
    throw new Error("Invalid feed: missing channel metadata");
  }

  const rawItems = Array.isArray(channel.item)
    ? channel.item
    : channel.item
      ? [channel.item]
      : [];

  const items: RSSItem[] = [];
  for (const it of rawItems) {
    if ([it?.title, it?.link, it?.description, it?.pubDate].every(isStr)) {
      items.push({
        title: it.title,
        link: it.link,
        description: it.description,
        pubDate: it.pubDate,
      });
    }
  }

  return { channel: { title, link, description, item: items } };
}
