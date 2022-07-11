import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useCatch,
  useLoaderData,
  Outlet,
  useParams,
} from "@remix-run/react";
import invariant from "tiny-invariant";

import type { Question } from "~/models/session.server";
import type { User } from "~/models/user.server";
import {
  addAnswerToQuestion,
  addQuestionToSession,
  getSession,
} from "~/models/session.server";
import { getUserId, requireUserId } from "~/session.server";
import { Button } from "~/components/shared/button";
import { QuestionAnswer } from "~/components/sessions/question-answer";
import { Header } from "~/components/shared/header";

type ActionData = {
  errors?: {
    title?: string;
    body?: string;
  };
};

type LoaderData = {
  session: Awaited<ReturnType<typeof getSession>>;
  currentUserId?: string;
};

export type OutletContext = LoaderData["session"];

export const loader: LoaderFunction = async ({ request, params }) => {
  invariant(params.sessionId, "sessionId not found");

  const session = await getSession(params.sessionId);
  if (!session) {
    throw new Response("Not Found", { status: 404 });
  }
  const currentUserId = await getUserId(request);
  return json<LoaderData>({ session, currentUserId });
};

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  invariant(params.sessionId, "sessionId not found");

  const formData = await request.formData();
  const questionId = formData.get("answer_to_question");

  if (typeof questionId === "string") {
    const answer = formData.get("answer");
    if (typeof answer !== "string" || answer?.trim()?.length < 3) {
      return json<ActionData>(
        { errors: { title: "Answer is required" } },
        { status: 400 }
      );
    }

    await addAnswerToQuestion({ id: questionId, userId, answer });
    return redirect(`/sessions/${params.sessionId}/questions/${questionId}`);
  }

  const content = formData.get("content");
  if (typeof content !== "string" || content?.trim()?.length < 3) {
    return json<ActionData>(
      { errors: { title: "Question is required" } },
      { status: 400 }
    );
  }

  const question = await addQuestionToSession({
    userId,
    sessionId: params.sessionId,
    content,
  });

  return redirect(`/sessions/${params.sessionId}/questions/${question.id}`);
};

const QuestionList = ({
  questions,
  selectedQuestionId,
}: {
  questions: (Question & { user: User })[];
  selectedQuestionId?: string;
}) => {
  return (
    <ul>
      {questions.map((q) => (
        <QuestionAnswer
          question={q}
          key={`question_${q.id}`}
          isSelected={selectedQuestionId === q.id}
        />
      ))}
    </ul>
  );
};

export default function SessionDetailsPage() {
  const params = useParams();
  const data = useLoaderData() as LoaderData;
  const dateFormatter = new Intl.DateTimeFormat("en-GB");

  return (
    <>
      <Header />
      <div className="flex flex-row w-full px-6 mx-auto justify-between md:w-5/6 lg:w-4/5 xl:w-2/3">
        <div className={params.questionId ? "w-1/2" : "w-full"}>
          <h3 className="flex flex-row items-center justify-between">
            <span className="text-2xl font-bold">
              {data.session?.user.name}
            </span>
            <span>
              {dateFormatter.format(
                new Date(data.session?.createdAt || Date.now())
              )}
            </span>
          </h3>
          <p className="py-6">{data.session?.content}</p>
          {data.currentUserId !== data.session?.userId && (
            <div className="bg-gray-100 p-3 mb-4 rounded">
              <Form method="post">
                <div>
                  <label htmlFor="question" className="block">
                    <div className="flex flex-row mb-2 items-center">
                      <img
                        alt="Question logo"
                        src="/icons/question.svg"
                        width={45}
                        height={45}
                      />
                      <span className="ml-2 leading-4">
                        Ask your question
                        <br />
                        <i className="text-xs text-gray-800">
                          Please be concise and expressive. No explicit content
                          allowed!
                        </i>
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      name="content"
                      className="w-full block rounded p-2"
                    />
                  </label>
                </div>
                <div className="mt-2 flex justify-end">
                  <Button type="submit" isAction>
                    Ask Question
                  </Button>
                </div>
              </Form>
            </div>
          )}
          {!!data.session?.questions?.length && (
            <QuestionList
              questions={data.session.questions}
              selectedQuestionId={params.questionId}
            />
          )}
        </div>
        <Outlet context={data.session} />
      </div>
    </>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>Session not found</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
