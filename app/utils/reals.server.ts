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
    posts AS (
      SELECT r.id, r.caption, f.username, re.type
      FROM reals r
      JOIN friends f on r.user_id = f.friend_id
      LEFT JOIN reactions re on r.id = re.real_id
      WHERE CAST(r.created_at AS DATE) = current_date()
    )
  SELECT
      p.username,
      p.id,
      p.caption,
      p.type,
      COUNT(*)
  FROM posts p
  GROUP BY p.id, p.username, p.caption, p.type;
  `;

  return friendReals;
};
