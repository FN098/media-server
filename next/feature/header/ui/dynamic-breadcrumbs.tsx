import { useDynamicBreadcrumbs } from "@/feature/header/hooks/use-dynamic-breadcrumbs";
import { BreadcrumbLinkItem } from "@/feature/navigation/types";
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

interface DynamicBreadcrumbsProps {
  items: BreadcrumbLinkItem[];
}

// 親の幅に合わせて動的に表示内容を変更するパンくず
export function DynamicBreadcrumbs(props: DynamicBreadcrumbsProps) {
  const { items, containerRef, displayMode, first, middle, last } =
    useDynamicBreadcrumbs(props);

  return (
    <Breadcrumb ref={containerRef} className="w-full">
      <BreadcrumbList className="flex-nowrap">
        {/* パターン1: 全部表示 */}
        {displayMode === "full" &&
          items.map((item, i) => (
            <React.Fragment key={item.key}>
              <BreadcrumbItem
                className={
                  i === items.length - 1 ? "min-w-0 flex-1" : "shrink-0"
                }
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

        {/* パターン2: First > [Dropdown(middle)] > Last */}
        {displayMode === "first-last" && (
          <>
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
          </>
        )}

        {/* パターン3: [Dropdown(first + middle)] > Last */}
        {displayMode === "ellipsis-last" && (
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
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
