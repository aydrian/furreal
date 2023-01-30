import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useNavigate } from "@remix-run/react";
import invariant from "tiny-invariant";
import { formatRelative } from "date-fns";

import { getUserId } from "~/utils/session.server";

import { BufferImage } from "~/components/buffer-image";
import { UserCircle } from "~/components/user-circle";
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

  return json({ user, friendReals });
};

export default function Feed() {
  const { user, friendReals } = useLoaderData<typeof loader>();
  const currentReal = user?.Reals[0];
  const navigate = useNavigate();
  return (
    <>
      <Outlet />
      <header className="bg-white sticky top-0">
        <div className="flex justify-between">
          <Link to="/friends" prefetch="intent">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
            </svg>
          </Link>
          <h1>FurReal</h1>
          <Link to="/profile" prefetch="intent">
            <UserCircle user={user} className="h-6 w-6" />
          </Link>
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
