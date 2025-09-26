import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export const ToastProvider = ({ children, ...props }) => (
  <ToastPrimitives.Provider {...props}>
    {children}
  </ToastPrimitives.Provider>
)

export const ToastViewport = React.forwardRef(function ToastViewport(
  { className, ...props },
  ref
) {
  return (
    <ToastPrimitives.Viewport
      ref={ref}
      className={cn(
        // bottom-right (>= sm), stacked vertikalisht
        "fixed z-[999999] flex max-h-screen w-full flex-col-reverse gap-2 p-4",
        "sm:bottom-4 sm:right-4 sm:top-auto sm:flex-col sm:w-auto sm:max-w-sm",
        "md:max-w-[420px]",
        // Mobile fixes për iPhone
        "touch-manipulation",
        className
      )}
      {...props}
    />
  )
})
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  [
    "group pointer-events-auto relative flex w-full items-start justify-between gap-3",
    "overflow-hidden rounded-xl border p-4 pr-10 shadow-xl",
    "backdrop-blur supports-[backdrop-filter]:bg-background/90",
    "transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-2",
    "data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4",
    "sm:data-[state=open]:slide-in-from-right-4",
    // accent bar majtas
    "before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:rounded-r-md before:content-['']",
    // Mobile fixes për iPhone
    "transform-gpu will-change-transform",
  ].join(" "),
  {
    variants: {
      variant: {
        default: cn("border-gray-300 bg-white text-gray-900 shadow-lg", "before:bg-blue-500"),
        destructive: cn(
          "border-red-500 bg-red-100 text-red-900 shadow-lg",
          "dark:border-red-400 dark:bg-red-900 dark:text-red-100",
          "before:bg-red-500"
        ),
        success: cn(
          "border-green-500 bg-green-100 text-green-900 shadow-lg",
          "dark:border-green-400 dark:bg-green-900 dark:text-green-100",
          "before:bg-green-500"
        ),
        info: cn(
          "border-blue-500 bg-blue-100 text-blue-900 shadow-lg",
          "dark:border-blue-400 dark:bg-blue-900 dark:text-blue-100",
          "before:bg-blue-500"
        ),
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export const Toast = React.forwardRef(function Toast(
  { className, variant, ...props },
  ref
) {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

export const ToastAction = React.forwardRef(function ToastAction(
  { className, ...props },
  ref
) {
  return (
    <ToastPrimitives.Action
      ref={ref}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors",
        "bg-transparent hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "group-[.destructive]:border-red-300/50 group-[.destructive]:hover:bg-red-100/40",
        "group-[.success]:border-emerald-300/50 group-[.success]:hover:bg-emerald-100/40",
        className
      )}
      {...props}
    />
  )
})
ToastAction.displayName = ToastPrimitives.Action.displayName

export const ToastClose = React.forwardRef(function ToastClose(
  { className, ...props },
  ref
) {
  return (
    <ToastPrimitives.Close
      ref={ref}
      className={cn(
        "absolute right-1.5 top-1.5 rounded-md p-1 text-foreground/60 opacity-0 transition-opacity",
        "hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring",
        "group-hover:opacity-100",
        "group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
        "group-[.success]:text-emerald-300 group-[.success]:hover:text-emerald-50 group-[.success]:focus:ring-emerald-400",
        className
      )}
      {...props}
    >
      <X className="h-4 w-4" />
    </ToastPrimitives.Close>
  )
})
ToastClose.displayName = ToastPrimitives.Close.displayName

export const ToastTitle = React.forwardRef(function ToastTitle(
  { className, ...props },
  ref
) {
  return (
    <ToastPrimitives.Title
      ref={ref}
      className={cn("text-sm font-semibold leading-5 [&+div]:mt-0.5 [&+div]:text-xs", className)}
      {...props}
    />
  )
})
ToastTitle.displayName = ToastPrimitives.Title.displayName

export const ToastDescription = React.forwardRef(function ToastDescription(
  { className, ...props },
  ref
) {
  return (
    <ToastPrimitives.Description
      ref={ref}
      className={cn("text-sm opacity-90", className)}
      {...props}
    />
  )
})
ToastDescription.displayName = ToastPrimitives.Description.displayName
