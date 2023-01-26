import type { ActionFunction, LoaderArgs } from "@remix-run/node";
import type { ActionData } from "~/utils/types.server";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import * as Z from "zod";

import { validateAction } from "~/utils/utils";
import { createUserSession, getUserId, register } from "~/utils/session.server";
import { checkUserExists } from "~/utils/users.server";

import { FormField } from "~/components/form-field";

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await getUserId(request);
  if (userId) {
    return redirect("/feed");
  }
  return json({ ok: true });
};

const schema = Z.object({
  fullName: Z.string({ required_error: "Name is required" }),
  password: Z.string().min(6, "Password must be at least 6 characters long"),
  confirmPassword: Z.string().min(
    6,
    "Password must be at least 6 characters long"
  ),
  redirectTo: Z.string().default("/profile"),
  username: Z.string({ required_error: "Username is required" })
}).superRefine(({ confirmPassword, password }, ctx) => {
  if (confirmPassword !== password) {
    ctx.addIssue({
      code: "custom",
      message: "The passwords did not match",
      path: ["confirmPassword"]
    });
  }
});

type ActionInput = Z.TypeOf<typeof schema>;

export const action: ActionFunction = async ({ request }) => {
  const { formData, errors } = await validateAction<ActionInput>({
    request,
    schema
  });

  if (errors) {
    return json({ fieldErrors: errors, fields: formData }, { status: 400 });
  }

  const { fullName, password, redirectTo, username } = formData;

  const userExists = await checkUserExists(username);
  if (userExists) {
    return json(
      {
        fields: formData,
        formError: `User with username ${username} already exists`
      },
      { status: 400 }
    );
  }

  const user = await register({ password, username, fullName });
  if (!user) {
    return json(
      {
        fields: formData,
        formError: `Something went wrong trying to create a new user.`
      },
      { status: 400 }
    );
  }
  return createUserSession(user.id, redirectTo);
};

export default function SignUp() {
  const actionData = useActionData() as ActionData<ActionInput>;
  const [searchParams] = useSearchParams();
  return (
    <main>
      <h1>Sign up</h1>
      <Form method="post" className="grid gap-4">
        <input
          type="hidden"
          name="redirectTo"
          value={searchParams.get("redirectTo") ?? undefined}
        />
        <FormField
          htmlFor="fullName"
          label="Name"
          type="text"
          required
          defaultValue={actionData?.fields?.fullName}
          error={actionData?.fieldErrors?.fullName}
        />
        <FormField
          htmlFor="username"
          label="Username"
          type="text"
          required
          defaultValue={actionData?.fields?.username}
          error={actionData?.fieldErrors?.username}
        />
        <FormField
          htmlFor="password"
          label="Password"
          type="password"
          required
          defaultValue={actionData?.fields?.password}
          error={actionData?.fieldErrors?.password}
        />
        <FormField
          htmlFor="confirmPassword"
          label="Confirm Password"
          type="password"
          required
          defaultValue={actionData?.fields?.confirmPassword}
          error={actionData?.fieldErrors?.confirmPassword}
        />
        {actionData?.formError ? (
          <div className="pt-1 text-red-700">{actionData.formError}</div>
        ) : undefined}
        <button type="submit" className="text-white bg-teal-500">
          Create Account
        </button>
        <div className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            className="text-blue-500 underline"
            to={{
              pathname: "/",
              search: searchParams.toString()
            }}
          >
            Log in
          </Link>
        </div>
      </Form>
    </main>
  );
}
