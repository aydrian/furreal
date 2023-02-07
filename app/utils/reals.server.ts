import dataUriToBuffer from "data-uri-to-buffer";
import { endOfToday, startOfToday } from "date-fns";
import { db } from "./db.server";

export const createReal = async (
  dataUrl: string,
  userId: string,
  caption: string,
  location?: string
) => {
  const imgData = dataUriToBuffer(dataUrl);
  await db.real.create({
    data: {
      imgData,
      caption,
      userId,
      location
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
