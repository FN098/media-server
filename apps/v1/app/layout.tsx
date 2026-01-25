import { APP_CONFIG } from "@/app.config";
import { AppQueryClientProvider } from "@/providers/app-query-client-provider";
import { HotkeysClientProvider } from "@/providers/hotkeys-client-provider";
import { ThumbEventProvider } from "@/providers/thumb-event-provider";
import { Toaster } from "@/shadcn/components/ui/sonner";
import { TooltipProvider } from "@/shadcn/components/ui/tooltip";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${APP_CONFIG.meta.title}`,
  description: `${APP_CONFIG.meta.description}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppQueryClientProvider>
          <TooltipProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <HotkeysClientProvider>
                <ThumbEventProvider>{children}</ThumbEventProvider>
              </HotkeysClientProvider>
            </ThemeProvider>
          </TooltipProvider>
        </AppQueryClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
