export type RedditPost = {
  id: string;
  title: string;
  body: string;
  score: number;
  createdUtc: number;
  permalink: string;
  url: string;
};

type RedditListingResponse = {
  data: {
    children: Array<{
      data: {
        id: string;
        title: string;
        selftext: string;
        score: number;
        created_utc: number;
        permalink: string;
        url: string;
      };
    }>;
  };
};

const getRedditToken = async () => {
  const clientId = process.env.REDDIT_CLIENT_ID ?? "";
  const clientSecret = process.env.REDDIT_CLIENT_SECRET ?? "";
  const userAgent = process.env.REDDIT_USER_AGENT ?? "runner-toolkit-ingest";

  if (!clientId || !clientSecret) {
    return null;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": userAgent
    },
    body: "grant_type=client_credentials"
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { access_token?: string };
  return data.access_token ?? null;
};

export const fetchRedditPosts = async (
  subreddit: string,
  limit = 50
): Promise<RedditPost[]> => {
  const token = await getRedditToken();
  const userAgent = process.env.REDDIT_USER_AGENT ?? "runner-toolkit-ingest";

  if (!token) {
    return [];
  }

  const response = await fetch(
    `https://oauth.reddit.com/r/${subreddit}/new?limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": userAgent
      }
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as RedditListingResponse;
  return data.data.children.map((child) => ({
    id: child.data.id,
    title: child.data.title,
    body: child.data.selftext ?? "",
    score: child.data.score ?? 0,
    createdUtc: child.data.created_utc,
    permalink: `https://www.reddit.com${child.data.permalink}`,
    url: child.data.url
  }));
};
