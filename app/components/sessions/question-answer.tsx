import { Form, Link } from "@remix-run/react";
import React from "react";

import type { Question } from "~/models/session.server";
import type { User } from "~/models/user.server";
import { Button } from "~/components/shared/button";

export const QuestionAnswer: React.FC<{
  question: Question & { user: User };
  isSelected?: boolean;
  as?: React.ElementType;
  hideCommentsLink?: boolean;
}> = ({
  question,
  hideCommentsLink,
  isSelected,
  as: Component = "li",
  ...rest
}) => {
  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return (
    <Component
      className={`mb-4 p-2 rounded ${isSelected ? "bg-gray-50" : ""}`}
      {...rest}
    >
      <div className="flex flex-row">
        <div className="mr-2 w-40">
          <img
            width={50}
            height={50}
            alt="Question icon"
            src="/icons/question.svg"
          />
        </div>
        <p>
          <span className="font-semi-bold text-xs text-gray-500">
            {question.user?.name} at{" "}
            {dateFormatter.format(new Date(question.createdAt))}
            {!hideCommentsLink && (
              <>
                {" "}
                |{" "}
                <Link className="underline" to={`questions/${question.id}`}>
                  Comments
                </Link>
              </>
            )}
          </span>
          <br />
          {question.content}
        </p>
      </div>
      {question.answer ? (
        <div className="pl-10 mt-2">
          <div className="flex flex-row shadow-sm p-2">
            <img
              width={50}
              height={50}
              alt="Question icon"
              src="/icons/answer.svg"
            />
            <p>
              <span className="font-semi-bold text-xs text-gray-500">
                {dateFormatter.format(new Date(question.updatedAt))}
              </span>
              <br />
              {question.answer}
            </p>
          </div>
        </div>
      ) : (
        <div className="px-4 mt-4">
          <Form method="post">
            <textarea
              rows={5}
              name="answer"
              className="w-full block rounded p-2"
            />
            <div className="mt-2 flex justify-end">
              <Button name="answer_to_question" value={question.id} isAction>
                Answer
              </Button>
            </div>
          </Form>
        </div>
      )}
    </Component>
  );
};
