import { db } from "./db.server";

export const checkUserExists = async (email: string) => {
  const user = db.user.findUnique({
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