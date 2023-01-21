import type { ActionFunction, LoaderArgs } from "@remix-run/node";
import type { ActionData, UserProfile } from "~/utils/types.server";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import * as Z from "zod";

import { FormField } from "~/components/form-field";
import { UserCircle } from "~/components/user-circle";

import { getUserId } from "~/utils/session.server";
import { getUserProfile, updateUserProfile } from "~/utils/users.server";
import { validateAction } from "~/utils/utils";

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await getUserId(request);
  invariant(userId, "User ID should be a string.");
  const user = await getUserProfile(userId);

  return json({ user });
};

const schema = Z.object({
  fullName: Z.string().optional(),
  username: Z.string({ required_error: "Username is required" }),
  bio: Z.string().optional(),
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

  await updateUserProfile(userId, formData as UserProfile);

  return redirect("../");
};

export default function EditProfile() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData() as ActionData<ActionInput>;
  return (
    <>
      <header className="bg-white sticky top-0">
        <div className="flex justify-between">
          <Link to="../">Cancel</Link>
          <h1>Edit Profile</h1>
          <div>Save</div>
        </div>
      </header>
      <main>
        {user ? (
          <UserCircle user={user} className="h-24 w-24 mx-auto flex-shrink-0" />
        ) : null}
        <Form method="post">
          <FormField
            htmlFor="fullName"
            label="Full Name"
            defaultValue={actionData?.fieldErrors?.fullName || user?.fullName}
            error={actionData?.fieldErrors?.fullName}
          />
          <FormField
            htmlFor="username"
            label="Username"
            defaultValue={actionData?.fieldErrors?.username || user?.username}
            required
            error={actionData?.fieldErrors?.username}
          />
          <FormField
            htmlFor="bio"
            label="Bio"
            defaultValue={actionData?.fieldErrors?.bio || user?.bio}
            error={actionData?.fieldErrors?.bio}
          />
          <FormField
            htmlFor="location"
            label="Location"
            defaultValue={actionData?.fieldErrors?.location || user?.location}
            error={actionData?.fieldErrors?.location}
          />
          {actionData?.formError ? (
            <div className="pt-1 text-red-700">{actionData.formError}</div>
          ) : undefined}
          <button type="submit" name="intent" value="saveProfile">
            Save
          </button>
        </Form>
      </main>
    </>
  );
}
