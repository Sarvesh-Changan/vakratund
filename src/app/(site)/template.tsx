import { ViewTransition, type ReactNode } from "react";

export default function PublicTemplate({ children }: Readonly<{ children: ReactNode }>) {
  return <ViewTransition default="none" enter="page-fade" exit="page-fade">{children}</ViewTransition>;
}
