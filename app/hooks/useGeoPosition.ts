import { useEffect, useReducer } from "react";

type State = {
  status: string;
  position?: GeolocationPosition;
  error?: Error;
};

type Action =
  | { type: "success"; position: GeolocationPosition }
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

export function useGeoPosition() {
  const [state, dispatch] = useReducer(geoPositionReducer, {
    status: "idle",
    position: undefined,
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
      (position) => dispatch({ type: "success", position }),
      (error) => dispatch({ type: "error", error: new Error(error.message) })
    );
    return () => navigator.geolocation.clearWatch(geoWatch);
  }, []);

  return state;
}
