"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, Video, LayoutDashboard } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()

  const navItems = [
    {
      title: "数据看板",
      href: "/dashboard",
      icon: LayoutDashboard
    },
    {
      title: "账号管理",
      href: "/accounts",
      icon: Users
    },
    {
      title: "视频管理",
      href: "/videos",
      icon: Video
    }
  ]

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center">
          <div className="flex items-center gap-2 mr-8">
            <div className="text-xl font-bold">创作者监控平台</div>
          </div>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
