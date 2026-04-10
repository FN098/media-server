import { Header } from "@/components/ui/headers/header";
import { pageMetas } from "@/lib/meta";

const meta = pageMetas["maintenance"];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-svh flex flex-col">
      <Header
        title={meta.title}
        icon={meta.icon}
        basePath={meta.url}
        features={{
          navigation: false,
          search: false,
          viewMode: false,
        }}
      />
      <main className="flex flex-col flex-1 min-h-0">{children}</main>
    </div>
  );
}
