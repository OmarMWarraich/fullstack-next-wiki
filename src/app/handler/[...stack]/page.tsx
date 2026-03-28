import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "../../../stack/server";

export default function Handler(props: unknown) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <StackHandler fullPage={false} app={stackServerApp} routeProps={props} />
    </div>
  );
}
