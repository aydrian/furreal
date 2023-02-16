import type { ActionArgs, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, NavLink, Outlet, useActionData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { ArrowSmallRightIcon } from "@heroicons/react/24/solid";

import { requireUserId } from "~/utils/session.server";
import { db } from "~/utils/db.server";
import { UserCombobox } from "../resources/users";

export const loader = async ({ request }: LoaderArgs) => {
  await requireUserId(request);

  return null;
};

export const meta: MetaFunction = () => ({
  title: "FurReal: Friends"
});

export const action = async ({ request }: ActionArgs) => {
  const userId = await requireUserId(request);
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
      <header className="bg-white sticky top-0 p-2">
        <div className="flex justify-between">
          <div className="w-6"></div>
          <h1 className="font-semibold">FurReal</h1>
          <Link to="/feed" prefetch="intent">
            <ArrowSmallRightIcon className="h-6 w-6 text-black" />
          </Link>
        </div>
      </header>
      <main className="flex flex-col gap-2 p-2">
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
      <footer className="flex flex-col place-items-center fixed bottom-0 p-4 w-full z-30">
        <div className="flex bg-slate-800 rounded-full p-2 text-white">
          <NavLink
            to="/friends/"
            className={({ isActive }) =>
              isActive ? "bg-slate-600 rounded-full p-2" : "p-2"
            }
            prefetch="intent"
          >
            Friends
          </NavLink>
          <NavLink
            to="/friends/requests"
            className={({ isActive }) =>
              isActive ? "bg-slate-600 rounded-full p-2" : "p-2"
            }
            prefetch="intent"
          >
            Requests
          </NavLink>
        </div>
      </footer>
    </>
  );
}
