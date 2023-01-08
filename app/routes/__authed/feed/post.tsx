import type { ActionFunction } from "@remix-run/node";
import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Form } from "@remix-run/react";
import invariant from "tiny-invariant";

import { Modal } from "~/components/modal";

export const action: ActionFunction = async ({ request }) => {};

export default function Post() {
  const [img, setImg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState("user");
  const webcamRef = useRef<Webcam>(null);

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
            <input type="hidden" name="imgSrc" value={img} />
            <label>
              Caption: <input type="text" name="caption" />
            </label>
            <button type="submit" className="text-white bg-teal-500">
              Send
            </button>
          </Form>
        </>
      )}
    </Modal>
  );
}
