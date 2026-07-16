"use client";

import type {
  ComponentType,
  ReactNode,
} from "react";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Eye,
  Gift,
  History,
  ImageOff,
  Lightbulb,
  Package,
  Recycle,
  RefreshCcw,
  ScanLine,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";


const RESIDENT_BASE_PATH =
  "/profiles/resident";

const DEFAULT_PAGE_SIZE =
  10;

const PAGE_SIZE_OPTIONS = [
  10,
  20,
  50,
] as const;


type HistoryFilter =
  | "all"
  | "confirmed"
  | "review"
  | "hazardous";


type SortOption =
  | "newest"
  | "oldest"
  | "confidence_high"
  | "confidence_low";


type ActionType =
  | "recycle"
  | "sell"
  | "donate"
  | "reuse";


interface ResidentProfile {
  id: string;
  auth_id: string;
  role: string;
}


interface ScanHistoryRow {
  id: string;
  user_id: string;
  image_url: string | null;
  detected_object: string;
  object_description: string | null;
  material_id: string | null;
  material_type: string;
  material_category: string | null;
  condition: string | null;
  confidence_score:
    | number
    | string
    | null;
  primary_action: string | null;
  preparation_steps:
    | string[]
    | string
    | null;
  hazardous: boolean;
  hazard_notes: string | null;
  needs_user_confirmation: boolean;
  user_confirmed: boolean;
  analysis_status: string | null;
  model_name: string | null;
  created_at: string;
  updated_at: string | null;
}


interface HistorySummary {
  total: number;
  confirmed: number;
  review: number;
  hazardous: number;
}


/* =========================================================
   HELPERS
========================================================= */

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (
    error instanceof
    Error
  ) {
    return error.message;
  }

  if (
    typeof error ===
      "object" &&
    error !==
      null &&
    "message" in
      error &&
    typeof (
      error as {
        message?: unknown;
      }
    ).message ===
      "string"
  ) {
    return (
      error as {
        message: string;
      }
    ).message;
  }

  return fallback;
}


function confidencePercent(
  value:
    | number
    | string
    | null,
) {
  const parsed =
    Number(
      value ??
      0,
    );

  const normalized =
    parsed <=
    1
      ? parsed *
        100
      : parsed;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        normalized,
      ),
    ),
  );
}


function titleCase(
  value: string | null,
  fallback =
    "Not specified",
) {
  if (
    !value
  ) {
    return fallback;
  }

  return value
    .replaceAll(
      "_",
      " ",
    )
    .replace(
      /\b\w/g,
      (
        character,
      ) =>
        character.toUpperCase(),
    );
}


function formatDateTime(
  value: string,
) {
  return new Date(
    value,
  ).toLocaleString(
    "en-PH",
    {
      month:
        "short",
      day:
        "numeric",
      year:
        "numeric",
      hour:
        "numeric",
      minute:
        "2-digit",
    },
  );
}


function formatRelativeDate(
  value: string,
) {
  const difference =
    Math.max(
      0,
      Date.now() -
        new Date(
          value,
        ).getTime(),
    );

  const minutes =
    Math.floor(
      difference /
        60_000,
    );

  if (
    minutes <
    1
  ) {
    return "Just now";
  }

  if (
    minutes <
    60
  ) {
    return `${minutes} min ago`;
  }

  const hours =
    Math.floor(
      minutes /
        60,
    );

  if (
    hours <
    24
  ) {
    return `${hours} hr${
      hours ===
      1
        ? ""
        : "s"
    } ago`;
  }

  const days =
    Math.floor(
      hours /
        24,
    );

  if (
    days <
    7
  ) {
    return `${days} day${
      days ===
      1
        ? ""
        : "s"
    } ago`;
  }

  return formatDateTime(
    value,
  );
}


