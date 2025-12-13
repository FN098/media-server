import { Header } from "@/app/components/ui/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header basePath="/dashboard/sample" />
      {children}
    </>
  );
}
