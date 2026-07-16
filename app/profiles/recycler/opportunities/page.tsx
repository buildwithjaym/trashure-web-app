"use client";

import type {
  ComponentType,
  FormEvent,
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
  BadgeCheck,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Handshake,
  History,
  Inbox,
  Info,
  Loader2,
  MapPin,
  MessageSquare,
  Package,
  PackageCheck,
  RefreshCcw,
  Scale,
  Search,
  Send,
  Store,
  Truck,
  Undo2,
  WalletCards,
  X,
} from "lucide-react";

import { toast } from "sonner";

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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";


type OpportunityTab =
  | "available"
  | "interested"
  | "accepted"
  | "completed";


type OpportunityStatus =
  | "open"
  | "accepted"
  | "completed";


type OpportunityBucket =
  | "available"
  | "interested"
  | "accepted"
  | "completed";


type ResponseStatus =
  | "interested"
  | "accepted"
  | "declined"
  | "withdrawn";


type FulfillmentMethod =
  | "drop_off"
  | "pickup"
  | "either";


type MatchFilter =
  | "all"
  | "exact"
  | "category"
  | "unconfigured";


type SortOption =
  | "recommended"
  | "newest"
  | "highest_value"
  | "heaviest";


interface DashboardJunkshop {
  id: string;
  junkshop_name: string;
  barangay: string | null;
  city: string | null;
  province: string | null;
  verification_status: string;
  is_active: boolean;
}


interface DashboardStats {
  available: number;
  interested: number;
  accepted: number;
  completed: number;
}


interface OpportunityResponse {
  id: string;
  offered_price_per_kg: number | string;
  pickup_available: boolean;
  message: string | null;
  status: ResponseStatus;
  created_at: string;
  updated_at: string;
}


interface Opportunity {
  id: string;
  resident_profile_id: string;
  material_id: string;
  scan_id: string | null;
  material_name: string;
  category: string;
  image_url: string | null;
  estimated_weight_kg: number | string;
  material_condition: string | null;
  fulfillment_method: FulfillmentMethod;
  barangay: string;
  city: string;
  province: string | null;
  status: OpportunityStatus;
  selected_junkshop_id: string | null;
  created_at: string;
  updated_at: string;
  listed_price_per_kg: number | string;
  minimum_weight_kg: number | string;
  accepted_condition: string | null;
  preparation_instructions: string | null;
  exact_material_match: boolean;
  same_category_match: boolean;
  match_type:
    | "exact"
    | "category"
    | "unconfigured";
  material_match_score: number;
  can_respond: boolean;
  location_score: number;
  match_label: string;
  estimated_listed_value: number | string;
  bucket: OpportunityBucket;
  response: OpportunityResponse | null;
}


interface DashboardPayload {
  ready: boolean;
  reason:
    | "missing_junkshop"
    | "junkshop_unavailable"
    | "missing_materials"
    | null;
  junkshop: DashboardJunkshop | null;
  accepted_material_count: number;
  stats: DashboardStats;
  opportunities: Opportunity[];
}


interface ResponseForm {
  offered_price_per_kg: string;
  pickup_available: boolean;
  message: string;
}


type FulfillmentFilter =
  | "all"
  | FulfillmentMethod;


const emptyResponseForm: ResponseForm = {
  offered_price_per_kg: "",
  pickup_available: false,
  message: "",
};


const pesoFormatter =
  new Intl.NumberFormat(
    "en-PH",
    {
      style:
        "currency",

      currency:
        "PHP",

      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    },
  );


function formatPeso(
  value: number,
) {
  return pesoFormatter.format(
    Number.isFinite(
      value,
    )
      ? value
      : 0,
  );
}


function numberValue(
  value:
    | number
    | string
    | null
    | undefined,
) {
  const parsed =
    Number(
      value ??
      0,
    );

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : 0;
}


function formatRelativeDate(
  value: string,
) {
  const createdAt =
    new Date(
      value,
    ).getTime();

  const difference =
    Math.max(
      0,
      Date.now() -
        createdAt,
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

  return new Date(
    value,
  ).toLocaleDateString(
    "en-PH",
    {
      month:
        "short",

      day:
        "numeric",

      year:
        "numeric",
    },
  );
}


function getFulfillmentLabel(
  method: FulfillmentMethod,
) {
  if (
    method ===
    "pickup"
  ) {
    return "Pickup required";
  }

  if (
    method ===
    "either"
  ) {
    return "Pickup or drop-off";
  }

  return "Resident drop-off";
}


function getMaterialMatchLabel(
  opportunity: Opportunity,
) {
  if (
    opportunity.match_type ===
    "exact"
  ) {
    return "Accepted material";
  }

  if (
    opportunity.match_type ===
    "category"
  ) {
    return "Same category";
  }

  return "Not configured";
}


function getLocationText(
  opportunity: Opportunity,
) {
  return [
    opportunity.barangay,
    opportunity.city,
    opportunity.province,
  ]
    .filter(Boolean)
    .join(", ");
}


function getOpportunityPrice(
  opportunity: Opportunity,
) {
  if (
    opportunity.response
  ) {
    return numberValue(
      opportunity.response
        .offered_price_per_kg,
    );
  }

  return numberValue(
    opportunity.listed_price_per_kg,
  );
}


function getEstimatedValue(
  opportunity: Opportunity,
) {
  return (
    numberValue(
      opportunity.estimated_weight_kg,
    ) *
    getOpportunityPrice(
      opportunity,
    )
  );
}


function readDashboardPayload(
  value: unknown,
): DashboardPayload {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    throw new Error(
      "The opportunities dashboard returned an invalid response.",
    );
  }

  return value as DashboardPayload;
}


