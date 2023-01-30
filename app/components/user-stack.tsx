import type { User } from "@prisma/client";
import type { SerializeFrom } from "@remix-run/node";

import { UserCircle } from "./user-circle";

interface stackProps {
  children: React.ReactNode;
}

interface tileProps {
  user: SerializeFrom<Partial<User>>;
  children?: React.ReactNode;
}

export const UserStack: React.FC<stackProps> = ({ children }) => {
  return <ul>{children}</ul>;
};

export const UserTile: React.FC<tileProps> = ({ user, children }) => {
  return (
    <li className="flex">
      <UserCircle user={user} className="h-12 w-12 flex-shrink-0" />
      <div className="flex flex-col ml-2">
        <div>{user.fullName}</div>
        <div>{user.username}</div>
      </div>
      {children ? <div>{children}</div> : null}
    </li>
  );
};
