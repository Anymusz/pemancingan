// File: src/constants/navigation.jsx
import { Home, Trophy, Info, HelpCircle } from "lucide-react";

export const NAV_ITEMS = [
  {
    name: "Beranda",
    link: "#hero",
    icon: <Home className="h-4 w-4 text-neutral-500 dark:text-white" />,
  },
  {
    name: "Leaderboard",
    link: "#leaderboard",
    icon: <Trophy className="h-4 w-4 text-neutral-500 dark:text-white" />,
  },
  {
    name: "Informasi",
    link: "#informasi",
    icon: <Info className="h-4 w-4 text-neutral-500 dark:text-white" />,
  },
  {
    name: "FAQ",
    link: "#faq",
    icon: <HelpCircle className="h-4 w-4 text-neutral-500 dark:text-white" />,
  },
];
