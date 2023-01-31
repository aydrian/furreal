import type { LoaderArgs } from "@remix-run/node";
import { Prisma, Real } from "@prisma/client";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { eachDayOfInterval, isSameDay, subDays } from "date-fns";

import { getUserId } from "~/utils/session.server";
import { getUserProfile } from "~/utils/users.server";

import { UserCircle } from "~/components/user-circle";
import { Memories } from "~/components/memories";

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await getUserId(request);
  invariant(userId, "User ID should be a string.");

  const user = await getUserProfile(userId);
  const Reals = user?.Reals || [];

  const now = new Date();
  const then = subDays(now, 13);
  const dates = eachDayOfInterval({ start: then, end: now });

  const memories: Array<Real> = [];
  const none: Real = {
    id: "none",
    createdAt: now,
    caption: null,
    location: null,
    imgData: Buffer.from(""),
    userId
  };
  dates.forEach((date) => {
    const real = Reals.find((real) => isSameDay(real.createdAt, date));
    memories.push(
      real || { ...none, id: date.getTime() + "", createdAt: date }
    );
  });

  return json({ user, memories });
};

export default function Profile() {
  const { user, memories } = useLoaderData<typeof loader>();
  return (
    <>
      <header className="bg-white sticky top-0">
        <div className="flex justify-between">
          <Link to="/feed" prefetch="intent">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75"
              />
            </svg>
          </Link>
          <h1 className="font-semibold">Profile</h1>
          <div className="w-6"></div>
        </div>
      </header>
      <main>
        <section className="flex flex-col place-items-center">
          {user ? <UserCircle user={user} className="h-24 w-24" /> : null}
          <Link to="./edit" prefetch="intent">
            <div className="flex flex-col place-items-center">
              <h2 className="text-xl font-semibold">{user?.fullName}</h2>
              <h3 className="text-lg font-medium">{user?.username}</h3>
              {user?.email && <div>{user.email}</div>}
              {user?.bio && <div>{user.bio}</div>}
              {user?.location && <div>{user.location}</div>}
            </div>
          </Link>
        </section>
        {memories ? (
          <section>
            <h2 className="text-xl font-semibold">Your Memories</h2>
            <div className="rounded-xl bg-slate-700 p-2 ">
              <h3 className="text-lg font-medium text-white">Last 14 days</h3>
              <Memories memories={memories} />
            </div>
          </section>
        ) : null}
        <section>
          <Form method="post" action="/logout" className="grid">
            <button type="submit" className="text-white bg-red-500">
              Log Out
            </button>
          </Form>
        </section>
      </main>
    </>
  );
}
