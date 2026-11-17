import {
  Home,
  FolderKanban,
  Settings,
  Users,
} from "lucide-react-native";

export const managerMenu = {
  drawerItems: [
    {
      title: "Home",
      href: "/user/manager",
      icon: Home,
    },
    {
      title: "Clients",
      href: "/user/manager/clients",
      icon: Users,
    },
    {
      title: "Workspaces",
      href: "/user/workspaces",
      icon: FolderKanban,
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
