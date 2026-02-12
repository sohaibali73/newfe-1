"use client";

import type { ComponentProps } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, ExternalLinkIcon, GlobeIcon } from "lucide-react";

/* ---------- Root ---------- */

export type SourcesProps = ComponentProps<"div">;

export const Sources = ({ className, ...props }: SourcesProps) => (
  <Collapsible
    className={cn("not-prose mb-4 text-sm", className)}
    {...props}
  />
);

/* ---------- Trigger ---------- */

export type SourcesTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  count: number;
};

export const SourcesTrigger = ({
  className,
  count,
  children,
  ...props
}: SourcesTriggerProps) => (
  <CollapsibleTrigger
    className={cn(
      "group flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
      className
    )}
    {...props}
  >
    {children ?? (
      <>
        <GlobeIcon className="h-3.5 w-3.5 shrink-0" />
        <span>
          {count} {count === 1 ? "source" : "sources"} cited
        </span>
        <ChevronDownIcon className="ml-auto h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </>
    )}
  </CollapsibleTrigger>
);

/* ---------- Content wrapper ---------- */

export type SourcesContentProps = ComponentProps<typeof CollapsibleContent>;

export const SourcesContent = ({
  className,
  ...props
}: SourcesContentProps) => (
  <CollapsibleContent
    className={cn(
      "mt-2 grid gap-2",
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
      className
    )}
    {...props}
  />
);

/* ---------- Single Source ---------- */

export type SourceProps = ComponentProps<"a"> & {
  /** Optional description / snippet for the source */
  description?: string;
  /** Source index number for numbered badges */
  index?: number;
};

export const Source = ({
  href,
  title,
  description,
  index,
  children,
  className,
  ...props
}: SourceProps) => {
  let hostname = "";
  let favicon = "";
  try {
    const u = new URL(href ?? "");
    hostname = u.hostname.replace(/^www\./, "");
    favicon = `https://www.google.com/s2/favicons?sz=32&domain=${hostname}`;
  } catch {
    /* invalid URL – leave hostname empty */
  }

  return (
    <a
      className={cn(
        "group/source flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-accent/50",
        className
      )}
      href={href}
      rel="noreferrer"
      target="_blank"
      {...props}
    >
      {children ?? (
        <>
          {/* Favicon or numbered badge */}
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted">
            {favicon ? (
              <img
                src={favicon}
                alt=""
                className="h-4 w-4 rounded-sm"
                crossOrigin="anonymous"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  const parent = (e.currentTarget as HTMLImageElement)
                    .parentElement;
                  if (parent) {
                    const fallback = document.createElement("span");
                    fallback.className = "text-[10px] font-bold text-muted-foreground";
                    fallback.textContent = index != null ? String(index) : hostname.charAt(0).toUpperCase();
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : (
              <span className="text-[10px] font-bold text-muted-foreground">
                {index != null ? index : <GlobeIcon className="h-3.5 w-3.5" />}
              </span>
            )}
          </span>

          {/* Text content */}
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-xs font-medium text-foreground group-hover/source:text-primary">
                {title || hostname || "Source"}
              </span>
              <ExternalLinkIcon className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/source:opacity-100" />
            </span>
            {hostname && (
              <span className="truncate text-[11px] text-muted-foreground">
                {hostname}
              </span>
            )}
            {description && (
              <span className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/80">
                {description}
              </span>
            )}
          </span>
        </>
      )}
    </a>
  );
};
