import type { ActionFunction } from "@remix-run/node";
import type { ActionData } from "~/utils/types.server";
import { json, redirect } from "@remix-run/node";
import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Form, useActionData } from "@remix-run/react";
import * as Z from "zod";
import invariant from "tiny-invariant";
import {
  ArrowPathIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  XCircleIcon
} from "@heroicons/react/24/solid";

import { Modal } from "~/components/modal";
import { useGeoPosition } from "~/hooks/useGeoPosition";

import { validateAction } from "~/utils/utils";
import { getUserId } from "~/utils/session.server";
import { createReal } from "~/utils/reals.server";

const schema = Z.object({
  caption: Z.string(),
  dataUrl: Z.string(),
  location: Z.string().optional()
});

type ActionInput = Z.TypeOf<typeof schema>;

export const action: ActionFunction = async ({ request }) => {
  const userId = await getUserId(request);
  invariant(userId, "User ID should be a string.");

  const { formData, errors } = await validateAction<ActionInput>({
    request,
    schema
  });

  if (errors) {
    return json({ fieldErrors: errors, fields: formData }, { status: 400 });
  }

  const { caption, dataUrl, location } = formData;

  try {
    await createReal(dataUrl, userId, caption, location);
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
  const { status, position, error } = useGeoPosition();
  const [facingMode, setFacingMode] = useState("user");
  const webcamRef = useRef<Webcam>(null);
  const actionData = useActionData() as ActionData<ActionInput>;

  const videoConstraints = {
    width: 420,
    height: 560,
    facingMode: "user",
    aspectRatio: 420 / 560
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
            <div className="rounded-xl aspect-[3/4] w-full">
              <Webcam
                audio={false}
                mirrored={true}
                height={560}
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
              <div className="flex absolute z-10 bottom-4 rounded-full bg-slate-500 text-white p-2">
                <MapPinIcon className="h-4 w-4" />
                <p className="text-sm font-medium">
                  {status === "resolved"
                    ? `(${position?.coords.latitude}, ${position?.coords.longitude})`
                    : "location not enabled"}
                </p>
              </div>
            </div>

            <Form
              method="post"
              className="flex flex-col place-items-center gap-2"
            >
              <input type="hidden" name="dataUrl" value={img} />
              {status === "resolved" ? (
                <input
                  type="hidden"
                  name="location"
                  value={`(${position?.coords.latitude}, ${position?.coords.longitude})`}
                />
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
