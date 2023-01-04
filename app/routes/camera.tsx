import { useEffect, useRef } from "react";

export default function Camera() {
  const videoRef = useRef(null);

  const getVideo = () => {
    navigator.mediaDevices
      .getUserMedia({
        video: { width: 1920, height: 1080 }
      })
      .then((stream) => {
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
      });
  };

  useEffect(() => {
    getVideo();
  }, [videoRef]);

  return (
    <div>
      <video ref={videoRef}></video>
    </div>
  );
}
