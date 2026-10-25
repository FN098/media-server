import { BreadcrumbLinkItem } from "@/feature/breadcrumbs/lib/types";
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
import React, { RefObject } from "react";

// 親の幅に合わせて動的に表示内容を変更するパンくず

/** 全部表示 */
export function DynamicBreadcrumbsFull({
  items,
  containerRef,
}: {
  items: BreadcrumbLinkItem[];
  containerRef: RefObject<HTMLDivElement>;
}) {
  return (
    <Breadcrumb ref={containerRef} className="w-full">
      <BreadcrumbList className="flex-nowrap">
        {items.map((item, i) => (
          <React.Fragment key={item.key}>
            <BreadcrumbItem
              className={i === items.length - 1 ? "min-w-0 flex-1" : "shrink-0"}
            >
              {i === items.length - 1 ? (
                <BreadcrumbPage className="truncate">
                  {item.key === "home" ? (
                    <HomeIcon className="size-4" />
                  ) : (
                    item.label
                  )}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>
                    {item.key === "home" ? (
                      <HomeIcon className="size-4" />
                    ) : (
                      item.label
                    )}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {i < items.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** 先頭と末尾 */
export function DynamicBreadcrumbsFirstLast({
  first,
  middle,
  last,
  containerRef,
}: {
  first: BreadcrumbLinkItem;
  middle: BreadcrumbLinkItem[];
  last: BreadcrumbLinkItem;
  containerRef: RefObject<HTMLDivElement>;
}) {
  return (
    <Breadcrumb ref={containerRef} className="w-full">
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink asChild>
            <Link href={first.href}>
              {first.key === "home" ? (
                <HomeIcon className="size-4" />
              ) : (
                first.label
              )}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1">
              <BreadcrumbEllipsis className="size-4" />
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

        <BreadcrumbItem className="min-w-0 flex-1">
          <BreadcrumbPage className="truncate">{last.label}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** 末尾のみ */
export function DynamicBreadcrumbsLast({
  first,
  middle,
  last,
  containerRef,
}: {
  first: BreadcrumbLinkItem;
  middle: BreadcrumbLinkItem[];
  last: BreadcrumbLinkItem;
  containerRef: RefObject<HTMLDivElement>;
}) {
  return (
    <Breadcrumb ref={containerRef} className="w-full">
      <BreadcrumbList className="flex-nowrap">
        <>
          <BreadcrumbItem className="shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1">
                <BreadcrumbEllipsis className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {[first, ...middle].map((item) => (
                  <DropdownMenuItem key={item.key} asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </BreadcrumbItem>
          <BreadcrumbSeparator />

          <BreadcrumbItem className="min-w-0 flex-1">
            <BreadcrumbPage className="truncate">{last.label}</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
