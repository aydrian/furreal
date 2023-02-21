import type { Real } from "@prisma/client";
import type { SerializeFrom } from "@remix-run/node";
import { Link } from "@remix-run/react";

import { BufferImage } from "./buffer-image";

interface memoriesProps {
  memories: Array<SerializeFrom<Real>>;
}

interface memoryProps {
  memory: SerializeFrom<Real>;
}

export const Memories: React.FC<memoriesProps> = ({ memories }) => {
  return (
    <ul className="grid grid-cols-7 gap-1">
      {memories.map((memory) => (
        <Memory key={memory.id} memory={memory} />
      ))}
    </ul>
  );
};

const Memory: React.FC<memoryProps> = ({ memory }) => {
  return (
    <li className="flex place-content-center place-items-center aspect-square w-full">
      {memory.imgData.data.length > 0 ? (
        <Link
          to={`/reals/${memory.id}`}
          className="flex place-content-center place-items-center"
        >
          <div className="absolute z-10 font-bold text-lg text-white">
            {new Date(memory.createdAt).getDate()}
          </div>
          <BufferImage buffer={memory.imgData} className="rounded-lg" />
        </Link>
      ) : (
        <div className="absolute z-10 font-bold text-lg text-white">
          {new Date(memory.createdAt).getDate()}
        </div>
      )}
    </li>
  );
};
