import type { LoaderFunction, ActionFunction } from "@remix-run/node"; // or "@remix-run/cloudflare"
import {
  Form,
  Link,
  useLoaderData,
  useOutletContext,
  useParams,
  useTransition,
} from "@remix-run/react";
import type { Comment } from "~/models/session.server";
import {
  addCommentToAnswer,
  getCommentsForQuestion,
} from "~/models/session.server";
import invariant from "tiny-invariant";
import { json, redirect } from "@remix-run/node";

import type { OutletContext } from "../../$sessionId";
import { requireUserId } from "~/session.server";
import type { User } from "~/models/user.server";
import { QuestionAnswer } from "~/components/sessions/question-answer";
import { Button } from "~/components/shared/button";
import React, { useEffect, useRef } from "react";

type LoaderData = {
  comments: Awaited<ReturnType<typeof getCommentsForQuestion>>;
};

type ActionData = {
  errors?: {
    title?: string;
    body?: string;
  };
};

export const loader: LoaderFunction = async ({ params }) => {
  invariant(params.questionId);
  const data: LoaderData = {
    comments: await getCommentsForQuestion(params.questionId),
  };
  return json(data);
};

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  invariant(params.sessionId, "sessionId not found");
  invariant(params.questionId, "questionId not found");

  const formData = await request.formData();
  const content = formData.get("content");

  if (typeof content !== "string" || content?.trim()?.length < 3) {
    return json<ActionData>(
      { errors: { title: "Comment is required" } },
      { status: 400 }
    );
  }

  await addCommentToAnswer({
    userId,
    content,
    questionId: params.questionId,
  });

  return redirect(
    `/sessions/${params.sessionId}/questions/${params.questionId}`
  );
};

export default function SessionQuestion() {
  const params = useParams();
  const commentFormRef = useRef<HTMLFormElement>(null);
  const transition = useTransition();
  const outletData = useOutletContext<OutletContext>();
  const data = useLoaderData();
  const question = outletData?.questions.find(
    (q) => q.id === params.questionId
  );

  const isCommenting = transition.state === "submitting";
  useEffect(() => {
    if (!isCommenting) {
      commentFormRef?.current?.reset();
    }
  }, [isCommenting]);

  if (!question) return null;
  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return (
    <div className="w-1/2">
      <div className="pl-8">
        <Link
          to={`/sessions/${params.sessionId}`}
          className="bg-gray-500 rounded-sm px-2 py-1 text-white flex flex-row justify-between"
        >
          <span>Thread</span>
          <span>✕</span>
        </Link>
        <QuestionAnswer question={question} as="div" hideCommentsLink />
        <div className="bg-gray-100 p-3 mb-4 rounded">
          <Form method="post" ref={commentFormRef}>
            <label htmlFor="comment" className="block">
              <div className="flex flex-row mb-2 items-center">
                <img
                  alt="Question logo"
                  src="/icons/comment.svg"
                  width={45}
                  height={45}
                />
                <span className="ml-2 leading-4">
                  Add a comment
                  <br />
                  <i className="text-xs text-gray-800">
                    Please be polite. No explicit content allowed!
                  </i>
                </span>
              </div>
              <textarea
                rows={5}
                className="w-full block rounded p-2"
                name="content"
              />
            </label>
            <div className="mt-2 flex justify-end">
              <Button type="submit" isAction>
                Comment
              </Button>
            </div>
          </Form>
        </div>
        <ul>
          {data.comments?.map((comment: Comment & { user: User }) => (
            <li key={`comment_${comment.id}`} className="mt-4">
              <div className="flex flex-row">
                <div>
                  <img
                    width={40}
                    height={40}
                    alt="Question icon"
                    className="mr-2"
                    src="/icons/comment.svg"
                  />
                </div>
                <p>
                  <span className="font-semi-bold text-xs text-gray-500">
                    {comment.user?.name} at{" "}
                    {dateFormatter.format(new Date(comment.createdAt))}
                  </span>
                  <br />
                  <span className="text-gray-800 text-sm">{comment.content}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
