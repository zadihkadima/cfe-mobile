import {
  Home,
  FolderKanban,
  Settings,
} from "lucide-react-native";

export const clientMenu = {
  drawerItems: [
    {
      title: "Home",
      href: "/user/client",
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
