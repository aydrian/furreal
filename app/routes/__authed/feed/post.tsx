import type { ActionFunction } from "@remix-run/node";
import type { ActionData } from "~/utils/types.server";
import { json, redirect } from "@remix-run/node";
import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Form, useActionData } from "@remix-run/react";
import * as Z from "zod";
import invariant from "tiny-invariant";

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

  const { caption, dataUrl } = formData;

  try {
    await createReal(dataUrl, userId, caption);
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
    height: 420,
    facingMode: "user"
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
      {img === null ? (
        <>
          <Webcam
            audio={false}
            mirrored={true}
            height={400}
            width={400}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ ...videoConstraints, facingMode }}
          />
          <button
            type="button"
            className="text-white bg-teal-500"
            onClick={switchCamera}
          >
            Switch Camera
          </button>
          <button className="text-white bg-teal-500" onClick={capture}>
            Capture photo
          </button>
        </>
      ) : (
        <>
          <img src={img} alt="screenshot" />
          <button
            type="button"
            className="text-white bg-teal-500"
            onClick={() => setImg(null)}
          >
            Retake
          </button>
          <Form method="post">
            <input type="hidden" name="dataUrl" value={img} />
            {status === "resolved" ? (
              <label>
                Location:{" "}
                <input
                  type="text"
                  name="location"
                  value={`(${position?.coords.latitude}, ${position?.coords.longitude})`}
                  disabled
                />
              </label>
            ) : (
              <div>location not enabled</div>
            )}
            <label>
              Caption: <input type="text" name="caption" />
            </label>
            {actionData?.fieldErrors?.caption ? (
              <div className="pt-1 text-red-700">
                {actionData.fieldErrors.caption}
              </div>
            ) : undefined}
            {actionData?.formError ? (
              <div className="pt-1 text-red-700">{actionData.formError}</div>
            ) : undefined}
            <button type="submit" className="text-white bg-teal-500">
              Send
            </button>
          </Form>
        </>
      )}
    </Modal>
  );
}
