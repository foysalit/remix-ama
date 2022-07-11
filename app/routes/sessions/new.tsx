import { Form, useActionData, useTransition } from "@remix-run/react";
import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import { startSessionsForUser } from "~/models/session.server";
import { requireUserId } from "~/session.server";
import { Header } from "~/components/shared/header";
import { Button } from "~/components/shared/button";

export type ActionData = {
  errors?: {
    content?: string;
    alreadyRunning?: string;
  };
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();

  try {
    const content = formData.get("content");

    if (typeof content !== "string" || content.length < 90) {
      return json<ActionData>(
        {
          errors: {
            content: "Content is required and must be at least 90 characters.",
          },
        },
        { status: 400 }
      );
    }

    const session = await startSessionsForUser(userId, content);
    return redirect(`/sessions/${session.id}`);
  } catch (err: any) {
    if (err?.message === "already-running-session") {
      return json<ActionData>(
        {
          errors: { alreadyRunning: "You already have a session running." },
        },
        { status: 400 }
      );
    }

    return json({ error: err?.message });
  }
};

// A simple server-side check for authentication to ensure only logged in users can access this page
export const loader: LoaderFunction = async ({ request }) => {
  await requireUserId(request);
  return json({ success: true });
};

export default function SessionNewPage() {
  const transition = useTransition();
  const actionData = useActionData();

  return (
    <>
      <Header />
      <div className="p-5 bg-gray-50 px-6 md:w-5/6 lg:w-4/5 xl:w-2/3 mx-auto rounded">
        <h4 className="font-bold text-lg">
          Sure you want to start a new AMA session?
        </h4>
        <p className="mb-4">
          An AMA session lasts until the end of the day regardless of when you
          start the session. During the session, any user on the platform can
          ask you any question. You always have the option to not answer.
          <br />
          <br />
          Please add a few lines to give everyone some context for the AMA
          session before starting.
        </p>

        <Form method="post">
          <textarea
            rows={5}
            autoFocus
            name="content"
            className="w-full block rounded p-2"
            placeholder="Greetings! I am 'X' from 'Y' TV show and I am delighted to be hosting today's AMA session..."
          />
          {actionData?.errors?.content && (
            <p className="text-red-500 text-sm">{actionData.errors.content}</p>
          )}
          <Button
            className="px-3 py-2 rounded mt-3"
            disabled={transition.state === "submitting"}
            type="submit"
            isAction
          >
            {transition.state === "submitting"
              ? "Starting..."
              : "Start Session"}
          </Button>
        </Form>
      </div>
      {actionData?.errors?.alreadyRunning && (
        <div className="mt-4 p-5 bg-red-500 mx-auto min-w-[24rem] max-w-3xl rounded">
          <p>{actionData.errors.alreadyRunning}</p>
        </div>
      )}
    </>
  );
}
