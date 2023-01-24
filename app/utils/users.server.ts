import type { UserProfile } from "./types.server";
import { subDays } from "date-fns";
import { db } from "./db.server";

export const checkUserExists = async (email: string) => {
  const user = await db.user.findUnique({
    select: { id: true },
    where: { email }
  });
  return Boolean(user);
};

export const getUserProfile = async (userId: string) => {
  const now = new Date();
  const then = subDays(now, 13);
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
            gte: new Date(
              `${then.getFullYear()}-${then.getMonth() + 1}-${then.getDate()}`
            ),
            lte: new Date(
              `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate() + 1}`
            )
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
  const now = new Date();
  const user = await db.user.findUnique({
    select: {
      id: true,
      username: true,
      fullName: true,
      Reals: {
        where: {
          createdAt: {
            gte: new Date(
              `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
            ),
            lt: new Date(
              `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate() + 1}`
            )
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
