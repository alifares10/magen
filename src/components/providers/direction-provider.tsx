"use client";

import { useEffect, type PropsWithChildren } from "react";

type DirectionProviderProps = PropsWithChildren<{
  locale: string;
  direction: "ltr" | "rtl";
}>;

export function DirectionProvider({
  locale,
  direction,
  children,
}: DirectionProviderProps) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [direction, locale]);

  return <div dir={direction}>{children}</div>;
}
