import dataUriToBuffer from "data-uri-to-buffer";
import { db } from "./db.server";

export const createReal = async (
  dataUrl: string,
  userId: string,
  caption: string
) => {
  const imgData = dataUriToBuffer(dataUrl);
  await db.real.create({
    data: {
      imgData,
      caption,
      userId
    }
  });
};

export const getCurrentReal = async (userId: string) => {
  const now = new Date();
  const currentReal = await db.real.findFirst({
    where: {
      userId,
      createdAt: {
        gte: new Date(
          `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
        ),
        lt: new Date(
          `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate() + 1}`
        )
      }
    }
  });

  return currentReal;
};
