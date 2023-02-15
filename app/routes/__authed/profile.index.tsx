import type { LoaderArgs } from "@remix-run/node";
import { Prisma, Real } from "@prisma/client";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { eachDayOfInterval, isSameDay, subDays } from "date-fns";
import { ArrowSmallLeftIcon } from "@heroicons/react/24/solid";

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
    coords: [],
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
      <header className="bg-white sticky top-0 p-2">
        <div className="flex justify-between">
          <Link to="/feed" prefetch="intent">
            <ArrowSmallLeftIcon className="h-6 w-6 text-black" />
          </Link>
          <h1 className="font-semibold">Profile</h1>
          <div className="w-6"></div>
        </div>
      </header>
      <main className="flex flex-col gap-2 p-2">
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
            <div className="rounded-xl bg-slate-600 p-2 ">
              <h3 className="text-lg font-medium text-white">Last 14 days</h3>
              <Memories memories={memories} />
            </div>
          </section>
        ) : null}
      </main>
      <footer className="fixed bottom-0 p-4 w-full z-30">
        <Form method="post" action="/logout" className="grid">
          <button type="submit" className="text-white bg-red-500">
            Log Out
          </button>
        </Form>
      </footer>
    </>
  );
}
