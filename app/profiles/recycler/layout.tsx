
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HandCoins,
  Home,
  Loader2,
  LogOut,
  PackageSearch,
  Plus,
  ScanLine,
  Store,
  User,
  Check,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RecyclerProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  barangay: string | null;
  role: string;
}

const navigation = [
  {
    name: "Home",
    mobileName: "Home",
    href: "/profiles/recycler",
    icon: Home,
  },
  {
    name: "Materials",
    mobileName: "Materials",
    href: "/profiles/recycler/materials",
    icon: PackageSearch,
  },
  {
    name: "Opportunities",
    mobileName: "Offers",
    href: "/profiles/recycler/opportunities",
    icon: HandCoins,
  },
  {
    name: "Profile",
    mobileName: "Profile",
    href: "/profiles/recycler/profile",
    icon: User,
  },
];

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getRoleHome(role: string) {
  switch (role) {
    case "resident":
      return "/profiles/resident";
    case "school_partner":
      return "/profiles/school";
    case "lgu_admin":
      return "/profiles/lgu";
    case "recycler_partner":
      return "/profiles/recycler";
    default:
      return "/login";
  }
}

export default function RecyclerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<RecyclerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, barangay, role")
          .eq("auth_id", user.id)
          .single();

        if (error || !data) {
          router.replace("/create-account");
          return;
        }

        if (data.role !== "recycler_partner") {
          router.replace(getRoleHome(data.role));
          return;
        }

        if (mounted) {
          setProfile(data as RecyclerProfile);
        }
      } catch {
        if (mounted) {
          toast.error("Unable to load your account.");
        }
      } finally {
        if (mounted) {
          setProfileLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  const isActive = (href: string) => {
    if (href === "/profiles/recycler") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const logout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      toast.success("Logged out successfully.");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to log out."
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  const profileName = profile?.full_name ?? "Recycler Partner";

  const profileBarangay = profile?.barangay
    ? `Barangay ${profile.barangay}`
    : "Barangay not provided";

  const profileMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label="Open account menu"
        className="flex items-center gap-3 rounded-full border border-emerald-100 bg-white p-1.5 shadow-sm transition hover:border-emerald-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 lg:pr-3"
      >
        {profileLoading ? (
          <div className="h-10 w-10 animate-pulse rounded-full bg-emerald-100" />
        ) : (
          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
            <AvatarImage
              src={profile?.avatar_url ?? undefined}
              alt={profileName}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-sm font-bold text-white">
              {getInitials(profileName)}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="hidden min-w-0 text-left lg:block">
          <p className="max-w-36 truncate text-sm font-bold text-zinc-900">
            {profileName}
          </p>
          <p className="max-w-36 truncate text-xs text-zinc-500">
            {profileBarangay}
          </p>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={10}
        className="z-[100] w-64 max-w-[calc(100vw-1rem)] rounded-2xl border border-emerald-100 bg-white p-2 text-zinc-900 shadow-xl"
      >
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 shrink-0 border-2 border-white shadow-sm">
              <AvatarImage
                src={profile?.avatar_url ?? undefined}
                alt={profileName}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-sm font-bold text-white">
                {getInitials(profileName)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="truncate text-sm font-black text-zinc-900">
                {profileName}
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {profileBarangay}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Junkshop Partner
              </p>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="my-2 bg-emerald-100" />

        <DropdownMenuItem
          onClick={() => router.push("/profiles/recycler/profile/")}
          className="cursor-pointer rounded-xl px-3 py-3 text-sm font-semibold text-zinc-700 focus:bg-emerald-50 focus:text-emerald-700"
        >
          <Store className="mr-3 h-4 w-4 text-emerald-600" />
          Junkshop profile
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2 bg-emerald-100" />

        <DropdownMenuItem
          disabled={isLoggingOut}
          onClick={() => void logout()}
          className="cursor-pointer rounded-xl px-3 py-3 text-sm font-semibold text-red-600 focus:bg-red-50 focus:text-red-700"
        >
          {isLoggingOut ? (
            <Loader2 className="mr-3 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-3 h-4 w-4" />
          )}
          {isLoggingOut ? "Logging out..." : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#f5faf6] text-zinc-900">
      {/* DESKTOP HEADER */}
      <header className="sticky top-0 z-40 hidden border-b border-emerald-100/80 bg-white/95 backdrop-blur-xl md:block">
        <div className="mx-auto flex min-h-[76px] max-w-[1600px] items-center justify-between gap-6 px-6 py-3 lg:px-10">
          <Link
            href="/profiles/recycler"
            className="group flex shrink-0 items-center gap-3 rounded-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-white p-1 shadow-sm transition duration-300 group-hover:scale-105 group-hover:shadow-md">
              <img
                src="/logo.png"
                alt="Trashure logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight text-zinc-900">
                Trashure
              </h1>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700">
                Team Aureloop
              </p>
            </div>
          </Link>

          <nav
            aria-label="Recycler navigation"
            className="flex items-center gap-1 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-1.5"
          >
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 lg:px-4 ${
                    active
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-700/15"
                      : "text-zinc-600 hover:bg-white hover:text-emerald-700"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{item.name}</span>
                  {active && (
                    <Check className="ml-0.5 h-3.5 w-3.5" />
                  )}
                </Link>
              );
            })}
          </nav>

          {profileMenu}
        </div>
      </header>

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/95 backdrop-blur-xl md:hidden">
        <div className="flex min-h-[68px] items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/profiles/recycler"
            className="flex min-w-0 items-center gap-2.5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-100 bg-white p-0.5 shadow-sm">
              <img
                src="/logo.png"
                alt="Trashure logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <p className="text-base font-black tracking-tight text-zinc-900">
                Trashure
              </p>
              <p className="text-[10px] font-semibold text-emerald-700">
                Junkshop Partner
              </p>
            </div>
          </Link>

          {profileMenu}
        </div>
      </header>

      {/* PAGE CONTENT */}
      <main className="mx-auto w-full min-w-0 max-w-[1600px] px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-7 md:px-8 md:pb-10 lg:px-10 lg:pt-8">
        {children}
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav
        aria-label="Recycler mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-100 bg-white/95 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto grid w-full max-w-md grid-cols-5 items-end">
          {navigation.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition active:scale-95 ${
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-zinc-500 hover:text-emerald-700"
                }`}
              >
                <Icon
                  className="h-5 w-5 shrink-0"
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="w-full truncate text-center text-[10px] font-semibold leading-tight">
                  {item.mobileName}
                </span>
              </Link>
            );
          })}

          <div className="flex min-w-0 flex-col items-center justify-end">
            <Link
              href="/profiles/recycler/materials?action=add"
              aria-label="Add accepted material"
              className="relative -mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-600/30 ring-4 ring-[#f5faf6] transition duration-200 hover:scale-105 active:scale-95 min-[380px]:h-16 min-[380px]:w-16"
            >
              <Plus className="h-7 w-7" />
            </Link>
            <span className="mt-1 text-[10px] font-bold leading-tight text-emerald-700">
              Add
            </span>
          </div>

          {navigation.slice(2).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition active:scale-95 ${
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-zinc-500 hover:text-emerald-700"
                }`}
              >
                <Icon
                  className="h-5 w-5 shrink-0"
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="w-full truncate text-center text-[10px] font-semibold leading-tight">
                  {item.mobileName}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
