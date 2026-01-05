import { BreadcrumbLinkItem } from "@/components/ui/breadcrumbs/types";
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

// 親の幅に合わせて動的に表示内容を変更するパンくず
export function DynamicBreadcrumbs({ items }: { items: BreadcrumbLinkItem[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);

  React.useLayoutEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const first = items[0];
  const last = items[items.length - 1];
  const middle = items.slice(1, -1);

  // 幅の計算ロジック（概算）
  const PADDING = 32;
  const ICON_WIDTH = 32;
  const ELLIPSIS_WIDTH = 32;
  const AVG_CHAR_WIDTH = 12;

  const getWidth = (item: BreadcrumbLinkItem) =>
    item.key === "home" ? ICON_WIDTH : item.label.length * AVG_CHAR_WIDTH + 16;

  const firstWidth = getWidth(first);
  const lastWidth = getWidth(last);
  const totalFullWidth =
    items.reduce((acc, item) => acc + getWidth(item), 0) +
    items.length * PADDING;

  // 表示モードの判定
  let displayMode: "full" | "first-last" | "ellipsis-last" = "full";
  if (containerWidth > 0) {
    if (totalFullWidth <= containerWidth) {
      displayMode = "full";
    } else if (
      firstWidth + lastWidth + ELLIPSIS_WIDTH + PADDING * 3 <=
      containerWidth
    ) {
      displayMode = "first-last";
    } else {
      displayMode = "ellipsis-last";
    }
  }

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
                    {item.label}
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
