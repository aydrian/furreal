import type { LoaderFunction } from "react-router";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { getUserId } from "~/utils/session.server";
import { db } from "~/utils/db.server";

import { UserCircle } from "~/components/user-circle";

export const loader: LoaderFunction = async ({ request }) => {
  const id = await getUserId(request);
  invariant(id, "User ID should be a string.");

  const user = await db.user.findUnique({
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      bio: true,
      location: true
    },
    where: { id }
  });

  return json({ user });
};

export default function Profile() {
  const { user } = useLoaderData();
  return (
    <section>
      <h1>Profile</h1>
      <UserCircle user={user} className="h-24 w-24 mx-auto flex-shrink-0" />
      <p>{user.username}</p>
    </section>
  );
}