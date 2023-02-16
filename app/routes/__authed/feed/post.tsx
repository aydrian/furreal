import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import type { ActionData } from "~/utils/types.server";
import { json, redirect } from "@remix-run/node";
import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Form, useActionData } from "@remix-run/react";
import * as Z from "zod";
import {
  ArrowPathIcon,
  PaperAirplaneIcon,
  XCircleIcon
} from "@heroicons/react/24/solid";

import { LocationTag } from "~/components/location-tag";
import { Modal } from "~/components/modal";
import { useGeoPosition } from "~/hooks/useGeoPosition";

import { validateAction } from "~/utils/utils";
import { requireUserId } from "~/utils/session.server";
import { createReal } from "~/utils/reals.server";

export const loader = async ({ request }: LoaderArgs) => {
  await requireUserId(request);

  return null;
};

const schema = Z.object({
  caption: Z.string(),
  dataUrl: Z.string(),
  location: Z.string().optional(),
  latitude: Z.string().optional(),
  longitude: Z.string().optional()
});

type ActionInput = Z.TypeOf<typeof schema>;

export const action = async ({ request }: ActionArgs) => {
  const userId = await requireUserId(request);

  const { formData, errors } = await validateAction<ActionInput>({
    request,
    schema
  });

  if (errors) {
    return json({ fieldErrors: errors, fields: formData }, { status: 400 });
  }

  const { caption, dataUrl, location, latitude, longitude } = formData;

  let coords: Array<number> = [];
  if (latitude && longitude) {
    coords = [parseFloat(latitude), parseFloat(longitude)];
  }

  try {
    await createReal(dataUrl, userId, caption, location, coords);
  } catch (e) {
    console.error(e);
    return json(
      {
        fields: formData,
        formError: `Something went wrong trying to create a new real.`
      },
      { status: 400 }
    );
  }

  return redirect("/feed");
};

export default function Post() {
  const [img, setImg] = useState<string | null>(null);
  const { status, position, location, error } = useGeoPosition();
  const [facingMode, setFacingMode] = useState("user");
  const webcamRef = useRef<Webcam>(null);
  const actionData = useActionData() as ActionData<ActionInput>;

  const videoConstraints = {
    width: 420,
    height: 420,
    facingMode: { exact: "environment" }
  };

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImg(imageSrc);
    }
  }, [webcamRef]);

  const switchCamera = useCallback(() => {
    setFacingMode((prevState) =>
      prevState === "user" ? "environment" : "user"
    );
  }, []);

  return (
    <Modal isOpen={true}>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl text-center text-white font-bold">FurReal</h1>
        {img === null ? (
          <>
            <div className="rounded-xl aspect-square w-full">
              <Webcam
                audio={false}
                mirrored={true}
                height={420}
                width={420}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ ...videoConstraints, facingMode }}
                className="rounded-xl"
              />
            </div>

            <div className="flex justify-center gap-1">
              <div className="h-8 w-8" />
              <button
                className="h-16 w-16 text-white rounded-full border-white border-4"
                onClick={capture}
              ></button>
              <button type="button" onClick={switchCamera}>
                <ArrowPathIcon className="h-8 w-8 text-white" />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="relative flex flex-col place-items-center">
              <img src={img} alt="screenshot" className="rounded-xl" />
              <button
                type="button"
                onClick={() => setImg(null)}
                className="absolute z-10 top-1 right-1"
              >
                <XCircleIcon className="h-6 w-6 text-slate-700" />
              </button>
              {status === "resolved" && location ? (
                <LocationTag
                  location={location}
                  className="absolute bottom-4 z-10 bg-slate-500 text-white"
                />
              ) : null}
            </div>

            <Form
              method="post"
              className="flex flex-col place-items-center gap-2"
            >
              <input type="hidden" name="dataUrl" value={img} />
              {status === "resolved" ? (
                <>
                  <input type="hidden" name="location" value={location} />
                  <input
                    type="hidden"
                    name="latitude"
                    value={position?.coords.latitude}
                  />
                  <input
                    type="hidden"
                    name="longitude"
                    value={position?.coords.longitude}
                  />
                </>
              ) : null}
              <label className="text-white font-medium w-full">
                Caption:{" "}
                <input type="text" name="caption" className="text-black" />
              </label>
              {actionData?.fieldErrors?.caption ? (
                <div className="pt-1 text-red-700">
                  {actionData.fieldErrors.caption}
                </div>
              ) : undefined}
              {actionData?.formError ? (
                <div className="pt-1 text-red-700">{actionData.formError}</div>
              ) : undefined}
              <button type="submit" className="flex align-middle text-white">
                <h1 className="text-2xl font-extrabold uppercase">Send</h1>{" "}
                <PaperAirplaneIcon className="h-8 w-8" />
              </button>
            </Form>
          </>
        )}
      </div>
    </Modal>
  );
}
