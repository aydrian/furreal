import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import type { ActionData } from "~/utils/types.server";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import * as Z from "zod";

import { validateAction } from "~/utils/utils";
import { createUserSession, getUserId, register } from "~/utils/session.server";
import { checkUserExists } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (userId) {
    return redirect("/feed");
  }
  return json({ ok: true });
};

const schema = Z.object({
  email: Z.string({ required_error: "Email is required" }).email(
    "Invalid email"
  ),
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

  const { email, password, redirectTo, username } = formData;

  const userExists = await checkUserExists(email);
  if (userExists) {
    return json(
      {
        fields: formData,
        formError: `User with email ${email} already exists`
      },
      { status: 400 }
    );
  }

  const user = await register({ email, password, username });
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
        <label>
          Email{" "}
          <input
            type="email"
            name="email"
            required
            defaultValue={actionData?.fieldErrors?.email}
            aria-errormessage={
              actionData?.fieldErrors?.email ? "email-error" : undefined
            }
          />
        </label>
        {actionData?.fieldErrors?.email ? (
          <div className="pt-1 text-red-700">
            {actionData.fieldErrors.email}
          </div>
        ) : undefined}
        <label>
          Password{" "}
          <input
            type="password"
            name="password"
            required
            defaultValue={actionData?.fields?.password}
            aria-errormessage={
              actionData?.fieldErrors?.password ? "password-error" : undefined
            }
          />
        </label>
        {actionData?.fieldErrors?.password ? (
          <div className="pt-1 text-red-700">
            {actionData.fieldErrors.password}
          </div>
        ) : undefined}
        <label>
          Confirm Password{" "}
          <input
            type="password"
            name="confirmPassword"
            required
            defaultValue={actionData?.fields?.confirmPassword}
            aria-errormessage={
              actionData?.fieldErrors?.confirmPassword
                ? "confirmPassword-error"
                : undefined
            }
          />
        </label>
        {actionData?.fieldErrors?.confirmPassword ? (
          <div className="pt-1 text-red-700">
            {actionData.fieldErrors.confirmPassword}
          </div>
        ) : undefined}
        <label>
          Username{" "}
          <input
            type="text"
            name="username"
            required
            defaultValue={actionData?.fields?.username}
            aria-errormessage={
              actionData?.fieldErrors?.username ? "username-error" : undefined
            }
          />
        </label>
        {actionData?.fieldErrors?.username ? (
          <div className="pt-1 text-red-700">
            {actionData.fieldErrors.username}
          </div>
        ) : undefined}
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
              pathname: "/login",
              search: searchParams.toString()
            }}
          >
            Sign up
          </Link>
        </div>
      </Form>
    </main>
  );
}
