import { Link, useCatch, useLoaderData } from "@remix-run/react";
import type { Session } from "~/models/session.server";
import { getSessions } from "~/models/session.server";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Header } from "~/components/shared/header";
import { Button } from "~/components/shared/button";

type LoaderData = {
  sessions: Awaited<ReturnType<typeof getSessions>>;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const sessions = await getSessions(params.date || new Date().toISOString());
  if (!sessions?.length) {
    throw new Response("No sessions found", { status: 404 });
  }
  return json<LoaderData>({ sessions });
};

export function CatchBoundary() {
  return (
    <>
      <Header />
      <div className="mx-auto px-6 md:w-5/6 lg:w-4/5 xl:w-2/3">
        <div className="bg-red-100 rounded p-5">
          <h4 className="font-bold text-lg">No sessions found</h4>
          <p className="mb-4">Why don't you start one... could be fun!</p>
          <Button isLink to="new" className="bg-blue-600 text-white">
            Start AMA session!
          </Button>
        </div>
      </div>
    </>
  );
}

export default function SessionIndexPage() {
  const data = useLoaderData<LoaderData>();
  const dateFormatter = new Intl.DateTimeFormat("en-GB");

  return (
    <>
      <Header />
      <div className="mx-auto px-6 md:w-5/6 lg:w-4/5 xl:w-2/3">
        <div>
          {data.sessions?.map((session) => (
            <div
              key={`session_list_item_${session.id}`}
              className="p-4 shadow-sm mt-4"
            >
              <div className="flex flex-row">
                <Link className="underline" to={session.id}>
                  {session.user.name} -{" "}
                  {dateFormatter.format(new Date(session.createdAt))}
                </Link>
                <span className="px-2">|</span>
                <div className="flex flex-row">
                  <img
                    width={18}
                    height={18}
                    alt="Question count icon"
                    src="/icons/question.svg"
                  />
                  <span className="ml-1">{session._count.questions}</span>
                </div>
              </div>
              <p className="pt-2 text-gray-700 text-sm">{session.content}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
