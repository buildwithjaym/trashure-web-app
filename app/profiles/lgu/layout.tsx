"use client";

import type {
  ReactNode,
} from "react";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  BarChart3,
  Building2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  Network,
  Recycle,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";


interface LguProfile {
  id: string;
  auth_id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  role: string;
  barangay: string | null;
  city: string | null;
  province: string | null;
}


interface NavigationItem {
  label: string;
  href: string;
  icon:
    typeof LayoutDashboard;
}


const navigationItems: NavigationItem[] = [
  {
    label:
      "City Overview",

    href:
      "/profiles/lgu#overview",

    icon:
      LayoutDashboard,
  },

  {
    label:
      "Recovery Trend",

    href:
      "/profiles/lgu#trend",

    icon:
      BarChart3,
  },

  {
    label:
      "Barangays",

    href:
      "/profiles/lgu#barangays",

    icon:
      MapPinned,
  },

  {
    label:
      "Recovery Network",

    href:
      "/profiles/lgu#network",

    icon:
      Network,
  },
];


function getInitials(
  name: string,
) {
  return name
    .split(
      " ",
    )
    .filter(
      Boolean,
    )
    .slice(
      0,
      2,
    )
    .map(
      (
        word,
      ) =>
        word[0]?.toUpperCase() ??
        "",
    )
    .join(
      "",
    );
}


function locationLabel(
  profile: LguProfile,
) {
  return [
    profile.city,
    profile.province,
  ]
    .filter(
      Boolean,
    )
    .join(
      ", ",
    );
}