export default function RecyclerOpportunitiesPage() {
  return (
    <Suspense
      fallback={
        <OpportunitiesPageSkeleton />
      }
    >
      <RecyclerOpportunitiesContent />
    </Suspense>
  );
}


function RecyclerOpportunitiesContent() {
  const router =
    useRouter();

  const supabase =
    useMemo(
      () =>
        createClient(),
      [],
    );


  const [
    dashboard,
    setDashboard,
  ] =
    useState<DashboardPayload | null>(
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
    activeTab,
    setActiveTab,
  ] =
    useState<OpportunityTab>(
      "available",
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      "",
    );

  const [
    categoryFilter,
    setCategoryFilter,
  ] =
    useState(
      "all",
    );

  const [
    fulfillmentFilter,
    setFulfillmentFilter,
  ] =
    useState<FulfillmentFilter>(
      "all",
    );

  const [
    matchFilter,
    setMatchFilter,
  ] =
    useState<MatchFilter>(
      "all",
    );

  const [
    sortOption,
    setSortOption,
  ] =
    useState<SortOption>(
      "recommended",
    );


  const [
    selectedOpportunity,
    setSelectedOpportunity,
  ] =
    useState<Opportunity | null>(
      null,
    );

  const [
    opportunityDialogOpen,
    setOpportunityDialogOpen,
  ] =
    useState(
      false,
    );

  const [
    responseForm,
    setResponseForm,
  ] =
    useState<ResponseForm>(
      emptyResponseForm,
    );

  const [
    savingResponse,
    setSavingResponse,
  ] =
    useState(
      false,
    );

  const [
    withdrawingOpportunityId,
    setWithdrawingOpportunityId,
  ] =
    useState<string | null>(
      null,
    );


  const loadPageData =
    useCallback(
      async (
        silent =
          false,
      ) => {
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
            await supabase.rpc(
              "get_recycler_opportunity_dashboard",
            );

          if (
            error
          ) {
            throw error;
          }

          setDashboard(
            readDashboardPayload(
              data,
            ),
          );
        } catch (
          error
        ) {
          const message =
            error instanceof
            Error
              ? error.message
              : "Unable to load recycler opportunities.";

          setPageError(
            message,
          );

          if (
            silent
          ) {
            toast.error(
              message,
            );
          }
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
        router,
        supabase,
      ],
    );


  useEffect(
    () => {
      void loadPageData();
    },
    [
      loadPageData,
    ],
  );


  const opportunities =
    dashboard?.opportunities ??
    [];

  const stats =
    dashboard?.stats ?? {
      available:
        0,

      interested:
        0,

      accepted:
        0,

      completed:
        0,
    };


  const categories =
    useMemo<string[]>(
      () =>
        Array.from(
          new Set(
            opportunities.map(
              (
                opportunity,
              ) =>
                opportunity.category,
            ),
          ),
        ).sort(
          (
            first,
            second,
          ) =>
            first.localeCompare(
              second,
            ),
        ),
      [
        opportunities,
      ],
    );


  const filteredItems =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        const items =
          opportunities.filter(
            (
              opportunity,
            ) => {
              if (
                opportunity.bucket !==
                activeTab
              ) {
                return false;
              }

              const matchesSearch =
                !normalizedSearch ||
                opportunity.material_name
                  .toLowerCase()
                  .includes(
                    normalizedSearch,
                  ) ||
                opportunity.category
                  .toLowerCase()
                  .includes(
                    normalizedSearch,
                  ) ||
                opportunity.barangay
                  .toLowerCase()
                  .includes(
                    normalizedSearch,
                  ) ||
                opportunity.city
                  .toLowerCase()
                  .includes(
                    normalizedSearch,
                  );

              const matchesCategory =
                categoryFilter ===
                  "all" ||
                opportunity.category ===
                  categoryFilter;

              const matchesFulfillment =
                fulfillmentFilter ===
                  "all" ||
                opportunity.fulfillment_method ===
                  fulfillmentFilter;

              const matchesMaterial =
                matchFilter ===
                  "all" ||
                opportunity.match_type ===
                  matchFilter;

              return (
                matchesSearch &&
                matchesCategory &&
                matchesFulfillment &&
                matchesMaterial
              );
            },
          );

        return [
          ...items,
        ].sort(
          (
            first,
            second,
          ) => {
            if (
              sortOption ===
              "newest"
            ) {
              return (
                new Date(
                  second.created_at,
                ).getTime() -
                new Date(
                  first.created_at,
                ).getTime()
              );
            }

            if (
              sortOption ===
              "highest_value"
            ) {
              return (
                getEstimatedValue(
                  second,
                ) -
                getEstimatedValue(
                  first,
                )
              );
            }

            if (
              sortOption ===
              "heaviest"
            ) {
              return (
                numberValue(
                  second.estimated_weight_kg,
                ) -
                numberValue(
                  first.estimated_weight_kg,
                )
              );
            }

            return (
              second.material_match_score -
                first.material_match_score ||
              second.location_score -
                first.location_score ||
              getEstimatedValue(
                second,
              ) -
                getEstimatedValue(
                  first,
                ) ||
              new Date(
                second.created_at,
              ).getTime() -
                new Date(
                  first.created_at,
                ).getTime()
            );
          },
        );
      },
      [
        activeTab,
        categoryFilter,
        fulfillmentFilter,
        matchFilter,
        opportunities,
        search,
        sortOption,
      ],
    );


  const clearFilters =
    () => {
      setSearch(
        "",
      );

      setCategoryFilter(
        "all",
      );

      setFulfillmentFilter(
        "all",
      );

      setMatchFilter(
        "all",
      );

      setSortOption(
        "recommended",
      );
    };


  const hasFilters =
    Boolean(
      search.trim(),
    ) ||
    categoryFilter !==
      "all" ||
    fulfillmentFilter !==
      "all" ||
    matchFilter !==
      "all" ||
    sortOption !==
      "recommended";


  const openOpportunityDialog =
    (
      opportunity: Opportunity,
    ) => {
      const pickupRequired =
        opportunity.fulfillment_method ===
        "pickup";

      setSelectedOpportunity(
        opportunity,
      );

      setResponseForm({
        offered_price_per_kg:
          opportunity.response
            ? String(
                numberValue(
                  opportunity.response
                    .offered_price_per_kg,
                ),
              )
            : numberValue(
                opportunity.listed_price_per_kg,
              ) > 0
              ? String(
                  numberValue(
                    opportunity.listed_price_per_kg,
                  ),
                )
              : "",

        pickup_available:
          pickupRequired ||
          opportunity.response
            ?.pickup_available ||
          false,

        message:
          opportunity.response
            ?.message ??
          "",
      });

      setOpportunityDialogOpen(
        true,
      );
    };


  const closeOpportunityDialog =
    (
      open: boolean,
    ) => {
      if (
        savingResponse
      ) {
        return;
      }

      setOpportunityDialogOpen(
        open,
      );

      if (
        !open
      ) {
        setSelectedOpportunity(
          null,
        );

        setResponseForm(
          emptyResponseForm,
        );
      }
    };


  const submitInterest =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (
        !selectedOpportunity ||
        savingResponse
      ) {
        return;
      }

      if (
        !selectedOpportunity.can_respond
      ) {
        toast.error(
          "Add this exact material to your junkshop before making an offer.",
        );

        return;
      }

      const offer =
        Number(
          responseForm
            .offered_price_per_kg,
        );

      if (
        !Number.isFinite(
          offer,
        ) ||
        offer <=
          0
      ) {
        toast.error(
          "Enter an offer greater than zero.",
        );

        return;
      }

      if (
        selectedOpportunity
          .fulfillment_method ===
          "pickup" &&
        !responseForm
          .pickup_available
      ) {
        toast.error(
          "This resident requires pickup.",
        );

        return;
      }

      setSavingResponse(
        true,
      );

      try {
        const {
          error,
        } =
          await supabase.rpc(
            "upsert_recycler_opportunity_response",
            {
              p_opportunity_id:
                selectedOpportunity.id,

              p_offered_price_per_kg:
                offer,

              p_pickup_available:
                responseForm
                  .pickup_available,

              p_message:
                responseForm.message
                  .trim() ||
                null,
            },
          );

        if (
          error
        ) {
          throw error;
        }

        toast.success(
          selectedOpportunity
            .response
            ? "Your offer was updated."
            : "Your offer was sent to the resident.",
        );

        setOpportunityDialogOpen(
          false,
        );

        setSelectedOpportunity(
          null,
        );

        setActiveTab(
          "interested",
        );

        await loadPageData(
          true,
        );
      } catch (
        error
      ) {
        toast.error(
          error instanceof
          Error
            ? error.message
            : "Unable to save your offer.",
        );
      } finally {
        setSavingResponse(
          false,
        );
      }
    };


  const withdrawResponse =
    async (
      opportunity: Opportunity,
    ) => {
      if (
        withdrawingOpportunityId
      ) {
        return;
      }

      setWithdrawingOpportunityId(
        opportunity.id,
      );

      try {
        const {
          error,
        } =
          await supabase.rpc(
            "withdraw_recycler_opportunity_response",
            {
              p_opportunity_id:
                opportunity.id,
            },
          );

        if (
          error
        ) {
          throw error;
        }

        toast.success(
          "Your offer was withdrawn.",
        );

        await loadPageData(
          true,
        );
      } catch (
        error
      ) {
        toast.error(
          error instanceof
          Error
            ? error.message
            : "Unable to withdraw your offer.",
        );
      } finally {
        setWithdrawingOpportunityId(
          null,
        );
      }
    };


  if (
    loading
  ) {
    return (
      <OpportunitiesPageSkeleton />
    );
  }


  if (
    pageError
  ) {
    return (
      <PageErrorState
        message={
          pageError
        }
        onRetry={() =>
          void loadPageData()
        }
      />
    );
  }


  if (
    !dashboard
  ) {
    return (
      <PageErrorState
        message="The opportunities dashboard returned no data."
        onRetry={() =>
          void loadPageData()
        }
      />
    );
  }


  if (
    !dashboard.ready
  ) {
    return (
      <SetupState
        reason={
          dashboard.reason
        }
        junkshop={
          dashboard.junkshop
        }
        onBack={() =>
          router.push(
            "/profiles/recycler",
          )
        }
        onManageMaterials={() =>
          router.push(
            "/profiles/recycler/materials",
          )
        }
      />
    );
  }


  const junkshop =
    dashboard.junkshop;

  if (
    !junkshop
  ) {
    return (
      <PageErrorState
        message="The junkshop information could not be loaded."
        onRetry={() =>
          void loadPageData()
        }
      />
    );
  }


  const selectedEstimatedTotal =
    selectedOpportunity
      ? numberValue(
          selectedOpportunity
            .estimated_weight_kg,
        ) *
        numberValue(
          responseForm
            .offered_price_per_kg,
        )
      : 0;

  const selectedBelowMinimum =
    selectedOpportunity?.exact_material_match
      ? numberValue(
          selectedOpportunity
            .estimated_weight_kg,
        ) <
        numberValue(
          selectedOpportunity
            .minimum_weight_kg,
        )
      : false;


  return (
    <>
      <style jsx global>{`
        @keyframes trashureFadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>


      <div className="space-y-7">
        <section className="animate-[trashureFadeUp_.35s_ease-out_both]">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/profiles/recycler",
              )
            }
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-green-700"
          >
            <ArrowLeft className="h-4 w-4" />

            Recycler dashboard
          </button>


          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold text-green-600">
                Resident material marketplace
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
                Recovery Opportunities
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Discover resident materials that match what your junkshop
                currently accepts. Submit, update, and track your offers
                from one place.
              </p>
            </div>


            <Button
              type="button"
              variant="outline"
              disabled={
                refreshing
              }
              onClick={() =>
                void loadPageData(
                  true,
                )
              }
              className="w-fit rounded-full border-green-200 bg-white hover:bg-green-50 hover:text-green-700"
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
          </div>
        </section>


        <section className="rounded-[24px] border border-green-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <Store className="h-6 w-6" />
              </div>

              <div>
                <p className="font-black text-zinc-900">
                  {
                    junkshop.junkshop_name
                  }
                </p>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Matching and default pricing come from your active
                  junkshop material listings.
                </p>
              </div>
            </div>

            <Badge className="w-fit border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
              <PackageCheck className="mr-1.5 h-3.5 w-3.5" />

              {
                dashboard
                  .accepted_material_count
              }{" "}
              accepted material
              {dashboard
                .accepted_material_count ===
              1
                ? ""
                : "s"}
            </Badge>
          </div>
        </section>


        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Available"
            value={
              stats.available
            }
            description="New matching resident offers"
            icon={
              Inbox
            }
            delay={
              0
            }
          />

          <SummaryCard
            title="My Offers"
            value={
              stats.interested
            }
            description="Waiting for resident decisions"
            icon={
              Handshake
            }
            delay={
              60
            }
          />

          <SummaryCard
            title="Accepted"
            value={
              stats.accepted
            }
            description="Assigned to your junkshop"
            icon={
              CheckCircle2
            }
            delay={
              120
            }
          />

          <SummaryCard
            title="Completed"
            value={
              stats.completed
            }
            description="Finished recoveries"
            icon={
              History
            }
            delay={
              180
            }
          />
        </section>


        <section className="overflow-x-auto rounded-[24px] border border-green-100 bg-white p-2 shadow-sm">
          <div className="flex min-w-max gap-2">
            <OpportunityTabButton
              active={
                activeTab ===
                "available"
              }
              label="Discover"
              count={
                stats.available
              }
              onClick={() =>
                setActiveTab(
                  "available",
                )
              }
            />

            <OpportunityTabButton
              active={
                activeTab ===
                "interested"
              }
              label="My Offers"
              count={
                stats.interested
              }
              onClick={() =>
                setActiveTab(
                  "interested",
                )
              }
            />

            <OpportunityTabButton
              active={
                activeTab ===
                "accepted"
              }
              label="Accepted"
              count={
                stats.accepted
              }
              onClick={() =>
                setActiveTab(
                  "accepted",
                )
              }
            />

            <OpportunityTabButton
              active={
                activeTab ===
                "completed"
              }
              label="History"
              count={
                stats.completed
              }
              onClick={() =>
                setActiveTab(
                  "completed",
                )
              }
            />
          </div>
        </section>


        <section className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_170px_170px_170px_170px_auto]">
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
                placeholder="Search material, category, or area"
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
                categoryFilter
              }
              onChange={(
                event,
              ) =>
                setCategoryFilter(
                  event.target.value,
                )
              }
              className="h-12 rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            >
              <option value="all">
                All categories
              </option>

              {categories.map(
                (
                  category,
                ) => (
                  <option
                    key={
                      category
                    }
                    value={
                      category
                    }
                  >
                    {
                      category
                    }
                  </option>
                ),
              )}
            </select>


            <select
              value={
                matchFilter
              }
              onChange={(
                event,
              ) =>
                setMatchFilter(
                  event.target
                    .value as MatchFilter,
                )
              }
              className="h-12 rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            >
              <option value="all">
                All opportunities
              </option>

              <option value="exact">
                Accepted materials
              </option>

              <option value="category">
                Same category
              </option>

              <option value="unconfigured">
                Not configured
              </option>
            </select>


            <select
              value={
                fulfillmentFilter
              }
              onChange={(
                event,
              ) =>
                setFulfillmentFilter(
                  event.target
                    .value as FulfillmentFilter,
                )
              }
              className="h-12 rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            >
              <option value="all">
                All methods
              </option>

              <option value="pickup">
                Pickup required
              </option>

              <option value="drop_off">
                Resident drop-off
              </option>

              <option value="either">
                Either method
              </option>
            </select>


            <select
              value={
                sortOption
              }
              onChange={(
                event,
              ) =>
                setSortOption(
                  event.target
                    .value as SortOption,
                )
              }
              className="h-12 rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            >
              <option value="recommended">
                Best matches
              </option>

              <option value="newest">
                Newest first
              </option>

              <option value="highest_value">
                Highest value
              </option>

              <option value="heaviest">
                Heaviest first
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
        </section>


        <section className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
          <div>
            <h2 className="text-xl font-black text-zinc-900">
              {activeTab ===
              "available"
                ? "Matching opportunities"
                : activeTab ===
                    "interested"
                  ? "Offers awaiting a decision"
                  : activeTab ===
                      "accepted"
                    ? "Accepted recoveries"
                    : "Completed recoveries"}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {
                filteredItems.length
              }{" "}
              {filteredItems.length ===
              1
                ? "item"
                : "items"}{" "}
              shown
            </p>
          </div>


          {filteredItems.length ===
          0 ? (
            <OpportunityEmptyState
              tab={
                activeTab
              }
              hasFilters={
                hasFilters
              }
              onClearFilters={
                clearFilters
              }
            />
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {filteredItems.map(
                (
                  opportunity,
                  index,
                ) => (
                  <OpportunityCard
                    key={
                      opportunity.id
                    }
                    opportunity={
                      opportunity
                    }
                    tab={
                      activeTab
                    }
                    animationDelay={
                      index *
                      45
                    }
                    withdrawing={
                      withdrawingOpportunityId ===
                      opportunity.id
                    }
                    onView={() =>
                      openOpportunityDialog(
                        opportunity,
                      )
                    }
                    onRespond={() =>
                      openOpportunityDialog(
                        opportunity,
                      )
                    }
                    onWithdraw={() =>
                      void withdrawResponse(
                        opportunity,
                      )
                    }
                    onAddMaterial={() =>
                      router.push(
                        `/profiles/recycler/materials?material=${encodeURIComponent(
                          opportunity.material_id,
                        )}`,
                      )
                    }
                  />
                ),
              )}
            </div>
          )}
        </section>
      </div>


      <Dialog
        open={
          opportunityDialogOpen
        }
        onOpenChange={
          closeOpportunityDialog
        }
      >
        <DialogContent className="max-h-[94dvh] !w-[calc(100vw-1rem)] !max-w-none gap-0 overflow-hidden rounded-[26px] border border-green-200 !bg-white p-0 text-zinc-900 shadow-[0_28px_100px_rgba(0,0,0,0.35)] sm:!w-[94vw] lg:!w-[820px] lg:rounded-[30px]">
          <DialogHeader className="sr-only">
            <DialogTitle>
              Recovery opportunity
            </DialogTitle>

            <DialogDescription>
              Review the material and manage your recycler offer.
            </DialogDescription>
          </DialogHeader>


          {selectedOpportunity && (
            <form
              onSubmit={
                submitInterest
              }
              className="grid max-h-[94dvh] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-white"
            >
              <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-700 px-5 py-5 text-white sm:px-7">
                <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-white/10" />

                <div className="relative flex items-start gap-4 pr-9">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                    <Handshake className="h-6 w-6" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-100">
                      {
                        selectedOpportunity.match_label
                      }
                    </p>

                    <h2 className="mt-1 break-words text-xl font-black leading-tight sm:text-2xl">
                      {
                        selectedOpportunity.material_name
                      }
                    </h2>

                    <p className="mt-1 text-sm text-green-50">
                      {
                        selectedOpportunity.category
                      }
                    </p>
                  </div>
                </div>
              </div>


              <div className="min-h-0 overflow-y-auto bg-white p-5 sm:p-7">
                <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
                  <div>
                    <SafeOpportunityImage
                      src={
                        selectedOpportunity.image_url
                      }
                      alt={
                        selectedOpportunity.material_name
                      }
                      className="h-52 w-full rounded-2xl"
                      iconClassName="h-14 w-14"
                    />

                    <div className="mt-3 rounded-2xl border border-green-100 bg-green-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                        Estimated total
                      </p>

                      <p className="mt-1 text-2xl font-black text-green-700">
                        {formatPeso(
                          selectedEstimatedTotal,
                        )}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        Based on the estimated weight and your current
                        price.
                      </p>
                    </div>
                  </div>


                  <div className="space-y-5">
                    <OpportunityDetailGrid
                      opportunity={
                        selectedOpportunity
                      }
                    />


                    {selectedBelowMinimum && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <p className="font-black text-amber-800">
                          Below your usual minimum
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-700">
                          This resident estimates{" "}
                          {
                            numberValue(
                              selectedOpportunity
                                .estimated_weight_kg,
                            )
                          }{" "}
                          kg. Your listing currently requires{" "}
                          {
                            numberValue(
                              selectedOpportunity
                                .minimum_weight_kg,
                            )
                          }{" "}
                          kg. You may still send a custom offer.
                        </p>
                      </div>
                    )}


                    {selectedOpportunity.status ===
                      "open" &&
                    selectedOpportunity.can_respond ? (
                      <>
                        <div className="border-t border-zinc-200 pt-5">
                          <h3 className="font-black text-zinc-900">
                            Your offer
                          </h3>

                          <p className="mt-1 text-sm text-zinc-500">
                            The resident will compare your price, pickup
                            option, location, and message.
                          </p>
                        </div>


                        <div className="space-y-2">
                          <Label htmlFor="opportunity_offer">
                            Price per kilogram
                          </Label>

                          <div className="relative">
                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-green-700">
                              ₱
                            </span>

                            <Input
                              id="opportunity_offer"
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={
                                responseForm
                                  .offered_price_per_kg
                              }
                              onChange={(
                                event,
                              ) =>
                                setResponseForm(
                                  (
                                    current,
                                  ) => ({
                                    ...current,

                                    offered_price_per_kg:
                                      event.target
                                        .value,
                                  }),
                                )
                              }
                              className="h-12 rounded-xl border-zinc-300 bg-white pl-9 focus-visible:ring-green-500"
                            />
                          </div>

                          <p className="text-xs text-zinc-500">
                            Your listed rate is{" "}
                            {formatPeso(
                              numberValue(
                                selectedOpportunity
                                  .listed_price_per_kg,
                              ),
                            )}
                            /kg.
                          </p>
                        </div>


                        <div className="space-y-2">
                          <Label htmlFor="opportunity_message">
                            Message to the resident
                          </Label>

                          <Textarea
                            id="opportunity_message"
                            maxLength={
                              250
                            }
                            value={
                              responseForm.message
                            }
                            onChange={(
                              event,
                            ) =>
                              setResponseForm(
                                (
                                  current,
                                ) => ({
                                  ...current,

                                  message:
                                    event.target
                                      .value,
                                }),
                              )
                            }
                            placeholder="Example: We can collect this Saturday morning."
                            rows={
                              4
                            }
                            className="resize-none rounded-xl border-zinc-300 bg-white focus-visible:ring-green-500"
                          />

                          <p className="text-right text-xs text-zinc-400">
                            {
                              responseForm
                                .message.length
                            }
                            /250
                          </p>
                        </div>


                        <div className="flex items-center justify-between gap-5 rounded-2xl border border-green-200 bg-green-50 p-4">
                          <div>
                            <p className="font-black text-zinc-900">
                              Pickup available
                            </p>

                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                              {selectedOpportunity
                                .fulfillment_method ===
                              "pickup"
                                ? "Pickup is required for this opportunity."
                                : "Enable this when your junkshop can collect the material."}
                            </p>
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={
                              responseForm
                                .pickup_available
                            }
                            disabled={
                              selectedOpportunity
                                .fulfillment_method ===
                              "pickup"
                            }
                            onClick={() =>
                              setResponseForm(
                                (
                                  current,
                                ) => ({
                                  ...current,

                                  pickup_available:
                                    !current.pickup_available,
                                }),
                              )
                            }
                            className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-not-allowed ${
                              responseForm
                                .pickup_available
                                ? "bg-green-600"
                                : "bg-zinc-300"
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                                responseForm
                                  .pickup_available
                                  ? "left-6"
                                  : "left-1"
                              }`}
                            />
                          </button>
                        </div>
                      </>
                    ) : selectedOpportunity.status ===
                        "open" ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <div className="flex gap-3">
                          <Package className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                          <div>
                            <p className="font-black text-zinc-900">
                              Add this exact material first
                            </p>

                            <p className="mt-1 text-sm leading-6 text-zinc-600">
                              This opportunity is visible because Discover now shows all open resident offers. You can send a price only after adding {selectedOpportunity.material_name} to your active junkshop materials.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <AcceptedDetails
                        opportunity={
                          selectedOpportunity
                        }
                      />
                    )}
                  </div>
                </div>
              </div>


              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-green-200 bg-white px-5 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] sm:px-7">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={
                    savingResponse
                  }
                  onClick={() =>
                    setOpportunityDialogOpen(
                      false,
                    )
                  }
                  className="rounded-full"
                >
                  Close
                </Button>


                {selectedOpportunity.status ===
                  "open" &&
                  selectedOpportunity.can_respond && (
                  <Button
                    type="submit"
                    disabled={
                      savingResponse ||
                      !responseForm
                        .offered_price_per_kg
                    }
                    className="min-w-40 rounded-full bg-green-600 px-6 text-white hover:bg-green-700 disabled:bg-zinc-200 disabled:text-zinc-400"
                  >
                    {savingResponse ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}

                    {savingResponse
                      ? "Saving..."
                      : selectedOpportunity
                          .response
                        ? "Update offer"
                        : "Send offer"}
                  </Button>
                )}


                {selectedOpportunity.status ===
                  "open" &&
                  !selectedOpportunity.can_respond && (
                  <Button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/profiles/recycler/materials?material=${encodeURIComponent(
                          selectedOpportunity.material_id,
                        )}`,
                      )
                    }
                    className="min-w-40 rounded-full bg-zinc-900 px-6 text-white hover:bg-zinc-800"
                  >
                    <Package className="mr-2 h-4 w-4" />

                    Add material
                  </Button>
                )}
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}


function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  delay,
}: {
  title: string;
  value: number;
  description: string;
  icon:
    ComponentType<{
      className?: string;
    }>;
  delay: number;
}) {
  return (
    <div
      className="animate-[trashureFadeUp_.38s_ease-out_both] rounded-[24px] border border-green-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-md"
      style={{
        animationDelay:
          `${delay}ms`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-500">
            {title}
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


function OpportunityTabButton({
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
      className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all ${
        active
          ? "bg-green-600 text-white shadow-sm shadow-green-600/20"
          : "text-zinc-500 hover:bg-green-50 hover:text-green-700"
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


function OpportunityCard({
  opportunity,
  tab,
  animationDelay,
  withdrawing,
  onView,
  onRespond,
  onWithdraw,
  onAddMaterial,
}: {
  opportunity: Opportunity;
  tab: OpportunityTab;
  animationDelay: number;
  withdrawing: boolean;
  onView: () => void;
  onRespond: () => void;
  onWithdraw: () => void;
  onAddMaterial: () => void;
}) {
  const displayedPrice =
    getOpportunityPrice(
      opportunity,
    );

  const estimatedTotal =
    getEstimatedValue(
      opportunity,
    );

  const belowMinimum =
    opportunity.exact_material_match &&
    numberValue(
      opportunity.estimated_weight_kg,
    ) <
      numberValue(
        opportunity.minimum_weight_kg,
      );

  return (
    <article
      className="animate-[trashureFadeUp_.35s_ease-out_both] overflow-hidden rounded-[26px] border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-300 hover:shadow-lg"
      style={{
        animationDelay:
          `${animationDelay}ms`,
      }}
    >
      <div className="relative h-48 overflow-hidden bg-green-50">
        <SafeOpportunityImage
          src={
            opportunity.image_url
          }
          alt={
            opportunity.material_name
          }
          className="h-full w-full"
          iconClassName="h-14 w-14"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <Badge className="border-white/20 bg-black/35 text-white backdrop-blur-sm hover:bg-black/35">
            {
              opportunity.match_label
            }
          </Badge>

          <Badge
            className={
              opportunity.match_type ===
              "exact"
                ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-50"
                : opportunity.match_type ===
                    "category"
                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-white"
            }
          >
            {getMaterialMatchLabel(
              opportunity,
            )}
          </Badge>

          {belowMinimum && (
            <Badge className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
              Below minimum
            </Badge>
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <Badge className="border-white/20 bg-black/30 text-white backdrop-blur-sm hover:bg-black/30">
            {
              opportunity.category
            }
          </Badge>

          <h3 className="mt-2 text-xl font-black text-white">
            {
              opportunity.material_name
            }
          </h3>
        </div>
      </div>


      <div className="p-5">
        <div className="grid grid-cols-2 gap-3">
          <OpportunityMetric
            icon={
              Scale
            }
            label="Estimated weight"
            value={`${numberValue(
              opportunity.estimated_weight_kg,
            )} kg`}
          />

          <OpportunityMetric
            icon={
              WalletCards
            }
            label={
              opportunity.response
                ? "Your estimate"
                : "Listed estimate"
            }
            value={formatPeso(
              estimatedTotal,
            )}
          />
        </div>


        <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                {opportunity.response
                  ? "Your offer"
                  : opportunity.exact_material_match
                    ? "Default rate"
                    : "Material setup"}
              </p>

              {opportunity.response ||
              opportunity.exact_material_match ? (
                <p className="mt-1 text-xl font-black text-green-700">
                  {formatPeso(
                    displayedPrice,
                  )}
                  <span className="ml-1 text-xs font-bold text-zinc-500">
                    /kg
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-sm font-black text-zinc-700">
                  Add this material to set a rate
                </p>
              )}
            </div>

            <CircleDollarSign className="h-7 w-7 text-green-600" />
          </div>
        </div>


        <div className="mt-4 space-y-3">
          <DetailLine
            icon={
              MapPin
            }
            label="Approximate location"
            value={getLocationText(
              opportunity,
            )}
          />

          <DetailLine
            icon={
              Truck
            }
            label="Method"
            value={getFulfillmentLabel(
              opportunity.fulfillment_method,
            )}
          />

          <DetailLine
            icon={
              Info
            }
            label="Condition"
            value={
              opportunity.material_condition ||
              "No condition provided."
            }
          />
        </div>


        <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Clock3 className="h-3.5 w-3.5" />

            {formatRelativeDate(
              opportunity.created_at,
            )}
          </div>

          <StatusBadge
            opportunity={
              opportunity
            }
          />
        </div>


        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={
              onView
            }
            className="flex-1 rounded-full border-green-200 hover:bg-green-50 hover:text-green-700"
          >
            View details
          </Button>


          {tab ===
            "available" &&
            opportunity.can_respond && (
            <Button
              type="button"
              onClick={
                onRespond
              }
              className="flex-1 rounded-full bg-green-600 hover:bg-green-700"
            >
              <Handshake className="mr-2 h-4 w-4" />

              Make offer
            </Button>
          )}


          {tab ===
            "available" &&
            !opportunity.can_respond && (
            <Button
              type="button"
              onClick={
                onAddMaterial
              }
              className="flex-1 rounded-full bg-zinc-900 text-white hover:bg-zinc-800"
            >
              <Package className="mr-2 h-4 w-4" />

              Add material
            </Button>
          )}


          {tab ===
            "interested" && (
            <>
              <Button
                type="button"
                onClick={
                  onRespond
                }
                className="flex-1 rounded-full bg-green-600 hover:bg-green-700"
              >
                <MessageSquare className="mr-2 h-4 w-4" />

                Update offer
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={
                  withdrawing
                }
                onClick={
                  onWithdraw
                }
                className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                {withdrawing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Undo2 className="h-4 w-4" />
                )}
              </Button>
            </>
          )}


          {tab ===
            "accepted" && (
            <div className="flex flex-1 items-center justify-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700">
              <BadgeCheck className="h-4 w-4" />

              Selected by resident
            </div>
          )}


          {tab ===
            "completed" && (
            <div className="flex flex-1 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-bold text-zinc-600">
              <PackageCheck className="h-4 w-4" />

              Recovery completed
            </div>
          )}
        </div>
      </div>
    </article>
  );
}


function SafeOpportunityImage({
  src,
  alt,
  className,
  iconClassName,
}: {
  src: string | null;
  alt: string;
  className: string;
  iconClassName: string;
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
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 text-green-600 ${className}`}
      >
        <Package
          className={
            iconClassName
          }
        />
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
      className={`object-cover ${className}`}
    />
  );
}


