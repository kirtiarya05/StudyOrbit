import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { GalaxyCanvas } from "./galaxy-canvas";
import { getCurrentUserId } from "@/lib/auth";
import { Rocket, Users, Target, User as UserIcon, Plus } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const userId = getCurrentUserId();

  useEffect(() => {
    if (!userId && location !== "/profile") {
      setLocation("/profile");
    }
  }, [userId, location, setLocation]);

  const navItems = [
    { href: "/", label: "Galaxy", icon: Rocket },
    { href: "/matches", label: "Matches", icon: Target },
    { href: "/teams", label: "Fleets", icon: Users },
    { href: "/create-team", label: "Create", icon: Plus },
    { href: "/profile", label: "Profile", icon: UserIcon },
  ];

  const isDashboard = location === "/";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-x-hidden">
      <GalaxyCanvas />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-primary/20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group" data-testid="logo">
              <div className="relative">
                <div
                  className="w-8 h-8 rounded-full bg-primary/15 border border-primary/50 flex items-center justify-center group-hover:border-primary transition-all"
                  style={{ boxShadow: "0 0 12px rgba(0,212,255,0.35)" }}
                >
                  <Rocket className="w-4 h-4 text-primary" />
                </div>
                <div
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border border-background"
                  style={{ boxShadow: "0 0 6px rgba(74,222,128,0.8)" }}
                />
              </div>
              <span className="font-mono text-lg font-bold tracking-widest text-primary neon-text hidden sm:block">
                STUDYORBIT
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    data-testid={`nav-${item.href.replace("/", "") || "home"}`}
                    className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-primary/15 text-primary border border-primary/40 neon-border"
                        : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider hidden md:block font-mono">
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 w-full">
        {isDashboard ? (
          children
        ) : (
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}
