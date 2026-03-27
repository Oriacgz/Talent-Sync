import React from "react";

function cls(...values) {
  return values.filter(Boolean).join(" ");
}

export function SkeletonBlock({ className = "", rounded = "rounded" }) {
  return <div className={cls("skeleton", rounded, className)} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={cls("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, idx) => (
        <SkeletonBlock
          key={idx}
          className={cls("h-3", idx === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }) {
  return (
    <div className={cls("card-base stack-base", className)} aria-hidden="true">
      <SkeletonBlock className="h-4 w-1/3" />
      <SkeletonText lines={3} />
      <div className="flex gap-2 pt-1">
        <SkeletonBlock className="h-8 w-24" />
        <SkeletonBlock className="h-8 w-20" />
      </div>
    </div>
  );
}
