import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
  strokeClassName?: string;
  accentClassName?: string;
};

function BaseIcon({
  className,
  children,
  viewBox = "0 0 64 64",
}: {
  className?: string;
  children: ReactNode;
  viewBox?: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function NotesIcon({ className, strokeClassName = "stroke-black", accentClassName = "fill-[#f59e0b]" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <rect x="12" y="8" width="40" height="44" rx="2" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <path d="M20 20H42" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <path d="M20 29H42" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <path d="M20 38H36" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <circle cx="50" cy="50" r="5" className={accentClassName} />
    </BaseIcon>
  );
}

export function QuotationsIcon({ className, strokeClassName = "stroke-black", accentClassName = "fill-[#d4af37]" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M26 18C18 18 13 24 13 32C13 40 18 46 26 46C32 46 37 41 37 35C37 29 33 24 28 24C25 24 22 25 20 28" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <path d="M44 18C36 18 31 24 31 32C31 40 36 46 44 46C50 46 55 41 55 35C55 29 51 24 46 24C43 24 40 25 38 28" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <rect x="17" y="52" width="30" height="3" rx="1.5" className={accentClassName} />
    </BaseIcon>
  );
}

export function VocabularyIcon({ className, strokeClassName = "stroke-black", accentClassName = "fill-[#56c5ea]" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <circle cx="31" cy="31" r="21" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <path d="M24 41L31 20L38 41" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <path d="M27 34H35" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <circle cx="49" cy="49" r="5" className={accentClassName} />
    </BaseIcon>
  );
}

export function EssaysIcon({ className, strokeClassName = "stroke-black", accentClassName = "fill-[#5ac8c8]" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M20 10H39L48 19V50H20V10Z" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <path d="M39 10V19H48" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <path d="M34 20C30 20 27 23 27 27C27 30 29 32 33 34C37 36 39 38 39 41C39 45 36 48 31 48" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <path d="M40 50L52 38L57 50H40Z" className={accentClassName} />
    </BaseIcon>
  );
}

export function ResearchIcon({ className, strokeClassName = "stroke-black", accentClassName = "fill-[#56c5ea]" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <circle cx="32" cy="31" r="11" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <circle cx="32" cy="31" r="2.8" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <path d="M32 10V18" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <path d="M32 44V52" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <path d="M11 31H19" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <path d="M45 31H53" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <path d="M17 16L23 22" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <path d="M41 40L47 46" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <circle cx="15" cy="15" r="4" className={accentClassName} />
      <circle cx="49" cy="47" r="4" className={accentClassName} />
    </BaseIcon>
  );
}

export function CategoriesIcon({ className, strokeClassName = "stroke-black", accentClassName = "fill-[#56c5ea]" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <rect x="12" y="12" width="14" height="14" rx="1.5" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <rect x="38" y="12" width="14" height="14" rx="1.5" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <rect x="12" y="38" width="14" height="14" rx="1.5" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <rect x="38" y="38" width="14" height="14" rx="1.5" className={cn("fill-none stroke-[2.5]", strokeClassName)} />
      <rect x="16" y="56" width="32" height="3" rx="1.5" className={accentClassName} />
    </BaseIcon>
  );
}

export function DevanomyAppMark({ className }: { className?: string }) {
  return (
    <BaseIcon className={className}>
      <circle cx="32" cy="32" r="24" className="fill-[#116d6d] stroke-black stroke-[2]" />
      <path d="M29 17C35 17 39 22 39 29V47H33.5V43.8C31.6 46.1 28.9 47.3 25.8 47.3C19 47.3 14 42.1 14 34.7C14 27.4 19.2 22.2 26.3 22.2C29.1 22.2 31.6 23.2 33.5 25.1V17H29Z" className="fill-[#fffaf1]" />
      <circle cx="43.5" cy="42.5" r="4.5" className="fill-[#e25b33]" />
    </BaseIcon>
  );
}
