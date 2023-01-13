import { Prisma } from "@prisma/client";

export type LoginForm = {
  email: string;
  password: string;
};

export type SignUpForm = {
  email: string;
  password: string;
  username: string;
};

export type ActionErrors<T> = Partial<Record<keyof T, string>>;

export type ActionData<T> = {
  formError?: string;
  fieldErrors?: ActionErrors<T>;
  fields?: T;
};

const userProfile = Prisma.validator<Prisma.UserArgs>()({
  select: {
    id: true,
    email: true,
    username: true,
    fullName: true,
    bio: true,
    location: true
  }
});

export type UserProfile = Prisma.UserGetPayload<typeof userProfile>;
