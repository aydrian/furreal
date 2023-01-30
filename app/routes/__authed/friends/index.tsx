import type { ActionFunction, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { getUserId } from "~/utils/session.server";
import { db } from "~/utils/db.server";
import { UserStack, UserTile } from "~/components/user-stack";

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await getUserId(request);
  invariant(userId, "User ID should not be null");

  const friendships = await db.friendship.findMany({
    select: {
      Friend: { select: { id: true, username: true, fullName: true } }
    },
    where: { userId, pending: false }
  });

  return json({ friendships });
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await getUserId(request);
  invariant(userId, "User ID should not be null");

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delFriend") {
    const friendId = formData.get("friendId");
    invariant(typeof friendId === "string", "Friend ID must be a string");

    await db.$transaction([
      db.friendship.delete({
        where: {
          userId_friendId: {
            userId,
            friendId
          }
        }
      }),
      db.friendship.delete({
        where: {
          userId_friendId: {
            userId: friendId,
            friendId: userId
          }
        }
      })
    ]);
    return json({});
  }
  return json({ message: "Intent not supported" }, { status: 400 });
};

export default function FriendsIndex() {
  const { friendships } = useLoaderData<typeof loader>();
  return (
    <section>
      <h2>My Friends ({friendships.length})</h2>
      {friendships.length > 0 ? (
        <div>
          <UserStack>
            {friendships.map((friendship) => (
              <UserTile key={friendship.Friend.id} user={friendship.Friend}>
                <Form method="post" action="/friends?index">
                  <input
                    type="hidden"
                    name="friendId"
                    value={friendship.Friend.id}
                  />
                  <button type="submit" name="intent" value="delFriend">
                    X
                  </button>
                </Form>
              </UserTile>
            ))}
          </UserStack>
        </div>
      ) : (
        <div>You have no friends. Add some.</div>
      )}
    </section>
  );
}
