import { useEffect, useState } from "react";
import { MapPinIcon } from "@heroicons/react/24/solid";

interface props {
  className?: string;
  location?: string;
  coords?: GeolocationCoordinates;
}

const fetchLocationName = async (coords: GeolocationCoordinates) => {
  const body = await fetch(
    "/resources/getLocationName?" +
      new URLSearchParams({
        lat: coords.latitude.toString(),
        lng: coords.longitude.toString()
      }).toString()
  ).then((resp) => resp.json());
  return body.name;
};

export const LocationTag: React.FC<props> = ({
  coords,
  location,
  className
}) => {
  const [locationName, setLocationName] = useState(location);

  useEffect(() => {
    if (coords) {
      fetchLocationName(coords).then((name) => setLocationName(name));
    }
  }, [coords]);
  return (
    <div className={`${className} flex rounded-full p-2`}>
      <MapPinIcon className="h-4 w-4" />
      <p className="text-sm font-medium">{locationName}</p>
    </div>
  );
};
