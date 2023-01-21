import type { ActionFunction, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { getUserId } from "~/utils/session.server";
import { db } from "~/utils/db.server";

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await getUserId(request);
  invariant(userId, "User ID should not be null");

  const friendships = await db.friendship.findMany({
    select: {
      createdAt: true,
      User: { select: { id: true, username: true, fullName: true } }
    },
    where: { friendId: userId, pending: true }
  });

  return json({ friendships });
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await getUserId(request);
  invariant(userId, "User ID should not be null");

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "accept") {
    const friendId = formData.get("friendId");
    invariant(typeof friendId === "string", "Friend ID must be a string");

    const now = new Date();
    await db.$transaction([
      db.friendship.create({
        data: { userId, friendId, pending: false, createdAt: now }
      }),
      db.friendship.update({
        data: { createdAt: now, pending: false },
        where: { userId_friendId: { userId: friendId, friendId: userId } }
      })
    ]);
    return json({});
  } else if (intent === "ignore") {
    const friendId = formData.get("friendId");
    invariant(typeof friendId === "string", "Friend ID must be a string");

    await db.friendship.delete({
      where: {
        userId_friendId: {
          userId: friendId,
          friendId: userId
        }
      }
    });
  }
  return json({ message: "Intent not supported" }, { status: 400 });
};

export default function FriendsRequests() {
  const { friendships } = useLoaderData<typeof loader>();
  return (
    <section>
      <h2>Friend Requests ({friendships.length})</h2>
      {friendships.length > 0 ? (
        <div>
          <ul>
            {friendships.map((friendship) => {
              return (
                <li key={friendship.User.id}>
                  <Form method="post">
                    <input
                      type="hidden"
                      name="friendId"
                      value={friendship.User.id}
                    />
                    {friendship.User.fullName || "Nameless"} (
                    {friendship.User.username})
                    <button type="submit" name="intent" value="accept">
                      Accept
                    </button>
                    <button type="submit" name="intent" value="ignore">
                      Ignore
                    </button>
                  </Form>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div>You have no requests.</div>
      )}
    </section>
  );
}
