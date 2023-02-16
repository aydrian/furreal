import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ params, request }: LoaderArgs) => {
  await requireUserId(request);
  const { realId } = params;

  return json({ realId });
};

export default function RealComments() {
  const { realId } = useLoaderData<typeof loader>();
  return <div>Index for {realId || "Not found"}</div>;
}
