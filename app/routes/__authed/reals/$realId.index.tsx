import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { ChevronDownIcon, LockClosedIcon } from "@heroicons/react/24/solid";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";
import { BufferImage } from "~/components/buffer-image";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
  year: "numeric"
});

export const loader = async ({ params, request }: LoaderArgs) => {
  const userId = await requireUserId(request);
  const { realId } = params;

  try {
    const real = await db.real.findFirstOrThrow({
      select: { id: true, imgData: true, createdAt: true },
      where: { id: realId, userId }
    });

    return json({ real });
  } catch (ex) {
    throw new Response("Real not found.", { status: 404 });
  }
};

export default function RealComments() {
  const { real } = useLoaderData<typeof loader>();

  return (
    <>
      <header className="bg-white sticky top-0 p-2">
        <div className="flex justify-between align-middle">
          <Link to="/profile" prefetch="intent">
            <ChevronDownIcon className="h-6 w-6 text-black" />
          </Link>
          <div className="flex flex-col place-content-center text-center">
            <h1 className="font-bold text-lg">
              {dateFormatter.format(new Date(real.createdAt))}
            </h1>
            <h2 className="text-sm text-gray-600 flex gap-1 place-content-center">
              <LockClosedIcon className="w-4 h-4" />{" "}
              <span>Only visible to you.</span>
            </h2>
          </div>
          <div className="w-6"></div>
        </div>
      </header>
      <main className="p-2">
        <BufferImage
          buffer={real.imgData}
          className="rounded-2xl aspect-square w-full m-auto"
        />
      </main>
    </>
  );
}
