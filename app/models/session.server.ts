import type { Question, User, Comment, Prisma, Session } from "@prisma/client";

import { prisma } from "~/db.server";
import startOfDay from "date-fns/startOfDay";
import endOfDay from "date-fns/endOfDay";

export type { Session, Question, Comment } from "@prisma/client";

export const getSessions = (date: string, userId?: string) => {
  const where: Prisma.SessionWhereInput = {
    createdAt: {
      lte: endOfDay(new Date(date)),
      gte: startOfDay(new Date(date)),
    },
  };
  if (userId) where.userId = userId;
  return prisma.session.findMany({
    where,
    include: {
      user: true,
      _count: {
        select: { questions: true },
      },
    },
  });
};

export const getSession = (id: Session["id"]) =>
  prisma.session.findFirst({
    where: { id },
    include: {
      questions: {
        include: {
          user: true,
        },
      },
      user: true,
    },
  });

export const startSessionsForUser = async (
  userId: User["id"],
  content: Session["content"]
) => {
  const runningSession = await getSessions(new Date().toISOString(), userId);

  if (runningSession?.length) {
    throw new Error("already-running-session");
  }

  return prisma.session.create({ data: { userId, content } });
};

export const addQuestionToSession = async ({
  userId,
  sessionId,
  content,
}: Pick<Question, "userId" | "sessionId" | "content">) => {
  const existingQuestion = await prisma.question.findFirst({
    where: {
      userId,
      sessionId,
      content,
    },
  });

  if (existingQuestion) {
    throw new Error("already-asked");
  }

  const isSessionHost = await prisma.session.findFirst({
    where: {
      userId,
      id: sessionId,
    },
  });

  if (isSessionHost) {
    throw new Error("host-can-not-ask-questions");
  }

  return prisma.question.create({ data: { sessionId, userId, content } });
};

export const addAnswerToQuestion = async ({
  id,
  userId,
  answer,
}: Pick<Question, "id" | "userId" | "answer">) => {
  const existingQuestion = await prisma.question.findFirst({
    where: { id },
    include: { session: true },
  });

  if (!existingQuestion) {
    throw new Error("question-not-found");
  }

  // Only allow the author of the session to answer questions
  if (existingQuestion.session.userId !== userId) {
    throw new Error("not-session-author");
  }

  return prisma.question.update({ where: { id }, data: { answer } });
};

export const addCommentToAnswer = async ({
  questionId,
  userId,
  content,
}: Pick<Comment, "questionId" | "userId" | "content">) => {
  return prisma.comment.create({ data: { questionId, userId, content } });
};

export const getCommentsForQuestion = async (questionId: string) => {
  return prisma.comment.findMany({
    where: { questionId },
    include: { user: true },
  });
};
