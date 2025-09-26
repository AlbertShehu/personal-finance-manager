// src/components/dashboard/Header.jsx
import React from "react"
import { cn } from "@/lib/utils"

export default function Header({ title, subtitle, children, className }) {
  const titleId = React.useId()
  const descId = subtitle ? `${titleId}-desc` : undefined

  return (
    <header
      className={cn(
        "py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4",
        className
      )}
      role="region"
      aria-labelledby={titleId}
      {...(subtitle ? { "aria-describedby": descId } : {})}
    >
      <div>
        <h1 id={titleId} className="text-2xl md:text-3xl font-bold text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p id={descId} className="mt-0.5 text-sm md:text-base text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>

      {children ? (
        <div className="flex items-center gap-2">
          {children}
        </div>
      ) : null}
    </header>
  )
}
