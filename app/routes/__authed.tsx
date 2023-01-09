import type { LoaderFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

import { requireUserId } from "~/utils/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserId(request);
  return null;
};

export default function AuthedPages() {
  return (
    <main>
      <form method="post" action="/logout" className="m-0">
        <button type="submit" className="text-white bg-teal-500">
          Logout
        </button>
      </form>
      <Outlet />
    </main>
  );
}
