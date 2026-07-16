"use client";

import type {
    ComponentType,
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
    ArrowRight,
    BadgeCheck,
    BellRing,
    CheckCircle2,
    Clock3,
    Handshake,
    Inbox,
    Loader2,
    MapPin,
    Package,
    PackageCheck,
    Power,
    RefreshCcw,
    Scale,
    Settings2,
    Store,
    Truck,
    UserRound,
    WalletCards,
} from "lucide-react";

import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";


/* =========================================================
   TYPES
========================================================= */

interface Profile {
    id: string;
    auth_id: string;
    full_name: string;
    avatar_url: string | null;
    role: string;
}


interface OperatingHours {
    days?: string[];
    opens?: string;
    closes?: string;
}


interface Junkshop {
    id: string;
    profile_id: string;
    junkshop_name: string;
    description: string | null;
    photo_url: string | null;
    address_line: string;
    barangay: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
    contact_number: string | null;
    contact_email: string | null;
    operating_hours: OperatingHours | null;

    verification_status:
        | "pending"
        | "approved"
        | "rejected"
        | "suspended";

    is_active: boolean;
}


interface JunkshopMaterialRow {
    material_id: string;

    price_per_kg:
        | number
        | string;

    is_accepting: boolean;
}


interface MaterialRelation {
    id: string;
    material_name: string;
    category: string;
}


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


interface OpportunityDatabaseRow {
    id: string;
    resident_profile_id: string;
    material_id: string;
    image_url: string | null;

    estimated_weight_kg:
        | number
        | string;

    material_condition: string | null;

    fulfillment_method:
        FulfillmentMethod;

    barangay: string;
    city: string;
    province: string | null;

    status: OpportunityStatus;

    selected_junkshop_id:
        | string
        | null;

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


interface OpportunityResponse {
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
}


interface PriorityAlert {
    title: string;
    description: string;
    actionLabel: string;
    actionRoute: string;

    icon:
        ComponentType<{
            className?: string;
        }>;

