import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useNavigate } from "@remix-run/react";
import invariant from "tiny-invariant";
import { formatRelative } from "date-fns";
import { EyeSlashIcon, UsersIcon } from "@heroicons/react/24/solid";

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
      <header className="bg-white sticky top-0 p-2">
        <div className="flex justify-between">
          <Link to="/friends/" prefetch="intent">
            <UsersIcon className="h-6 w-6 text-black" />
          </Link>
          <h1 className="font-semibold">FurReal</h1>
          <Link to="/profile" prefetch="intent">
            <UserCircle user={user} className="h-6 w-6" />
          </Link>
        </div>
      </header>
      <main className="p-2">
        {currentReal ? (
          <>
            <section className="flex flex-col place-items-center">
              <BufferImage
                buffer={currentReal.imgData}
                className="rounded-2xl  aspect-[3/4] w-1/3"
              />
              <p>{currentReal.caption}</p>
              <p>
                {currentReal.location} &#x2022;{" "}
                {formatRelative(new Date(currentReal.createdAt), new Date())}
              </p>
            </section>
            <section>
              {friendReals && friendReals.length > 0 ? (
                <ul className="flex flex-col place-items-center">
                  {friendReals.map((friendReal) => {
                    return (
                      <li key={friendReal.User.id}>
                        <div className="flex align-middle">
                          <UserCircle
                            user={friendReal.User}
                            className="w-8 h-8"
                          />
                          <div className="flex flex-col">
                            <h3>{friendReal.User.username}</h3>
                            <p>
                              {friendReal.location} &#x2022;{" "}
                              {formatRelative(
                                new Date(friendReal.createdAt),
                                new Date()
                              )}
                            </p>
                          </div>
                        </div>
                        <BufferImage
                          buffer={friendReal.imgData}
                          className="rounded-2xl aspect-[3/4]"
                        />
                        {friendReal.caption ? (
                          <p>{friendReal.caption}</p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div>No one has posted yet.</div>
              )}
            </section>
          </>
        ) : (
          <div className=" flex flex-col place-items-center rounded-xl px-2 py-8 bg-slate-600 text-white">
            <EyeSlashIcon className="h-10 w-10 text-white"></EyeSlashIcon>
            <h3 className="font-semibold text-xl">Post to view</h3>
            <p className="text-center">
              To view your friends' FurReal, share yours with them.
            </p>
            <button
              type="button"
              className="text-black font-medium bg-white mt-4"
              onClick={() => navigate(`post`)}
            >
              Post a FurReal
            </button>
          </div>
        )}
      </main>
    </>
  );
}
