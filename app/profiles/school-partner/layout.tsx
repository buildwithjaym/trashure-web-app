"use client";

import type {
    ComponentType,
    ReactNode,
} from "react";

import {
    BarChart3,
    Bell,
    ClipboardList,
    Home,
    Plus,
    Recycle,
    School,
    Truck,
    UserRound,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";


interface NavigationItem {
    label: string;
    href: string;

    icon: ComponentType<{
        className?: string;
    }>;
}


const desktopNavigation: NavigationItem[] = [
    {
        label: "Home",
        href: "/profiles/school-partner",
        icon: Home,
    },
    {
        label: "Collection Drives",
        href: "/profiles/school-partner/drives",
        icon: ClipboardList,
    },
    {
        label: "Pickup Requests",
        href: "/profiles/school-partner/pickups",
        icon: Truck,
    },
    {
        label: "Impact",
        href: "/profiles/school-partner/impact",
        icon: BarChart3,
    },
    {
        label: "School Profile",
        href: "/profiles/school-partner/profile",
        icon: UserRound,
    },
];


const mobileNavigation: NavigationItem[] = [
    {
        label: "Home",
        href: "/profiles/school-partner",
        icon: Home,
    },
    {
        label: "Drives",
        href: "/profiles/school-partner/drives",
        icon: ClipboardList,
    },
    {
        label: "Pickups",
        href: "/profiles/school-partner/pickups",
        icon: Truck,
    },
    {
        label: "Profile",
        href: "/profiles/school-partner/profile",
        icon: UserRound,
    },
];


function isRouteActive(
    pathname: string,
    href: string
) {
    if (
        href ===
        "/profiles/school-partner"
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
    pathname: string
) {
    if (
        pathname.startsWith(
            "/profiles/school-partner/drives"
        )
    ) {
        return "Collection Drives";
    }

    if (
        pathname.startsWith(
            "/profiles/school-partner/pickups"
        )
    ) {
        return "Pickup Requests";
    }

    if (
        pathname.startsWith(
            "/profiles/school-partner/impact"
        )
    ) {
        return "Environmental Impact";
    }

    if (
        pathname.startsWith(
            "/profiles/school-partner/profile"
        )
    ) {
        return "School Profile";
    }

    return "School Dashboard";
}


export default function SchoolPartnerLayout({
    children,
}: {
    children: ReactNode;
}) {
    const pathname =
        usePathname();

    const pageTitle =
        getPageTitle(
            pathname
        );

    return (
        <>
            <style jsx global>{`
                @keyframes schoolShellFade {
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
                    .school-motion {
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
                            href="/profiles/school-partner"
                            className="group flex items-center gap-3"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                                <Recycle className="h-6 w-6" />
                            </div>

                            <div>
                                <p className="text-lg font-black tracking-tight text-zinc-900">
                                    Trashure
                                </p>

                                <p className="text-xs font-semibold text-green-600">
                                    School Partner
                                </p>
                            </div>
                        </Link>
                    </div>


                    <div className="flex-1 overflow-y-auto px-4 py-6">
                        <div className="mb-5 rounded-[22px] border border-green-100 bg-green-50 p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-green-700 shadow-sm">
                                    <School className="h-5 w-5" />
                                </div>

                                <div className="min-w-0">
                                    <p className="font-black text-zinc-900">
                                        School Workspace
                                    </p>

                                    <p className="mt-0.5 text-xs text-zinc-500">
                                        Sustainability activities
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
                            href="/profiles/school-partner/drives?action=create"
                            className="group flex w-full items-center justify-center gap-2 rounded-full bg-green-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md"
                        >
                            <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />

                            Create collection drive
                        </Link>

                        <p className="mt-3 text-center text-[11px] leading-5 text-zinc-400">
                            Organize materials and school sustainability
                            activities.
                        </p>
                    </div>
                </aside>


                {/* MAIN AREA */}

                <div className="min-h-screen lg:pl-72">
                    {/* TOP HEADER */}

                    <header className="sticky top-0 z-30 border-b border-green-100 bg-white/95 backdrop-blur-md">
                        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
                            <div className="school-motion animate-[schoolShellFade_.3s_ease-out_both]">
                                <p className="text-xs font-bold text-green-600 lg:hidden">
                                    Trashure School Partner
                                </p>

                                <h1 className="text-lg font-black text-zinc-900 sm:text-xl">
                                    {pageTitle}
                                </h1>
                            </div>


                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    aria-label="Notifications coming soon"
                                    title="Notifications will be added later"
                                    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-green-100 bg-white text-zinc-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-50 hover:text-green-700"
                                >
                                    <Bell className="h-5 w-5" />

                                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-green-500 ring-2 ring-white" />
                                </button>


                                <Link
                                    href="/profiles/school-partner/profile"
                                    aria-label="Open school profile"
                                    className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 hover:-translate-y-0.5 ${
                                        pathname.startsWith(
                                            "/profiles/school-partner/profile"
                                        )
                                            ? "border-green-600 bg-green-600 text-white"
                                            : "border-green-100 bg-green-50 text-green-700 hover:border-green-200"
                                    }`}
                                >
                                    <UserRound className="h-5 w-5" />
                                </Link>
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
                                href="/profiles/school-partner/drives?action=create"
                                aria-label="Create collection drive"
                               className="relative -mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-700 text-white shadow-xl shadow-green-500/40 transition active:scale-95"
                            >
                                <Plus
                            size={
                                29
                            }
                        />

                                
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