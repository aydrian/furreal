import type { ActionFunction, LoaderArgs, MetaFunction } from "@remix-run/node";
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

export const meta: MetaFunction = () => ({
  title: "FurReal: Sign up"
});

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
    <main className="grid lg:grid-rows-2 gap-4 w-screen min-h-screen">
      <section className="flex flex-col gap-4 justify-center bg-gray-400 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-6xl font-bold text-center">FurReal</h1>
          <h2 className="m-0 text-center text-white font-semibold text-lg mb-2">
            A Daily Picture App for Pets
          </h2>
          <p className="text-center text-white mb-0 mx-auto sm:w-3/4">
            Based on the social media app, BeReal.
          </p>
          <p className="text-center text-sm text-white mb-0">
            A{" "}
            <a
              className="text-inherit"
              href="https://www.cockroachlabs.com/"
              target="_blank"
              rel="noreferrer"
            >
              Cockroach Labs
            </a>{" "}
            Demo by{" "}
            <a
              className="text-inherit"
              href="https://twitter.com/itsaydrian"
              target="_blank"
              rel="noreferrer"
            >
              Aydrian Howard
            </a>
          </p>
        </div>
      </section>
      <section className="flex flex-col lg:justify-center bg-white p-4 sm:p-8">
        <div className="lg:max-w-xl mx-auto">
          <h3 className="font-bold text-xl mb-2">Sign up</h3>
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
        </div>
      </section>
    </main>
  );
}
