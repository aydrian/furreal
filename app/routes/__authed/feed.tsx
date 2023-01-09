import type { LoaderFunction } from "@remix-run/node";
import type { Real } from "@prisma/client";
import { json } from "@remix-run/node";
import { Outlet, useLoaderData, useNavigate } from "@remix-run/react";
import invariant from "tiny-invariant";
import { formatRelative } from "date-fns";

import { getUserId } from "~/utils/session.server";
import { getCurrentReal } from "~/utils/reals.server";

import { BufferImage } from "~/components/buffer-image";

type LoaderData = {
  currentReal: Real;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  invariant(userId, "User ID should not be null");

  const currentReal = await getCurrentReal(userId);

  return json({ currentReal });
};

export default function Feed() {
  const { currentReal } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  return (
    <section>
      <Outlet />
      <h1>Feed</h1>
      {currentReal ? (
        <div>
          <BufferImage buffer={currentReal.imgData} />
          <p>{currentReal.caption}</p>
          <p>{formatRelative(new Date(currentReal.createdAt), new Date())}</p>
        </div>
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
    </section>
  );
}
