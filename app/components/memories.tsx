import type { Real } from "@prisma/client";
import type { SerializeFrom } from "@remix-run/node";

interface memoriesProps {
  memories: Array<SerializeFrom<Real>>;
}

interface memoryProps {
  memory: SerializeFrom<Real>;
}

export const Memories: React.FC<memoriesProps> = ({ memories }) => {
  return (
    <ul className="grid grid-cols-7">
      {memories.map((memory) => (
        <Memory key={memory.id} memory={memory} />
      ))}
    </ul>
  );
};

const Memory: React.FC<memoryProps> = ({ memory }) => {
  return (
    <li>
      {new Date(memory.createdAt).getDate()}: {memory.caption}
    </li>
  );
};
