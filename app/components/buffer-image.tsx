interface props {
  buffer: {
    data: number[];
    type: string;
  };
  alt?: string;
  className?: string;
}

export const BufferImage: React.FC<props> = ({
  buffer,
  alt = "A real image",
  className
}) => {
  const base64String = btoa(
    String.fromCharCode(...new Uint8Array(buffer.data))
  );
  const dataUrl = `data:image/jpeg;base64,${base64String}`;
  return <img src={dataUrl} alt={alt} className={className} />;
};
