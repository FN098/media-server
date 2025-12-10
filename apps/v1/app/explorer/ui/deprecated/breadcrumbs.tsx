import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/shadcn/components/ui/breadcrumb";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/components/ui/tooltip";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";

const MAX_VISIBLE = 3;

function TruncateButton({
  label,
  fullPath,
  onClick,
}: {
  label: string;
  fullPath: string;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    setTruncated(el.scrollWidth > el.clientWidth);
  }, [label]);

  const btn = (
    <button
      ref={ref}
      onClick={onClick}
      className="block w-full truncate text-blue-600 hover:underline"
    >
      {label}
    </button>
  );

  if (!truncated) return btn;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{btn}</TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[400px] break-all">
        {fullPath}
      </TooltipContent>
    </Tooltip>
  );
}

export function Breadcrumbs({
  path,
  onClick,
}: {
  path: string;
  onClick: (path: string) => void;
}) {
  const crumbs = useMemo(() => path.split("/").filter(Boolean), [path]);

  const visibleCrumbs =
    crumbs.length > MAX_VISIBLE ? crumbs.slice(-MAX_VISIBLE) : crumbs;

  const hiddenCrumbs =
    crumbs.length > MAX_VISIBLE
      ? crumbs.slice(0, crumbs.length - MAX_VISIBLE)
      : [];

  return (
    <TooltipProvider>
      <Breadcrumb>
        <BreadcrumbList className="max-w-[60vw] flex-nowrap overflow-hidden">
          {/* ===== HOME ===== */}
          <BreadcrumbItem className="shrink-0">
            <button
              onClick={() => onClick("")}
              className="text-blue-600 hover:underline"
            >
              HOME
            </button>
          </BreadcrumbItem>

          {/* ===== 省略 (...)：ここは常に Tooltip ===== */}
          {hiddenCrumbs.length > 0 && (
            <Fragment>
              <BreadcrumbSeparator className="shrink-0" />
              <BreadcrumbItem className="shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-default px-1 text-muted-foreground">
                      …
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="max-w-[400px] break-all"
                  >
                    {hiddenCrumbs.join("/")}
                  </TooltipContent>
                </Tooltip>
              </BreadcrumbItem>
            </Fragment>
          )}

          {/* ===== 表示中の末尾階層（truncate時のみTooltip） ===== */}
          {visibleCrumbs.map((c, i) => {
            const fullIndex = crumbs.length - visibleCrumbs.length + i;

            const p = "/" + crumbs.slice(0, fullIndex + 1).join("/");

            return (
              <Fragment key={p}>
                <BreadcrumbSeparator className="shrink-0" />

                <BreadcrumbItem className="min-w-0 max-w-[160px]">
                  <TruncateButton
                    label={c}
                    fullPath={p}
                    onClick={() => onClick(p)}
                  />
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </TooltipProvider>
  );
}
