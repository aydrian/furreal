import type { UserProfile } from "./types.server";
import { db } from "./db.server";

export const checkUserExists = async (email: string) => {
  const user = await db.user.findUnique({
    select: { id: true },
    where: { email }
  });
  return Boolean(user);
};

export const getUserProfile = async (userId: string) => {
  const profile = await db.user.findUnique({
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      bio: true,
      location: true
    },
    where: { id: userId }
  });
  return profile;
};

export const updateUserProfile = async (userId: string, data: UserProfile) => {
  await db.user.update({ data, where: { id: userId } });
};
