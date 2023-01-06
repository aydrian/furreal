import type { User } from "@prisma/client";

interface props {
  user: User;
  className?: string;
  onClick?: (...args: any) => any;
}

export function UserCircle({ user, onClick, className }: props) {
  const names = user.fullName ? user.fullName.split(" ") : [user.username];
  return (
    <div
      className={`${className} cursor-pointer bg-gray-400 rounded-full flex justify-center items-center`}
      onClick={onClick}
    >
      <h2>
        {names.map((name) => {
          return name.charAt(0).toUpperCase();
        })}
      </h2>
    </div>
  );
}
