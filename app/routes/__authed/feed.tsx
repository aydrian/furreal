import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useNavigate } from "@remix-run/react";
import invariant from "tiny-invariant";
import { formatRelative } from "date-fns";

import { getUserId } from "~/utils/session.server";

import { BufferImage } from "~/components/buffer-image";
import { getUserFeed } from "~/utils/users.server";
import { getCurrentFriendReals } from "~/utils/reals.server";

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await getUserId(request);
  invariant(userId, "User ID should not be null");

  const user = await getUserFeed(userId);

  if (user?.Reals.length === 0) {
    return json({ user, friendReals: null });
  }

  const friendReals = await getCurrentFriendReals(user?.Friends);
  console.log(friendReals);

  return json({ user, friendReals });
};

export default function Feed() {
  const { user, friendReals } = useLoaderData<typeof loader>();
  const currentReal = user?.Reals[0];
  console.log("Current Real", currentReal);
  console.log("Friend Reals", friendReals);
  const navigate = useNavigate();
  return (
    <>
      <Outlet />
      <header className="bg-white sticky top-0">
        <div className="flex justify-between">
          <Link to="/friends">Friends</Link>
          <h1>FurReal</h1>
          <Link to="/profile">Profile</Link>
        </div>
      </header>
      <main>
        {currentReal ? (
          <>
            <div>
              <BufferImage buffer={currentReal.imgData} />
              <p>{currentReal.caption}</p>
              <p>
                {formatRelative(new Date(currentReal.createdAt), new Date())}
              </p>
            </div>
            {friendReals ? (
              <ul>
                {friendReals.map((friendReal) => {
                  return (
                    <li key={friendReal.User.id}>
                      <h3>{friendReal.User.username}</h3>
                      <BufferImage buffer={friendReal.imgData} />
                      <p>{friendReal.caption}</p>
                      <p>
                        {formatRelative(
                          new Date(friendReal.createdAt),
                          new Date()
                        )}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div>No one has posted yet</div>
            )}
          </>
        ) : (
          <div>
            <p>Post a Real to see today's feed.</p>
            <button
              type="button"
              className="text-white bg-teal-500"
              onClick={() => navigate(`post`)}
            >
              Be FurReal
            </button>
          </div>
        )}
      </main>
    </>
  );
}
