import React from "react";
import { Link, LinkProps } from "@remix-run/react";

export type ButtonProps = {
  isAction?: boolean;
  isLink?: boolean;
};

export const Button: React.FC<
  ButtonProps & (React.ButtonHTMLAttributes<HTMLButtonElement> | LinkProps)
> = ({ children, isLink, isAction, className, ...props }) => {
  let classNames = `${className || ""} px-3 py-2 rounded`;

  if (isAction) {
    classNames += " bg-green-300 text-gray-600 text-sm font-semi-bold";
  }

  const Component = isLink ? Link : "button";
  // TODO: Figure out how to use dynamic component here without TS complaining
  return (
    <Component className={classNames} {...props}>
      {children}
    </Component>
  );
};