function normalizeSearchTerm(
  value: string,
) {
  return value
    .trim()
    .replace(
      /[%_,()]/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .slice(
      0,
      80,
    );
}


function actionType(
  value: string | null,
): ActionType | null {
  if (
    value ===
      "recycle" ||
    value ===
      "sell" ||
    value ===
      "donate" ||
    value ===
      "reuse"
  ) {
    return value;
  }

  return null;
}


function actionIcon(
  action: ActionType,
) {
  if (
    action ===
    "sell"
  ) {
    return CircleDollarSign;
  }

  if (
    action ===
    "donate"
  ) {
    return Gift;
  }

  if (
    action ===
    "reuse"
  ) {
    return Lightbulb;
  }

  return Recycle;
}


function readPreparationSteps(
  value:
    | string[]
    | string
    | null,
) {
  if (
    Array.isArray(
      value,
    )
  ) {
    return value.filter(
      (
        item,
      ): item is string =>
        typeof item ===
          "string" &&
        item.trim().length >
          0,
    );
  }

  if (
    typeof value ===
    "string"
  ) {
    try {
      const parsed =
        JSON.parse(
          value,
        );

      if (
        Array.isArray(
          parsed,
        )
      ) {
        return parsed.filter(
          (
            item,
          ): item is string =>
            typeof item ===
              "string",
        );
      }
    } catch {
      return [
        value,
      ];
    }
  }

  return [];
}


/* =========================================================
   PAGE
========================================================= */

export default function ResidentScanHistoryPage() {
  return (
    <Suspense
      fallback={
        <HistoryPageSkeleton />
      }
    >
      <ResidentScanHistoryContent />
    </Suspense>
  );
}


function ResidentScanHistoryContent() {
  const router =
    useRouter();

  const supabase =
    useMemo(
      () =>
        createClient(),
      [],
    );


  const [
    profile,
    setProfile,
  ] =
    useState<ResidentProfile | null>(
      null,
    );

  const [
    rows,
    setRows,
  ] =
    useState<ScanHistoryRow[]>(
      [],
    );

  const [
    summary,
    setSummary,
  ] =
    useState<HistorySummary>({
      total:
        0,

      confirmed:
        0,

      review:
        0,

      hazardous:
        0,
    });


  const [
    search,
    setSearch,
  ] =
    useState(
      "",
    );

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] =
    useState(
      "",
    );

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<HistoryFilter>(
      "all",
    );

  const [
    sortOption,
    setSortOption,
  ] =
    useState<SortOption>(
      "newest",
    );


  const [
    currentPage,
    setCurrentPage,
  ] =
    useState(
      1,
    );

  const [
    pageSize,
    setPageSize,
  ] =
    useState(
      DEFAULT_PAGE_SIZE,
    );

  const [
    totalRows,
    setTotalRows,
  ] =
    useState(
      0,
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false,
    );

  const [
    pageError,
    setPageError,
  ] =
    useState<string | null>(
      null,
    );


  const [
    selectedScan,
    setSelectedScan,
  ] =
    useState<ScanHistoryRow | null>(
      null,
    );

  const [
    detailsOpen,
    setDetailsOpen,
  ] =
    useState(
      false,
    );


  useEffect(
    () => {
      const timer =
        window.setTimeout(
          () => {
            setDebouncedSearch(
              normalizeSearchTerm(
                search,
              ),
            );

            setCurrentPage(
              1,
            );
          },
          350,
        );

      return () =>
        window.clearTimeout(
          timer,
        );
    },
    [
      search,
    ],
  );


  const loadProfile =
    useCallback(
      async () => {
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

          return null;
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
              role
            `)
            .eq(
              "auth_id",
              user.id,
            )
            .single();

        if (
          error ||
          !data
        ) {
          throw (
            error ??
            new Error(
              "Resident account was not found.",
            )
          );
        }

        const nextProfile =
          data as ResidentProfile;

        if (
          nextProfile.role !==
          "resident"
        ) {
          throw new Error(
            "This page is available only to resident accounts.",
          );
        }

        setProfile(
          nextProfile,
        );

        return nextProfile;
      },
      [
        router,
        supabase,
      ],
    );


  const loadSummary =
    useCallback(
      async (
        profileId: string,
      ) => {
        const [
          totalResult,
          confirmedResult,
          reviewResult,
          hazardousResult,
        ] =
          await Promise.all([
            supabase
              .from(
                "scans",
              )
              .select(
                "id",
                {
                  count:
                    "exact",

                  head:
                    true,
                },
              )
              .eq(
                "user_id",
                profileId,
              ),

            supabase
              .from(
                "scans",
              )
              .select(
                "id",
                {
                  count:
                    "exact",

                  head:
                    true,
                },
              )
              .eq(
                "user_id",
                profileId,
              )
              .eq(
                "user_confirmed",
                true,
              ),

            supabase
              .from(
                "scans",
              )
              .select(
                "id",
                {
                  count:
                    "exact",

                  head:
                    true,
                },
              )
              .eq(
                "user_id",
                profileId,
              )
              .or(
                "needs_user_confirmation.eq.true,user_confirmed.eq.false",
              ),

            supabase
              .from(
                "scans",
              )
              .select(
                "id",
                {
                  count:
                    "exact",

                  head:
                    true,
                },
              )
              .eq(
                "user_id",
                profileId,
              )
              .eq(
                "hazardous",
                true,
              ),
          ]);

        const firstError =
          totalResult.error ??
          confirmedResult.error ??
          reviewResult.error ??
          hazardousResult.error;

        if (
          firstError
        ) {
          throw firstError;
        }

        setSummary({
          total:
            totalResult.count ??
            0,

          confirmed:
            confirmedResult.count ??
            0,

          review:
            reviewResult.count ??
            0,

          hazardous:
            hazardousResult.count ??
            0,
        });
      },
      [
        supabase,
      ],
    );


  const loadHistory =
    useCallback(
      async ({
        silent =
          false,
        profileOverride,
      }: {
        silent?: boolean;
        profileOverride?: ResidentProfile | null;
      } = {}) => {
        if (
          silent
        ) {
          setRefreshing(
            true,
          );
        } else {
          setLoading(
            true,
          );
        }

        setPageError(
          null,
        );

        try {
          const currentProfile =
            profileOverride ??
            profile ??
            await loadProfile();

          if (
            !currentProfile
          ) {
            return;
          }

          let query =
            supabase
              .from(
                "scans",
              )
              .select(
                `
                  id,
                  user_id,
                  image_url,
                  detected_object,
                  object_description,
                  material_id,
                  material_type,
                  material_category,
                  condition,
                  confidence_score,
                  primary_action,
                  preparation_steps,
                  hazardous,
                  hazard_notes,
                  needs_user_confirmation,
                  user_confirmed,
                  analysis_status,
                  model_name,
                  created_at,
                  updated_at
                `,
                {
                  count:
                    "exact",
                },
              )
              .eq(
                "user_id",
                currentProfile.id,
              );


          if (
            debouncedSearch
          ) {
            query =
              query.or(
                [
                  `detected_object.ilike.%${debouncedSearch}%`,
                  `material_type.ilike.%${debouncedSearch}%`,
                  `material_category.ilike.%${debouncedSearch}%`,
                  `condition.ilike.%${debouncedSearch}%`,
                ].join(
                  ",",
                ),
              );
          }


          if (
            activeFilter ===
            "confirmed"
          ) {
            query =
              query.eq(
                "user_confirmed",
                true,
              );
          }


          if (
            activeFilter ===
            "review"
          ) {
            query =
              query.or(
                "needs_user_confirmation.eq.true,user_confirmed.eq.false",
              );
          }


          if (
            activeFilter ===
            "hazardous"
          ) {
            query =
              query.eq(
                "hazardous",
                true,
              );
          }


          if (
            sortOption ===
            "newest"
          ) {
            query =
              query.order(
                "created_at",
                {
                  ascending:
                    false,
                },
              );
          }


          if (
            sortOption ===
            "oldest"
          ) {
            query =
              query.order(
                "created_at",
                {
                  ascending:
                    true,
                },
              );
          }


          if (
            sortOption ===
            "confidence_high"
          ) {
            query =
              query
                .order(
                  "confidence_score",
                  {
                    ascending:
                      false,

                    nullsFirst:
                      false,
                  },
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  },
                );
          }


          if (
            sortOption ===
            "confidence_low"
          ) {
            query =
              query
                .order(
                  "confidence_score",
                  {
                    ascending:
                      true,

                    nullsFirst:
                      false,
                  },
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  },
                );
          }


          const from =
            (
              currentPage -
              1
            ) *
            pageSize;

          const to =
            from +
            pageSize -
            1;


          const {
            data,
            error,
            count,
          } =
            await query.range(
              from,
              to,
            );


          if (
            error
          ) {
            throw error;
          }


          const nextTotal =
            count ??
            0;

          const totalPages =
            Math.max(
              1,
              Math.ceil(
                nextTotal /
                  pageSize,
              ),
            );


          if (
            currentPage >
            totalPages
          ) {
            setCurrentPage(
              totalPages,
            );

            return;
          }


          setRows(
            (
              data ??
              []
            ) as ScanHistoryRow[],
          );

          setTotalRows(
            nextTotal,
          );


          await loadSummary(
            currentProfile.id,
          );
        } catch (
          error
        ) {
          setPageError(
            getErrorMessage(
              error,
              "The scan history could not be loaded.",
            ),
          );
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [
        activeFilter,
        currentPage,
        debouncedSearch,
        loadProfile,
        loadSummary,
        pageSize,
        profile,
        sortOption,
        supabase,
      ],
    );


  useEffect(
    () => {
      void loadHistory();
    },
    [
      loadHistory,
    ],
  );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalRows /
          pageSize,
      ),
    );

  const firstVisible =
    totalRows ===
    0
      ? 0
      : (
          currentPage -
          1
        ) *
          pageSize +
        1;

  const lastVisible =
    Math.min(
      currentPage *
        pageSize,
      totalRows,
    );


  const openDetails =
    (
      scan: ScanHistoryRow,
    ) => {
      setSelectedScan(
        scan,
      );

      setDetailsOpen(
        true,
      );
    };


  const openAction =
    (
      scan: ScanHistoryRow,
      action: ActionType,
    ) => {
      if (
        !scan.material_id ||
        !scan.user_confirmed
      ) {
        return;
      }

      router.push(
        `${RESIDENT_BASE_PATH}/actions/${action}?scan=${encodeURIComponent(
          scan.id,
        )}&material=${encodeURIComponent(
          scan.material_id,
        )}`,
      );
    };


  const clearFilters =
    () => {
      setSearch(
        "",
      );

      setDebouncedSearch(
        "",
      );

      setActiveFilter(
        "all",
      );

      setSortOption(
        "newest",
      );

      setCurrentPage(
        1,
      );
    };


  const hasFilters =
    Boolean(
      search.trim(),
    ) ||
    activeFilter !==
      "all" ||
    sortOption !==
      "newest";


  if (
    loading
  ) {
    return (
      <HistoryPageSkeleton />
    );
  }


  if (
    pageError
  ) {
    return (
      <HistoryErrorState
        message={
          pageError
        }
        onRetry={() =>
          void loadHistory({
            profileOverride:
              profile,
          })
        }
      />
    );
  }


  return (
    <>
      <div className="space-y-7">
        {/* HEADER */}

        <section>
          <button
            type="button"
            onClick={() =>
              router.push(
                RESIDENT_BASE_PATH,
              )
            }
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-green-700"
          >
            <ArrowLeft className="h-4 w-4" />

            Resident dashboard
          </button>


          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold text-green-600">
                Your scanned material records
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
                Scan History
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Search, review, and reopen your previous scans. Confirmed
                materials can be sent directly to Recycle, Sell, Donate, or
                Reuse pages.
              </p>
            </div>


            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={
                  refreshing
                }
                onClick={() =>
                  void loadHistory({
                    silent:
                      true,
                  })
                }
                className="rounded-full border-green-200 bg-white text-green-700 hover:bg-green-50"
              >
                <RefreshCcw
                  className={`mr-2 h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Refresh
              </Button>


              <Button
                type="button"
                onClick={() =>
                  router.push(
                    `${RESIDENT_BASE_PATH}/scan`,
                  )
                }
                className="rounded-full bg-green-600 hover:bg-green-700"
              >
                <ScanLine className="mr-2 h-4 w-4" />

                Scan an item
              </Button>
            </div>
          </div>
        </section>


        {/* SUMMARY */}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={
              History
            }
            label="Total scans"
            value={
              summary.total
            }
            description="All saved scan records"
          />

          <SummaryCard
            icon={
              BadgeCheck
            }
            label="Confirmed"
            value={
              summary.confirmed
            }
            description="Ready for recovery actions"
          />

          <SummaryCard
            icon={
              Clock3
            }
            label="Needs review"
            value={
              summary.review
            }
            description="Unconfirmed or uncertain"
          />

          <SummaryCard
            icon={
              ShieldAlert
            }
            label="Hazardous"
            value={
              summary.hazardous
            }
            description="Special handling required"
          />
        </section>


        {/* SEARCH AND FILTERS */}

        <section className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_210px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

              <Input
                value={
                  search
                }
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search object, material, category, or condition"
                className="h-12 rounded-xl border-zinc-300 bg-white pl-11 pr-11 focus-visible:ring-green-500"
              />

              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() =>
                    setSearch(
                      "",
                    )
                  }
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>


            <select
              value={
                sortOption
              }
              onChange={(
                event,
              ) => {
                setSortOption(
                  event.target
                    .value as SortOption,
                );

                setCurrentPage(
                  1,
                );
              }}
              className="h-12 rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            >
              <option value="newest">
                Newest first
              </option>

              <option value="oldest">
                Oldest first
              </option>

              <option value="confidence_high">
                Highest confidence
              </option>

              <option value="confidence_low">
                Lowest confidence
              </option>
            </select>


            {hasFilters ? (
              <Button
                type="button"
                variant="outline"
                onClick={
                  clearFilters
                }
                className="h-12 rounded-xl border-zinc-300"
              >
                <X className="mr-2 h-4 w-4" />

                Clear
              </Button>
            ) : (
              <div className="hidden xl:block" />
            )}
          </div>


          <div className="mt-4 flex flex-wrap gap-2">
            <FilterButton
              active={
                activeFilter ===
                "all"
              }
              label="All"
              count={
                summary.total
              }
              onClick={() => {
                setActiveFilter(
                  "all",
                );

                setCurrentPage(
                  1,
                );
              }}
            />

            <FilterButton
              active={
                activeFilter ===
                "confirmed"
              }
              label="Confirmed"
              count={
                summary.confirmed
              }
              onClick={() => {
                setActiveFilter(
                  "confirmed",
                );

                setCurrentPage(
                  1,
                );
              }}
            />

            <FilterButton
              active={
                activeFilter ===
                "review"
              }
              label="Needs review"
              count={
                summary.review
              }
              onClick={() => {
                setActiveFilter(
                  "review",
                );

                setCurrentPage(
                  1,
                );
              }}
            />

            <FilterButton
              active={
                activeFilter ===
                "hazardous"
              }
              label="Hazardous"
              count={
                summary.hazardous
              }
              onClick={() => {
                setActiveFilter(
                  "hazardous",
                );

                setCurrentPage(
                  1,
                );
              }}
            />
          </div>
        </section>


        {/* TABLE */}

        <section className="overflow-hidden rounded-[28px] border border-green-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-green-100 p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <h2 className="text-xl font-black text-zinc-900">
                Scan records
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Showing{" "}
                {
                  firstVisible
                }
                –
                {
                  lastVisible
                }{" "}
                of{" "}
                {
                  totalRows
                }{" "}
                results
              </p>
            </div>


            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">
                Rows
              </span>

              <select
                value={
                  pageSize
                }
                onChange={(
                  event,
                ) => {
                  setPageSize(
                    Number(
                      event.target
                        .value,
                    ),
                  );

                  setCurrentPage(
                    1,
                  );
                }}
                className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              >
                {PAGE_SIZE_OPTIONS.map(
                  (
                    size,
                  ) => (
                    <option
                      key={
                        size
                      }
                      value={
                        size
                      }
                    >
                      {
                        size
                      }
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>


          {rows.length ===
          0 ? (
            <EmptyHistoryState
              hasFilters={
                hasFilters
              }
              onClear={
                clearFilters
              }
              onScan={() =>
                router.push(
                  `${RESIDENT_BASE_PATH}/scan`,
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                    <TableHeader>
                      Item
                    </TableHeader>

                    <TableHeader>
                      Material
                    </TableHeader>

                    <TableHeader>
                      Confidence
                    </TableHeader>

                    <TableHeader>
                      Recommendation
                    </TableHeader>

                    <TableHeader>
                      Status
                    </TableHeader>

                    <TableHeader>
                      Scanned
                    </TableHeader>

                    <TableHeader align="right">
                      Action
                    </TableHeader>
                  </tr>
                </thead>


                <tbody>
                  {rows.map(
                    (
                      scan,
                    ) => (
                      <HistoryTableRow
                        key={
                          scan.id
                        }
                        scan={
                          scan
                        }
                        onView={() =>
                          openDetails(
                            scan,
                          )
                        }
                      />
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}


          {/* PAGINATION */}

          <div className="flex flex-col justify-between gap-4 border-t border-zinc-200 p-5 sm:flex-row sm:items-center sm:p-6">
            <p className="text-sm text-zinc-500">
              Page{" "}
              <strong className="text-zinc-800">
                {
                  currentPage
                }
              </strong>{" "}
              of{" "}
              <strong className="text-zinc-800">
                {
                  totalPages
                }
              </strong>
            </p>


            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={
                  currentPage <=
                  1
                }
                onClick={() =>
                  setCurrentPage(
                    (
                      page,
                    ) =>
                      Math.max(
                        1,
                        page -
                          1,
                      ),
                  )
                }
                className="rounded-full border-zinc-300"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />

                Previous
              </Button>


              <PaginationNumbers
                currentPage={
                  currentPage
                }
                totalPages={
                  totalPages
                }
                onPageChange={
                  setCurrentPage
                }
              />


              <Button
                type="button"
                variant="outline"
                disabled={
                  currentPage >=
                  totalPages
                }
                onClick={() =>
                  setCurrentPage(
                    (
                      page,
                    ) =>
                      Math.min(
                        totalPages,
                        page +
                          1,
                      ),
                  )
                }
                className="rounded-full border-zinc-300"
              >
                Next

                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>


      {/* DETAILS DIALOG */}

      <Dialog
        open={
          detailsOpen
        }
        onOpenChange={
          setDetailsOpen
        }
      >
        <DialogContent className="max-h-[94dvh] !w-[calc(100vw-1rem)] !max-w-none overflow-hidden rounded-[26px] border border-green-200 !bg-white p-0 text-zinc-900 shadow-[0_28px_100px_rgba(0,0,0,0.35)] sm:!w-[92vw] lg:!w-[760px]">
          <DialogHeader className="sr-only">
            <DialogTitle>
              Scan details
            </DialogTitle>

            <DialogDescription>
              Review the saved scan and open a recovery action.
            </DialogDescription>
          </DialogHeader>


          {selectedScan && (
            <ScanDetailsDialog
              scan={
                selectedScan
              }
              onClose={() =>
                setDetailsOpen(
                  false,
                )
              }
              onOpenAction={
                openAction
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}


/* =========================================================
   COMPONENTS
========================================================= */

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon:
    ComponentType<{
      className?: string;
    }>;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-green-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-black text-zinc-900">
            {value}
          </p>

          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}


function FilterButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
        active
          ? "border-green-600 bg-green-600 text-white"
          : "border-zinc-200 bg-white text-zinc-600 hover:border-green-300 hover:bg-green-50 hover:text-green-700"
      }`}
    >
      {label}

      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          active
            ? "bg-white/20 text-white"
            : "bg-zinc-100 text-zinc-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}


function TableHeader({
  children,
  align =
    "left",
}: {
  children: ReactNode;
  align?:
    | "left"
    | "right";
}) {
  return (
    <th
      className={`px-5 py-4 text-xs font-black uppercase tracking-[0.1em] text-zinc-500 ${
        align ===
        "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
}


function HistoryTableRow({
  scan,
  onView,
}: {
  scan: ScanHistoryRow;
  onView: () => void;
}) {
  const confidence =
    confidencePercent(
      scan.confidence_score,
    );

  const primaryAction =
    actionType(
      scan.primary_action,
    );

  const ActionIcon =
    primaryAction
      ? actionIcon(
          primaryAction,
        )
      : Sparkles;


  return (
    <tr className="border-b border-zinc-100 transition hover:bg-green-50/50">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <ScanThumbnail
            src={
              scan.image_url
            }
            alt={
              scan.detected_object
            }
          />

          <div className="min-w-0">
            <p className="max-w-[220px] truncate font-black text-zinc-900">
              {
                scan.detected_object
              }
            </p>

            <p className="mt-1 max-w-[220px] truncate text-xs text-zinc-500">
              {
                scan.object_description ||
                "No description"
              }
            </p>
          </div>
        </div>
      </td>


      <td className="px-5 py-4">
        <p className="font-semibold text-zinc-800">
          {
            scan.material_type
          }
        </p>

        <p className="mt-1 text-xs text-zinc-500">
          {
            scan.material_category ||
            "Other"
          }
        </p>
      </td>


      <td className="px-5 py-4">
        <ConfidenceBadge
          value={
            confidence
          }
        />
      </td>


      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <ActionIcon className="h-4 w-4 text-green-600" />

          <span className="text-sm font-semibold text-zinc-700">
            {titleCase(
              scan.primary_action,
              "Review",
            )}
          </span>
        </div>
      </td>


      <td className="px-5 py-4">
        <ScanStatusBadge
          scan={
            scan
          }
        />
      </td>


      <td className="px-5 py-4">
        <p className="text-sm font-semibold text-zinc-700">
          {formatRelativeDate(
            scan.created_at,
          )}
        </p>

        <p className="mt-1 text-xs text-zinc-400">
          {formatDateTime(
            scan.created_at,
          )}
        </p>
      </td>


      <td className="px-5 py-4 text-right">
        <Button
          type="button"
          variant="outline"
          onClick={
            onView
          }
          className="rounded-full border-green-200 text-green-700 hover:bg-green-50"
        >
          <Eye className="mr-2 h-4 w-4" />

          View
        </Button>
      </td>
    </tr>
  );
}


function ScanThumbnail({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  const [
    failed,
    setFailed,
  ] =
    useState(
      false,
    );

  useEffect(
    () => {
      setFailed(
        false,
      );
    },
    [
      src,
    ],
  );


  if (
    !src ||
    failed
  ) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }


  return (
    <img
      src={
        src
      }
      alt={
        alt
      }
      onError={() =>
        setFailed(
          true,
        )
      }
      className="h-14 w-14 shrink-0 rounded-2xl object-cover"
    />
  );
}


function ConfidenceBadge({
  value,
}: {
  value: number;
}) {
  const classes =
    value >=
    80
      ? "border-green-200 bg-green-50 text-green-700"
      : value >=
          60
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-red-200 bg-red-50 text-red-700";

  return (
    <Badge
      className={classes}
    >
      {value}
      %
    </Badge>
  );
}


function ScanStatusBadge({
  scan,
}: {
  scan: ScanHistoryRow;
}) {
  if (
    scan.hazardous
  ) {
    return (
      <Badge className="border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
        <ShieldAlert className="mr-1 h-3.5 w-3.5" />

        Hazardous
      </Badge>
    );
  }


  if (
    scan.user_confirmed
  ) {
    return (
      <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
        <BadgeCheck className="mr-1 h-3.5 w-3.5" />

        Confirmed
      </Badge>
    );
  }


  return (
    <Badge className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
      <Clock3 className="mr-1 h-3.5 w-3.5" />

      Needs review
    </Badge>
  );
}


function PaginationNumbers({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (
    page: number,
  ) => void;
}) {
  const pages =
    Array.from(
      {
        length:
          totalPages,
      },
      (
        _,
        index,
      ) =>
        index +
        1,
    ).filter(
      (
        page,
      ) =>
        page ===
          1 ||
        page ===
          totalPages ||
        Math.abs(
          page -
            currentPage,
        ) <=
          1,
    );


  const items:
    Array<
      | number
      | "ellipsis"
    > = [];


  pages.forEach(
    (
      page,
      index,
    ) => {
      const previous =
        pages[
          index -
            1
        ];

      if (
        previous &&
        page -
          previous >
          1
      ) {
        items.push(
          "ellipsis",
        );
      }

      items.push(
        page,
      );
    },
  );


  return (
    <div className="hidden items-center gap-1 md:flex">
      {items.map(
        (
          item,
          index,
        ) =>
          item ===
          "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-zinc-400"
            >
              …
            </span>
          ) : (
            <button
              key={
                item
              }
              type="button"
              onClick={() =>
                onPageChange(
                  item,
                )
              }
              className={`flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-bold transition ${
                item ===
                currentPage
                  ? "bg-green-600 text-white"
                  : "text-zinc-600 hover:bg-green-50 hover:text-green-700"
              }`}
            >
              {item}
            </button>
          ),
      )}
    </div>
  );
}


function ScanDetailsDialog({
  scan,
  onClose,
  onOpenAction,
}: {
  scan: ScanHistoryRow;
  onClose: () => void;
  onOpenAction: (
    scan: ScanHistoryRow,
    action: ActionType,
  ) => void;
}) {
  const preparationSteps =
    readPreparationSteps(
      scan.preparation_steps,
    );

  const confirmed =
    scan.user_confirmed &&
    Boolean(
      scan.material_id,
    );

  const availableActions: ActionType[] = [
    "recycle",
    "sell",
    "donate",
    "reuse",
  ];


  return (
    <div className="grid max-h-[94dvh] grid-rows-[auto_minmax(0,1fr)_auto] bg-white">
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-700 p-5 text-white sm:p-7">
        <div className="flex items-start gap-4 pr-8">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
            <Package className="h-6 w-6" />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-green-100">
              Saved scan
            </p>

            <h2 className="mt-1 text-2xl font-black">
              {
                scan.detected_object
              }
            </h2>

            <p className="mt-1 text-sm text-green-50">
              {
                scan.material_type
              }{" "}
              ·{" "}
              {formatDateTime(
                scan.created_at,
              )}
            </p>
          </div>
        </div>
      </div>


      <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
        <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <div className="overflow-hidden rounded-2xl border border-green-100 bg-green-50">
              {scan.image_url ? (
                <img
                  src={
                    scan.image_url
                  }
                  alt={
                    scan.detected_object
                  }
                  className="h-56 w-full object-cover"
                />
              ) : (
                <div className="flex h-56 items-center justify-center">
                  <ImageOff className="h-10 w-10 text-green-600" />
                </div>
              )}
            </div>


            <div className="mt-3 flex flex-wrap gap-2">
              <ConfidenceBadge
                value={confidencePercent(
                  scan.confidence_score,
                )}
              />

              <ScanStatusBadge
                scan={
                  scan
                }
              />
            </div>
          </div>


          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailBox
                label="Material"
                value={
                  scan.material_type
                }
              />

              <DetailBox
                label="Category"
                value={
                  scan.material_category ||
                  "Other"
                }
              />

              <DetailBox
                label="Condition"
                value={titleCase(
                  scan.condition,
                )}
              />

              <DetailBox
                label="Recommendation"
                value={titleCase(
                  scan.primary_action,
                  "Review",
                )}
              />
            </div>


            {scan.object_description && (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-zinc-400">
                  Item description
                </p>

                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {
                    scan.object_description
                  }
                </p>
              </div>
            )}


            {scan.hazardous && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                  <div>
                    <p className="font-black text-red-800">
                      Special handling required
                    </p>

                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {scan.hazard_notes ||
                        "Do not open, puncture, burn, or dismantle this item."}
                    </p>
                  </div>
                </div>
              </div>
            )}


            {preparationSteps.length >
              0 && (
              <div>
                <p className="font-black text-zinc-900">
                  Preparation steps
                </p>

                <div className="mt-3 space-y-2">
                  {preparationSteps.map(
                    (
                      step,
                      index,
                    ) => (
                      <div
                        key={`${step}-${index}`}
                        className="flex gap-3 rounded-2xl bg-green-50 p-3"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-black text-white">
                          {index +
                            1}
                        </div>

                        <p className="pt-1 text-sm leading-5 text-zinc-600">
                          {
                            step
                          }
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}


            <div>
              <p className="font-black text-zinc-900">
                Recovery actions
              </p>

              <p className="mt-1 text-sm leading-6 text-zinc-500">
                {confirmed
                  ? "Open an action page using this confirmed material."
                  : "Confirm this material from the scanner before opening recovery actions."}
              </p>


              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {availableActions.map(
                  (
                    action,
                  ) => {
                    const Icon =
                      actionIcon(
                        action,
                      );

                    const disabled =
                      !confirmed ||
                      (
                        action ===
                          "reuse" &&
                        scan.hazardous
                      );

                    return (
                      <Button
                        key={
                          action
                        }
                        type="button"
                        variant="outline"
                        disabled={
                          disabled
                        }
                        onClick={() =>
                          onOpenAction(
                            scan,
                            action,
                          )
                        }
                        className="justify-between rounded-xl border-green-200 text-green-700 hover:bg-green-50"
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />

                          {titleCase(
                            action,
                          )}
                        </span>

                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="flex justify-end border-t border-zinc-200 bg-white p-4 sm:px-7">
        <Button
          type="button"
          variant="outline"
          onClick={
            onClose
          }
          className="rounded-full"
        >
          Close
        </Button>
      </div>
    </div>
  );
}


function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.1em] text-zinc-400">
        {label}
      </p>

      <p className="mt-2 font-black text-zinc-800">
        {value}
      </p>
    </div>
  );
}


function EmptyHistoryState({
  hasFilters,
  onClear,
  onScan,
}: {
  hasFilters: boolean;
  onClear: () => void;
  onScan: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
        <ScanLine className="h-7 w-7" />
      </div>

      <h3 className="mt-5 text-lg font-black text-zinc-900">
        {hasFilters
          ? "No matching scans"
          : "No scan history yet"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
        {hasFilters
          ? "Try clearing or changing your search and filters."
          : "Your completed and saved scans will appear in this table."}
      </p>

      <Button
        type="button"
        onClick={
          hasFilters
            ? onClear
            : onScan
        }
        className="mt-5 rounded-full bg-green-600 hover:bg-green-700"
      >
        {hasFilters ? (
          <>
            <X className="mr-2 h-4 w-4" />

            Clear filters
          </>
        ) : (
          <>
            <ScanLine className="mr-2 h-4 w-4" />

            Scan an item
          </>
        )}
      </Button>
    </div>
  );
}


function HistoryErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-xl items-center justify-center">
      <div className="w-full rounded-[28px] border border-red-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertCircle className="h-8 w-8" />
        </div>

        <h1 className="mt-5 text-xl font-black text-zinc-900">
          Scan history unavailable
        </h1>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {message}
        </p>

        <Button
          type="button"
          onClick={
            onRetry
          }
          className="mt-6 rounded-full bg-green-600 hover:bg-green-700"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />

          Try again
        </Button>
      </div>
    </div>
  );
}


function HistoryPageSkeleton() {
  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <Skeleton className="h-4 w-48 bg-green-100" />

        <Skeleton className="h-9 w-72 max-w-full bg-green-100" />

        <Skeleton className="h-4 w-[520px] max-w-full bg-green-100" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              className="h-32 rounded-[24px] bg-green-100"
            />
          ),
        )}
      </div>

      <Skeleton className="h-40 rounded-[28px] bg-green-100" />

      <Skeleton className="h-[620px] rounded-[28px] bg-green-100" />
    </div>
  );
}
