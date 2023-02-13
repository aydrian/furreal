import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  Outlet,
  useFetcher,
  useLoaderData,
  useNavigate
} from "@remix-run/react";
import invariant from "tiny-invariant";
import { formatRelative } from "date-fns";
import { EyeSlashIcon, UsersIcon } from "@heroicons/react/24/solid";
import { HeartIcon } from "@heroicons/react/24/solid";

import { getUserId } from "~/utils/session.server";

import { BufferImage } from "~/components/buffer-image";
import { UserCircle } from "~/components/user-circle";
import { getUserFeed } from "~/utils/users.server";
import { getCurrentFriendReals } from "~/utils/reals.server";
import { db } from "~/utils/db.server";
import { ReactionType } from "@prisma/client";

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await getUserId(request);
  invariant(userId, "User ID should not be null");

  const user = await getUserFeed(userId);

  if (user?.Reals.length === 0) {
    return json({ user, friendReals: null });
  }

  const friendReals = await getCurrentFriendReals(userId, user?.Friends);

  return json({ user, friendReals });
};

export const action = async ({ request }: ActionArgs) => {
  const userId = await getUserId(request);
  invariant(userId, "User ID should be a string.");

  const formData = Object.fromEntries(await request.formData());

  if (formData.intent === "addLike") {
    const realId = formData.realId as string;
    await db.reaction.create({
      data: {
        userId,
        realId
      }
    });
    return json({ message: "Added Like." }, { status: 200 });
  } else if (formData.intent == "delLike") {
    const realId = formData.realId as string;
    await db.reaction.delete({ where: { realId_userId: { realId, userId } } });
    return json({ message: "Deleted Like." }, { status: 200 });
  }
  return json({ message: "Intent not supported" }, { status: 400 });
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
                className="rounded-2xl aspect-square w-1/3"
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
                  {friendReals.map((friendReal) => (
                    <FriendReal
                      key={friendReal.User.id}
                      friendReal={friendReal}
                    />
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col place-items-center px-2 py-8">
                  <p className="text-center">
                    Your friends haven't posted their FurReal yet. Add even more
                    friends.
                  </p>
                  <button
                    type="button"
                    className="text-black font-medium bg-white mt-4"
                    onClick={() => navigate(`/friends/`)}
                  >
                    + Add Friends
                  </button>
                </div>
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

function FriendReal({ friendReal }) {
  const fetcher = useFetcher();

  const isLiking =
    fetcher.submission?.formData.get("intent") === "addLike" &&
    fetcher.submission?.formData.get("realId") === friendReal.id;
  const isDisliking =
    fetcher.submission?.formData.get("intent") === "delLike" &&
    fetcher.submission?.formData.get("realId") === friendReal.id;

  const yourReactions = friendReal.Reaction.map((reaction) => reaction.type);
  const liked = yourReactions.includes(ReactionType.LIKE);
  return (
    <li>
      <fetcher.Form method="post" replace>
        <input type="hidden" name="realId" value={friendReal.id} />
        <div className="flex align-middle">
          <UserCircle user={friendReal.User} className="w-8 h-8" />
          <div className="flex flex-col">
            <h3>{friendReal.User.username}</h3>
            <p>
              {friendReal.location} &#x2022;{" "}
              {formatRelative(new Date(friendReal.createdAt), new Date())}
            </p>
          </div>
        </div>
        <div className="relative aspect-square">
          <BufferImage
            buffer={friendReal.imgData}
            className="rounded-2xl aspect-square w-full"
          />
          <div className="absolute z-10 bottom-2 right-4">
            <button
              type="submit"
              name="intent"
              value={
                (liked || isLiking) && !isDisliking ? "delLike" : "addLike"
              }
              className="p-0 m-0"
            >
              <HeartIcon
                className={`h-12 w-12  drop-shadow-md ${
                  (liked || isLiking) && !isDisliking
                    ? "text-pink-600"
                    : "text-white hover:text-pink-600"
                }`}
              />
            </button>
          </div>
        </div>
        {friendReal.caption ? <p>{friendReal.caption}</p> : null}
      </fetcher.Form>
    </li>
  );
}