    containerClass: string;
    iconClass: string;
    buttonClass: string;
}


/* =========================================================
   FORMATTERS
========================================================= */

const pesoFormatter =
    new Intl.NumberFormat(
        "en-PH",
        {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    );


function formatPeso(
    value: number
) {
    return pesoFormatter.format(
        Number.isFinite(value)
            ? value
            : 0
    );
}


function getInitials(
    value: string
) {
    return value
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(
            (
                part
            ) =>
                part
                    .charAt(0)
                    .toUpperCase()
        )
        .join("");
}


function getFirstName(
    value: string
) {
    return (
        value
            .trim()
            .split(/\s+/)[0] ||
        "Partner"
    );
}


function normalizeMaterialRelation(
    relation:
        | MaterialRelation
        | MaterialRelation[]
        | null
) {
    if (
        Array.isArray(
            relation
        )
    ) {
        return relation[0] ?? null;
    }

    return relation;
}


function normalizeOpportunity(
    row: OpportunityDatabaseRow
): Opportunity {
    const material =
        normalizeMaterialRelation(
            row.materials
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

        image_url:
            row.image_url,

        estimated_weight_kg:
            Number(
                row.estimated_weight_kg ??
                0
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
}


function formatRelativeDate(
    value: string
) {
    const timestamp =
        new Date(
            value
        ).getTime();

    const difference =
        Math.max(
            0,
            Date.now() -
            timestamp
        );

    const minutes =
        Math.floor(
            difference /
            60_000
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
            minutes / 60
        );

    if (
        hours <
        24
    ) {
        return `${hours} hr${
            hours === 1
                ? ""
                : "s"
        } ago`;
    }

    const days =
        Math.floor(
            hours / 24
        );

    if (
        days <
        7
    ) {
        return `${days} day${
            days === 1
                ? ""
                : "s"
        } ago`;
    }

    return new Date(
        value
    ).toLocaleDateString(
        "en-PH",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
        }
    );
}


function getLocationText(
    opportunity: Opportunity
) {
    return [
        opportunity.barangay,
        opportunity.city,
        opportunity.province,
    ]
        .filter(
            Boolean
        )
        .join(
            ", "
        );
}


function getFulfillmentLabel(
    method: FulfillmentMethod
) {
    switch (
        method
    ) {
        case "pickup":
            return "Pickup requested";

        case "either":
            return "Pickup or drop-off";

        default:
            return "Resident drop-off";
    }
}


/* =========================================================
   PRIORITY ALERT
========================================================= */

function getPriorityAlert(
    junkshop: Junkshop,
    activeMaterialCount: number,
    profileCompleteness: number
): PriorityAlert | null {
    if (
        junkshop.verification_status ===
        "suspended"
    ) {
        return {
            title:
                "Your junkshop is suspended",

            description:
                "The shop is currently unavailable to residents. Review the profile or contact the administrator before accepting new recoveries.",

            actionLabel:
                "View shop profile",

            actionRoute:
                "/profiles/recycler/profile",

            icon:
                AlertCircle,

            containerClass:
                "border-orange-200 bg-orange-50",

            iconClass:
                "bg-orange-100 text-orange-700",

            buttonClass:
                "border-orange-200 bg-white text-orange-700 hover:bg-orange-100",
        };
    }


    if (
        junkshop.verification_status ===
        "rejected"
    ) {
        return {
            title:
                "Your profile needs correction",

            description:
                "Review the junkshop information and correct any missing or inaccurate business details.",

            actionLabel:
                "Review profile",

            actionRoute:
                "/profiles/recycler/profile",

            icon:
                AlertCircle,

            containerClass:
                "border-red-200 bg-red-50",

            iconClass:
                "bg-red-100 text-red-700",

            buttonClass:
                "border-red-200 bg-white text-red-700 hover:bg-red-100",
        };
    }


    if (
        !junkshop.is_active
    ) {
        return {
            title:
                "Your junkshop is paused",

            description:
                "Residents cannot currently discover the shop or send new matching opportunities.",

            actionLabel:
                "Activate in profile",

            actionRoute:
                "/profiles/recycler/profile",

            icon:
                Power,

            containerClass:
                "border-zinc-200 bg-zinc-50",

            iconClass:
                "bg-zinc-200 text-zinc-700",

            buttonClass:
                "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100",
        };
    }


    if (
        activeMaterialCount ===
        0
    ) {
        return {
            title:
                "Add accepted materials",

            description:
                "Trashure matches resident opportunities using the materials your junkshop is actively buying.",

            actionLabel:
                "Manage materials",

            actionRoute:
                "/profiles/recycler/materials",

            icon:
                PackageCheck,

            containerClass:
                "border-green-200 bg-green-50",

            iconClass:
                "bg-green-100 text-green-700",

            buttonClass:
                "border-green-200 bg-white text-green-700 hover:bg-green-100",
        };
    }


    if (
        profileCompleteness <
        70
    ) {
        return {
            title:
                "Complete your junkshop profile",

            description:
                "Add the missing shop photo, address, contact number, and operating schedule to improve resident trust.",

            actionLabel:
                "Complete profile",

            actionRoute:
                "/profiles/recycler/profile",

            icon:
                UserRound,

            containerClass:
                "border-green-200 bg-green-50",

            iconClass:
                "bg-green-100 text-green-700",

            buttonClass:
                "border-green-200 bg-white text-green-700 hover:bg-green-100",
        };
    }


    if (
        junkshop.verification_status ===
        "pending"
    ) {
        return {
            title:
                "Verification is still pending",

            description:
                "You may manage materials and review opportunities while the junkshop profile is being checked.",

            actionLabel:
                "View verification",

            actionRoute:
                "/profiles/recycler/profile",

            icon:
                Clock3,

            containerClass:
                "border-amber-200 bg-amber-50",

            iconClass:
                "bg-amber-100 text-amber-700",

            buttonClass:
                "border-amber-200 bg-white text-amber-700 hover:bg-amber-100",
        };
    }


    return null;
}


/* =========================================================
   PAGE
========================================================= */

export default function RecyclerHomePage() {
    const router =
        useRouter();

    const supabase =
        useMemo(
            () =>
                createClient(),
            []
        );


    const [
        greeting,
        setGreeting,
    ] =
        useState(
            "Welcome back"
        );


    const [
        profile,
        setProfile,
    ] =
        useState<Profile | null>(
            null
        );

    const [
        junkshop,
        setJunkshop,
    ] =
        useState<Junkshop | null>(
            null
        );

    const [
        activeMaterialCount,
        setActiveMaterialCount,
    ] =
        useState(
            0
        );

    const [
        materialPrices,
        setMaterialPrices,
    ] =
        useState<
            Record<
                string,
                number
            >
        >({});

    const [
        openOpportunities,
        setOpenOpportunities,
    ] =
        useState<Opportunity[]>(
            []
        );

    const [
        acceptedOpportunities,
        setAcceptedOpportunities,
    ] =
        useState<Opportunity[]>(
            []
        );

    const [
        responses,
        setResponses,
    ] =
        useState<
            OpportunityResponse[]
        >([]);


    const [
        loading,
        setLoading,
    ] =
        useState(
            true
        );

    const [
        refreshing,
        setRefreshing,
    ] =
        useState(
            false
        );

    const [
        pageError,
        setPageError,
    ] =
        useState<
            string | null
        >(
            null
        );


    useEffect(
        () => {
            const hour =
                new Date().getHours();

            if (
                hour <
                12
            ) {
                setGreeting(
                    "Good morning"
                );
            } else if (
                hour <
                18
            ) {
                setGreeting(
                    "Good afternoon"
                );
            } else {
                setGreeting(
                    "Good evening"
                );
            }
        },
        []
    );


    const loadDashboard =
        useCallback(
            async (
                silent = false
            ) => {
                if (
                    silent
                ) {
                    setRefreshing(
                        true
                    );
                } else {
                    setLoading(
                        true
                    );
                }

                setPageError(
                    null
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
                            "/login"
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
                                "profiles"
                            )
                            .select(`
                                id,
                                auth_id,
                                full_name,
                                avatar_url,
                                role
                            `)
                            .eq(
                                "auth_id",
                                user.id
                            )
                            .single();

                    if (
                        profileError ||
                        !profileData
                    ) {
                        throw (
                            profileError ??
                            new Error(
                                "Recycler profile was not found."
                            )
                        );
                    }

                    const currentProfile =
                        profileData as Profile;

                    if (
                        currentProfile.role !==
                        "recycler_partner"
                    ) {
                        throw new Error(
                            "This dashboard is available only to recycler partners."
                        );
                    }

                    setProfile(
                        currentProfile
                    );


                    const {
                        data:
                            junkshopData,
                        error:
                            junkshopError,
                    } =
                        await supabase
                            .from(
                                "junkshops"
                            )
                            .select(`
                                id,
                                profile_id,
                                junkshop_name,
                                description,
                                photo_url,
                                address_line,
                                barangay,
                                city,
                                province,
                                postal_code,
                                contact_number,
                                contact_email,
                                operating_hours,
                                verification_status,
                                is_active
                            `)
                            .eq(
                                "profile_id",
                                currentProfile.id
                            )
                            .maybeSingle();

                    if (
                        junkshopError
                    ) {
                        throw junkshopError;
                    }

                    const currentJunkshop =
                        (
                            junkshopData as
                                | Junkshop
                                | null
                        ) ?? null;

                    setJunkshop(
                        currentJunkshop
                    );


                    if (
                        !currentJunkshop
                    ) {
                        setActiveMaterialCount(
                            0
                        );

                        setMaterialPrices(
                            {}
                        );

                        setOpenOpportunities(
                            []
                        );

                        setAcceptedOpportunities(
                            []
                        );

                        setResponses(
                            []
                        );

                        return;
                    }


                    const {
                        data:
                            materialRows,
                        error:
                            materialError,
                    } =
                        await supabase
                            .from(
                                "junkshop_materials"
                            )
                            .select(`
                                material_id,
                                price_per_kg,
                                is_accepting
                            `)
                            .eq(
                                "junkshop_id",
                                currentJunkshop.id
                            );

                    if (
                        materialError
                    ) {
                        throw materialError;
                    }

                    const acceptedRows =
                        (
                            materialRows ??
                            []
                        ) as JunkshopMaterialRow[];

                    const activeRows =
                        acceptedRows.filter(
                            (
                                material
                            ) =>
                                material.is_accepting
                        );

                    const activeMaterialIds =
                        activeRows.map(
                            (
                                material
                            ) =>
                                material.material_id
                        );

                    const nextPriceMap =
                        activeRows.reduce<
                            Record<
                                string,
                                number
                            >
                        >(
                            (
                                result,
                                material
                            ) => {
                                result[
                                    material.material_id
                                ] =
                                    Number(
                                        material.price_per_kg ??
                                        0
                                    );

                                return result;
                            },
                            {}
                        );

                    setActiveMaterialCount(
                        activeRows.length
                    );

                    setMaterialPrices(
                        nextPriceMap
                    );


                    let normalizedOpenOpportunities:
                        Opportunity[] = [];

                    if (
                        activeMaterialIds.length >
                        0
                    ) {
                        const {
                            data:
                                openOpportunityRows,
                            error:
                                openOpportunityError,
                        } =
                            await supabase
                                .from(
                                    "material_opportunities"
                                )
                                .select(`
                                    id,
                                    resident_profile_id,
                                    material_id,
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
                                    "status",
                                    "open"
                                )
                                .in(
                                    "material_id",
                                    activeMaterialIds
                                )
                                .order(
                                    "created_at",
                                    {
                                        ascending:
                                            false,
                                    }
                                );

                        if (
                            openOpportunityError
                        ) {
                            throw openOpportunityError;
                        }

                        normalizedOpenOpportunities =
                            (
                                (
                                    openOpportunityRows ??
                                    []
                                ) as OpportunityDatabaseRow[]
                            ).map(
                                normalizeOpportunity
                            );
                    }

                    setOpenOpportunities(
                        normalizedOpenOpportunities
                    );


                    const {
                        data:
                            acceptedOpportunityRows,
                        error:
                            acceptedOpportunityError,
                    } =
                        await supabase
                            .from(
                                "material_opportunities"
                            )
                            .select(`
                                id,
                                resident_profile_id,
                                material_id,
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
                                "selected_junkshop_id",
                                currentJunkshop.id
                            )
                            .eq(
                                "status",
                                "accepted"
                            )
                            .order(
                                "updated_at",
                                {
                                    ascending:
                                        false,
                                }
                            );

                    if (
                        acceptedOpportunityError
                    ) {
                        throw acceptedOpportunityError;
                    }

                    setAcceptedOpportunities(
                        (
                            (
                                acceptedOpportunityRows ??
                                []
                            ) as OpportunityDatabaseRow[]
                        ).map(
                            normalizeOpportunity
                        )
                    );


                    const {
                        data:
                            responseRows,
                        error:
                            responseError,
                    } =
                        await supabase
                            .from(
                                "opportunity_responses"
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
                                updated_at
                            `)
                            .eq(
                                "junkshop_id",
                                currentJunkshop.id
                            );

                    if (
                        responseError
                    ) {
                        throw responseError;
                    }

                    setResponses(
                        (
                            responseRows ??
                            []
                        ) as OpportunityResponse[]
                    );
                } catch (
                    error
                ) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : "Unable to load the recycler dashboard.";

                    setPageError(
                        message
                    );

                    if (
                        silent
                    ) {
                        toast.error(
                            message
                        );
                    }
                } finally {
                    setLoading(
                        false
                    );

                    setRefreshing(
                        false
                    );
                }
            },
            [
                router,
                supabase,
            ]
        );


    useEffect(
        () => {
            void loadDashboard();
        },
        [
            loadDashboard,
        ]
    );


    const responseMap =
        useMemo(
            () =>
                new Map(
                    responses.map(
                        (
                            response
                        ) => [
                            response.opportunity_id,
                            response,
                        ]
                    )
                ),
            [
                responses,
            ]
        );


    const availableOpportunities =
        useMemo(
            () =>
                openOpportunities.filter(
                    (
                        opportunity
                    ) => {
                        const response =
                            responseMap.get(
                                opportunity.id
                            );

                        return (
                            !response ||
                            response.status ===
                                "withdrawn" ||
                            response.status ===
                                "declined"
                        );
                    }
                ),
            [
                openOpportunities,
                responseMap,
            ]
        );


    const waitingOpportunities =
        useMemo(
            () =>
                openOpportunities.filter(
                    (
                        opportunity
                    ) =>
                        responseMap.get(
                            opportunity.id
                        )?.status ===
                        "interested"
                ),
            [
                openOpportunities,
                responseMap,
            ]
        );


    const profileCompleteness =
        useMemo(
            () => {
                if (
                    !junkshop
                ) {
                    return 0;
                }

                const requiredValues = [
                    junkshop.junkshop_name,
                    junkshop.photo_url,
                    junkshop.address_line,
                    junkshop.barangay,
                    junkshop.city,
                    junkshop.province,
                    junkshop.contact_number,
                    junkshop.operating_hours
                        ?.days?.length,
                    activeMaterialCount >
                    0,
                ];

                const completed =
                    requiredValues.filter(
                        Boolean
                    ).length;

                return Math.round(
                    (
                        completed /
                        requiredValues.length
                    ) *
                    100
                );
            },
            [
                activeMaterialCount,
                junkshop,
            ]
        );


    const priorityAlert =
        useMemo(
            () =>
                junkshop
                    ? getPriorityAlert(
                          junkshop,
                          activeMaterialCount,
                          profileCompleteness
                      )
                    : null,
            [
                activeMaterialCount,
                junkshop,
                profileCompleteness,
            ]
        );


    if (
        loading
    ) {
        return (
            <RecyclerHomeSkeleton />
        );
    }


    if (
        pageError ||
        !profile
    ) {
        return (
            <DashboardErrorState
                message={
                    pageError ??
                    "Recycler account was not found."
                }
                onRetry={() =>
                    void loadDashboard()
                }
            />
        );
    }


    const verificationBadge =
        junkshop?.verification_status ===
        "approved"
            ? {
                  label:
                      "Verified",

                  className:
                      "border-green-200 bg-green-50 text-green-700",

                  icon:
                      BadgeCheck,
              }
            : junkshop?.verification_status ===
              "rejected"
              ? {
                    label:
                        "Needs correction",

                    className:
                        "border-red-200 bg-red-50 text-red-700",

                    icon:
                        AlertCircle,
                }
              : junkshop?.verification_status ===
                "suspended"
                ? {
                      label:
                          "Suspended",

                      className:
                          "border-orange-200 bg-orange-50 text-orange-700",

                      icon:
                          AlertCircle,
                  }
                : {
                      label:
                          "Pending verification",

                      className:
                          "border-amber-200 bg-amber-50 text-amber-700",

                      icon:
                          Clock3,
                  };

    const VerificationIcon =
        verificationBadge.icon;


    return (
        <>
            <style jsx global>{`
                @keyframes trashureFadeUp {
                    from {
                        opacity: 0;
                        transform: translateY(9px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes trashureSoftScale {
                    from {
                        opacity: 0;
                        transform: scale(0.985);
                    }

                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .trashure-motion {
                        animation: none !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>


            <div className="space-y-7">
                {/* HEADER */}

                <section className="trashure-motion animate-[trashureFadeUp_.35s_ease-out_both]">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-sm font-bold text-green-600">
                                Recycler workspace
                            </p>

                            <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
                                {greeting},{" "}
                                {getFirstName(
                                    profile.full_name
                                )}
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                                Review recoveries, respond to residents, and
                                keep your junkshop ready for incoming
                                materials.
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
                                    void loadDashboard(
                                        true
                                    )
                                }
                                className="rounded-full border-green-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-50 hover:text-green-700"
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
                                        "/profiles/recycler/opportunities"
                                    )
                                }
                                className="rounded-full bg-green-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700"
                            >
                                <Inbox className="mr-2 h-4 w-4" />

                                View opportunities
                            </Button>
                        </div>
                    </div>
                </section>


                {!junkshop ? (
                    <MissingJunkshopHome
                        profile={
                            profile
                        }
                        onSetup={() =>
                            router.push(
                                "/profiles/recycler/profile"
                            )
                        }
                    />
                ) : (
                    <>
                        {/* SHOP HERO */}

                        <section className="trashure-motion animate-[trashureSoftScale_.4s_ease-out_.04s_both] overflow-hidden rounded-[32px] border border-green-100 bg-white shadow-sm">
                            <div className="relative min-h-56 overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-emerald-800 p-6 text-white sm:p-8">
                                {junkshop.photo_url && (
                                    <>
                                        <img
                                            src={
                                                junkshop.photo_url
                                            }
                                            alt={
                                                junkshop.junkshop_name
                                            }
                                            className="absolute inset-0 h-full w-full object-cover opacity-25"
                                        />

                                        <div className="absolute inset-0 bg-gradient-to-r from-green-950/90 via-emerald-800/80 to-emerald-700/60" />
                                    </>
                                )}

                                <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10" />

                                <div className="relative flex min-h-40 flex-col justify-between gap-7 sm:flex-row sm:items-end">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-16 w-16 shrink-0 border-2 border-white/70 bg-white shadow-lg">
                                            <AvatarImage
                                                src={
                                                    profile.avatar_url ??
                                                    undefined
                                                }
                                                alt={
                                                    profile.full_name
                                                }
                                                className="object-cover"
                                            />

                                            <AvatarFallback className="bg-green-100 font-black text-green-700">
                                                {getInitials(
                                                    profile.full_name
                                                )}
                                            </AvatarFallback>
                                        </Avatar>


                                        <div>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge className="border-white/20 bg-white/15 text-white hover:bg-white/15">
                                                    <Store className="mr-1.5 h-3.5 w-3.5" />

                                                    Recovery partner
                                                </Badge>

                                                <Badge className="border-white/20 bg-black/20 text-white hover:bg-black/20">
                                                    <Power className="mr-1.5 h-3.5 w-3.5" />

                                                    {junkshop.is_active
                                                        ? "Active"
                                                        : "Paused"}
                                                </Badge>
                                            </div>

                                            <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                                                {
                                                    junkshop.junkshop_name
                                                }
                                            </h2>

                                            <p className="mt-2 flex items-center gap-2 text-sm text-green-50/85">
                                                <MapPin className="h-4 w-4" />

                                                {[
                                                    junkshop.barangay,
                                                    junkshop.city,
                                                    junkshop.province,
                                                ]
                                                    .filter(
                                                        Boolean
                                                    )
                                                    .join(
                                                        ", "
                                                    ) ||
                                                    "Location not provided"}
                                            </p>
                                        </div>
                                    </div>


                                    <div className="flex flex-wrap gap-2">
                                        <Badge
                                            variant="outline"
                                            className={`border-white/30 bg-white text-sm ${verificationBadge.className}`}
                                        >
                                            <VerificationIcon className="mr-1.5 h-3.5 w-3.5" />

                                            {
                                                verificationBadge.label
                                            }
                                        </Badge>

                                        <Button
                                            type="button"
                                            onClick={() =>
                                                router.push(
                                                    "/profiles/recycler/profile"
                                                )
                                            }
                                            className="rounded-full bg-white text-green-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-50"
                                        >
                                            <Settings2 className="mr-2 h-4 w-4" />

                                            Manage profile
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </section>


                        {/* PRIORITY ALERT */}

                        {priorityAlert && (
                            <PriorityNotice
                                alert={
                                    priorityAlert
                                }
                                onAction={() =>
                                    router.push(
                                        priorityAlert.actionRoute
                                    )
                                }
                            />
                        )}


                        {/* SUMMARY CARDS */}

                        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <DashboardSummaryCard
                                title="Available"
                                value={
                                    availableOpportunities.length
                                }
                                description="New matching resident offers"
                                icon={
                                    Inbox
                                }
                                delay={
                                    0
                                }
                                onClick={() =>
                                    router.push(
                                        "/profiles/recycler/opportunities"
                                    )
                                }
                            />

                            <DashboardSummaryCard
                                title="Waiting"
                                value={
                                    waitingOpportunities.length
                                }
                                description="Responses awaiting residents"
                                icon={
                                    Clock3
                                }
                                delay={
                                    50
                                }
                                onClick={() =>
                                    router.push(
                                        "/profiles/recycler/opportunities"
                                    )
                                }
                            />

                            <DashboardSummaryCard
                                title="Accepted"
                                value={
                                    acceptedOpportunities.length
                                }
                                description="Recoveries assigned to you"
                                icon={
                                    Handshake
                                }
                                delay={
                                    100
                                }
                                onClick={() =>
                                    router.push(
                                        "/profiles/recycler/opportunities"
                                    )
                                }
                            />

                            <DashboardSummaryCard
                                title="Materials"
                                value={
                                    activeMaterialCount
                                }
                                description="Actively accepted materials"
                                icon={
                                    PackageCheck
                                }
                                delay={
                                    150
                                }
                                onClick={() =>
                                    router.push(
                                        "/profiles/recycler/materials"
                                    )
                                }
                            />
                        </section>


                        {/* ACCEPTED RECOVERIES + QUICK ACTIONS */}

                        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
                            <DashboardSection
                                title="Accepted recoveries"
                                description="These residents selected your junkshop."
                                actionLabel="View all"
                                onAction={() =>
                                    router.push(
                                        "/profiles/recycler/opportunities"
                                    )
                                }
                                animationDelay="200ms"
                            >
                                {acceptedOpportunities.length ===
                                0 ? (
                                    <SectionEmptyState
                                        icon={
                                            Handshake
                                        }
                                        title="No accepted recoveries"
                                        description="Opportunities selected by residents will appear here."
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        {acceptedOpportunities
                                            .slice(
                                                0,
                                                3
                                            )
                                            .map(
                                                (
                                                    opportunity
                                                ) => (
                                                    <AcceptedRecoveryCard
                                                        key={
                                                            opportunity.id
                                                        }
                                                        opportunity={
                                                            opportunity
                                                        }
                                                        response={
                                                            responseMap.get(
                                                                opportunity.id
                                                            ) ??
                                                            null
                                                        }
                                                        onView={() =>
                                                            router.push(
                                                                "/profiles/recycler/opportunities"
                                                            )
                                                        }
                                                    />
                                                )
                                            )}
                                    </div>
                                )}
                            </DashboardSection>


                            <DashboardSection
                                title="Quick actions"
                                description="Open the tools used most often."
                                animationDelay="250ms"
                            >
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                                    <QuickAction
                                        icon={
                                            Inbox
                                        }
                                        title="Browse opportunities"
                                        description="Review new resident material offers."
                                        onClick={() =>
                                            router.push(
                                                "/profiles/recycler/opportunities"
                                            )
                                        }
                                    />

                                    <QuickAction
                                        icon={
                                            PackageCheck
                                        }
                                        title="Manage materials"
                                        description="Update prices and accepted conditions."
                                        onClick={() =>
                                            router.push(
                                                "/profiles/recycler/materials"
                                            )
                                        }
                                    />

                                    <QuickAction
                                        icon={
                                            UserRound
                                        }
                                        title="Edit junkshop profile"
                                        description="Manage business and account information."
                                        onClick={() =>
                                            router.push(
                                                "/profiles/recycler/profile"
                                            )
                                        }
                                    />

                                    <QuickAction
                                        icon={
                                            BellRing
                                        }
                                        title="Notifications"
                                        description="Notification updates will be added later."
                                        disabled
                                    />
                                </div>
                            </DashboardSection>
                        </section>


                        {/* NEW OPPORTUNITIES + WAITING */}

                        <section className="grid gap-5 xl:grid-cols-2">
                            <DashboardSection
                                title="New opportunities"
                                description="Newest offers you have not responded to."
                                actionLabel="Browse all"
                                onAction={() =>
                                    router.push(
                                        "/profiles/recycler/opportunities"
                                    )
                                }
                                animationDelay="300ms"
                            >
                                {availableOpportunities.length ===
                                0 ? (
                                    <SectionEmptyState
                                        icon={
                                            Inbox
                                        }
                                        title="No new matching opportunities"
                                        description="Resident offers matching your active materials will appear here."
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        {availableOpportunities
                                            .slice(
                                                0,
                                                3
                                            )
                                            .map(
                                                (
                                                    opportunity
                                                ) => (
                                                    <AvailableOpportunityCard
                                                        key={
                                                            opportunity.id
                                                        }
                                                        opportunity={
                                                            opportunity
                                                        }
                                                        pricePerKg={
                                                            materialPrices[
                                                                opportunity
                                                                    .material_id
                                                            ] ??
                                                            0
                                                        }
                                                        onView={() =>
                                                            router.push(
                                                                "/profiles/recycler/opportunities"
                                                            )
                                                        }
                                                    />
                                                )
                                            )}
                                    </div>
                                )}
                            </DashboardSection>


                            <DashboardSection
                                title="Waiting for residents"
                                description="Responses sent and awaiting a decision."
                                actionLabel="View responses"
                                onAction={() =>
                                    router.push(
                                        "/profiles/recycler/opportunities"
                                    )
                                }
                                animationDelay="350ms"
                            >
                                {waitingOpportunities.length ===
                                0 ? (
                                    <SectionEmptyState
                                        icon={
                                            Clock3
                                        }
                                        title="No responses waiting"
                                        description="Offers you send to residents will appear here."
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        {waitingOpportunities
                                            .slice(
                                                0,
                                                3
                                            )
                                            .map(
                                                (
                                                    opportunity
                                                ) => {
                                                    const response =
                                                        responseMap.get(
                                                            opportunity.id
                                                        );

                                                    if (
                                                        !response
                                                    ) {
                                                        return null;
                                                    }

                                                    return (
                                                        <WaitingResponseCard
                                                            key={
                                                                opportunity.id
                                                            }
                                                            opportunity={
                                                                opportunity
                                                            }
                                                            response={
                                                                response
                                                            }
                                                            onView={() =>
                                                                router.push(
                                                                    "/profiles/recycler/opportunities"
                                                                )
                                                            }
                                                        />
                                                    );
                                                }
                                            )}
                                    </div>
                                )}
                            </DashboardSection>
                        </section>
                    </>
                )}
            </div>
        </>
    );
}


/* =========================================================
   COMPONENTS
========================================================= */

function PriorityNotice({
    alert,
    onAction,
}: {
    alert: PriorityAlert;
    onAction: () => void;
}) {
    const Icon =
        alert.icon;

    return (
        <section
            className={`trashure-motion animate-[trashureFadeUp_.38s_ease-out_.08s_both] flex flex-col gap-4 rounded-[24px] border p-5 sm:flex-row sm:items-center ${alert.containerClass}`}
        >
            <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${alert.iconClass}`}
            >
                <Icon className="h-6 w-6" />
            </div>

            <div className="flex-1">
                <h2 className="font-black text-zinc-900">
                    {
                        alert.title
                    }
                </h2>

                <p className="mt-1 text-sm leading-6 text-zinc-600">
                    {
                        alert.description
                    }
                </p>
            </div>

            <Button
                type="button"
                variant="outline"
                onClick={
                    onAction
                }
                className={`w-fit rounded-full ${alert.buttonClass}`}
            >
                {
                    alert.actionLabel
                }

                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </section>
    );
}


function DashboardSummaryCard({
    title,
    value,
    description,
    icon: Icon,
    delay,
    onClick,
}: {
    title: string;
    value: number;
    description: string;

    icon:
        ComponentType<{
            className?: string;
        }>;

    delay: number;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={
                onClick
            }
            style={{
                animationDelay:
                    `${delay}ms`,
            }}
            className="trashure-motion group animate-[trashureFadeUp_.38s_ease-out_both] rounded-[24px] border border-green-100 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-300 hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-zinc-500">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-black text-zinc-900">
                        {value}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                        {description}
                    </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600 transition-transform duration-300 group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-4 flex items-center text-xs font-bold text-green-700">
                Open section

                <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
        </button>
    );
}


function DashboardSection({
    title,
    description,
    actionLabel,
    onAction,
    animationDelay,
    children,
}: {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    animationDelay: string;
    children: React.ReactNode;
}) {
    return (
        <section
            style={{
                animationDelay,
            }}
            className="trashure-motion animate-[trashureFadeUp_.4s_ease-out_both] rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-6"
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-zinc-900">
                        {title}
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                        {description}
                    </p>
                </div>

                {actionLabel &&
                    onAction && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={
                                onAction
                            }
                            className="hidden shrink-0 rounded-full text-green-700 hover:bg-green-50 sm:flex"
                        >
                            {
                                actionLabel
                            }

                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
            </div>

            <div className="mt-5">
                {children}
            </div>

            {actionLabel &&
                onAction && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={
                            onAction
                        }
                        className="mt-4 w-full rounded-xl text-green-700 hover:bg-green-50 sm:hidden"
                    >
                        {
                            actionLabel
                        }

                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
        </section>
    );
}


function AcceptedRecoveryCard({
    opportunity,
    response,
    onView,
}: {
    opportunity: Opportunity;

    response:
        | OpportunityResponse
        | null;

    onView: () => void;
}) {
    return (
        <div className="group flex flex-col gap-4 rounded-2xl border border-green-100 bg-green-50/50 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-green-300 hover:bg-green-50 sm:flex-row sm:items-center">
            <MaterialThumbnail
                opportunity={
                    opportunity
                }
            />

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-zinc-900">
                        {
                            opportunity.material_name
                        }
                    </h3>

                    <Badge
                        variant="outline"
                        className="border-green-200 bg-white text-green-700"
                    >
                        Accepted
                    </Badge>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5">
                        <Scale className="h-3.5 w-3.5 text-green-600" />

                        {
                            opportunity.estimated_weight_kg
                        }{" "}
                        kg
                    </span>

                    <span className="flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-green-600" />

                        {getFulfillmentLabel(
                            opportunity.fulfillment_method
                        )}
                    </span>

                    {response && (
                        <span className="flex items-center gap-1.5">
                            <WalletCards className="h-3.5 w-3.5 text-green-600" />

                            {formatPeso(
                                Number(
                                    response.offered_price_per_kg
                                )
                            )}
                            /kg
                        </span>
                    )}
                </div>

                <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-green-600" />

                    <span className="truncate">
                        {getLocationText(
                            opportunity
                        )}
                    </span>
                </p>
            </div>

            <Button
                type="button"
                variant="outline"
                onClick={
                    onView
                }
                className="rounded-full border-green-200 bg-white text-green-700 hover:bg-green-100"
            >
                View details
            </Button>
        </div>
    );
}


function AvailableOpportunityCard({
    opportunity,
    pricePerKg,
    onView,
}: {
    opportunity: Opportunity;
    pricePerKg: number;
    onView: () => void;
}) {
    const estimatedValue =
        opportunity.estimated_weight_kg *
        pricePerKg;

    return (
        <div className="group flex gap-4 rounded-2xl border border-zinc-100 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-green-300 hover:bg-green-50/40">
            <MaterialThumbnail
                opportunity={
                    opportunity
                }
            />

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-zinc-900">
                        {
                            opportunity.material_name
                        }
                    </h3>

                    <Badge
                        variant="secondary"
                        className="bg-zinc-100 text-zinc-600"
                    >
                        {
                            opportunity.category
                        }
                    </Badge>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5">
                        <Scale className="h-3.5 w-3.5 text-green-600" />

                        {
                            opportunity.estimated_weight_kg
                        }{" "}
                        kg
                    </span>

                    <span className="flex items-center gap-1.5">
                        <WalletCards className="h-3.5 w-3.5 text-green-600" />

                        {formatPeso(
                            estimatedValue
                        )}
                    </span>
                </div>

                <p className="mt-2 truncate text-xs text-zinc-500">
                    {getLocationText(
                        opportunity
                    )}
                </p>

                <p className="mt-1 text-xs text-zinc-400">
                    {formatRelativeDate(
                        opportunity.created_at
                    )}
                </p>
            </div>

            <button
                type="button"
                aria-label={`View ${opportunity.material_name}`}
                onClick={
                    onView
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full bg-green-50 text-green-700 transition-all duration-200 hover:bg-green-100 group-hover:translate-x-0.5"
            >
                <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    );
}


function WaitingResponseCard({
    opportunity,
    response,
    onView,
}: {
    opportunity: Opportunity;
    response: OpportunityResponse;
    onView: () => void;
}) {
    return (
        <div className="group flex gap-4 rounded-2xl border border-amber-100 bg-amber-50/40 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-200">
            <MaterialThumbnail
                opportunity={
                    opportunity
                }
            />

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-zinc-900">
                        {
                            opportunity.material_name
                        }
                    </h3>

                    <Badge
                        variant="outline"
                        className="border-amber-200 bg-white text-amber-700"
                    >
                        Waiting
                    </Badge>
                </div>

                <p className="mt-2 text-sm text-zinc-600">
                    Your offer:{" "}
                    <span className="font-black text-green-700">
                        {formatPeso(
                            Number(
                                response.offered_price_per_kg
                            )
                        )}
                        /kg
                    </span>
                </p>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span>
                        {response.pickup_available
                            ? "Pickup available"
                            : "No pickup offered"}
                    </span>

                    <span>
                        Sent{" "}
                        {formatRelativeDate(
                            response.created_at
                        )}
                    </span>
                </div>
            </div>

            <button
                type="button"
                aria-label={`View response for ${opportunity.material_name}`}
                onClick={
                    onView
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full bg-white text-green-700 shadow-sm transition-transform duration-200 group-hover:translate-x-0.5"
            >
                <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    );
}


function MaterialThumbnail({
    opportunity,
}: {
    opportunity: Opportunity;
}) {
    return (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-green-100">
            {opportunity.image_url ? (
                <img
                    src={
                        opportunity.image_url
                    }
                    alt={
                        opportunity.material_name
                    }
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.04]"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 text-green-600">
                    <Package className="h-7 w-7" />
                </div>
            )}
        </div>
    );
}


function QuickAction({
    icon: Icon,
    title,
    description,
    onClick,
    disabled = false,
}: {
    icon:
        ComponentType<{
            className?: string;
        }>;

    title: string;
    description: string;
    onClick?: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            disabled={
                disabled
            }
            onClick={
                onClick
            }
            className="group flex w-full items-center gap-4 rounded-2xl border border-zinc-100 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:border-zinc-100 disabled:hover:bg-white"
        >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600 transition-transform duration-300 group-hover:scale-105">
                <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="font-black text-zinc-900">
                    {title}
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {description}
                </p>
            </div>

            {!disabled && (
                <ArrowRight className="h-4 w-4 shrink-0 text-green-600 transition-transform duration-200 group-hover:translate-x-1" />
            )}
        </button>
    );
}


function SectionEmptyState({
    icon: Icon,
    title,
    description,
}: {
    icon:
        ComponentType<{
            className?: string;
        }>;

    title: string;
    description: string;
}) {
    return (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-green-200 bg-green-50/60 px-5 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-green-600 shadow-sm">
                <Icon className="h-6 w-6" />
            </div>

            <h3 className="mt-4 font-black text-zinc-900">
                {title}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                {description}
            </p>
        </div>
    );
}


function MissingJunkshopHome({
    profile,
    onSetup,
}: {
    profile: Profile;
    onSetup: () => void;
}) {
    return (
        <section className="trashure-motion animate-[trashureSoftScale_.4s_ease-out_both] overflow-hidden rounded-[32px] border border-green-100 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
                <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-emerald-800 p-7 text-white sm:p-10">
                    <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10" />

                    <div className="relative">
                        <Avatar className="h-20 w-20 border-4 border-white bg-white shadow-xl">
                            <AvatarImage
                                src={
                                    profile.avatar_url ??
                                    undefined
                                }
                                alt={
                                    profile.full_name
                                }
                            />

                            <AvatarFallback className="bg-green-100 text-xl font-black text-green-700">
                                {getInitials(
                                    profile.full_name
                                )}
                            </AvatarFallback>
                        </Avatar>

                        <Badge className="mt-6 border-white/20 bg-white/15 text-white hover:bg-white/15">
                            Setup required
                        </Badge>

                        <h2 className="mt-4 max-w-xl text-3xl font-black leading-tight">
                            Create your junkshop profile
                        </h2>

                        <p className="mt-4 max-w-xl text-sm leading-7 text-green-50/90">
                            Add your shop identity, address, operating
                            schedule, and contact information before managing
                            materials and resident opportunities.
                        </p>

                        <Button
                            type="button"
                            onClick={
                                onSetup
                            }
                            className="mt-7 rounded-full bg-white px-6 text-green-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-50"
                        >
                            <Store className="mr-2 h-4 w-4" />

                            Set up junkshop

                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>


                <div className="p-7 sm:p-10">
                    <p className="text-sm font-bold uppercase tracking-wide text-green-600">
                        After setup
                    </p>

                    <div className="mt-6 space-y-5">
                        <HomeFeature
                            icon={
                                PackageCheck
                            }
                            title="Add accepted materials"
                            description="Set prices, minimum weights, and required conditions."
                        />

                        <HomeFeature
                            icon={
                                Inbox
                            }
                            title="Receive opportunities"
                            description="See resident material offers matching your shop."
                        />

                        <HomeFeature
                            icon={
                                Handshake
                            }
                            title="Manage recoveries"
                            description="Respond to residents and track accepted transactions."
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}


function HomeFeature({
    icon: Icon,
    title,
    description,
}: {
    icon:
        ComponentType<{
            className?: string;
        }>;

    title: string;
    description: string;
}) {
    return (
        <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <Icon className="h-5 w-5" />
            </div>

            <div>
                <p className="font-black text-zinc-900">
                    {title}
                </p>

                <p className="mt-1 text-sm leading-5 text-zinc-500">
                    {description}
                </p>
            </div>
        </div>
    );
}


function DashboardErrorState({
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
                    Dashboard unavailable
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


function RecyclerHomeSkeleton() {
    return (
        <div className="space-y-7">
            <div className="flex justify-between gap-4">
                <div className="space-y-3">
                    <Skeleton className="h-4 w-40 bg-green-100" />

                    <Skeleton className="h-9 w-80 max-w-full bg-green-100" />

                    <Skeleton className="h-4 w-96 max-w-full bg-green-100" />
                </div>

                <div className="hidden gap-2 sm:flex">
                    <Skeleton className="h-10 w-28 rounded-full bg-green-100" />

                    <Skeleton className="h-10 w-40 rounded-full bg-green-100" />
                </div>
            </div>


            <Skeleton className="h-56 rounded-[32px] bg-green-100" />

            <Skeleton className="h-28 rounded-[24px] bg-green-100" />


            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({
                    length: 4,
                }).map(
                    (
                        _,
                        index
                    ) => (
                        <Skeleton
                            key={
                                index
                            }
                            className="h-36 rounded-[24px] bg-green-100"
                        />
                    )
                )}
            </div>


            <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
                <Skeleton className="h-96 rounded-[28px] bg-green-100" />

                <Skeleton className="h-96 rounded-[28px] bg-green-100" />
            </div>


            <div className="grid gap-5 xl:grid-cols-2">
                <Skeleton className="h-96 rounded-[28px] bg-green-100" />

                <Skeleton className="h-96 rounded-[28px] bg-green-100" />
            </div>
        </div>
    );
}