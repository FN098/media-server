import { APP_CONFIG } from "@/app.config";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Sandbox | ${APP_CONFIG.meta.title}`,
};

export default function SandboxPage() {
  return (
    <div className="flex items-center justify-center w-full h-full text-xl">
      No content
    </div>
  );
}
