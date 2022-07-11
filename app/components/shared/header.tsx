import { Link } from "@remix-run/react";

export const HeaderText = () => {
  return (
    <h1 className="text-center text-3xl font-cursive tracking-tight sm:text-5xl lg:text-7xl">
      <Link to="/sessions" className="block uppercase drop-shadow-md">
        AMA
      </Link>
    </h1>
  );
};

export const Header = () => {
  return (
    <div className="flex flex-row justify-between items-center px-6 md:w-5/6 lg:w-4/5 xl:w-2/3 mx-auto py-4">
      <HeaderText />
    </div>
  );
};
