import type { LoaderFunction } from "react-router";
import type { UserProfile } from "~/utils/types.server";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { getUserId } from "~/utils/session.server";
import { getUserProfile } from "~/utils/users.server";

import { UserCircle } from "~/components/user-circle";

type LoaderData = {
  user: UserProfile;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  invariant(userId, "User ID should be a string.");

  const user = await getUserProfile(userId);

  return json({ user });
};

export default function Profile() {
  const { user } = useLoaderData<LoaderData>();
  return (
    <section>
      <Link to="/feed">Back</Link>
      <h1>Profile</h1>
      <UserCircle user={user} className="h-24 w-24 mx-auto flex-shrink-0" />
      <Link to="./edit">
        <p>
          {user.fullName && (
            <>
              <span>{user.fullName}</span>
              <br />
            </>
          )}
          {user.username} <br />
          {user.bio && (
            <>
              <span>{user.bio}</span>
              <br />
            </>
          )}
          {user.location && (
            <>
              <span>{user.location}</span>
              <br />
            </>
          )}
        </p>
      </Link>
    </section>
  );
}
