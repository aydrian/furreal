import { useEffect, useReducer } from "react";

type State = {
  status: string;
  position?: GeolocationPosition;
  location?: string;
  error?: Error;
};

type Action =
  | { type: "success"; position: GeolocationPosition; location: string }
  | { type: "fetching"; position: GeolocationPosition }
  | { type: "started" }
  | { type: "error"; error: Error };

function geoPositionReducer(state: State, action: Action): State {
  switch (action.type) {
    case "error": {
      return {
        ...state,
        status: "rejected",
        error: action.error
      };
    }
    case "success": {
      return {
        ...state,
        status: "resolved",
        position: action.position,
        location: action.location
      };
    }
    case "fetching": {
      return {
        ...state,
        status: "resolved",
        position: action.position
      };
    }
    case "started": {
      return {
        ...state,
        status: "pending"
      };
    }
  }
}

async function fetchLocationName(coords: GeolocationCoordinates) {
  const body = await fetch(
    "/resources/getLocationName?" +
      new URLSearchParams({
        lat: coords.latitude.toString(),
        lng: coords.longitude.toString()
      }).toString()
  ).then((resp) => resp.json());
  return body.name;
}

export function useGeoPosition() {
  const [state, dispatch] = useReducer(geoPositionReducer, {
    status: "idle",
    position: undefined,
    location: undefined,
    error: undefined
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      dispatch({
        type: "error",
        error: new Error("Geolocation is not supported")
      });
      return;
    }
    dispatch({ type: "started" });
    const geoWatch = navigator.geolocation.watchPosition(
      (position) => {
        fetchLocationName(position.coords).then((location) =>
          dispatch({ type: "success", position, location })
        );
        return dispatch({ type: "fetching", position });
      },
      (error) => dispatch({ type: "error", error: new Error(error.message) })
    );
    return () => navigator.geolocation.clearWatch(geoWatch);
  }, []);

  return state;
}
