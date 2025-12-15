import { Header } from "@/app/components/ui/header";
import { PATHS } from "@/app/lib/paths";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header title="Experimental" basePath={PATHS.client.experimental.root} />
      {children}
    </>
  );
}
