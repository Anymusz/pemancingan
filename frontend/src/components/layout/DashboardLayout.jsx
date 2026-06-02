// File: src/components/layout/DashboardLayout.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Fish, LogOut } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function DashboardLayout({
  navGroups,
  activeItem,
  onNavChange,
  title,
  user,
  unreadCount,
  onLogout,
  children,
}) {
  const navigate = useNavigate();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const activeLabel =
    navGroups.flatMap((g) => g.items).find((i) => i.key === activeItem)
      ?.label ?? "";

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        {/* ── Header ── */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="pointer-events-none">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sky-500 text-white">
                  <Fish className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{title}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* ── Navigation ── */}
        <SidebarContent>
          {navGroups.map((group, gi) => (
            <SidebarGroup key={gi}>
              {group.label && (
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              )}
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={item.key === activeItem}
                      onClick={() => onNavChange(item.key)}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>

        {/* ── Footer (user + logout) ── */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="cursor-pointer"
                onClick={() => onNavChange('profile')}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sky-500 text-white text-xs font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user?.name ?? ""}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.role ?? ""}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setLogoutConfirmOpen(true)}
                tooltip="Logout"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* ── Main area ── */}
      <SidebarInset>
        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 z-1 bg-background">
          <div className="flex items-center gap-2 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 !h-4" />
            <span className="text-md font-medium truncate">{activeLabel}</span>
          </div>

          {/* Notification bell */}
          <button
            onClick={() => navigate("/notifications")}
            className="relative p-2 rounded-md hover:bg-accent transition-colors"
            title="Notifikasi"
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
                {unreadCount < 100 ? unreadCount : "99+"}
              </span>
            )}
          </button>
        </header>

        {/* Page content */}
        <div className="p-4">{children}</div>
      </SidebarInset>

      <ConfirmDialog
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={onLogout}
        variant="destructive"
        title="Konfirmasi Logout"
        description="Apakah Anda yakin ingin keluar?"
        confirmLabel="Logout"
        cancelLabel="Batal"
      />
    </SidebarProvider>
  );
}
