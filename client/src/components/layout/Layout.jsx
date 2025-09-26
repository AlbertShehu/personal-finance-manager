// src/components/shared/layout/Layout.jsx
import React from "react"
import { Outlet } from "react-router-dom"
import Navbar from "@/components/navbar/Navbar"
import Sidebar from "@/components/sidebar/Sidebar"


export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Skip link për aksesueshmëri */}
      <a
        href="#app-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-[100] rounded-md bg-primary px-3 py-2 text-primary-foreground shadow"
      >
        Skip to content
      </a>

      {/* Sidebar për desktop */}
      <aside
        aria-label="Sidebar"
        className="hidden md:block fixed top-0 left-0 h-screen w-64 z-40 border-r border-border bg-background"
      >
        <Sidebar />
      </aside>

      {/* Pjesa kryesore (navbar + content + footer) */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <Navbar />
        </header>

        <main id="app-content" role="main" className="flex-1 px-4 py-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>

        <footer className="text-center py-4 text-xs text-muted-foreground border-t border-border px-4">
          &copy; {new Date().getFullYear()} FinMan. All rights reserved.
        </footer>
      </div>
    </div>
  )
}
