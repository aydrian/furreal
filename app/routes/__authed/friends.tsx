import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, Outlet, useActionData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { getUserId } from "~/utils/session.server";
import { db } from "~/utils/db.server";

export const action: ActionFunction = async ({ request }) => {
  const userId = await getUserId(request);
  invariant(userId, "User ID should not be null");
  const formData = Object.fromEntries(await request.formData());

  if (formData.intent === "addFriend") {
    const user = await db.user.findUnique({
      select: { id: true },
      where: { email: formData.email as string }
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
  const actionData = useActionData();
  return (
    <>
      <header className="bg-white sticky top-0">
        <div className="flex justify-between">
          <div></div>
          <h1>FurReal</h1>
          <Link to="/feed">Back</Link>
        </div>
      </header>
      <main>
        <section>
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
        </section>
        <section>
          <Outlet />
        </section>
      </main>
      <footer>
        <Link to="/friends">Friends</Link>
        <Link to="/friends/requests">Requests</Link>
      </footer>
    </>
  );
}
