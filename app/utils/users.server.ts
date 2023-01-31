import type { UserProfile } from "./types.server";
import { endOfToday, startOfDay, startOfToday, subDays } from "date-fns";
import { db } from "./db.server";

export const checkUserExists = async (username: string) => {
  const user = await db.user.findUnique({
    select: { id: true },
    where: { username }
  });
  return Boolean(user);
};

export const getUserProfile = async (userId: string) => {
  const then = subDays(new Date(), 13);
  const profile = await db.user.findUnique({
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      bio: true,
      location: true,
      Reals: {
        where: {
          createdAt: {
            gte: startOfDay(then),
            lte: endOfToday()
          }
        }
      }
    },
    where: { id: userId }
  });
  return profile;
};

export const updateUserProfile = async (userId: string, data: UserProfile) => {
  await db.user.update({ data, where: { id: userId } });
};

export const getUserFeed = async (userId: string) => {
  const user = await db.user.findUnique({
    select: {
      id: true,
      username: true,
      fullName: true,
      Reals: {
        where: {
          createdAt: {
            gte: startOfToday(),
            lte: endOfToday()
          }
        }
      },
      Friends: {
        select: { friendId: true },
        where: {
          pending: false
        }
      }
    },
    where: { id: userId }
  });
  return user;
};

export const searchUsers = async (query: string) => {
  const users = await db.user.findMany({
    select: { id: true, username: true, fullName: true },
    where: {
      OR: [{ username: { contains: query } }, { fullName: { contains: query } }]
    }
  });

  return users;
};
