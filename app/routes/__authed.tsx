import type { LoaderArgs } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderArgs) => {
  await requireUserId(request);
  return null;
};

export default function AuthedPages() {
  return <Outlet />;
}
