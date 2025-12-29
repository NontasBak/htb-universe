import { NavLink } from "react-router";
import { Target } from "lucide-react";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  return (
    <div>
      <div className="flex flex-row items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <NavLink to="/" className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity">
            <Target className="h-6 w-6" />
            <span>HTB Universe</span>
          </NavLink>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
      <hr />
    </div>
  );
}
