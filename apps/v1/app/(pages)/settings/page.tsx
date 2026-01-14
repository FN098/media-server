import { APP_CONFIG } from "@/app.config";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Settings | ${APP_CONFIG.meta.title}`,
};

export default function SandboxPage() {
  return <>Under construction...</>;
}
