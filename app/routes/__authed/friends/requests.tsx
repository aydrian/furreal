import type { ActionFunction, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { XMarkIcon } from "@heroicons/react/20/solid";

import { requireUserId } from "~/utils/session.server";
import { db } from "~/utils/db.server";
import { UserStack, UserTile } from "~/components/user-stack";

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await requireUserId(request);

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
  const userId = await requireUserId(request);

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
      <h3 className="text-lg font-semibold uppercase">
        Friend Requests ({friendships.length})
      </h3>
      {friendships.length > 0 ? (
        <div>
          <UserStack>
            {friendships.map((friendship) => (
              <UserTile key={friendship.User.id} user={friendship.User}>
                <Form method="post" className="flex align-middle">
                  <input
                    type="hidden"
                    name="friendId"
                    value={friendship.User.id}
                  />
                  <button
                    type="submit"
                    name="intent"
                    value="accept"
                    className="rounded-full bg-slate-600 text-white uppercase text-xs"
                  >
                    Accept
                  </button>
                  <button type="submit" name="intent" value="ignore">
                    <XMarkIcon className="h-5 w-5 text-black" />
                  </button>
                </Form>
              </UserTile>
            ))}
          </UserStack>
        </div>
      ) : (
        <div className="flex flex-col place-items-center rounded-xl bg-slate-600 p-2 text-white">
          <h3 className="font-semibold">No pending requests</h3>
          <p>You don't have any pending requests.</p>
        </div>
      )}
    </section>
  );
}
