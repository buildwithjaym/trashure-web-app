"use client";

import type {
  ComponentType,
  FormEvent,
} from "react";

import {
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
  Edit3,
  Handshake,
  Inbox,
  Loader2,
  MapPin,
  Package,
  PackageCheck,
  Plus,
  RefreshCcw,
  Scale,
  Store,
  Trash2,
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


const RESIDENT_BASE_PATH =
  "/profiles/resident";


type OffersTab =
  | "open"
  | "responses"
  | "accepted"
  | "history";


type OpportunityStatus =
  | "open"
  | "accepted"
  | "completed"
  | "cancelled";


type FulfillmentMethod =
  | "drop_off"
  | "pickup"
  | "either";


type ResponseStatus =
  | "interested"
  | "accepted"
  | "declined"
  | "withdrawn";


interface ResidentProfile {
  id: string;
  auth_id: string;
  full_name: string;
  role: string;
  barangay: string | null;
  city: string | null;
  province: string | null;
}


interface MaterialRelation {
  id: string;
  material_name: string;
  category: string;
}


interface ScanRow {
  id: string;
  user_id: string;
  image_url: string | null;
  detected_object: string;
  material_id: string | null;
  material_type: string;
  material_category: string | null;
  condition: string | null;
  user_confirmed: boolean;
  created_at: string;
}


interface OpportunityDatabaseRow {
  id: string;
  resident_profile_id: string;
  material_id: string;
  scan_id: string | null;
  image_url: string | null;
  estimated_weight_kg:
  | number
  | string;
  material_condition: string | null;
  fulfillment_method: FulfillmentMethod;
  barangay: string;
  city: string;
  province: string | null;
  status: OpportunityStatus;
  selected_junkshop_id: string | null;
  created_at: string;
  updated_at: string;
  materials:
  | MaterialRelation
  | MaterialRelation[]
  | null;
}


interface Opportunity {
  id: string;
  resident_profile_id: string;
  material_id: string;
  material_name: string;
  category: string;
  scan_id: string | null;
  image_url: string | null;
  estimated_weight_kg: number;
  material_condition: string | null;
  fulfillment_method: FulfillmentMethod;
  barangay: string;
  city: string;
  province: string | null;
  status: OpportunityStatus;
  selected_junkshop_id: string | null;
  created_at: string;
  updated_at: string;
}


interface JunkshopRelation {
  id: string;
  junkshop_name: string;
  barangay: string | null;
  city: string | null;
  province: string | null;
  contact_number: string | null;
}


interface ResponseDatabaseRow {
  id: string;
  opportunity_id: string;
  junkshop_id: string;
  offered_price_per_kg:
  | number
  | string;
  pickup_available: boolean;
  message: string | null;
  status: ResponseStatus;
  created_at: string;
  updated_at: string;
  junkshops:
  | JunkshopRelation
  | JunkshopRelation[]
  | null;
}


interface OpportunityResponse {
  id: string;
  opportunity_id: string;
  junkshop_id: string;
  junkshop_name: string;
  barangay: string | null;
  city: string | null;
  province: string | null;
  contact_number: string | null;
  offered_price_per_kg: number;
  pickup_available: boolean;
  message: string | null;
  status: ResponseStatus;
  created_at: string;
  updated_at: string;
}


interface OfferForm {
  scan_id: string;
  estimated_weight_kg: string;
  material_condition: string;
  fulfillment_method: FulfillmentMethod;
}


const emptyOfferForm: OfferForm = {
  scan_id: "",
  estimated_weight_kg: "",
  material_condition: "",
  fulfillment_method: "either",
};


const pesoFormatter =
  new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );


function formatPeso(
  value: number,
) {
  return pesoFormatter.format(
    Number.isFinite(value)
      ? value
      : 0,
  );
}


function normalizeRelation<T>(
  value:
    | T
    | T[]
    | null,
) {
  if (
    Array.isArray(value)
  ) {
    return value[0] ?? null;
  }

  return value;
}


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
    return `${hours} hr${hours ===
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
    return `${days} day${days ===
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
      month: "short",
      day: "numeric",
      year: "numeric",
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
    return "Pickup requested";
  }

  if (
    method ===
    "drop_off"
  ) {
    return "I will drop it off";
  }

  return "Pickup or drop-off";
}


function getLocationText(
  value: {
    barangay: string;
    city: string;
    province: string | null;
  },
) {
  return [
    value.barangay,
    value.city,
    value.province,
  ]
    .filter(Boolean)
    .join(", ");
}


