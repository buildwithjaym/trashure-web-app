"use client";

import type {
    ComponentType,
    ReactNode,
} from "react";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import Link from "next/link";

import {
    usePathname,
    useRouter,
} from "next/navigation";

import {
    Bell,
    History,
    Home,
    Loader2,
    Handshake,
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


const RESIDENT_BASE_PATH =
    "/profiles/resident";


interface NavigationItem {
    label: string;
    href: string;

    icon:
        ComponentType<{
            className?: string;
        }>;
}


interface ResidentShellProfile {
    full_name: string;
    avatar_url: string | null;
}


const desktopNavigation: NavigationItem[] = [
    {
        label:
            "Home",

        href:
            RESIDENT_BASE_PATH,

        icon:
            Home,
    },
    {
        label:
            "Scan Item",

        href:
            `${RESIDENT_BASE_PATH}/scan`,

        icon:
            ScanLine,
    },
    {
        label:
            "Offers",

        href:
            `${RESIDENT_BASE_PATH}/offers`,

        icon:
            Handshake,
    },
    {
        label:
            "Nearby Recovery",

        href:
            `${RESIDENT_BASE_PATH}/nearby`,

        icon:
            MapPinned,
    },
    {
        label:
            "Resident Profile",

        href:
            `${RESIDENT_BASE_PATH}/profile`,

        icon:
            UserRound,
    },
];


const mobileNavigation: NavigationItem[] = [
  {
    label: "Home",
    href: RESIDENT_BASE_PATH,
    icon: Home,
  },
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

function isRouteActive(
    pathname: string,
    href: string
) {
    if (
        href ===
        RESIDENT_BASE_PATH
    ) {
        return (
            pathname ===
            href
        );
    }

    return (
        pathname ===
            href ||
        pathname.startsWith(
            `${href}/`
        )
    );
}


function getPageTitle(
  pathname: string,
) {
  if (
    pathname.startsWith(
      `${RESIDENT_BASE_PATH}/scan`,
    )
  ) {
    return "Scan Item";
  }

  if (
    pathname.startsWith(
      `${RESIDENT_BASE_PATH}/history`,
    )
  ) {
    return "Scan History";
  }

  if (
    pathname.startsWith(
      `${RESIDENT_BASE_PATH}/offers`,
    )
  ) {
    return "Recovery Offers";
  }

  if (
    pathname.startsWith(
      `${RESIDENT_BASE_PATH}/nearby`,
    )
  ) {
    return "Nearby Recovery";
  }

  if (
    pathname.startsWith(
      `${RESIDENT_BASE_PATH}/profile`,
    )
  ) {
    return "Resident Profile";
  }

  return "Resident Dashboard";
}


function firstName(
    value: string
) {
    return (
        value
            .trim()
            .split(/\s+/)[0] ||
        "Resident"
    );
}


export default function ResidentLayout({
    children,
}: {
    children: ReactNode;
}) {
    const pathname =
        usePathname();

    const router =
        useRouter();

    const supabase =
        useMemo(
            () =>
                createClient(),
            []
        );


    const [
        shellProfile,
        setShellProfile,
    ] =
        useState<ResidentShellProfile | null>(
            null
        );

    const [
        loggingOut,
        setLoggingOut,
    ] =
        useState(
            false
        );


    const pageTitle =
        getPageTitle(
            pathname
        );


    useEffect(
        () => {
            let active =
                true;

            const loadProfile =
                async () => {
                    const {
                        data: {
                            user,
                        },
                    } =
                        await supabase.auth.getUser();

                    if (
                        !user
                    ) {
                        router.replace(
                            "/login"
                        );

                        return;
                    }

                    const {
                        data,
                    } =
                        await supabase
                            .from(
                                "profiles"
                            )
                            .select(`
                                full_name,
                                avatar_url
                            `)
                            .eq(
                                "auth_id",
                                user.id
                            )
                            .maybeSingle();

                    if (
                        active &&
                        data
                    ) {
                        setShellProfile(
                            data as ResidentShellProfile
                        );
                    }
                };

            void loadProfile();

            return () => {
                active =
                    false;
            };
        },
        [
            router,
            supabase,
        ]
    );


    const handleLogout =
        async () => {
            if (
                loggingOut
            ) {
                return;
            }

            setLoggingOut(
                true
            );

            try {
                const {
                    error,
                } =
                    await supabase.auth.signOut();

                if (
                    error
                ) {
                    throw error;
                }

                toast.success(
                    "Signed out successfully."
                );

                router.replace(
                    "/login"
                );

                router.refresh();
            } catch (
                error
            ) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Unable to sign out."
                );
            } finally {
                setLoggingOut(
                    false
                );
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

                @media (prefers-reduced-motion: reduce) {
                    .resident-shell-motion {
                        animation: none !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>


            <div className="min-h-screen bg-green-50/60 text-zinc-900">
                {/* DESKTOP SIDEBAR */}

                <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-green-100 bg-white lg:flex lg:flex-col">
                    <div className="flex h-20 items-center border-b border-green-100 px-6">
                        <Link
                            href={
                                RESIDENT_BASE_PATH
                            }
                            className="group flex items-center gap-3"
                        >
                            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-green-100 transition-transform duration-300 group-hover:scale-105">
                                <img
                                    src="/logo.png"
                                    alt="Trashure logo"
                                    className="h-full w-full object-contain"
                                />
                            </div>

                            <div>
                                <p className="text-lg font-black tracking-tight text-zinc-900">
                                    Trashure
                                </p>

                                <p className="text-xs font-semibold text-green-600">
                                    Resident
                                </p>
                            </div>
                        </Link>
                    </div>


                    <div className="flex-1 overflow-y-auto px-4 py-6">
                        <div className="mb-5 rounded-[22px] border border-green-100 bg-green-50 p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white text-green-700 shadow-sm">
                                    {shellProfile?.avatar_url ? (
                                        <img
                                            src={
                                                shellProfile.avatar_url
                                            }
                                            alt={
                                                shellProfile.full_name
                                            }
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <UserRound className="h-5 w-5" />
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate font-black text-zinc-900">
                                        {shellProfile
                                            ? firstName(
                                                  shellProfile.full_name
                                              )
                                            : "Resident workspace"}
                                    </p>

                                    <p className="mt-0.5 text-xs text-zinc-500">
                                        Scan, recover, and reuse
                                    </p>
                                </div>
                            </div>
                        </div>


                        <p className="px-3 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">
                            Workspace
                        </p>

                        <nav className="mt-3 space-y-1.5">
                            {desktopNavigation.map(
                                (
                                    item
                                ) => {
                                    const Icon =
                                        item.icon;

                                    const active =
                                        isRouteActive(
                                            pathname,
                                            item.href
                                        );

                                    return (
                                        <Link
                                            key={
                                                item.href
                                            }
                                            href={
                                                item.href
                                            }
                                            className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
                                                active
                                                    ? "bg-green-600 text-white shadow-sm shadow-green-600/20"
                                                    : "text-zinc-500 hover:translate-x-0.5 hover:bg-green-50 hover:text-green-700"
                                            }`}
                                        >
                                            <Icon
                                                className={`h-5 w-5 ${
                                                    active
                                                        ? "text-white"
                                                        : "text-zinc-400 transition-colors group-hover:text-green-600"
                                                }`}
                                            />

                                            <span className="flex-1">
                                                {
                                                    item.label
                                                }
                                            </span>
                                        </Link>
                                    );
                                }
                            )}
                        </nav>
                    </div>


                    <div className="border-t border-green-100 p-4">
                        <Link
                            href={`${RESIDENT_BASE_PATH}/scan`}
                            className="group flex w-full items-center justify-center gap-2 rounded-full bg-green-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md"
                        >
                            <ScanLine className="h-4 w-4" />

                            Scan an item
                        </Link>


                        <button
                            type="button"
                            disabled={
                                loggingOut
                            }
                            onClick={() =>
                                void handleLogout()
                            }
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-red-100 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
                        >
                            {loggingOut ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <LogOut className="h-4 w-4" />
                            )}

                            {loggingOut
                                ? "Signing out..."
                                : "Sign out"}
                        </button>
                    </div>
                </aside>


                {/* MAIN AREA */}

                <div className="min-h-screen lg:pl-72">
                    <header className="sticky top-0 z-30 border-b border-green-100 bg-white/95 backdrop-blur-md">
                        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
                            <div className="resident-shell-motion animate-[residentShellFade_.3s_ease-out_both]">
                                <p className="text-xs font-bold text-green-600 lg:hidden">
                                    Trashure Resident
                                </p>

                                <h1 className="text-lg font-black text-zinc-900 sm:text-xl">
                                    {pageTitle}
                                </h1>
                            </div>


                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    aria-label="Notifications"
                                    title="Notifications will be connected later"
                                    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-green-100 bg-white text-zinc-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-50 hover:text-green-700"
                                >
                                    <Bell className="h-5 w-5" />
                                </button>


                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        aria-label="Open resident menu"
                                        className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border bg-white outline-none transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 ${
                                            pathname.startsWith(
                                                `${RESIDENT_BASE_PATH}/profile`
                                            )
                                                ? "border-green-600 bg-green-600 text-white"
                                                : "border-green-100 bg-white text-green-700 hover:border-green-200 hover:bg-green-50"
                                        }`}
                                    >
                                        {loggingOut ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : shellProfile?.avatar_url ? (
                                            <img
                                                src={
                                                    shellProfile.avatar_url
                                                }
                                                alt={
                                                    shellProfile.full_name
                                                }
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <UserRound className="h-5 w-5" />
                                        )}
                                    </DropdownMenuTrigger>


                                    <DropdownMenuContent
                                        align="end"
                                        className="w-60 rounded-2xl border border-green-100 !bg-white p-2 text-zinc-900 shadow-xl"
                                    >
                                        {shellProfile && (
                                            <div className="px-3 py-2">
                                                <p className="truncate text-sm font-black text-zinc-900">
                                                    {
                                                        shellProfile.full_name
                                                    }
                                                </p>

                                                <p className="mt-0.5 text-xs text-zinc-400">
                                                    Resident account
                                                </p>
                                            </div>
                                        )}


                                        <DropdownMenuSeparator className="bg-green-100" />


                                        <DropdownMenuItem
                                            onClick={() =>
                                                router.push(
                                                    `${RESIDENT_BASE_PATH}/profile`
                                                )
                                            }
                                            className="cursor-pointer rounded-xl px-3 py-2.5 font-semibold text-zinc-700 focus:bg-green-50 focus:text-green-700"
                                        >
                                            <UserRound className="mr-2 h-4 w-4" />

                                            Resident profile
                                        </DropdownMenuItem>


                                        <DropdownMenuSeparator className="bg-green-100" />


                                        <DropdownMenuItem
                                            disabled={
                                                loggingOut
                                            }
                                            onClick={() =>
                                                void handleLogout()
                                            }
                                            className="cursor-pointer rounded-xl px-3 py-2.5 font-semibold text-red-600 focus:bg-red-50 focus:text-red-700"
                                        >
                                            {loggingOut ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <LogOut className="mr-2 h-4 w-4" />
                                            )}

                                            {loggingOut
                                                ? "Signing out..."
                                                : "Sign out"}
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

                <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-green-100 bg-white/95 px-3 py-3 backdrop-blur-xl md:hidden">
                    <div className="mx-auto flex max-w-md items-center justify-between">
                        {mobileNavigation
                            .slice(
                                0,
                                2
                            )
                            .map(
                                (
                                    item
                                ) => (
                                    <MobileNavigationItem
                                        key={
                                            item.href
                                        }
                                        item={
                                            item
                                        }
                                        active={isRouteActive(
                                            pathname,
                                            item.href
                                        )}
                                    />
                                )
                            )}


                        <div className="relative flex justify-center">
                            <Link
                                href={`${RESIDENT_BASE_PATH}/scan`}
                                aria-label="Scan an item"
                                className="relative -mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-700 text-white shadow-xl shadow-green-500/40 transition active:scale-95"
                            >
                                

                                <ScanLine className="h-7 w-7" />
                            </Link>
                        </div>


                        {mobileNavigation
                            .slice(
                                2
                            )
                            .map(
                                (
                                    item
                                ) => (
                                    <MobileNavigationItem
                                        key={
                                            item.href
                                        }
                                        item={
                                            item
                                        }
                                        active={isRouteActive(
                                            pathname,
                                            item.href
                                        )}
                                    />
                                )
                            )}
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
    const Icon =
        item.icon;

    return (
        <Link
            href={
                item.href
            }
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-bold transition-colors ${
                active
                    ? "text-green-700"
                    : "text-zinc-400 hover:text-green-600"
            }`}
        >
            <div
                className={`flex h-8 w-10 items-center justify-center rounded-full transition-colors ${
                    active
                        ? "bg-green-100"
                        : "bg-transparent"
                }`}
            >
                <Icon className="h-5 w-5" />
            </div>

            <span className="truncate">
                {item.label}
            </span>
        </Link>
    );
}