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
    Store,
    User,
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
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
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
        href: "/profiles/recycler",
        icon: Home,
    },
    {
        name: "Materials",
        href: "/profiles/recycler/materials",
        icon: PackageSearch,
    },
    {
        name: "Opportunities",
        href: "/profiles/recycler/opportunities",
        icon: HandCoins,
    },
    {
        name: "Profile",
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

    const supabase = useMemo(
        () => createClient(),
        []
    );

    const [profile, setProfile] =
        useState<RecyclerProfile | null>(null);

    const [profileLoading, setProfileLoading] =
        useState(true);

    const [isLoggingOut, setIsLoggingOut] =
        useState(false);


    useEffect(() => {
        let mounted = true;

        const loadProfile = async () => {
            try {
                const {
                    data: {
                        user,
                    },
                    error: authError,
                } = await supabase.auth.getUser();


                if (authError || !user) {
                    router.replace("/login");
                    return;
                }


                const {
                    data,
                    error,
                } = await supabase
                    .from("profiles")
                    .select(`
                        id,
                        full_name,
                        avatar_url,
                        barangay,
                        role
                    `)
                    .eq("auth_id", user.id)
                    .single();


                if (error || !data) {
                    router.replace("/create-account");
                    return;
                }


                if (data.role !== "recycler_partner") {
                    router.replace(
                        getRoleHome(data.role)
                    );

                    return;
                }


                if (mounted) {
                    setProfile(
                        data as RecyclerProfile
                    );
                }
            } catch {
                if (mounted) {
                    toast.error(
                        "Unable to load your account."
                    );
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
    }, [
        router,
        supabase,
    ]);


    const isActive = (
        href: string
    ) => {
        if (
            href ===
            "/profiles/recycler"
        ) {
            return (
                pathname ===
                "/profiles/recycler"
            );
        }

        return pathname.startsWith(href);
    };


    const logout = async () => {
        if (isLoggingOut) {
            return;
        }


        setIsLoggingOut(true);


        try {
            const {
                error,
            } =
                await supabase.auth.signOut();


            if (error) {
                throw error;
            }


            toast.success(
                "Logged out successfully."
            );


            router.replace("/login");
            router.refresh();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Unable to log out.";


            toast.error(message);
        } finally {
            setIsLoggingOut(false);
        }
    };


    const profileName =
        profile?.full_name ??
        "Recycler Partner";

    const profileBarangay =
        profile?.barangay
            ? `Barangay ${profile.barangay}`
            : "Barangay not provided";


    const profileMenu = (
    <DropdownMenu>
        <DropdownMenuTrigger
            type="button"
            aria-label="Open account menu"
            className="flex items-center gap-3 rounded-full border border-green-100 bg-white p-1.5 shadow-sm transition hover:border-green-200 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 lg:pr-3"
        >
            {profileLoading ? (
                <div className="h-10 w-10 animate-pulse rounded-full bg-green-100" />
            ) : (
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarImage
                        src={profile?.avatar_url ?? undefined}
                        alt={profileName}
                        className="object-cover"
                    />

                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-700 text-sm font-bold text-white">
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
            className="z-[100] w-64 max-w-[calc(100vw-1rem)] rounded-2xl border border-green-100 bg-white p-2 text-zinc-900 shadow-2xl"
        >
            {/* User information */}

            <div className="rounded-xl bg-green-50 p-3">
                <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 shrink-0 border-2 border-white shadow-sm">
                        <AvatarImage
                            src={profile?.avatar_url ?? undefined}
                            alt={profileName}
                            className="object-cover"
                        />

                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-700 text-sm font-bold text-white">
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

                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-green-600">
                            Junkshop Partner
                        </p>
                    </div>
                </div>
            </div>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuItem
                onClick={() => {
                    router.push("/profiles/recycler/profile/");
                }}
                className="cursor-pointer rounded-xl px-3 py-3 text-sm font-medium text-zinc-700 focus:bg-green-50 focus:text-green-700"
            >
                <Store className="mr-3 h-4 w-4 text-green-600" />

                Junkshop profile
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuItem
                disabled={isLoggingOut}
                onClick={() => {
                    void logout();
                }}
                className="cursor-pointer rounded-xl px-3 py-3 text-sm font-medium text-red-600 focus:bg-red-50 focus:text-red-700"
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
        <div className="min-h-screen bg-green-50">
            {/* Desktop top bar */}

            <header className="sticky top-0 z-40 hidden border-b border-green-100 bg-white/85 backdrop-blur-xl md:block">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
                    <Link
                        href="/profiles/recycler"
                        className="flex items-center gap-3"
                    >
                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-green-100">
                            <img
                                src="/logo.png"
                                alt="Trashure"
                                className="h-full w-full object-contain"
                            />
                        </div>


                        <div>
                            <h1 className="font-black text-zinc-900">
                                Trashure
                            </h1>

                            <p className="text-xs font-medium text-green-600">
                                Junkshop Partner
                            </p>
                        </div>
                    </Link>


                    <nav className="flex items-center gap-2">
                        {navigation.map(
                            (
                                item
                            ) => {
                                const Icon =
                                    item.icon;

                                const active =
                                    isActive(
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
                                        aria-current={
                                            active
                                                ? "page"
                                                : undefined
                                        }
                                        className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition ${
                                            active
                                                ? "bg-green-600 text-white shadow-sm shadow-green-600/20"
                                                : "text-zinc-600 hover:bg-green-50 hover:text-green-700"
                                        }`}
                                    >
                                        <Icon
                                            size={
                                                17
                                            }
                                        />

                                        {
                                            item.name
                                        }
                                    </Link>
                                );
                            }
                        )}
                    </nav>


                    {profileMenu}
                </div>
            </header>


            {/* Mobile top bar */}

            <header className="sticky top-0 z-40 border-b border-green-100 bg-white/90 backdrop-blur-xl md:hidden">
                <div className="flex items-center justify-between px-4 py-3">
                    <Link
                        href="/profiles/recycler"
                        className="flex items-center gap-2.5"
                    >
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-green-100">
                            <img
                                src="/logo.png"
                                alt="Trashure"
                                className="h-full w-full object-contain"
                            />
                        </div>


                        <div>
                            <p className="text-sm font-black text-zinc-900">
                                Trashure
                            </p>

                            <p className="text-[11px] font-medium text-green-600">
                                Junkshop Partner
                            </p>
                        </div>
                    </Link>


                    {profileMenu}
                </div>
            </header>


            {/* Page content */}

            <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:px-8 md:pb-10">
                {children}
            </main>


            {/* Mobile bottom navigation */}

            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-green-100 bg-white/95 px-3 py-3 backdrop-blur-xl md:hidden">
                <div className="mx-auto flex max-w-md items-center justify-between">
                    {navigation
                        .slice(
                            0,
                            2
                        )
                        .map(
                            (
                                item
                            ) => {
                                const Icon =
                                    item.icon;

                                const active =
                                    isActive(
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
                                        aria-current={
                                            active
                                                ? "page"
                                                : undefined
                                        }
                                        className={`flex min-w-16 flex-col items-center gap-1 text-[11px] font-medium transition ${
                                            active
                                                ? "text-green-600"
                                                : "text-zinc-500"
                                        }`}
                                    >
                                        <Icon
                                            size={
                                                22
                                            }
                                            strokeWidth={
                                                active
                                                    ? 2.5
                                                    : 2
                                            }
                                        />

                                        {
                                            item.name
                                        }
                                    </Link>
                                );
                            }
                        )}


                    <Link
                        href="/profiles/recycler/materials?action=add"
                        aria-label="Add accepted material"
                        className="relative -mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-700 text-white shadow-xl shadow-green-500/40 transition active:scale-95"
                    >
                        <Plus
                            size={
                                29
                            }
                        />
                    </Link>


                    {navigation
                        .slice(2)
                        .map(
                            (
                                item
                            ) => {
                                const Icon =
                                    item.icon;

                                const active =
                                    isActive(
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
                                        aria-current={
                                            active
                                                ? "page"
                                                : undefined
                                        }
                                        className={`flex min-w-16 flex-col items-center gap-1 text-[11px] font-medium transition ${
                                            active
                                                ? "text-green-600"
                                                : "text-zinc-500"
                                        }`}
                                    >
                                        <Icon
                                            size={
                                                22
                                            }
                                            strokeWidth={
                                                active
                                                    ? 2.5
                                                    : 2
                                            }
                                        />

                                        {
                                            item.name
                                        }
                                    </Link>
                                );
                            }
                        )}
                </div>
            </nav>
        </div>
    );
}