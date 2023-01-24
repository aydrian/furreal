import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { eachDayOfInterval, isSameDay, subDays } from "date-fns";

import { getUserId } from "~/utils/session.server";
import { getUserProfile } from "~/utils/users.server";

import { UserCircle } from "~/components/user-circle";

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await getUserId(request);
  invariant(userId, "User ID should be a string.");

  const user = await getUserProfile(userId);
  const Reals = user?.Reals || [];

  const now = new Date();
  const then = subDays(now, 13);
  const dates = eachDayOfInterval({ start: then, end: now });
  console.log(dates.length);

  const memories: Array<
    typeof Reals[0] | { createdAt: Date; caption: string }
  > = [];
  dates.forEach((date) => {
    const real = Reals.find((real) => isSameDay(real.createdAt, date));
    memories.push(real || { createdAt: date, caption: "No photo." });
  });

  return json({ user, memories });
};

export default function Profile() {
  const { user, memories } = useLoaderData<typeof loader>();
  return (
    <>
      <header className="bg-white sticky top-0">
        <div className="flex justify-between">
          <Link to="/feed">Back</Link>
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
          <Link to="./edit">
            <p>
              {user?.fullName && (
                <>
                  <span>{user.fullName}</span>
                  <br />
                </>
              )}
              {user?.username} <br />
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
            <ul className="grid grid-cols-7">
              {memories.map((memory) => {
                return (
                  <li>
                    {new Date(memory.createdAt).getDate()}: {memory.caption}
                  </li>
                );
              })}
            </ul>
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