function statusBadgeClass(
  status: OpportunityStatus,
) {
  if (
    status ===
    "completed"
  ) {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (
    status ===
    "accepted"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (
    status ===
    "cancelled"
  ) {
    return "border-zinc-200 bg-zinc-100 text-zinc-600";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}


export default function ResidentOffersPage() {
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
    scans,
    setScans,
  ] =
    useState<ScanRow[]>(
      [],
    );

  const [
    opportunities,
    setOpportunities,
  ] =
    useState<Opportunity[]>(
      [],
    );

  const [
    responses,
    setResponses,
  ] =
    useState<OpportunityResponse[]>(
      [],
    );


  const [
    activeTab,
    setActiveTab,
  ] =
    useState<OffersTab>(
      "open",
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
    offerDialogOpen,
    setOfferDialogOpen,
  ] =
    useState(
      false,
    );

  const [
    editingOpportunity,
    setEditingOpportunity,
  ] =
    useState<Opportunity | null>(
      null,
    );

  const [
    offerForm,
    setOfferForm,
  ] =
    useState<OfferForm>(
      emptyOfferForm,
    );

  const [
    savingOffer,
    setSavingOffer,
  ] =
    useState(
      false,
    );


  const [
    responsesDialogOpen,
    setResponsesDialogOpen,
  ] =
    useState(
      false,
    );

  const [
    selectedOpportunity,
    setSelectedOpportunity,
  ] =
    useState<Opportunity | null>(
      null,
    );

  const [
    acceptingResponseId,
    setAcceptingResponseId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    actionOpportunityId,
    setActionOpportunityId,
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
            data:
            profileData,
            error:
            profileError,
          } =
            await supabase
              .from(
                "profiles",
              )
              .select(`
                id,
                auth_id,
                full_name,
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
            profileError ||
            !profileData
          ) {
            throw (
              profileError ??
              new Error(
                "Resident account was not found.",
              )
            );
          }

          const currentProfile =
            profileData as ResidentProfile;

          if (
            currentProfile.role !==
            "resident"
          ) {
            throw new Error(
              "This page is available only to resident accounts.",
            );
          }

          setProfile(
            currentProfile,
          );

          const [
            scanResult,
            opportunityResult,
          ] =
            await Promise.all([
              supabase
                .from(
                  "scans",
                )
                .select(`
                  id,
                  user_id,
                  image_url,
                  detected_object,
                  material_id,
                  material_type,
                  material_category,
                  condition,
                  user_confirmed,
                  created_at
                `)
                .eq(
                  "user_id",
                  currentProfile.id,
                )
                .eq(
                  "user_confirmed",
                  true,
                )
                .not(
                  "material_id",
                  "is",
                  null,
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  },
                )
                .limit(
                  30,
                ),

              supabase
                .from(
                  "material_opportunities",
                )
                .select(`
                  id,
                  resident_profile_id,
                  material_id,
                  scan_id,
                  image_url,
                  estimated_weight_kg,
                  material_condition,
                  fulfillment_method,
                  barangay,
                  city,
                  province,
                  status,
                  selected_junkshop_id,
                  created_at,
                  updated_at,
                  materials (
                    id,
                    material_name,
                    category
                  )
                `)
                .eq(
                  "resident_profile_id",
                  currentProfile.id,
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  },
                ),
            ]);

          if (
            scanResult.error
          ) {
            throw scanResult.error;
          }

          if (
            opportunityResult.error
          ) {
            throw opportunityResult.error;
          }

          const normalizedOpportunities =
            (
              (
                opportunityResult.data ??
                []
              ) as OpportunityDatabaseRow[]
            ).map(
              (
                row,
              ): Opportunity => {
                const material =
                  normalizeRelation(
                    row.materials,
                  );

                return {
                  id:
                    row.id,

                  resident_profile_id:
                    row.resident_profile_id,

                  material_id:
                    row.material_id,

                  material_name:
                    material?.material_name ??
                    "Unnamed material",

                  category:
                    material?.category ??
                    "Other",

                  scan_id:
                    row.scan_id,

                  image_url:
                    row.image_url,

                  estimated_weight_kg:
                    Number(
                      row.estimated_weight_kg,
                    ),

                  material_condition:
                    row.material_condition,

                  fulfillment_method:
                    row.fulfillment_method,

                  barangay:
                    row.barangay,

                  city:
                    row.city,

                  province:
                    row.province,

                  status:
                    row.status,

                  selected_junkshop_id:
                    row.selected_junkshop_id,

                  created_at:
                    row.created_at,

                  updated_at:
                    row.updated_at,
                };
              },
            );

          setScans(
            (
              scanResult.data ??
              []
            ) as ScanRow[],
          );

          setOpportunities(
            normalizedOpportunities,
          );

          const opportunityIds =
            normalizedOpportunities.map(
              (
                opportunity,
              ) =>
                opportunity.id,
            );

          if (
            opportunityIds.length ===
            0
          ) {
            setResponses(
              [],
            );

            return;
          }

          const {
            data:
            responseData,
            error:
            responseError,
          } =
            await supabase
              .from(
                "opportunity_responses",
              )
              .select(`
                id,
                opportunity_id,
                junkshop_id,
                offered_price_per_kg,
                pickup_available,
                message,
                status,
                created_at,
                updated_at,
                junkshops (
                  id,
                  junkshop_name,
                  barangay,
                  city,
                  province,
                  contact_number
                )
              `)
              .in(
                "opportunity_id",
                opportunityIds,
              )
              .order(
                "offered_price_per_kg",
                {
                  ascending:
                    false,
                },
              );

          if (
            responseError
          ) {
            throw responseError;
          }

          const normalizedResponses =
            (
              (
                responseData ??
                []
              ) as ResponseDatabaseRow[]
            ).map(
              (
                row,
              ): OpportunityResponse => {
                const junkshop =
                  normalizeRelation(
                    row.junkshops,
                  );

                return {
                  id:
                    row.id,

                  opportunity_id:
                    row.opportunity_id,

                  junkshop_id:
                    row.junkshop_id,

                  junkshop_name:
                    junkshop?.junkshop_name ??
                    "Unnamed junkshop",

                  barangay:
                    junkshop?.barangay ??
                    null,

                  city:
                    junkshop?.city ??
                    null,

                  province:
                    junkshop?.province ??
                    null,

                  contact_number:
                    junkshop?.contact_number ??
                    null,

                  offered_price_per_kg:
                    Number(
                      row.offered_price_per_kg,
                    ),

                  pickup_available:
                    row.pickup_available,

                  message:
                    row.message,

                  status:
                    row.status,

                  created_at:
                    row.created_at,

                  updated_at:
                    row.updated_at,
                };
              },
            );

          setResponses(
            normalizedResponses,
          );
        } catch (
        error
        ) {
          const message =
            getErrorMessage(
              error,
              "Unable to load your offers.",
            );

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


  const responseMap =
    useMemo(
      () => {
        const map =
          new Map<
            string,
            OpportunityResponse[]
          >();

        for (
          const response of responses
        ) {
          const current =
            map.get(
              response.opportunity_id,
            ) ??
            [];

          current.push(
            response,
          );

          map.set(
            response.opportunity_id,
            current,
          );
        }

        for (
          const [
            opportunityId,
            items,
          ] of map
        ) {
          map.set(
            opportunityId,
            items.sort(
              (
                first,
                second,
              ) =>
                second.offered_price_per_kg -
                first.offered_price_per_kg ||
                Number(
                  second.pickup_available,
                ) -
                Number(
                  first.pickup_available,
                ) ||
                new Date(
                  second.created_at,
                ).getTime() -
                new Date(
                  first.created_at,
                ).getTime(),
            ),
          );
        }

        return map;
      },
      [
        responses,
      ],
    );


  const activeScanIds =
    useMemo(
      () => {
        return new Set(
          opportunities
            .filter(
              (
                opportunity,
              ) =>
                opportunity.status ===
                "open" ||
                opportunity.status ===
                "accepted" ||
                opportunity.status ===
                "completed",
            )
            .map(
              (
                opportunity,
              ) =>
                opportunity.scan_id,
            )
            .filter(
              (
                scanId,
              ): scanId is string =>
                Boolean(
                  scanId,
                ),
            ),
        );
      },
      [
        opportunities,
      ],
    );


  const availableScans =
    useMemo(
      () => {
        return scans.filter(
          (
            scan,
          ) =>
            !activeScanIds.has(
              scan.id,
            ),
        );
      },
      [
        activeScanIds,
        scans,
      ],
    );


  const openOffers =
    useMemo(
      () => {
        return opportunities.filter(
          (
            opportunity,
          ) =>
            opportunity.status ===
            "open" &&
            (
              responseMap.get(
                opportunity.id,
              ) ??
              []
            ).filter(
              (
                response,
              ) =>
                response.status ===
                "interested",
            ).length ===
            0,
        );
      },
      [
        opportunities,
        responseMap,
      ],
    );


  const offersWithResponses =
    useMemo(
      () => {
        return opportunities.filter(
          (
            opportunity,
          ) =>
            opportunity.status ===
            "open" &&
            (
              responseMap.get(
                opportunity.id,
              ) ??
              []
            ).some(
              (
                response,
              ) =>
                response.status ===
                "interested",
            ),
        );
      },
      [
        opportunities,
        responseMap,
      ],
    );


  const acceptedOffers =
    useMemo(
      () => {
        return opportunities.filter(
          (
            opportunity,
          ) =>
            opportunity.status ===
            "accepted",
        );
      },
      [
        opportunities,
      ],
    );


  const historyOffers =
    useMemo(
      () => {
        return opportunities.filter(
          (
            opportunity,
          ) =>
            opportunity.status ===
            "completed" ||
            opportunity.status ===
            "cancelled",
        );
      },
      [
        opportunities,
      ],
    );


  const displayedOffers =
    useMemo(
      () => {
        if (
          activeTab ===
          "responses"
        ) {
          return offersWithResponses;
        }

        if (
          activeTab ===
          "accepted"
        ) {
          return acceptedOffers;
        }

        if (
          activeTab ===
          "history"
        ) {
          return historyOffers;
        }

        return openOffers;
      },
      [
        acceptedOffers,
        activeTab,
        historyOffers,
        offersWithResponses,
        openOffers,
      ],
    );


  const openCreateDialog =
    (
      preferredScanId =
        "",
    ) => {
      const scan =
        scans.find(
          (
            item,
          ) =>
            item.id ===
            preferredScanId,
        ) ??
        availableScans[0] ??
        null;

      setEditingOpportunity(
        null,
      );

      setOfferForm({
        scan_id:
          scan?.id ??
          "",

        estimated_weight_kg:
          "",

        material_condition:
          scan?.condition ??
          "",

        fulfillment_method:
          "either",
      });

      setOfferDialogOpen(
        true,
      );
    };


  useEffect(
    () => {
      if (
        loading ||
        scans.length ===
        0
      ) {
        return;
      }

      const query =
        new URLSearchParams(
          window.location.search,
        );

      const requestedScan =
        query.get(
          "scan",
        );

      if (
        !requestedScan
      ) {
        return;
      }

      const isAvailable =
        availableScans.some(
          (
            scan,
          ) =>
            scan.id ===
            requestedScan,
        );

      if (
        isAvailable
      ) {
        openCreateDialog(
          requestedScan,
        );
      }

      query.delete(
        "scan",
      );

      const nextQuery =
        query.toString();

      window.history.replaceState(
        {},
        "",
        nextQuery
          ? `${window.location.pathname}?${nextQuery}`
          : window.location.pathname,
      );
    },
    [
      availableScans,
      loading,
      scans.length,
    ],
  );


  const openEditDialog =
    (
      opportunity: Opportunity,
    ) => {
      setEditingOpportunity(
        opportunity,
      );

      setOfferForm({
        scan_id:
          opportunity.scan_id ??
          "",

        estimated_weight_kg:
          String(
            opportunity.estimated_weight_kg,
          ),

        material_condition:
          opportunity.material_condition ??
          "",

        fulfillment_method:
          opportunity.fulfillment_method,
      });

      setOfferDialogOpen(
        true,
      );
    };


  const closeOfferDialog =
    (
      open: boolean,
    ) => {
      if (
        savingOffer
      ) {
        return;
      }

      setOfferDialogOpen(
        open,
      );

      if (
        !open
      ) {
        setEditingOpportunity(
          null,
        );

        setOfferForm(
          emptyOfferForm,
        );
      }
    };


  const saveOffer =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (
        !profile ||
        savingOffer
      ) {
        return;
      }

      const weight =
        Number(
          offerForm.estimated_weight_kg,
        );

      if (
        !Number.isFinite(
          weight,
        ) ||
        weight <=
        0
      ) {
        toast.error(
          "Enter an estimated weight greater than zero.",
        );

        return;
      }

      if (
        !editingOpportunity &&
        !offerForm.scan_id
      ) {
        toast.error(
          "Select a confirmed scan.",
        );

        return;
      }

      if (
        !profile.barangay ||
        !profile.city
      ) {
        toast.error(
          "Complete your barangay and city in your profile before posting an offer.",
        );

        return;
      }

      setSavingOffer(
        true,
      );

      try {
        if (
          editingOpportunity
        ) {
          const {
            error,
          } =
            await supabase.rpc(
              "resident_update_material_opportunity",
              {
                p_opportunity_id:
                  editingOpportunity.id,

                p_estimated_weight_kg:
                  weight,

                p_material_condition:
                  offerForm.material_condition.trim(),

                p_fulfillment_method:
                  offerForm.fulfillment_method,
              },
            );

          if (
            error
          ) {
            throw error;
          }

          toast.success(
            "Offer updated.",
          );
        } else {
          const selectedScan =
            scans.find(
              (
                scan,
              ) =>
                scan.id ===
                offerForm.scan_id,
            );

          if (
            !selectedScan?.material_id
          ) {
            throw new Error(
              "The selected scan has no confirmed material.",
            );
          }

          const opportunityId =
            crypto.randomUUID();

          const {
            error,
          } =
            await supabase
              .from(
                "material_opportunities",
              )
              .insert({
                id:
                  opportunityId,

                resident_profile_id:
                  profile.id,

                material_id:
                  selectedScan.material_id,

                scan_id:
                  selectedScan.id,

                image_url:
                  `/api/opportunities/${opportunityId}/image`,

                estimated_weight_kg:
                  weight,

                material_condition:
                  offerForm.material_condition.trim() ||
                  selectedScan.condition ||
                  null,

                fulfillment_method:
                  offerForm.fulfillment_method,

                barangay:
                  profile.barangay,

                city:
                  profile.city,

                province:
                  profile.province,

                status:
                  "open",

                selected_junkshop_id:
                  null,
              });

          if (
            error
          ) {
            throw error;
          }

          toast.success(
            "Offer posted to matching recyclers.",
          );
        }

        setOfferDialogOpen(
          false,
        );

        setEditingOpportunity(
          null,
        );

        setOfferForm(
          emptyOfferForm,
        );

        await loadPageData(
          true,
        );
      } catch (
      error
      ) {
        toast.error(
          getErrorMessage(
            error,
            "Unable to save the offer.",
          ),
        );
      } finally {
        setSavingOffer(
          false,
        );
      }
    };


  const cancelOffer =
    async (
      opportunity: Opportunity,
    ) => {
      const confirmed =
        window.confirm(
          "Cancel this offer? Recycler responses will be declined.",
        );

      if (
        !confirmed
      ) {
        return;
      }

      setActionOpportunityId(
        opportunity.id,
      );

      try {
        const {
          error,
        } =
          await supabase.rpc(
            "resident_cancel_material_opportunity",
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
          "Offer cancelled.",
        );

        await loadPageData(
          true,
        );
      } catch (
      error
      ) {
        toast.error(
          getErrorMessage(
            error,
            "Unable to cancel the offer.",
          ),
        );
      } finally {
        setActionOpportunityId(
          null,
        );
      }
    };


  const deleteOffer =
    async (
      opportunity: Opportunity,
    ) => {
      const confirmed =
        window.confirm(
          "Delete this offer permanently?",
        );

      if (
        !confirmed
      ) {
        return;
      }

      setActionOpportunityId(
        opportunity.id,
      );

      try {
        const {
          error,
        } =
          await supabase.rpc(
            "resident_delete_material_opportunity",
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
          "Offer deleted.",
        );

        await loadPageData(
          true,
        );
      } catch (
      error
      ) {
        toast.error(
          getErrorMessage(
            error,
            "Unable to delete the offer.",
          ),
        );
      } finally {
        setActionOpportunityId(
          null,
        );
      }
    };






  const openResponses =
    (
      opportunity: Opportunity,
    ) => {
      setSelectedOpportunity(
        opportunity,
      );

      setResponsesDialogOpen(
        true,
      );
    };


  const acceptResponse =
    async (
      response:
        OpportunityResponse,
    ) => {
      if (
        !selectedOpportunity ||
        acceptingResponseId
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Accept ${response.junkshop_name}'s offer of ${formatPeso(
            response.offered_price_per_kg,
          )}/kg?`,
        );

      if (
        !confirmed
      ) {
        return;
      }

      setAcceptingResponseId(
        response.id,
      );

      try {
        const apiResponse =
          await fetch(
            `/api/resident/opportunities/${selectedOpportunity.id}/accept`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  response_id:
                    response.id,
                }),
            },
          );

        const payload =
          await apiResponse
            .json()
            .catch(
              () => null,
            );

        if (
          !apiResponse.ok
        ) {
          throw new Error(
            payload?.error ??
            "Unable to accept the recycler offer.",
          );
        }

        toast.success(
          `${response.junkshop_name} was selected.`,
        );

        setResponsesDialogOpen(
          false,
        );

        setSelectedOpportunity(
          null,
        );

        await loadPageData(
          true,
        );

        setActiveTab(
          "accepted",
        );
      } catch (
      error
      ) {
        toast.error(
          getErrorMessage(
            error,
            "Unable to accept the recycler offer.",
          ),
        );
      } finally {
        setAcceptingResponseId(
          null,
        );
      }
    };


  if (
    loading
  ) {
    return (
      <OffersPageSkeleton />
    );
  }


  if (
    pageError ||
    !profile
  ) {
    return (
      <PageErrorState
        message={
          pageError ??
          "Resident account was not found."
        }
        onRetry={() =>
          void loadPageData()
        }
      />
    );
  }


  const selectedResponses =
    selectedOpportunity
      ? (
        responseMap.get(
          selectedOpportunity.id,
        ) ??
        []
      ).filter(
        (
          response,
        ) =>
          response.status ===
          "interested" ||
          response.status ===
          "accepted",
      )
      : [];


  return (
    <>
      <div className="space-y-7">
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
                Resident marketplace
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
                My Offers
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Post confirmed scanned materials, compare recycler offers,
                and choose how the recovery will happen.
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
                  void loadPageData(
                    true,
                  )
                }
                className="rounded-full border-green-200 text-green-700 hover:bg-green-50"
              >
                <RefreshCcw
                  className={`mr-2 h-4 w-4 ${refreshing
                      ? "animate-spin"
                      : ""
                    }`}
                />

                Refresh
              </Button>


              <Button
                type="button"
                disabled={
                  availableScans.length ===
                  0
                }
                onClick={() =>
                  openCreateDialog()
                }
                className="rounded-full bg-green-600 hover:bg-green-700"
              >
                <Plus className="mr-2 h-4 w-4" />

                Post an offer
              </Button>
            </div>
          </div>
        </section>


        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={
              Inbox
            }
            label="Open"
            value={
              openOffers.length
            }
            description="Waiting for recycler interest"
          />

          <SummaryCard
            icon={
              Handshake
            }
            label="With responses"
            value={
              offersWithResponses.length
            }
            description="Ready for comparison"
          />

          <SummaryCard
            icon={
              PackageCheck
            }
            label="Accepted"
            value={
              acceptedOffers.length
            }
            description="Assigned to a recycler"
          />

          <SummaryCard
            icon={
              CheckCircle2
            }
            label="Completed"
            value={
              historyOffers.filter(
                (
                  opportunity,
                ) =>
                  opportunity.status ===
                  "completed",
              ).length
            }
            description="Finished recoveries"
          />
        </section>


        <section className="overflow-x-auto rounded-[24px] border border-green-100 bg-white p-2 shadow-sm">
          <div className="flex min-w-max gap-2">
            <TabButton
              label="Open"
              count={
                openOffers.length
              }
              active={
                activeTab ===
                "open"
              }
              onClick={() =>
                setActiveTab(
                  "open",
                )
              }
            />

            <TabButton
              label="Responses"
              count={
                offersWithResponses.length
              }
              active={
                activeTab ===
                "responses"
              }
              onClick={() =>
                setActiveTab(
                  "responses",
                )
              }
            />

            <TabButton
              label="Accepted"
              count={
                acceptedOffers.length
              }
              active={
                activeTab ===
                "accepted"
              }
              onClick={() =>
                setActiveTab(
                  "accepted",
                )
              }
            />

            <TabButton
              label="History"
              count={
                historyOffers.length
              }
              active={
                activeTab ===
                "history"
              }
              onClick={() =>
                setActiveTab(
                  "history",
                )
              }
            />
          </div>
        </section>


        <section className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
          <div>
            <h2 className="text-xl font-black text-zinc-900">
              {activeTab ===
                "responses"
                ? "Recycler responses"
                : activeTab ===
                  "accepted"
                  ? "Accepted recoveries"
                  : activeTab ===
                    "history"
                    ? "Offer history"
                    : "Open offers"}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {displayedOffers.length}{" "}
              {displayedOffers.length ===
                1
                ? "offer"
                : "offers"}{" "}
              shown
            </p>
          </div>


          {displayedOffers.length ===
            0 ? (
            <EmptyOffersState
              tab={
                activeTab
              }
              canCreate={
                availableScans.length >
                0
              }
              onCreate={() =>
                openCreateDialog()
              }
              onScan={() =>
                router.push(
                  `${RESIDENT_BASE_PATH}/scan`,
                )
              }
            />
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {displayedOffers.map(
                (
                  opportunity,
                ) => {
                  const opportunityResponses =
                    (
                      responseMap.get(
                        opportunity.id,
                      ) ??
                      []
                    ).filter(
                      (
                        response,
                      ) =>
                        response.status ===
                        "interested" ||
                        response.status ===
                        "accepted",
                    );

                  const highestResponse =
                    opportunityResponses[0] ??
                    null;

                  const acceptedResponse =
                    opportunityResponses.find(
                      (
                        response,
                      ) =>
                        response.status ===
                        "accepted",
                    ) ??
                    null;

                  return (
                    <OfferCard
                      key={
                        opportunity.id
                      }
                      opportunity={
                        opportunity
                      }
                      responseCount={
                        opportunityResponses.filter(
                          (
                            response,
                          ) =>
                            response.status ===
                            "interested",
                        ).length
                      }
                      highestResponse={
                        highestResponse
                      }
                      acceptedResponse={
                        acceptedResponse
                      }
                      busy={
                        actionOpportunityId ===
                        opportunity.id
                      }
                      onEdit={() =>
                        openEditDialog(
                          opportunity,
                        )
                      }
                      onResponses={() =>
                        openResponses(
                          opportunity,
                        )
                      }
                      onCancel={() =>
                        void cancelOffer(
                          opportunity,
                        )
                      }
                      onDelete={() =>
                        void deleteOffer(
                          opportunity,
                        )
                      }

                    />
                  );
                },
              )}
            </div>
          )}
        </section>
      </div>


      <Dialog
        open={
          offerDialogOpen
        }
        onOpenChange={
          closeOfferDialog
        }
      >
        <DialogContent className="max-h-[92dvh] !w-[calc(100vw-1rem)] !max-w-none overflow-y-auto rounded-[26px] border border-green-200 !bg-white p-0 sm:!w-[620px]">
          <DialogHeader className="border-b border-green-100 p-5 text-left sm:p-6">
            <DialogTitle className="text-xl font-black text-zinc-900">
              {editingOpportunity
                ? "Edit offer"
                : "Post material offer"}
            </DialogTitle>

            <DialogDescription>
              Share the approximate quantity and preferred handoff method.
            </DialogDescription>
          </DialogHeader>


          <form
            onSubmit={
              saveOffer
            }
            className="space-y-5 p-5 sm:p-6"
          >
            {!editingOpportunity && (
              <div className="space-y-2">
                <Label htmlFor="offer_scan">
                  Confirmed scan
                </Label>

                <select
                  id="offer_scan"
                  value={
                    offerForm.scan_id
                  }
                  onChange={(
                    event,
                  ) => {
                    const nextScan =
                      scans.find(
                        (
                          scan,
                        ) =>
                          scan.id ===
                          event.target.value,
                      );

                    setOfferForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        scan_id:
                          event.target.value,

                        material_condition:
                          nextScan?.condition ??
                          current.material_condition,
                      }),
                    );
                  }}
                  className="h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="">
                    Select a confirmed scan
                  </option>

                  {availableScans.map(
                    (
                      scan,
                    ) => (
                      <option
                        key={
                          scan.id
                        }
                        value={
                          scan.id
                        }
                      >
                        {
                          scan.detected_object
                        }{" "}
                        ·{" "}
                        {
                          scan.material_type
                        }
                      </option>
                    ),
                  )}
                </select>
              </div>
            )}


            {editingOpportunity && (
              <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-green-700">
                  Material
                </p>

                <p className="mt-1 font-black text-zinc-900">
                  {
                    editingOpportunity.material_name
                  }
                </p>
              </div>
            )}


            <div className="space-y-2">
              <Label htmlFor="offer_weight">
                Estimated weight in kilograms
              </Label>

              <Input
                id="offer_weight"
                type="number"
                min="0.01"
                step="0.01"
                value={
                  offerForm.estimated_weight_kg
                }
                onChange={(
                  event,
                ) =>
                  setOfferForm(
                    (
                      current,
                    ) => ({
                      ...current,

                      estimated_weight_kg:
                        event.target.value,
                    }),
                  )
                }
                placeholder="Example: 4.5"
                className="h-12 rounded-xl border-zinc-300 focus-visible:ring-green-500"
              />
            </div>


            <div className="space-y-2">
              <Label htmlFor="offer_condition">
                Condition or notes
              </Label>

              <Textarea
                id="offer_condition"
                rows={4}
                maxLength={300}
                value={
                  offerForm.material_condition
                }
                onChange={(
                  event,
                ) =>
                  setOfferForm(
                    (
                      current,
                    ) => ({
                      ...current,

                      material_condition:
                        event.target.value,
                    }),
                  )
                }
                placeholder="Example: Clean, dry, and packed in one sack."
                className="resize-none rounded-xl border-zinc-300 focus-visible:ring-green-500"
              />

              <p className="text-right text-xs text-zinc-400">
                {
                  offerForm
                    .material_condition
                    .length
                }
                /300
              </p>
            </div>


            <div className="space-y-2">
              <Label htmlFor="offer_method">
                Handoff method
              </Label>

              <select
                id="offer_method"
                value={
                  offerForm.fulfillment_method
                }
                onChange={(
                  event,
                ) =>
                  setOfferForm(
                    (
                      current,
                    ) => ({
                      ...current,

                      fulfillment_method:
                        event.target
                          .value as FulfillmentMethod,
                    }),
                  )
                }
                className="h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              >
                <option value="either">
                  Pickup or drop-off
                </option>

                <option value="pickup">
                  I need pickup
                </option>

                <option value="drop_off">
                  I will drop it off
                </option>
              </select>
            </div>


            <div className="rounded-2xl bg-zinc-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-zinc-400">
                Approximate location
              </p>

              <p className="mt-1 text-sm font-semibold text-zinc-700">
                {[
                  profile.barangay,
                  profile.city,
                  profile.province,
                ]
                  .filter(
                    Boolean,
                  )
                  .join(
                    ", ",
                  ) ||
                  "Complete your profile location first"}
              </p>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Your exact home address is not included in the public listing.
              </p>
            </div>


            <div className="flex justify-end gap-2 border-t border-zinc-100 pt-5">
              <Button
                type="button"
                variant="ghost"
                disabled={
                  savingOffer
                }
                onClick={() =>
                  closeOfferDialog(
                    false,
                  )
                }
                className="rounded-full"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  savingOffer ||
                  (
                    !editingOpportunity &&
                    !offerForm.scan_id
                  ) ||
                  !offerForm.estimated_weight_kg
                }
                className="rounded-full bg-green-600 px-6 hover:bg-green-700"
              >
                {savingOffer && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                {savingOffer
                  ? "Saving..."
                  : editingOpportunity
                    ? "Save changes"
                    : "Post offer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>


      <Dialog
        open={
          responsesDialogOpen
        }
        onOpenChange={(
          open,
        ) => {
          if (
            acceptingResponseId
          ) {
            return;
          }

          setResponsesDialogOpen(
            open,
          );

          if (
            !open
          ) {
            setSelectedOpportunity(
              null,
            );
          }
        }}
      >
        <DialogContent className="max-h-[92dvh] !w-[calc(100vw-1rem)] !max-w-none overflow-y-auto rounded-[26px] border border-green-200 !bg-white p-0 sm:!w-[760px]">
          <DialogHeader className="border-b border-green-100 p-5 text-left sm:p-6">
            <DialogTitle className="text-xl font-black text-zinc-900">
              Compare recycler offers
            </DialogTitle>

            <DialogDescription>
              Consider the price, pickup option, location, and recycler message.
            </DialogDescription>
          </DialogHeader>


          {selectedOpportunity && (
            <div className="space-y-5 p-5 sm:p-6">
              <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      {
                        selectedOpportunity.material_name
                      }
                    </p>

                    <p className="mt-1 text-lg font-black text-zinc-900">
                      {
                        selectedOpportunity.estimated_weight_kg
                      }{" "}
                      kg estimated
                    </p>
                  </div>

                  <Badge className="border-green-200 bg-white text-green-700 hover:bg-white">
                    {
                      selectedResponses.length
                    }{" "}
                    response
                    {
                      selectedResponses.length ===
                        1
                        ? ""
                        : "s"
                    }
                  </Badge>
                </div>
              </div>


              {selectedResponses.length ===
                0 ? (
                <div className="rounded-2xl border border-dashed border-green-200 bg-green-50 p-8 text-center">
                  <Inbox className="mx-auto h-8 w-8 text-green-600" />

                  <h3 className="mt-3 font-black text-zinc-900">
                    No active recycler response
                  </h3>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedResponses.map(
                    (
                      response,
                      index,
                    ) => {
                      const total =
                        response.offered_price_per_kg *
                        selectedOpportunity.estimated_weight_kg;

                      const location =
                        [
                          response.barangay,
                          response.city,
                          response.province,
                        ]
                          .filter(
                            Boolean,
                          )
                          .join(
                            ", ",
                          );

                      return (
                        <article
                          key={
                            response.id
                          }
                          className="rounded-[22px] border border-zinc-200 bg-white p-4"
                        >
                          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                                  #{index +
                                    1}
                                </Badge>

                                {index ===
                                  0 && (
                                    <Badge className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">
                                      Highest price
                                    </Badge>
                                  )}

                                {response.pickup_available && (
                                  <Badge className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
                                    Pickup available
                                  </Badge>
                                )}
                              </div>

                              <h3 className="mt-3 text-lg font-black text-zinc-900">
                                {
                                  response.junkshop_name
                                }
                              </h3>

                              <p className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
                                <MapPin className="h-4 w-4 text-green-600" />

                                {location ||
                                  "Location not provided"}
                              </p>
                            </div>


                            <div className="sm:text-right">
                              <p className="text-2xl font-black text-green-700">
                                {formatPeso(
                                  response.offered_price_per_kg,
                                )}
                                <span className="ml-1 text-sm text-zinc-400">
                                  /kg
                                </span>
                              </p>

                              <p className="mt-1 text-sm font-bold text-zinc-700">
                                About{" "}
                                {formatPeso(
                                  total,
                                )}{" "}
                                total
                              </p>
                            </div>
                          </div>


                          {response.message && (
                            <p className="mt-4 rounded-2xl bg-zinc-50 p-3 text-sm leading-6 text-zinc-600">
                              {
                                response.message
                              }
                            </p>
                          )}


                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-zinc-400">
                              Responded{" "}
                              {formatRelativeDate(
                                response.created_at,
                              )}
                            </p>

                            {selectedOpportunity.status ===
                              "open" && (
                                <Button
                                  type="button"
                                  disabled={
                                    Boolean(
                                      acceptingResponseId,
                                    )
                                  }
                                  onClick={() =>
                                    void acceptResponse(
                                      response,
                                    )
                                  }
                                  className="rounded-full bg-green-600 hover:bg-green-700"
                                >
                                  {acceptingResponseId ===
                                    response.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <BadgeCheck className="mr-2 h-4 w-4" />
                                  )}

                                  Accept offer
                                </Button>
                              )}
                          </div>
                        </article>
                      );
                    },
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}


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
    <div className="rounded-[22px] border border-green-100 bg-white p-5 shadow-sm">
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


function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition ${active
          ? "bg-green-600 text-white"
          : "text-zinc-500 hover:bg-green-50 hover:text-green-700"
        }`}
    >
      {label}

      <span
        className={`rounded-full px-2 py-0.5 text-xs ${active
            ? "bg-white/20 text-white"
            : "bg-zinc-100 text-zinc-500"
          }`}
      >
        {count}
      </span>
    </button>
  );
}


function OfferCard({
  opportunity,
  responseCount,
  highestResponse,
  acceptedResponse,
  busy,
  onEdit,
  onResponses,
  onCancel,
  onDelete,
}: {
  opportunity: Opportunity;
  responseCount: number;
  highestResponse:
  OpportunityResponse | null;
  acceptedResponse:
  OpportunityResponse | null;
  busy: boolean;
  onEdit: () => void;
  onResponses: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const displayedResponse =
    acceptedResponse ??
    highestResponse;

  const estimatedTotal =
    displayedResponse
      ? displayedResponse
        .offered_price_per_kg *
      opportunity.estimated_weight_kg
      : 0;

  return (
    <article className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-sm transition hover:border-green-300 hover:shadow-md">
      <div className="relative h-44 bg-green-50">
        {opportunity.image_url ? (
          <img
            src={
              opportunity.image_url
            }
            alt={
              opportunity.material_name
            }
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-12 w-12 text-green-600" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

        <div className="absolute bottom-4 left-4 right-4">
          <Badge className="border-white/20 bg-black/30 text-white hover:bg-black/30">
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
          <Metric
            icon={
              Scale
            }
            label="Estimated weight"
            value={`${opportunity.estimated_weight_kg} kg`}
          />

          <Metric
            icon={
              responseCount >
                0
                ? WalletCards
                : Clock3
            }
            label={
              displayedResponse
                ? "Estimated value"
                : "Status"
            }
            value={
              displayedResponse
                ? formatPeso(
                  estimatedTotal,
                )
                : "Waiting"
            }
          />
        </div>


        <div className="mt-4 space-y-3 text-sm text-zinc-500">
          <p className="flex items-start gap-2">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />

            {getFulfillmentLabel(
              opportunity.fulfillment_method,
            )}
          </p>

          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />

            {getLocationText(
              opportunity,
            )}
          </p>
        </div>


        {opportunity.material_condition && (
          <p className="mt-4 rounded-2xl bg-zinc-50 p-3 text-sm leading-6 text-zinc-600">
            {
              opportunity.material_condition
            }
          </p>
        )}


        {acceptedResponse && (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">
              Selected recycler
            </p>

            <p className="mt-1 font-black text-zinc-900">
              {
                acceptedResponse.junkshop_name
              }
            </p>

            <p className="mt-1 text-sm text-zinc-600">
              {formatPeso(
                acceptedResponse.offered_price_per_kg,
              )}
              /kg
              {acceptedResponse.pickup_available
                ? " · Pickup available"
                : ""}
            </p>
          </div>
        )}


        <div className="mt-5 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Clock3 className="h-3.5 w-3.5" />

            {formatRelativeDate(
              opportunity.created_at,
            )}
          </div>

          <Badge
            variant="outline"
            className={statusBadgeClass(
              opportunity.status,
            )}
          >
            {
              opportunity.status
            }
          </Badge>
        </div>


        <div className="mt-5 flex flex-wrap gap-2">
          {opportunity.status ===
            "open" &&
            responseCount ===
            0 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    busy
                  }
                  onClick={
                    onEdit
                  }
                  className="flex-1 rounded-full border-green-200 text-green-700 hover:bg-green-50"
                >
                  <Edit3 className="mr-2 h-4 w-4" />

                  Edit
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    busy
                  }
                  onClick={
                    onDelete
                  }
                  className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </>
            )}


          {opportunity.status ===
            "open" &&
            responseCount >
            0 && (
              <>
                <Button
                  type="button"
                  onClick={
                    onResponses
                  }
                  className="flex-1 rounded-full bg-green-600 hover:bg-green-700"
                >
                  <Handshake className="mr-2 h-4 w-4" />

                  Compare{" "}
                  {responseCount}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    busy
                  }
                  onClick={
                    onCancel
                  }
                  className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Undo2 className="h-4 w-4" />
                  )}
                </Button>
              </>
            )}


          {opportunity.status === "accepted" && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onResponses}
                className="flex-1 rounded-full border-green-200 text-green-700 hover:bg-green-50"
              >
                View details
              </Button>

              <div
                className="
        flex flex-1 items-center justify-center gap-2
        rounded-full border border-blue-200
        bg-blue-50 px-4 py-2.5
        text-sm font-bold text-blue-700
      "
              >
                <Clock3 className="h-4 w-4" />

                Awaiting recycler confirmation
              </div>
            </>
          )}


          {opportunity.status ===
            "cancelled" && (
              <div className="flex flex-1 items-center justify-center rounded-full bg-zinc-100 px-4 py-2.5 text-sm font-bold text-zinc-600">
                Offer cancelled
              </div>
            )}


          {opportunity.status ===
            "completed" && (
              <div className="flex flex-1 items-center justify-center rounded-full bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700">
                <CheckCircle2 className="mr-2 h-4 w-4" />

                Recovery completed
              </div>
            )}
        </div>
      </div>
    </article>
  );
}


function Metric({
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

        <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
          {label}
        </p>
      </div>

      <p className="mt-2 font-black text-zinc-900">
        {value}
      </p>
    </div>
  );
}


function EmptyOffersState({
  tab,
  canCreate,
  onCreate,
  onScan,
}: {
  tab: OffersTab;
  canCreate: boolean;
  onCreate: () => void;
  onScan: () => void;
}) {
  const copy =
    tab ===
      "responses"
      ? {
        title:
          "No recycler responses yet",

        description:
          "When recyclers respond to your open listings, they will appear here.",
      }
      : tab ===
        "accepted"
        ? {
          title:
            "No accepted recovery",

          description:
            "Choose a recycler response first, then the accepted recovery will appear here.",
        }
        : tab ===
          "history"
          ? {
            title:
              "No offer history",

            description:
              "Completed and cancelled offers will appear here.",
          }
          : {
            title:
              "No open offer",

            description:
              "Post one of your confirmed scans so matching recyclers can respond.",
          };

  return (
    <div className="mt-6 flex flex-col items-center rounded-[24px] border border-dashed border-green-200 bg-green-50 px-6 py-12 text-center">
      <Inbox className="h-8 w-8 text-green-600" />

      <h3 className="mt-4 text-lg font-black text-zinc-900">
        {
          copy.title
        }
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
        {
          copy.description
        }
      </p>

      {tab ===
        "open" && (
          <Button
            type="button"
            onClick={
              canCreate
                ? onCreate
                : onScan
            }
            className="mt-5 rounded-full bg-green-600 hover:bg-green-700"
          >
            {canCreate ? (
              <>
                <Plus className="mr-2 h-4 w-4" />

                Post an offer
              </>
            ) : (
              <>
                <Package className="mr-2 h-4 w-4" />

                Scan an item
              </>
            )}
          </Button>
        )}
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
    <div className="mx-auto flex min-h-[65vh] max-w-xl items-center">
      <div className="w-full rounded-[28px] border border-red-100 bg-white p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto h-10 w-10 text-red-600" />

        <h1 className="mt-4 text-xl font-black text-zinc-900">
          My Offers unavailable
        </h1>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {
            message
          }
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


function OffersPageSkeleton() {
  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40 bg-green-100" />

        <Skeleton className="h-9 w-72 bg-green-100" />

        <Skeleton className="h-4 w-96 max-w-full bg-green-100" />
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
              className="h-32 rounded-[22px] bg-green-100"
            />
          ),
        )}
      </div>

      <Skeleton className="h-16 rounded-[24px] bg-green-100" />

      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-[520px] rounded-[24px] bg-green-100" />

        <Skeleton className="h-[520px] rounded-[24px] bg-green-100" />
      </div>
    </div>
  );
}
