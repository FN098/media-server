import { APP_CONFIG } from "@/app.config";
import SwiperFadeDemo from "@/components/ui/demo/caroucel-demo";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Sandbox | ${APP_CONFIG.meta.title}`,
};

export default function SandboxPage() {
  return <SwiperFadeDemo />;
}
