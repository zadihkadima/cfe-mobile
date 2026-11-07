// src/menuData/adminMenu.ts

import {
  Building2,
  Home,
  FolderKanban,
	LockKeyhole,
  Settings,
  Users,
} from "lucide-react-native";

export const adminMenu = {
  drawerItems: [
    {
      title: "Home",
      href: "/user/admin",
      icon: Home,
    },
    {
      title: "Managers",
      href: "/user/admin/managers",
      icon: Users,
    },
    {
      title: "Clients",
      href: "/user/admin/clients",
      icon: Building2,
    },
    {
      title: "Locked Accounts",
      href: "/user/admin/locked-accounts",
      icon: LockKeyhole,
    },
    
    {
      title: "Workspaces",
      href: "/user/admin/workspaces",
      icon: FolderKanban,
    },
    // Single pending invites entry
    {
      title: "Pending Invites",
      href: "/user/admin/invites/clients",
      icon: Users,
    },
  ],

  drawerBottomItems: [
    {
      title: "Settings",
      href: "/user/settings",
      icon: Settings,
    },
  ],
};