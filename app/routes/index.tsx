import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import type { ActionErrors } from "~/utils/utils";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import * as Z from "zod";

import { login, createUserSession, getUserId } from "~/utils/session.server";
import { validateAction } from "~/utils/utils";

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
  redirectTo: Z.string().default("/feed")
});

type ActionInput = Z.TypeOf<typeof schema>;

type ActionData = {
  formError?: string;
  fieldErrors?: ActionErrors<ActionInput>;
  fields?: ActionInput;
};

export const action: ActionFunction = async ({ request }) => {
  const { formData, errors } = await validateAction<ActionInput>({
    request,
    schema
  });

  if (errors) {
    return json({ fieldErrors: errors, fields: formData }, { status: 400 });
  }

  const { email, password, redirectTo } = formData;

  const user = await login({ email, password });
  if (!user) {
    return json(
      {
        fields: formData,
        formError: `Email/Password combination is incorrect`
      },
      { status: 400 }
    );
  }
  return createUserSession(user.id, redirectTo);
};

export default function Index() {
  const actionData = useActionData() as ActionData;
  const [searchParams] = useSearchParams();
  return (
    <main className="grid lg:grid-rows-2 gap-4 w-screen min-h-screen">
      <section className="flex flex-col gap-4 justify-center bg-purple-400 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <h1>FurReal</h1>
          <h2 className="m-0 text-center text-white">
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
          <h3 className="font-bold">Login</h3>
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
                  actionData?.fieldErrors?.password
                    ? "password-error"
                    : undefined
                }
              />
            </label>
            {actionData?.fieldErrors?.password ? (
              <div className="pt-1 text-red-700">
                {actionData.fieldErrors.password}
              </div>
            ) : undefined}
            {actionData?.formError ? (
              <div className="pt-1 text-red-700">{actionData.formError}</div>
            ) : undefined}
            <button type="submit" className="text-white bg-teal-500">
              Login
            </button>
            <div className="text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <Link
                className="text-blue-500 underline"
                to={{
                  pathname: "/signup",
                  search: searchParams.toString()
                }}
              >
                Sign up
              </Link>
            </div>
          </Form>
        </div>
      </section>
    </main>
  );
}
