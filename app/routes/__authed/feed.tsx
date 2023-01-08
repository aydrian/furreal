import type { LoaderFunction } from "@remix-run/node";
import type { Real } from "@prisma/client";
import { json } from "@remix-run/node";
import { Outlet, useLoaderData, useNavigate } from "@remix-run/react";
import invariant from "tiny-invariant";

import { getUserId } from "~/utils/session.server";
import { db } from "~/utils/db.server";

type LoaderData = {
  currentReal: Real;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  invariant(userId, "User ID should not be null");

  const now = new Date();

  const currentReal = db.real.findFirst({
    where: {
      createdAt: {
        gte: new Date(
          `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
        ),
        lt: new Date(
          `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate() + 1}`
        )
      }
    }
  });

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
          <p>Post a Real to see today's feed.</p>
          <button type="button" onClick={() => navigate(`post`)}>
            Be FurReal
          </button>
        </div>
      ) : (
        <div>TODO: Display Image</div>
      )}
    </section>
  );
}
