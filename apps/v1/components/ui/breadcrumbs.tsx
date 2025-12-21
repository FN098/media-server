import { TextWithTooltip } from "@/components/ui/text-with-tooltip";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shadcn/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import { HomeIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

export type BreadcrumbLinkItem = {
  key: string;
  label: string;
  href: string;
};

export function Breadcrumbs({
  items,
  threshold,
  className,
}: {
  items: BreadcrumbLinkItem[];
  threshold?: number;
  className?: string;
}) {
  if (!items || items.length === 0) return null;

  const useEllipsis = items.length >= (threshold ?? 5);

  const first = items[0];
  const last = items.length >= 2 ? items[items.length - 1] : null;
  const middle = items.slice(1, items.length - 1);

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className="flex-nowrap">
        {/* First item */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={first.href}>
              {first.key === "home" ? (
                <HomeIcon className="size-5" />
              ) : (
                <TextWithTooltip
                  text={first.label}
                  className="max-w-10 text-center"
                />
              )}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {/* Middle items */}
        {useEllipsis ? (
          <>
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1">
                  <BreadcrumbEllipsis className="size-4" />
                  <span className="sr-only">Toggle breadcrumb menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {middle.map((item) => (
                    <DropdownMenuItem key={item.key} asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        ) : (
          middle.map((item) => (
            <React.Fragment key={item.key}>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={item.href}>
                    <TextWithTooltip
                      text={item.label}
                      className="max-w-10 text-center"
                    />
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </React.Fragment>
          ))
        )}

        {/* Last item */}
        {last && (
          <BreadcrumbItem className="min-w-0 flex-1">
            <BreadcrumbPage className="block truncate">
              <TextWithTooltip text={last.label} />
            </BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
