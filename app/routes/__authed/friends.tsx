import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, NavLink, Outlet, useActionData } from "@remix-run/react";
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
          <div className="w-6"></div>
          <h1 className="font-semibold">FurReal</h1>
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
                d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
              />
            </svg>
          </Link>
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
      <footer className="flex place-items-center">
        <div className="flex bg-slate-800 rounded-full p-2 text-white">
          <NavLink
            to="/friends/"
            className={({ isActive }) =>
              isActive ? "bg-slate-600 rounded-full p-2" : "p-2"
            }
          >
            Friends
          </NavLink>
          <NavLink
            to="/friends/requests"
            className={({ isActive }) =>
              isActive ? "bg-slate-600 rounded-full p-2" : "p-2"
            }
          >
            Requests
          </NavLink>
        </div>
      </footer>
    </>
  );
}
