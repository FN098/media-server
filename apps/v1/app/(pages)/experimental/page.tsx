"use client";

import { APP_CONFIG } from "@/app.config";
import { CarouselDemo } from "@/shadcn-demos/caroucel-demo";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Experimental | ${APP_CONFIG.meta.title}`,
};

export default function Page() {
  return <CarouselDemo />;
}