function StatusBadge({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  if (
    opportunity.bucket ===
    "completed"
  ) {
    return (
      <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
        Completed
      </Badge>
    );
  }

  if (
    opportunity.bucket ===
    "accepted"
  ) {
    return (
      <Badge className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">
        Accepted
      </Badge>
    );
  }

  if (
    opportunity.bucket ===
    "interested"
  ) {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
        Offer sent
      </Badge>
    );
  }

  return (
    <Badge className="border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-50">
      Available
    </Badge>
  );
}


function OpportunityMetric({
  icon: Icon,
  label,
  value,
}: {
  icon:
    ComponentType<{
      className?: string;
    }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-green-600" />

        <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          {label}
        </p>
      </div>

      <p className="mt-2 font-black text-zinc-900">
        {value}
      </p>
    </div>
  );
}


function DetailLine({
  icon: Icon,
  label,
  value,
}: {
  icon:
    ComponentType<{
      className?: string;
    }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />

      <div>
        <p className="text-xs font-bold text-zinc-700">
          {label}
        </p>

        <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500">
          {value}
        </p>
      </div>
    </div>
  );
}


function OpportunityDetailGrid({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <OpportunityDetail
        icon={
          Scale
        }
        label="Estimated weight"
        value={`${numberValue(
          opportunity.estimated_weight_kg,
        )} kg`}
      />

      <OpportunityDetail
        icon={
          MapPin
        }
        label="Approximate location"
        value={getLocationText(
          opportunity,
        )}
      />

      <OpportunityDetail
        icon={
          Truck
        }
        label="Method"
        value={getFulfillmentLabel(
          opportunity.fulfillment_method,
        )}
      />

      <OpportunityDetail
        icon={
          Info
        }
        label="Condition"
        value={
          opportunity.material_condition ||
          "No condition provided."
        }
      />

      <OpportunityDetail
        icon={
          CircleDollarSign
        }
        label="Your listed rate"
        value={
          opportunity.exact_material_match
            ? `${formatPeso(
                numberValue(
                  opportunity.listed_price_per_kg,
                ),
              )}/kg`
            : "Not configured"
        }
      />

      <OpportunityDetail
        icon={
          PackageCheck
        }
        label="Your minimum"
        value={
          opportunity.exact_material_match
            ? `${numberValue(
                opportunity.minimum_weight_kg,
              )} kg`
            : "Not configured"
        }
      />
    </div>
  );
}


