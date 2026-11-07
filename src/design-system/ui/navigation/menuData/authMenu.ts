import {
  LogIn,
  UserPlus,
} from "lucide-react-native";


export const authMenu = 
  {
    drawerItems: [
      {
        title: "Login",
        href: "/login",
        icon: LogIn,
      },
      {
        title: "Accept Invite",
        href: "/accept-invite",
        icon: UserPlus,
      },
    ],
    drawerBottomItems: [],
  }
