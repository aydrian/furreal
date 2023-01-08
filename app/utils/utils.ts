import type { ZodError, ZodSchema } from "zod";
import type { ActionErrors } from "./types.server";

export async function validateAction<ActionInput>({
  request,
  schema
}: {
  request: Request;
  schema: ZodSchema;
}) {
  const body = Object.fromEntries(await request.formData());

  try {
    const formData = schema.parse(body) as ActionInput;

    return { formData, errors: null };
  } catch (e) {
    console.error(e);

    const errors = e as ZodError<ActionInput>;

    return {
      formData: body,
      errors: errors.issues.reduce((acc: ActionErrors<ActionInput>, curr) => {
        const key = curr.path[0] as keyof ActionInput;
        acc[key] = curr.message;
        return acc;
      }, {})
    };
  }
}
