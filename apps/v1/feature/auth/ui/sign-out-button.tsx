import { signOutAction } from "@/feature/auth/actions/sign-out";
import { LogOutIcon } from "lucide-react";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors"
      >
        <LogOutIcon className="h-4 w-4 shrink-0" aria-hidden />
        <span>Sign out</span>
      </button>
    </form>
  );
}
