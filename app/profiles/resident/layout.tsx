
"use client";

import type { ComponentType, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BarChart3,
  Check,
  Handshake,
  History,
  Home,
  Loader2,
  LogOut,
  MapPinned,
  ScanLine,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const RESIDENT_BASE_PATH = "/profiles/resident";

interface NavigationItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

interface ResidentShellProfile {
  full_name: string;
  avatar_url: string | null;
}

const desktopNavigation: NavigationItem[] = [
  { label: "Home", href: RESIDENT_BASE_PATH, icon: Home },
  {
    label: "Scan Item",
    href: `${RESIDENT_BASE_PATH}/scan`,
    icon: ScanLine,
  },
  {
    label: "Offers",
    href: `${RESIDENT_BASE_PATH}/offers`,
    icon: Handshake,
  },
  {
    label: "Nearby Recovery",
    href: `${RESIDENT_BASE_PATH}/nearby`,
    icon: MapPinned,
  },
  {
    label: "Resident Profile",
    href: `${RESIDENT_BASE_PATH}/profile`,
    icon: UserRound,
  },
];

const mobileNavigation: NavigationItem[] = [
  { label: "Home", href: RESIDENT_BASE_PATH, icon: Home },
  {
    label: "Offers",
    href: `${RESIDENT_BASE_PATH}/offers`,
    icon: Handshake,
  },
  {
    label: "Nearby",
    href: `${RESIDENT_BASE_PATH}/nearby`,
    icon: MapPinned,
  },
  {
    label: "Profile",
    href: `${RESIDENT_BASE_PATH}/profile`,
    icon: UserRound,
  },
];

function isRouteActive(pathname: string, href: string) {
  if (href === RESIDENT_BASE_PATH) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getPageTitle(pathname: string) {
  if (pathname.startsWith(`${RESIDENT_BASE_PATH}/scan`)) {
    return "Scan Item";
  }

  if (pathname.startsWith(`${RESIDENT_BASE_PATH}/history`)) {
    return "Scan History";
  }

  if (pathname.startsWith(`${RESIDENT_BASE_PATH}/offers`)) {
    return "Recovery Offers";
  }

  if (pathname.startsWith(`${RESIDENT_BASE_PATH}/nearby`)) {
    return "Nearby Recovery";
  }

  if (pathname.startsWith(`${RESIDENT_BASE_PATH}/profile`)) {
    return "Resident Profile";
  }

  return "Resident Dashboard";
}

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || "Resident";
}

export default function ResidentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [shellProfile, setShellProfile] =
    useState<ResidentShellProfile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const pageTitle = getPageTitle(pathname);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("auth_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Resident profile lookup failed:", error.message);
          return;
        }

        if (active && data) {
          setShellProfile(data as ResidentShellProfile);
        }
      } catch (error) {
        console.error("Unable to load resident profile:", error);
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      toast.success("Signed out successfully.");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to sign out."
      );
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes residentShellFade {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .resident-shell-motion {
          animation: residentShellFade 0.3s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .resident-shell-motion {
            animation: none !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-[#f5faf6] text-zinc-900">
        {/* DESKTOP SIDEBAR */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-emerald-100/80 bg-white lg:flex">
          {/* Brand */}
          <div className="border-b border-zinc-100 px-5 py-5">
            <Link
              href={RESIDENT_BASE_PATH}
              className="group flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-emerald-50/70"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-white p-1 shadow-sm transition duration-300 group-hover:scale-105 group-hover:shadow-md">
                <img
                  src="/logo.png"
                  alt="Trashure logo"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <p className="text-xl font-black tracking-tight text-zinc-900">
                  Trashure
                </p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                  Team Aureloop
                </p>
              </div>
            </Link>
          </div>

          {/* Resident identity */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mb-7 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-100 bg-white text-emerald-700 shadow-sm">
                  {shellProfile?.avatar_url ? (
                    <img
                      src={shellProfile.avatar_url}
                      alt={shellProfile.full_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound className="h-5 w-5" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-zinc-900">
                    {shellProfile
                      ? firstName(shellProfile.full_name)
                      : "Resident workspace"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Scan, recover, and reuse
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-emerald-100 pt-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                <span className="text-[11px] font-medium text-zinc-500">
                  Making a greener community
                </span>
              </div>
            </div>

            <div className="mb-3 px-3">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-zinc-400">
                Your workspace
              </p>
            </div>

            <nav
              aria-label="Resident navigation"
              className="space-y-1.5"
            >
              {desktopNavigation.map((item) => {
                const Icon = item.icon;
                const active = isRouteActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex min-h-12 items-center gap-3 overflow-hidden rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${
                      active
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-700/15"
                        : "text-zinc-600 hover:bg-emerald-50 hover:text-emerald-800"
                    }`}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-white/90"
                      />
                    )}

                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        active
                          ? "bg-white/15 text-white"
                          : "bg-zinc-50 text-zinc-500 group-hover:bg-white group-hover:text-emerald-700"
                      }`}
                    >
                      <Icon className="h-[19px] w-[19px]" />
                    </span>

                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>

                    {active && (
                      <Check className="h-4 w-4 shrink-0 text-white/90" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Scan history shortcut */}
            <div className="mt-6 border-t border-zinc-100 pt-5">
              <Link
                href={`${RESIDENT_BASE_PATH}/history`}
                aria-current={
                  isRouteActive(
                    pathname,
                    `${RESIDENT_BASE_PATH}/history`
                  )
                    ? "page"
                    : undefined
                }
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  isRouteActive(
                    pathname,
                    `${RESIDENT_BASE_PATH}/history`
                  )
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-zinc-500 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                <History className="h-5 w-5" />
                Scan History
              </Link>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="border-t border-zinc-100 bg-gradient-to-b from-white to-emerald-50/50 p-4">
            <Link
              href={`${RESIDENT_BASE_PATH}/scan`}
              className="group flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-700/15 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                <ScanLine className="h-4 w-4" />
              </span>
              Scan an item
            </Link>

            <button
              type="button"
              disabled={loggingOut}
              onClick={() => void handleLogout()}
              className="mt-2.5 flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-zinc-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-wait disabled:opacity-60"
            >
              {loggingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
              {loggingOut ? "Signing out..." : "Sign out"}
            </button>

            <div className="mt-3 border-t border-emerald-100 pt-3 text-center">
              <p className="text-[10px] font-semibold tracking-wide text-zinc-400">
                TRASHURE · TEAM AURELOOP
              </p>
              <p className="mt-1 text-[10px] text-zinc-400">
                A more sustainable future.
              </p>
            </div>
          </div>
        </aside>

        {/* MAIN AREA */}
        <div className="min-h-screen lg:pl-72">
          <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/95 backdrop-blur-md">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
              <div className="resident-shell-motion">
                <div className="mb-0.5 flex items-center gap-2 lg:hidden">
                  <img
                    src="/logo.png"
                    alt="Trashure"
                    className="h-6 w-6 object-contain"
                  />
                  <p className="text-xs font-bold text-emerald-700">
                    Trashure Resident
                  </p>
                </div>

                <h1 className="text-lg font-black text-zinc-900 sm:text-xl">
                  {pageTitle}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Notifications"
                  title="Notifications will be connected later"
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 bg-white text-zinc-500 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Bell className="h-5 w-5" />
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label="Open resident menu"
                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700 outline-none transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    {loggingOut ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : shellProfile?.avatar_url ? (
                      <img
                        src={shellProfile.avatar_url}
                        alt={shellProfile.full_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound className="h-5 w-5" />
                    )}
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-60 rounded-2xl border border-emerald-100 !bg-white p-2 text-zinc-900 shadow-xl"
                  >
                    {shellProfile && (
                      <div className="px-3 py-2">
                        <p className="truncate text-sm font-black text-zinc-900">
                          {shellProfile.full_name}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          Resident account
                        </p>
                      </div>
                    )}

                    <DropdownMenuSeparator className="bg-emerald-100" />

                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`${RESIDENT_BASE_PATH}/profile`)
                      }
                      className="cursor-pointer rounded-xl px-3 py-2.5 font-semibold text-zinc-700 focus:bg-emerald-50 focus:text-emerald-700"
                    >
                      <UserRound className="mr-2 h-4 w-4" />
                      Resident profile
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-emerald-100" />

                    <DropdownMenuItem
                      disabled={loggingOut}
                      onClick={() => void handleLogout()}
                      className="cursor-pointer rounded-xl px-3 py-2.5 font-semibold text-red-600 focus:bg-red-50 focus:text-red-700"
                    >
                      {loggingOut ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="mr-2 h-4 w-4" />
                      )}
                      {loggingOut ? "Signing out..." : "Sign out"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
            <div className="mx-auto w-full max-w-[1500px]">
              {children}
            </div>
          </main>
        </div>

        {/* MOBILE BOTTOM NAVIGATION */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100 bg-white/95 px-3 py-3 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between">
            {mobileNavigation.slice(0, 2).map((item) => (
              <MobileNavigationItem
                key={item.href}
                item={item}
                active={isRouteActive(pathname, item.href)}
              />
            ))}

            <div className="relative flex justify-center">
              <Link
                href={`${RESIDENT_BASE_PATH}/scan`}
                aria-label="Scan an item"
                className="relative -mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 text-white shadow-xl shadow-emerald-500/40 transition active:scale-95"
              >
                <ScanLine className="h-7 w-7" />
              </Link>
            </div>

            {mobileNavigation.slice(2).map((item) => (
              <MobileNavigationItem
                key={item.href}
                item={item}
                active={isRouteActive(pathname, item.href)}
              />
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}

function MobileNavigationItem({
  item,
  active,
}: {
  item: NavigationItem;
  active: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-bold transition-colors ${
        active
          ? "text-emerald-700"
          : "text-zinc-400 hover:text-emerald-600"
      }`}
    >
      <div
        className={`flex h-8 w-10 items-center justify-center rounded-full transition-colors ${
          active ? "bg-emerald-100" : "bg-transparent"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
