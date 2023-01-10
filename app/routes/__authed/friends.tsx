import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { getUserId } from "~/utils/session.server";
import { db } from "~/utils/db.server";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  invariant(userId, "User ID should not be null");

  const friendships = await db.friendship.findMany({
    select: {
      createdAt: true,
      Friend: { select: { id: true, username: true, fullName: true } }
    },
    where: { userId, pending: false }
  });

  return json({ friendships });
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await getUserId(request);
  invariant(userId, "User ID should not be null");
  const formData = Object.fromEntries(await request.formData());

  if (formData.intent === "addFriend") {
    const user = await db.user.findUnique({
      select: { id: true },
      where: { email: formData.email }
    });
    if (!user) {
      return json(
        {
          fields: formData,
          formError: `User not found.`
        },
        { status: 400 }
      );
    }
    await db.friendship.create({
      data: {
        userId,
        friendId: user.id
      }
    });
    return json({}, { status: 200 });
  }
};

export default function Friends() {
  const { friendships } = useLoaderData();
  console.log(friendships);
  return (
    <section>
      <Link to="/feed">Back</Link>
      <h2>Friends</h2>
      <Form method="post">
        <label>
          Email:
          <input type="text" name="email" />
        </label>
        <button
          type="submit"
          name="intent"
          value="addFriend"
          className="text-white bg-teal-500"
        >
          Add
        </button>
      </Form>
      {friendships.length > 0 ? (
        <div>
          <ul>
            {friendships.map((friendship) => {
              return (
                <li>
                  {friendship.Friend.fullName || "Nameless"} (
                  {friendship.Friend.username})
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div>You have no friends. Add some.</div>
      )}
    </section>
  );
}
