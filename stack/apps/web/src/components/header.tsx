import { NavLink } from "react-router";
import { Target } from "lucide-react";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";

export default function Header() {
  const { data: session } = authClient.useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (session?.user) {
      api.getCurrentUser()
        .then((user) => {
          setIsAdmin(user.role === "Admin");
        })
        .catch(() => {
          setIsAdmin(false);
        });
    } else {
      setIsAdmin(false);
    }
  }, [session]);

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity">
            <Target className="h-6 w-6" />
            <span>HTB Universe</span>
          </NavLink>
          <nav className="flex items-center gap-4">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`
              }
            >
              Dashboard
            </NavLink>
            {session && (
              <>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors hover:text-primary ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`
                  }
                >
                  Profile
                </NavLink>
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `text-sm font-medium transition-colors hover:text-primary ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`
                    }
                  >
                    Admin
                  </NavLink>
                )}
              </>
            )}
          </nav>
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
