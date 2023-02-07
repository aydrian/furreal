import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import invariant from "tiny-invariant";
import { fetch } from "@remix-run/node";

import { requireUserId } from "~/utils/session.server";

const fetchLocationName = async (latitude: string, longitude: string) => {
  const body = await fetch(
    "http://api.geonames.org/findNearbyPlaceNameJSON?" +
      new URLSearchParams({
        username: "itsaydrian",
        lat: latitude,
        lng: longitude
      }).toString()
  ).then((resp) => resp.json());
  const { name, countryName } = body.geonames[0];
  return `${name}, ${countryName}`;
};

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);
  const url = new URL(request.url);
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");
  invariant(typeof lat === "string", "query is required");
  invariant(typeof lng === "string", "query is required");
  const name = await fetchLocationName(lat, lng);
  return json({ name });
}
