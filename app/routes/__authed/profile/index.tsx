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
          <h1>Profile</h1>
          <div></div>
        </div>
      </header>
      <main>
        <section>
          {user ? (
            <UserCircle
              user={user}
              className="h-24 w-24 mx-auto flex-shrink-0"
            />
          ) : null}
          <Link to="./edit" prefetch="intent">
            <p>
              {user?.fullName} <br />
              {user?.username} <br />
              {user?.email && (
                <>
                  <span>{user.email}</span>
                  <br />
                </>
              )}
              {user?.bio && (
                <>
                  <span>{user.bio}</span>
                  <br />
                </>
              )}
              {user?.location && (
                <>
                  <span>{user.location}</span>
                  <br />
                </>
              )}
            </p>
          </Link>
        </section>
        {memories ? (
          <section>
            <h2>Your Memories</h2>
            <Memories memories={memories} />
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
