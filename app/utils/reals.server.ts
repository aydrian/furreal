import dataUriToBuffer from "data-uri-to-buffer";
import { endOfToday, startOfToday } from "date-fns";
import { db } from "./db.server";

export const createReal = async (
  dataUrl: string,
  userId: string,
  caption: string,
  location?: string,
  coords?: Array<number>
) => {
  const imgData = dataUriToBuffer(dataUrl);
  await db.real.create({
    data: {
      imgData,
      caption,
      userId,
      location,
      coords
    }
  });
};

export const getCurrentReal = async (userId: string) => {
  const currentReal = await db.real.findFirst({
    where: {
      userId,
      createdAt: {
        gte: startOfToday(),
        lte: endOfToday()
      }
    }
  });

  return currentReal;
};

export const getCurrentFriendReals = async (
  userId: string,
  friends: Array<{ friendId: string }> | undefined
) => {
  if (!friends) {
    return [];
  }
  const friendIds = friends.map((friend) => {
    return friend.friendId;
  });

  const friendReals = await db.real.findMany({
    include: {
      User: { select: { id: true, username: true } },
      Reaction: { select: { type: true }, where: { userId } }
    },
    where: {
      createdAt: {
        gte: startOfToday(),
        lte: endOfToday()
      },
      userId: { in: friendIds }
    },
    orderBy: { createdAt: "desc" }
  });
  return friendReals;
};

export const getCurrentFriendRealsRaw = async (userId: string) => {
  const friendReals = await db.$queryRaw`
  WITH
    friends AS (
      SELECT u.id, f.friend_id, u.username
      FROM friendships f
        JOIN users u on f.friend_id = u.id
      WHERE user_id = ${userId}
        AND pending = 'f'
    ),
    friend_posts (
      post_id,
      post_caption,
      post_username,
      reaction_type
    ) AS (
      SELECT r.id, r.caption, f.username, re.type
      FROM reals r
        JOIN friends f on r.user_id = f.friend_id
        LEFT JOIN reactions re on r.id = re.real_id
      WHERE CAST(r.created_at AS DATE) = current_date()
    ),
    reaction_counts AS (
      SELECT post_id, post_caption, post_username, reaction_type, COUNT(*)
      FROM friend_posts p
      GROUP BY post_id, post_caption, post_username, reaction_type
    ),
    my_reactions (post_id, my_reaction) AS (
      SELECT r.id, re.type
      FROM reactions re
        JOIN reals r ON re.real_id = r.id
      WHERE re.user_id = ${userId}
    )
  SELECT
      rc.post_id, rc.post_caption, rc.post_username, rc.reaction_type, rc.count, mr.my_reaction
  FROM reaction_counts rc
    LEFT JOIN my_reactions mr ON rc.post_id = mr.post_id;
  `;

  return friendReals;
};