function OpportunityDetail({
  icon: Icon,
  label,
  value,
}: {
  icon:
    ComponentType<{
      className?: string;
    }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <Icon className="h-5 w-5 text-green-600" />

      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-zinc-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold leading-5 text-zinc-700">
        {value}
      </p>
    </div>
  );
}


function AcceptedDetails({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
      <div className="flex gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />

        <div>
          <p className="font-black text-zinc-900">
            {opportunity.status ===
            "completed"
              ? "Recovery completed"
              : "Your junkshop was selected"}
          </p>

          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Your accepted offer was{" "}
            {formatPeso(
              numberValue(
                opportunity.response
                  ?.offered_price_per_kg,
              ),
            )}
            /kg
            {opportunity.response
              ?.pickup_available
              ? " with pickup available."
              : "."}
          </p>

          {opportunity.response
            ?.message && (
            <p className="mt-3 rounded-xl bg-white p-3 text-sm leading-6 text-zinc-600">
              {
                opportunity.response
                  .message
              }
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


function OpportunityEmptyState({
  tab,
  hasFilters,
  onClearFilters,
}: {
  tab: OpportunityTab;
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  const content =
    tab ===
    "available"
      ? {
          title:
            "No matching opportunities yet",

          description:
            "New resident offers matching your active material listings will appear here.",
        }
      : tab ===
          "interested"
        ? {
            title:
              "No active offers",

            description:
              "Resident opportunities you respond to will appear here.",
          }
        : tab ===
            "accepted"
          ? {
              title:
                "No accepted recoveries",

              description:
                "Opportunities assigned to your junkshop will appear here.",
            }
          : {
              title:
                "No completed recoveries",

              description:
                "Finished resident transactions will appear here.",
            };

  return (
    <div className="mt-6 flex flex-col items-center rounded-[26px] border border-dashed border-green-200 bg-green-50 px-6 py-14 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-green-600 shadow-sm">
        <Inbox className="h-7 w-7" />
      </div>

      <h3 className="mt-5 text-lg font-black text-zinc-900">
        {hasFilters
          ? "No matching results"
          : content.title}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
        {hasFilters
          ? "Try changing or clearing the current filters."
          : content.description}
      </p>

      {hasFilters && (
        <Button
          type="button"
          variant="outline"
          onClick={
            onClearFilters
          }
          className="mt-5 rounded-full"
        >
          <X className="mr-2 h-4 w-4" />

          Clear filters
        </Button>
      )}
    </div>
  );
}


function SetupState({
  reason,
  junkshop,
  onBack,
  onManageMaterials,
}: {
  reason: DashboardPayload["reason"];
  junkshop: DashboardJunkshop | null;
  onBack: () => void;
  onManageMaterials: () => void;
}) {
  const missingJunkshop =
    reason ===
    "missing_junkshop";

  const unavailable =
    reason ===
    "junkshop_unavailable";

  const title =
    missingJunkshop
      ? "Create your junkshop first"
      : unavailable
        ? "Your junkshop is not available yet"
        : "Add accepted materials first";

  const description =
    missingJunkshop
      ? "Recovery opportunities need an active junkshop profile."
      : unavailable
        ? `Current status: ${
            junkshop
              ?.verification_status ??
            "unknown"
          }. Opportunities appear after approval and activation.`
        : "The marketplace matches resident offers with materials your junkshop actively accepts.";

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={
          onBack
        }
        className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-green-700"
      >
        <ArrowLeft className="h-4 w-4" />

        Recycler dashboard
      </button>

      <div className="rounded-[30px] border border-green-100 bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
          {missingJunkshop ? (
            <Store className="h-8 w-8" />
          ) : unavailable ? (
            <Clock3 className="h-8 w-8" />
          ) : (
            <Package className="h-8 w-8" />
          )}
        </div>

        <h1 className="mt-5 text-2xl font-black text-zinc-900">
          {title}
        </h1>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">
          {description}
        </p>

        <Button
          type="button"
          onClick={
            missingJunkshop ||
            unavailable
              ? onBack
              : onManageMaterials
          }
          className="mt-6 rounded-full bg-green-600 hover:bg-green-700"
        >
          {missingJunkshop
            ? "Set up junkshop"
            : unavailable
              ? "Return to dashboard"
              : "Manage materials"}
        </Button>
      </div>
    </div>
  );
}


function PageErrorState({
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
          Opportunities unavailable
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


function OpportunitiesPageSkeleton() {
  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <Skeleton className="h-4 w-48 bg-green-100" />

        <Skeleton className="h-9 w-80 max-w-full bg-green-100" />

        <Skeleton className="h-4 w-96 max-w-full bg-green-100" />
      </div>

      <Skeleton className="h-20 rounded-[24px] bg-green-100" />

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

      <Skeleton className="h-16 rounded-[24px] bg-green-100" />

      <Skeleton className="h-28 rounded-[28px] bg-green-100" />

      <div className="grid gap-5 lg:grid-cols-2">
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
              className="h-[500px] rounded-[26px] bg-green-100"
            />
          ),
        )}
      </div>
    </div>
  );
}
