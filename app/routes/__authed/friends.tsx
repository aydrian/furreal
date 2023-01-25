import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, Outlet, useActionData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { getUserId } from "~/utils/session.server";
import { db } from "~/utils/db.server";
import { UserCombobox } from "../resources/users";

export const action: ActionFunction = async ({ request }) => {
  const userId = await getUserId(request);
  invariant(userId, "User ID should not be null");
  const formData = Object.fromEntries(await request.formData());

  if (formData.intent === "addFriend") {
    const friendId = formData.userId as string;
    await db.friendship.create({
      data: {
        userId,
        friendId
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
            <UserCombobox />
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
