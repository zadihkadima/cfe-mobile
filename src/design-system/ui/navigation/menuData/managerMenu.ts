import {
  Home,
  FolderKanban,
  Settings,
} from "lucide-react-native";

export const managerMenu = {
  drawerItems: [
    {
      title: "Home",
      href: "/user/manager",
      icon: Home,
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