export default function LguLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const supabase =
    useMemo(
      () =>
        createClient(),
      [],
    );

  const profileMenuRef =
    useRef<HTMLDivElement | null>(
      null,
    );


  const [
    profile,
    setProfile,
  ] =
    useState<LguProfile | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] =
    useState(
      false,
    );

  const [
    profileMenuOpen,
    setProfileMenuOpen,
  ] =
    useState(
      false,
    );

  const [
    signingOut,
    setSigningOut,
  ] =
    useState(
      false,
    );


  const loadProfile =
    useCallback(
      async () => {
        setLoading(
          true,
        );

        const {
          data: {
            user,
          },
          error:
            authError,
        } =
          await supabase.auth.getUser();

        if (
          authError ||
          !user
        ) {
          router.replace(
            "/login",
          );

          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "profiles",
            )
            .select(`
              id,
              auth_id,
              full_name,
              email,
              avatar_url,
              role,
              barangay,
              city,
              province
            `)
            .eq(
              "auth_id",
              user.id,
            )
            .single();

        if (
          error ||
          !data ||
          data.role !==
            "lgu_admin"
        ) {
          router.replace(
            "/login",
          );

          return;
        }

        setProfile(
          data as LguProfile,
        );

        setLoading(
          false,
        );
      },
      [
        router,
        supabase,
      ],
    );


  useEffect(
    () => {
      void loadProfile();
    },
    [
      loadProfile,
    ],
  );


  useEffect(
    () => {
      setMobileMenuOpen(
        false,
      );
    },
    [
      pathname,
    ],
  );


  useEffect(
    () => {
      const handlePointerDown =
        (
          event:
            MouseEvent,
        ) => {
          if (
            !profileMenuRef.current?.contains(
              event.target as Node,
            )
          ) {
            setProfileMenuOpen(
              false,
            );
          }
        };

      document.addEventListener(
        "mousedown",
        handlePointerDown,
      );

      return () =>
        document.removeEventListener(
          "mousedown",
          handlePointerDown,
        );
    },
    [],
  );


  useEffect(
    () => {
      document.body.style.overflow =
        mobileMenuOpen
          ? "hidden"
          : "";

      return () => {
        document.body.style.overflow =
          "";
      };
    },
    [
      mobileMenuOpen,
    ],
  );


  const signOut =
    async () => {
      if (
        signingOut
      ) {
        return;
      }

      setSigningOut(
        true,
      );

      await supabase.auth.signOut();

      router.replace(
        "/login",
      );

      router.refresh();
    };


  const currentDate =
    new Intl.DateTimeFormat(
      "en-PH",
      {
        weekday:
          "short",

        month:
          "short",

        day:
          "numeric",

        year:
          "numeric",
      },
    ).format(
      new Date(),
    );


  if (
    loading ||
    !profile
  ) {
    return (
      <LguLayoutSkeleton>
        {children}
      </LguLayoutSkeleton>
    );
  }


  return (
    <div className="min-h-screen bg-[#f3fff7] text-zinc-900">
      {/* DESKTOP SIDEBAR */}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[284px] border-r border-green-100 bg-white lg:flex lg:flex-col">
        <LguSidebarContent
          profile={
            profile
          }
          onNavigate={() =>
            undefined
          }
          onSignOut={() =>
            void signOut()
          }
          signingOut={
            signingOut
          }
        />
      </aside>


      {/* MOBILE BACKDROP */}

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() =>
            setMobileMenuOpen(
              false,
            )
          }
          className="fixed inset-0 z-50 bg-zinc-950/45 backdrop-blur-sm lg:hidden"
        />
      )}


      {/* MOBILE DRAWER */}

      <aside
        className={`fixed inset-y-0 left-0 z-[60] flex w-[min(88vw,320px)] flex-col border-r border-green-100 bg-white shadow-2xl transition-transform duration-300 lg:hidden ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() =>
            setMobileMenuOpen(
              false,
            )
          }
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
        >
          <X className="h-5 w-5" />
        </button>


        <LguSidebarContent
          profile={
            profile
          }
          onNavigate={() =>
            setMobileMenuOpen(
              false,
            )
          }
          onSignOut={() =>
            void signOut()
          }
          signingOut={
            signingOut
          }
        />
      </aside>


      {/* MAIN */}

      <div className="min-h-screen lg:pl-[284px]">
        <header className="sticky top-0 z-30 border-b border-green-100 bg-white/95 backdrop-blur">
          <div className="flex min-h-[78px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open mobile menu"
                onClick={() =>
                  setMobileMenuOpen(
                    true,
                  )
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-green-100 bg-green-50 text-green-700 hover:bg-green-100 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>


              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-lg font-black text-zinc-900 sm:text-xl">
                    City Waste Monitoring
                  </h1>

                  <span className="hidden rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-green-700 sm:inline-flex">
                    Read only
                  </span>
                </div>

                <p className="mt-0.5 truncate text-xs text-zinc-500 sm:text-sm">
                  {locationLabel(
                    profile,
                  ) ||
                    "LGU monitoring scope"}{" "}
                  ·{" "}
                  {
                    currentDate
                  }
                </p>
              </div>
            </div>


            <div
              ref={
                profileMenuRef
              }
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setProfileMenuOpen(
                    (
                      open,
                    ) =>
                      !open,
                  )
                }
                className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white p-1.5 pr-2 transition hover:border-green-200 hover:bg-green-50"
              >
                {profile.avatar_url ? (
                  <img
                    src={
                      profile.avatar_url
                    }
                    alt={
                      profile.full_name
                    }
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-xs font-black text-white">
                    {getInitials(
                      profile.full_name,
                    )}
                  </div>
                )}

                <div className="hidden text-left sm:block">
                  <p className="max-w-36 truncate text-xs font-black text-zinc-900">
                    {
                      profile.full_name
                    }
                  </p>

                  <p className="text-[10px] font-semibold text-green-700">
                    LGU Administrator
                  </p>
                </div>

                <ChevronDown className="h-4 w-4 text-zinc-400" />
              </button>


              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-green-100 bg-white p-2 shadow-xl">
                  <div className="rounded-xl bg-green-50 p-3">
                    <p className="truncate font-black text-zinc-900">
                      {
                        profile.full_name
                      }
                    </p>

                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {profile.email ||
                        "LGU monitoring account"}
                    </p>
                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/profiles/lgu#overview",
                      )
                    }
                    className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-zinc-600 hover:bg-green-50 hover:text-green-700"
                  >
                    <UserRound className="h-4 w-4" />

                    Monitoring profile
                  </button>


                  <button
                    type="button"
                    disabled={
                      signingOut
                    }
                    onClick={() =>
                      void signOut()
                    }
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4" />

                    {signingOut
                      ? "Signing out..."
                      : "Sign out"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>


        <main className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}


function LguSidebarContent({
  profile,
  onNavigate,
  onSignOut,
  signingOut,
}: {
  profile: LguProfile;
  onNavigate: () => void;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  return (
    <>
      <div className="border-b border-green-100 p-5">
        <a
          href="/profiles/lgu#overview"
          onClick={
            onNavigate
          }
          className="flex items-center gap-3"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-green-100 bg-green-50">
            <img
              src="/logo.png"
              alt="Trashure"
              className="h-full w-full object-contain p-1.5"
            />
          </div>

          <div>
            <p className="text-lg font-black text-zinc-900">
              Trashure
            </p>

            <p className="text-xs font-bold text-green-700">
              LGU Monitoring
            </p>
          </div>
        </a>
      </div>


      <div className="p-4">
        <div className="rounded-[22px] border border-green-100 bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-green-700 shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="truncate font-black text-zinc-900">
                {profile.city ||
                  "City LGU"}
              </p>

              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {profile.province ||
                  "Monitoring jurisdiction"}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-green-700">
            <ShieldCheck className="h-4 w-4" />

            Monitoring access only
          </div>
        </div>
      </div>


      <nav className="flex-1 overflow-y-auto px-4 pb-4">
        <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
          Monitoring
        </p>

        <div className="space-y-1">
          {navigationItems.map(
            (
              item,
            ) => {
              const Icon =
                item.icon;

              return (
                <a
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  onClick={
                    onNavigate
                  }
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-zinc-600 transition hover:bg-green-50 hover:text-green-700"
                >
                  <Icon className="h-5 w-5" />

                  {
                    item.label
                  }
                </a>
              );
            },
          )}
        </div>


        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-center gap-2 text-zinc-700">
            <Recycle className="h-4 w-4 text-green-600" />

            <p className="text-sm font-black">
              What is counted?
            </p>
          </div>

          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Completed resident recoveries and recorded school collection
            entries inside the LGU city scope.
          </p>
        </div>
      </nav>


      <div className="border-t border-green-100 p-4">
        <Button
          type="button"
          variant="outline"
          disabled={
            signingOut
          }
          onClick={
            onSignOut
          }
          className="h-11 w-full rounded-full border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
        >
          <LogOut className="mr-2 h-4 w-4" />

          {signingOut
            ? "Signing out..."
            : "Sign out"}
        </Button>
      </div>
    </>
  );
}


function LguLayoutSkeleton({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f3fff7]">
      <aside className="fixed inset-y-0 left-0 hidden w-[284px] border-r border-green-100 bg-white p-5 lg:block">
        <Skeleton className="h-12 w-40 bg-green-100" />

        <Skeleton className="mt-8 h-28 rounded-[22px] bg-green-100" />

        <div className="mt-8 space-y-3">
          {Array.from({
            length:
              4,
          }).map(
            (
              _,
              index,
            ) => (
              <Skeleton
                key={
                  index
                }
                className="h-12 rounded-2xl bg-green-100"
              />
            ),
          )}
        </div>
      </aside>


      <div className="lg:pl-[284px]">
        <header className="h-[78px] border-b border-green-100 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64 max-w-[60vw] bg-green-100" />

            <Skeleton className="h-11 w-36 rounded-full bg-green-100" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
