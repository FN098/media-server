import { Header } from "@/components/ui/header";
import { PATHS } from "@/lib/paths";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header title="Experimental" basePath={PATHS.client.experimental.root} />
      {children}
    </>
  );
}
