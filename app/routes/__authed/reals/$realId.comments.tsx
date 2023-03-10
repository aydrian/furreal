import type { ActionArgs, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json, Response } from "@remix-run/node";
import { Form, Link, useLoaderData, useNavigation } from "@remix-run/react";
import { formatRelative } from "date-fns";
import {
  ArrowSmallLeftIcon,
  PaperAirplaneIcon
} from "@heroicons/react/24/solid";
import invariant from "tiny-invariant";

import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

import { BufferImage } from "~/components/buffer-image";
import { UserCircle } from "~/components/user-circle";
import { LocationTag } from "~/components/location-tag";
import { useEffect, useRef } from "react";
import { getUserProfile } from "~/utils/users.server";

export const loader = async ({ params, request }: LoaderArgs) => {
  const userId = await requireUserId(request);
  const currentUser = await getUserProfile(userId);
  const { realId } = params;

  try {
    const real = await db.real.findUniqueOrThrow({
      select: {
        id: true,
        location: true,
        caption: true,
        createdAt: true,
        imgData: true,
        User: { select: { id: true, username: true } },
        Comments: {
          select: {
            id: true,
            createdAt: true,
            comment: true,
            User: { select: { id: true, username: true, fullName: true } }
          },
          orderBy: { createdAt: "asc" }
        }
      },
      where: { id: realId }
    });

    // Check if Real User is Auth User
    const selfOwned = userId === real.User.id;
    if (!selfOwned) {
      // Check if Real User is a Friend of Auth User
      const friendshipCount = await db.friendship.count({
        where: { userId, friendId: real.User.id, pending: false }
      });

      if (friendshipCount === 0) {
        throw new Response("Real not found.", { status: 404 });
      }
    }

    return json({ currentUser, real, selfOwned });
  } catch (err) {
    throw new Response("Real not found.", { status: 404 });
  }
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const { real, selfOwned } = data;
  return {
    title: `FurReal: ${selfOwned ? "My" : `${real.User.username}'s`} FurReal`
  };
};

export const action = async ({ params, request }: ActionArgs) => {
  const userId = await requireUserId(request);
  const { realId } = params;
  invariant(typeof realId === "string", "Real ID should be a string.");

  const formData = Object.fromEntries(await request.formData());

  if (formData.intent === "addComment") {
    const comment = formData.comment as string;
    if (comment.length > 0) {
      await db.comment.create({
        data: {
          realId,
          userId,
          comment
        }
      });
    }
  }

  return null;
};

export default function RealComments() {
  const { currentUser, real, selfOwned } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isAdding =
    navigation.state === "submitting" &&
    navigation.formData.get("intent") === "addComment";
  console.log(`isAdding? ${isAdding}, nav state: ${navigation.state}`);

  let formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (isAdding) {
      formRef.current?.reset();
    }
  }, [isAdding]);

  return (
    <>
      <header className="bg-white sticky top-0 p-2">
        <div className="flex justify-between align-middle">
          <Link to="/feed" prefetch="intent">
            <ArrowSmallLeftIcon className="h-6 w-6 text-black" />
          </Link>
          <div className="flex flex-col place-content-center text-center">
            <h1 className="font-bold">
              {selfOwned ? "My" : `${real.User.username}'s`} FurReal
            </h1>
            <h2 className="text-sm text-gray-600">
              {formatRelative(new Date(real.createdAt), new Date())}
            </h2>
          </div>
          <div className="w-6"></div>
        </div>
      </header>
      <main className="p-2">
        <section className="flex flex-col place-items-center">
          <BufferImage
            buffer={real.imgData}
            className="rounded-2xl aspect-square w-1/3"
          />
          <p className="font-semibold">{real.caption}</p>{" "}
          {real.location ? (
            <LocationTag
              location={real.location}
              className="text-white bg-gray-800 rounded-full font-semibold text-sm"
            />
          ) : null}
        </section>
        <section>
          <hr className="m-4" />
          {real.Comments ? (
            <ul>
              {real.Comments.map((comment) => (
                <Comment key={comment.id} comment={comment} />
              ))}
              {isAdding && (
                <Comment
                  isOptimistic
                  comment={{
                    comment: navigation.formData.get("comment"),
                    createdAt: new Date().toDateString(),
                    User: currentUser
                  }}
                />
              )}
            </ul>
          ) : (
            <p className="text-center">Be the first to comment!</p>
          )}
        </section>
      </main>
      <footer className="fixed bottom-0 p-2 w-full z-30">
        <Form ref={formRef} method="post" replace className="flex">
          <input type="text" name="comment" className="flex-grow" />
          <button type="submit" name="intent" value="addComment">
            <PaperAirplaneIcon className="text-black w-6 h-6" />
            <span className="sr-only">Add</span>
          </button>
        </Form>
      </footer>
    </>
  );
}

function Comment({ comment, isOptimistic = false }) {
  return (
    <li className="flex gap-3">
      <UserCircle user={comment.User} className="w-8 h-8" />
      <div className="flex flex-col flex-grow">
        <div className="flex gap-3">
          <div className="font-semibold">{comment.User.username}</div>
          <div className="text-slate-500 text-sm">
            {formatRelative(new Date(comment.createdAt), new Date())}
          </div>
        </div>
        <p className="text-sm">{comment.comment}</p>
      </div>
    </li>
  );
}
