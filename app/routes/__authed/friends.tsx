import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  Outlet,
  useActionData,
  useLoaderData
} from "@remix-run/react";
import invariant from "tiny-invariant";

import { getUserId } from "~/utils/session.server";
import { db } from "~/utils/db.server";

// export const loader: LoaderFunction = async ({ request }) => {
//   const userId = await getUserId(request);
//   invariant(userId, "User ID should not be null");

//   const friendships = await db.friendship.findMany({
//     select: {
//       createdAt: true,
//       Friend: { select: { id: true, username: true, fullName: true } }
//     },
//     where: { userId, pending: false }
//   });

//   return json({ friendships });
// };

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
    return json({ message: "Friend requested." }, { status: 200 });
  }
  return json({ message: "Intent not supported" }, { status: 400 });
};

export default function Friends() {
  // const { friendships } = useLoaderData();
  const actionData = useActionData();
  return (
    <section>
      <Link to="/feed">Back</Link>
      <h2>Friends</h2>
      <Form method="post" action="/friends">
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
      {actionData?.message.length > 0 ? (
        <div className="pt-1 text-green-700">{actionData?.message}</div>
      ) : null}
      <Outlet />
      <Link to="/friends">Friends</Link>
      <Link to="/friends/requests">Requests</Link>
    </section>
  );
}
