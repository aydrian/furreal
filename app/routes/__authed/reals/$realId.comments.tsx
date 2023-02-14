import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, Response } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { formatRelative } from "date-fns";
import { ArrowSmallLeftIcon } from "@heroicons/react/24/solid";
import invariant from "tiny-invariant";

import { db } from "~/utils/db.server";
import { getUserId } from "~/utils/session.server";

import { BufferImage } from "~/components/buffer-image";
import { UserCircle } from "~/components/user-circle";

export const loader = async ({ params, request }: LoaderArgs) => {
  const { realId } = params;
  const userId = await getUserId(request);
  invariant(typeof userId === "string", "User ID should be a string.");

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
          }
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

    return json({ real, selfOwned });
  } catch (err) {
    throw new Response("Real not found.", { status: 404 });
  }
};

export const action = async ({ params, request }: ActionArgs) => {
  const { realId } = params;
  invariant(typeof realId === "string", "Real ID should be a string.");
  const userId = await getUserId(request);
  invariant(typeof userId === "string", "User ID should be a string.");

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
  const { real, selfOwned } = useLoaderData<typeof loader>();
  return (
    <>
      <header className="bg-white sticky top-0 p-2">
        <div className="flex justify-between align-middle">
          <Link to="/feed" prefetch="intent">
            <ArrowSmallLeftIcon className="h-6 w-6 text-black" />
          </Link>
          <div className="flex flex-col place-content-center text-center">
            <h1 className="font-semibold">
              {selfOwned ? "My" : `${real.User.username}'s`} FurReal
            </h1>
            <h2 className="text-grey-600">
              {formatRelative(new Date(real.createdAt), new Date())}
            </h2>
          </div>
          <div className="w-6"></div>
        </div>
      </header>
      <main>
        <section className="flex flex-col place-items-center">
          <BufferImage
            buffer={real.imgData}
            className="rounded-2xl aspect-square w-1/3"
          />
          <p>{real.caption}</p>
        </section>
        <section>
          <hr />
          {real.Comments && real.Comments.length > 0 ? (
            <ul>
              {real.Comments.map((comment) => (
                <Comment key={comment.id} comment={comment} />
              ))}
            </ul>
          ) : (
            <div>Be the first to comment!</div>
          )}
        </section>
      </main>
      <footer className="fixed bottom-0 p-4 w-full z-30">
        <Form method="post" className="flex">
          <input type="text" name="comment" className="flex-grow" />
          <button type="submit" name="intent" value="addComment">
            Add
          </button>
        </Form>
      </footer>
    </>
  );
}

function Comment({ comment }) {
  return (
    <li className="flex gap-3">
      <UserCircle user={comment.User} className="w-8 h-8" />
      <div className="flex flex-col flex-grow">
        <div className="flex gap-3">
          <div className="font-semibold">{comment.User.username}</div>
          <div className="text-slate-500">
            {formatRelative(new Date(comment.createdAt), new Date())}
          </div>
        </div>
        <p>{comment.comment}</p>
      </div>
    </li>
  );
}
