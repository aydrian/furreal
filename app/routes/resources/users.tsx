import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import clsx from "clsx";
import { useCombobox } from "downshift";
import { useId, useState } from "react";
import invariant from "tiny-invariant";

import { requireUserId } from "~/utils/session.server";
import { searchUsers } from "~/utils/users.server";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);
  const url = new URL(request.url);
  const query = url.searchParams.get("query");
  invariant(typeof query === "string", "query is required");
  return json({ users: await searchUsers(query) });
}

export function UserCombobox() {
  const userFetcher = useFetcher<typeof loader>();
  const id = useId();
  const users = userFetcher.data?.users ?? [];
  type User = typeof users[number];
  const [selectedUser, setSelectedUser] = useState<User | null | undefined>(
    null
  );

  const cb = useCombobox<User>({
    id,
    onSelectedItemChange: ({ selectedItem }) => {
      setSelectedUser(selectedItem);
    },
    items: users,
    itemToString: (item) =>
      item
        ? item.fullName
          ? `${item.fullName} (${item.username})`
          : item.username
        : "",
    onInputValueChange: (changes) => {
      userFetcher.submit(
        { query: changes.inputValue ?? "" },
        { method: "get", action: "/resources/users" }
      );
    }
  });

  const displayMenu = cb.isOpen && users.length > 0;

  return (
    <div>
      <div className="relative text-gray-600 focus-within:text-gray-400">
        <input name="userId" type="hidden" value={selectedUser?.id ?? ""} />
        <span className="absolute inset-y-0 left-0 flex items-center pl-2">
          <button
            type="submit"
            name="intent"
            value="addFriend"
            className="p-1 focus:outline-none focus:shadow-outline"
          >
            <svg
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="w-6 h-6"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </button>
        </span>
        <input
          {...cb.getInputProps({
            type: "search",
            className:
              "w-full py-2 text-sm text-white bg-gray-900 rounded-md pl-10 focus:outline-none focus:bg-white focus:text-gray-900",
            placeholder: "Search...",
            autoComplete: "off"
          })}
        />
      </div>
      <ul
        {...cb.getMenuProps({
          className: clsx(
            "absolute z-10 bg-white shadow-lg rounded-b w-full border border-t-0 border-gray-500 max-h-[180px] overflow-scroll",
            { hidden: !displayMenu }
          )
        })}
      >
        {displayMenu
          ? users.map((user, index) => (
              <li
                key={user.id}
                {...cb.getItemProps({ item: user, index })}
                className={clsx("cursor-pointer py-1 px-2", {
                  "bg-green-200": cb.highlightedIndex === index
                })}
              >
                {user.fullName
                  ? `${user.fullName} (${user.username})`
                  : user.username}
              </li>
            ))
          : null}
      </ul>
    </div>
  );
}
