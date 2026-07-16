"use client";

import type {
    ComponentType,
    ReactNode,
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
    BarChart3,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock3,
    Inbox,
    Leaf,
    Loader2,
    MapPin,
    PackageCheck,
    Plus,
    Recycle,
    RefreshCcw,
    School,
    Send,
    Target,
    Truck,
    UserRound,
    Weight,
    XCircle,
} from "lucide-react";

import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";


/* =========================================================
   TYPES
========================================================= */

type DriveStatus =
    | "draft"
    | "active"
    | "completed"
    | "cancelled";


type PickupStatus =
    | "pending"
    | "accepted"
    | "completed"
    | "cancelled";


type VerificationStatus =
    | "pending"
    | "approved"
    | "rejected"
    | "suspended";


interface Profile {
    id: string;
    auth_id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    role: string;
    barangay: string | null;
    city: string | null;
    province: string | null;
    onboarding_completed: boolean;
    created_at: string;
    updated_at: string;
}


interface SchoolPartner {
    id: string;
    profile_id: string;
    organization_name: string;

    organization_type:
        | "school"
        | "community"
        | "nonprofit"
        | "other";

    description: string | null;
    project_description: string | null;
    photo_url: string | null;

    address_line: string;
    barangay: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;

    contact_person: string | null;
    contact_number: string | null;
    contact_email: string | null;

    verification_status: VerificationStatus;
    is_active: boolean;

    created_at: string;
    updated_at: string;
}


interface Material {
    id: string;
    material_name: string;
    category: string;
}


interface DriveRow {
    id: string;
    school_partner_id: string;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string;

    target_weight_kg:
        | number
        | string
        | null;

    collection_location: string;
    photo_url: string | null;
    status: DriveStatus;
    created_at: string;
    updated_at: string;
}


interface CollectionEntryRow {
    id: string;
    drive_id: string;
    material_id: string;
    source_name: string;

    weight_kg:
        | number
        | string;

    notes: string | null;
    photo_url: string | null;
    collected_at: string;
    created_at: string;
    updated_at: string;
}


interface PickupRequestRow {
    id: string;
    school_partner_id: string;
    drive_id: string;
    preferred_pickup_date: string;
    preferred_time_start: string | null;
    preferred_time_end: string | null;
    address_line: string;
    barangay: string;
    city: string;
    province: string | null;
    postal_code: string | null;
    contact_person: string;
    contact_number: string;
    notes: string | null;
    status: PickupStatus;
    selected_junkshop_id: string | null;
    created_at: string;
    updated_at: string;
}


interface PickupItemRow {
    id: string;
    pickup_request_id: string;
    material_id: string;

    estimated_weight_kg:
        | number
        | string;

    created_at: string;
}


interface PickupResponseRow {
    id: string;
    pickup_request_id: string;
    junkshop_id: string;
    proposed_pickup_date: string | null;
    pickup_available: boolean;
    message: string | null;

    status:
        | "interested"
        | "accepted"
        | "declined"
        | "withdrawn";

    created_at: string;
    updated_at: string;
}


interface DriveView extends DriveRow {
    target_weight_kg: number | null;
    collected_weight_kg: number;
    progress_percentage: number;
    collection_count: number;
}


interface CollectionEntryView {
    id: string;
    drive_id: string;
    drive_title: string;
    material_id: string;
    material_name: string;
    category: string;
    source_name: string;
    weight_kg: number;
    notes: string | null;
    photo_url: string | null;
    collected_at: string;
}


interface PickupRequestView extends PickupRequestRow {
    drive_title: string;
    total_weight_kg: number;
    response_count: number;
    interested_response_count: number;
}


/* =========================================================
   HELPERS
========================================================= */

function getErrorMessage(
    error: unknown,
    fallback: string
) {
    if (
        error instanceof Error
    ) {
        return error.message;
    }

    if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (
            error as {
                message?: unknown;
            }
        ).message === "string"
    ) {
        return (
            error as {
                message: string;
            }
        ).message;
    }

    return fallback;
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


function formatWeight(
    value: number
) {
    return new Intl.NumberFormat(
        "en-PH",
        {
            minimumFractionDigits:
                0,

            maximumFractionDigits:
                2,
        }
    ).format(
        value
    );
}


function formatDate(
    value: string
) {
    return new Date(
        `${value}T00:00:00`
    ).toLocaleDateString(
        "en-PH",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
        }
    );
}


function formatRelativeDate(
    value: string
) {
    const difference =
        Math.max(
            0,
            Date.now() -
                new Date(
                    value
                ).getTime()
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
            minutes /
                60
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
            hours /
                24
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


function formatLocation(
    partner: SchoolPartner
) {
    return [
        partner.barangay,
        partner.city,
        partner.province,
    ]
        .filter(
            Boolean
        )
        .join(
            ", "
        );
}


function getVerificationDetails(
    status: VerificationStatus
) {
    switch (
        status
    ) {
        case "approved":
            return {
                label:
                    "Verified",

                className:
                    "border-white/20 bg-black/20 text-white",

                icon:
                    BadgeCheck,
            };

        case "rejected":
            return {
                label:
                    "Needs correction",

                className:
                    "border-white/20 bg-red-500/20 text-white",

                icon:
                    XCircle,
            };

        case "suspended":
            return {
                label:
                    "Suspended",

                className:
                    "border-white/20 bg-orange-500/20 text-white",

                icon:
                    AlertCircle,
            };

        default:
            return {
                label:
                    "Pending verification",

                className:
                    "border-white/20 bg-amber-500/20 text-white",

                icon:
                    Clock3,
            };
    }
}


function getPickupStatusDetails(
    status: PickupStatus
) {
    switch (
        status
    ) {
        case "accepted":
            return {
                label:
                    "Accepted",

                className:
                    "border-blue-200 bg-blue-50 text-blue-700",

                icon:
                    Truck,
            };

        case "completed":
            return {
                label:
                    "Completed",

                className:
                    "border-green-200 bg-green-50 text-green-700",

                icon:
                    CheckCircle2,
            };

        case "cancelled":
            return {
                label:
                    "Cancelled",

                className:
                    "border-red-200 bg-red-50 text-red-700",

                icon:
                    XCircle,
            };

        default:
            return {
                label:
                    "Pending",

                className:
                    "border-amber-200 bg-amber-50 text-amber-700",

                icon:
                    Clock3,
            };
    }
}


/* =========================================================
   PAGE
========================================================= */

export default function SchoolPartnerDashboardPage() {
    const router =
        useRouter();

    const supabase =
        useMemo(
            () =>
                createClient(),
            []
        );


    const [
        profile,
        setProfile,
    ] =
        useState<Profile | null>(
            null
        );

    const [
        partner,
        setPartner,
    ] =
        useState<SchoolPartner | null>(
            null
        );

    const [
        drives,
        setDrives,
    ] =
        useState<DriveView[]>(
            []
        );

    const [
        recentCollections,
        setRecentCollections,
    ] =
        useState<CollectionEntryView[]>(
            []
        );

    const [
        pickupRequests,
        setPickupRequests,
    ] =
        useState<PickupRequestView[]>(
            []
        );


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
        useState<string | null>(
            null
        );

    const [
        greeting,
        setGreeting,
    ] =
        useState(
            "Welcome back"
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
                                email,
                                avatar_url,
                                role,
                                barangay,
                                city,
                                province,
                                onboarding_completed,
                                created_at,
                                updated_at
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
                                "School partner account was not found."
                            )
                        );
                    }

                    const currentProfile =
                        profileData as Profile;

                    if (
                        currentProfile.role !==
                        "school_partner"
                    ) {
                        throw new Error(
                            "This dashboard is available only to school partners."
                        );
                    }

                    setProfile(
                        currentProfile
                    );


                    const {
                        data:
                            partnerData,
                        error:
                            partnerError,
                    } =
                        await supabase
                            .from(
                                "school_partners"
                            )
                            .select(`
                                id,
                                profile_id,
                                organization_name,
                                organization_type,
                                description,
                                project_description,
                                photo_url,
                                address_line,
                                barangay,
                                city,
                                province,
                                postal_code,
                                contact_person,
                                contact_number,
                                contact_email,
                                verification_status,
                                is_active,
                                created_at,
                                updated_at
                            `)
                            .eq(
                                "profile_id",
                                currentProfile.id
                            )
                            .maybeSingle();

                    if (
                        partnerError
                    ) {
                        throw partnerError;
                    }

                    const currentPartner =
                        (
                            partnerData as
                                | SchoolPartner
                                | null
                        ) ?? null;

                    setPartner(
                        currentPartner
                    );


                    if (
                        !currentPartner
                    ) {
                        setDrives(
                            []
                        );

                        setRecentCollections(
                            []
                        );

                        setPickupRequests(
                            []
                        );

                        return;
                    }


                    const [
                        driveResult,
                        materialResult,
                        pickupResult,
                    ] =
                        await Promise.all([
                            supabase
                                .from(
                                    "school_drives"
                                )
                                .select(`
                                    id,
                                    school_partner_id,
                                    title,
                                    description,
                                    start_date,
                                    end_date,
                                    target_weight_kg,
                                    collection_location,
                                    photo_url,
                                    status,
                                    created_at,
                                    updated_at
                                `)
                                .eq(
                                    "school_partner_id",
                                    currentPartner.id
                                )
                                .order(
                                    "created_at",
                                    {
                                        ascending:
                                            false,
                                    }
                                ),

                            supabase
                                .from(
                                    "materials"
                                )
                                .select(`
                                    id,
                                    material_name,
                                    category
                                `),

                            supabase
                                .from(
                                    "school_pickup_requests"
                                )
                                .select(`
                                    id,
                                    school_partner_id,
                                    drive_id,
                                    preferred_pickup_date,
                                    preferred_time_start,
                                    preferred_time_end,
                                    address_line,
                                    barangay,
                                    city,
                                    province,
                                    postal_code,
                                    contact_person,
                                    contact_number,
                                    notes,
                                    status,
                                    selected_junkshop_id,
                                    created_at,
                                    updated_at
                                `)
                                .eq(
                                    "school_partner_id",
                                    currentPartner.id
                                )
                                .order(
                                    "created_at",
                                    {
                                        ascending:
                                            false,
                                    }
                                ),
                        ]);


                    if (
                        driveResult.error
                    ) {
                        throw driveResult.error;
                    }

                    if (
                        materialResult.error
                    ) {
                        throw materialResult.error;
                    }

                    if (
                        pickupResult.error
                    ) {
                        throw pickupResult.error;
                    }


                    const driveRows =
                        (
                            driveResult.data ??
                            []
                        ) as DriveRow[];

                    const materials =
                        (
                            materialResult.data ??
                            []
                        ) as Material[];

                    const pickupRows =
                        (
                            pickupResult.data ??
                            []
                        ) as PickupRequestRow[];


                    const driveIds =
                        driveRows.map(
                            (
                                drive
                            ) =>
                                drive.id
                        );

                    const pickupIds =
                        pickupRows.map(
                            (
                                request
                            ) =>
                                request.id
                        );


                    let collectionRows:
                        CollectionEntryRow[] = [];

                    if (
                        driveIds.length >
                        0
                    ) {
                        const {
                            data,
                            error,
                        } =
                            await supabase
                                .from(
                                    "school_collection_entries"
                                )
                                .select(`
                                    id,
                                    drive_id,
                                    material_id,
                                    source_name,
                                    weight_kg,
                                    notes,
                                    photo_url,
                                    collected_at,
                                    created_at,
                                    updated_at
                                `)
                                .in(
                                    "drive_id",
                                    driveIds
                                )
                                .order(
                                    "collected_at",
                                    {
                                        ascending:
                                            false,
                                    }
                                );

                        if (
                            error
                        ) {
                            throw error;
                        }

                        collectionRows =
                            (
                                data ??
                                []
                            ) as CollectionEntryRow[];
                    }


                    let pickupItems:
                        PickupItemRow[] = [];

                    let pickupResponses:
                        PickupResponseRow[] = [];


                    if (
                        pickupIds.length >
                        0
                    ) {
                        const [
                            itemResult,
                            responseResult,
                        ] =
                            await Promise.all([
                                supabase
                                    .from(
                                        "school_pickup_items"
                                    )
                                    .select(`
                                        id,
                                        pickup_request_id,
                                        material_id,
                                        estimated_weight_kg,
                                        created_at
                                    `)
                                    .in(
                                        "pickup_request_id",
                                        pickupIds
                                    ),

                                supabase
                                    .from(
                                        "school_pickup_responses"
                                    )
                                    .select(`
                                        id,
                                        pickup_request_id,
                                        junkshop_id,
                                        proposed_pickup_date,
                                        pickup_available,
                                        message,
                                        status,
                                        created_at,
                                        updated_at
                                    `)
                                    .in(
                                        "pickup_request_id",
                                        pickupIds
                                    ),
                            ]);


                        if (
                            itemResult.error
                        ) {
                            console.warn(
                                "Pickup items could not be loaded:",
                                itemResult.error
                            );
                        } else {
                            pickupItems =
                                (
                                    itemResult.data ??
                                    []
                                ) as PickupItemRow[];
                        }


                        if (
                            responseResult.error
                        ) {
                            console.warn(
                                "Pickup responses could not be loaded:",
                                responseResult.error
                            );
                        } else {
                            pickupResponses =
                                (
                                    responseResult.data ??
                                    []
                                ) as PickupResponseRow[];
                        }
                    }


                    const materialMap =
                        new Map(
                            materials.map(
                                (
                                    material
                                ) => [
                                    material.id,
                                    material,
                                ]
                            )
                        );


                    const normalizedCollections =
                        collectionRows.map(
                            (
                                entry
                            ): CollectionEntryView => {
                                const drive =
                                    driveRows.find(
                                        (
                                            item
                                        ) =>
                                            item.id ===
                                            entry.drive_id
                                    );

                                const material =
                                    materialMap.get(
                                        entry.material_id
                                    );

                                return {
                                    id:
                                        entry.id,

                                    drive_id:
                                        entry.drive_id,

                                    drive_title:
                                        drive?.title ??
                                        "Collection drive",

                                    material_id:
                                        entry.material_id,

                                    material_name:
                                        material?.material_name ??
                                        "Unnamed material",

                                    category:
                                        material?.category ??
                                        "Other",

                                    source_name:
                                        entry.source_name,

                                    weight_kg:
                                        Number(
                                            entry.weight_kg ??
                                            0
                                        ),

                                    notes:
                                        entry.notes,

                                    photo_url:
                                        entry.photo_url,

                                    collected_at:
                                        entry.collected_at,
                                };
                            }
                        );


                    const normalizedDrives =
                        driveRows.map(
                            (
                                drive
                            ): DriveView => {
                                const driveEntries =
                                    normalizedCollections.filter(
                                        (
                                            entry
                                        ) =>
                                            entry.drive_id ===
                                            drive.id
                                    );

                                const collectedWeight =
                                    driveEntries.reduce(
                                        (
                                            total,
                                            entry
                                        ) =>
                                            total +
                                            entry.weight_kg,
                                        0
                                    );

                                const targetWeight =
                                    drive.target_weight_kg ===
                                    null
                                        ? null
                                        : Number(
                                              drive.target_weight_kg
                                          );

                                const progress =
                                    targetWeight &&
                                    targetWeight >
                                        0
                                        ? Math.min(
                                              100,
                                              Math.round(
                                                  (
                                                      collectedWeight /
                                                      targetWeight
                                                  ) *
                                                      100
                                              )
                                          )
                                        : 0;

                                return {
                                    ...drive,

                                    target_weight_kg:
                                        targetWeight,

                                    collected_weight_kg:
                                        collectedWeight,

                                    progress_percentage:
                                        progress,

                                    collection_count:
                                        driveEntries.length,
                                };
                            }
                        );


                    const driveMap =
                        new Map(
                            normalizedDrives.map(
                                (
                                    drive
                                ) => [
                                    drive.id,
                                    drive,
                                ]
                            )
                        );


                    const normalizedPickups =
                        pickupRows.map(
                            (
                                request
                            ): PickupRequestView => {
                                const requestItems =
                                    pickupItems.filter(
                                        (
                                            item
                                        ) =>
                                            item.pickup_request_id ===
                                            request.id
                                    );

                                const requestResponses =
                                    pickupResponses.filter(
                                        (
                                            response
                                        ) =>
                                            response.pickup_request_id ===
                                            request.id
                                    );

                                return {
                                    ...request,

                                    drive_title:
                                        driveMap.get(
                                            request.drive_id
                                        )?.title ??
                                        "Collection drive",

                                    total_weight_kg:
                                        requestItems.reduce(
                                            (
                                                total,
                                                item
                                            ) =>
                                                total +
                                                Number(
                                                    item.estimated_weight_kg ??
                                                    0
                                                ),
                                            0
                                        ),

                                    response_count:
                                        requestResponses.length,

                                    interested_response_count:
                                        requestResponses.filter(
                                            (
                                                response
                                            ) =>
                                                response.status ===
                                                "interested"
                                        ).length,
                                };
                            }
                        );


                    setDrives(
                        normalizedDrives
                    );

                    setRecentCollections(
                        normalizedCollections.slice(
                            0,
                            5
                        )
                    );

                    setPickupRequests(
                        normalizedPickups
                    );
                } catch (
                    error
                ) {
                    const message =
                        getErrorMessage(
                            error,
                            "Unable to load the school partner dashboard."
                        );

                    console.error(
                        "School partner dashboard loading failed:",
                        error
                    );

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


    /* =====================================================
       DERIVED DATA
    ===================================================== */

    const activeDrives =
        useMemo(
            () =>
                drives.filter(
                    (
                        drive
                    ) =>
                        drive.status ===
                        "active"
                ),
            [
                drives,
            ]
        );


    const totalCollectedWeight =
        useMemo(
            () =>
                drives.reduce(
                    (
                        total,
                        drive
                    ) =>
                        total +
                        drive.collected_weight_kg,
                    0
                ),
            [
                drives,
            ]
        );


    const pendingPickupCount =
        useMemo(
            () =>
                pickupRequests.filter(
                    (
                        request
                    ) =>
                        request.status ===
                            "pending" ||
                        request.status ===
                            "accepted"
                ).length,
            [
                pickupRequests,
            ]
        );


    const completedRecoveryCount =
        useMemo(
            () =>
                pickupRequests.filter(
                    (
                        request
                    ) =>
                        request.status ===
                        "completed"
                ).length,
            [
                pickupRequests,
            ]
        );


    const interestedResponseCount =
        useMemo(
            () =>
                pickupRequests.reduce(
                    (
                        total,
                        request
                    ) =>
                        total +
                        request.interested_response_count,
                    0
                ),
            [
                pickupRequests,
            ]
        );


    const eligiblePickupDrive =
        useMemo(
            () => {
                const unavailableDriveIds =
                    new Set(
                        pickupRequests
                            .filter(
                                (
                                    request
                                ) =>
                                    request.status ===
                                        "pending" ||
                                    request.status ===
                                        "accepted"
                            )
                            .map(
                                (
                                    request
                                ) =>
                                    request.drive_id
                            )
                    );

                return (
                    drives.find(
                        (
                            drive
                        ) =>
                            (
                                drive.status ===
                                    "active" ||
                                drive.status ===
                                    "completed"
                            ) &&
                            drive.collected_weight_kg >
                                0 &&
                            !unavailableDriveIds.has(
                                drive.id
                            )
                    ) ??
                    null
                );
            },
            [
                drives,
                pickupRequests,
            ]
        );


    const priorityNotice =
        useMemo(
            () => {
                if (
                    !partner
                ) {
                    return null;
                }

                if (
                    !partner.is_active
                ) {
                    return {
                        icon:
                            AlertCircle,

                        title:
                            "The organization profile is paused",

                        description:
                            "Activate the partner profile before publishing new recovery activities.",

                        actionLabel:
                            "Review profile",

                        route:
                            "/profiles/school-partner/profile",

                        tone:
                            "warning" as const,
                    };
                }

                if (
                    partner.verification_status ===
                    "suspended"
                ) {
                    return {
                        icon:
                            AlertCircle,

                        title:
                            "The organization is suspended",

                        description:
                            "Collection and pickup activity may be restricted until administrator review is complete.",

                        actionLabel:
                            "View profile",

                        route:
                            "/profiles/school-partner/profile",

                        tone:
                            "danger" as const,
                    };
                }

                if (
                    partner.verification_status ===
                    "rejected"
                ) {
                    return {
                        icon:
                            XCircle,

                        title:
                            "The partner profile needs correction",

                        description:
                            "Review the organization information and submit complete contact and location details.",

                        actionLabel:
                            "Correct profile",

                        route:
                            "/profiles/school-partner/profile",

                        tone:
                            "danger" as const,
                    };
                }

                if (
                    interestedResponseCount >
                    0
                ) {
                    return {
                        icon:
                            Inbox,

                        title:
                            `${interestedResponseCount} recycler response${
                                interestedResponseCount ===
                                1
                                    ? ""
                                    : "s"
                            } waiting`,

                        description:
                            "Review interested recycler partners and select one for the pickup.",

                        actionLabel:
                            "Review responses",

                        route:
                            "/profiles/school-partner/pickups",

                        tone:
                            "success" as const,
                    };
                }

                if (
                    activeDrives.length ===
                    0
                ) {
                    return {
                        icon:
                            ClipboardList,

                        title:
                            "Create an active collection drive",

                        description:
                            "Start a measurable campaign before recording recyclable materials.",

                        actionLabel:
                            "Create drive",

                        route:
                            "/profiles/school-partner/drives?action=create",

                        tone:
                            "success" as const,
                    };
                }

                if (
                    recentCollections.length ===
                    0
                ) {
                    return {
                        icon:
                            Weight,

                        title:
                            "Record the first material collection",

                        description:
                            "Add a class, department, club, or community contribution to an active drive.",

                        actionLabel:
                            "Record collection",

                        route:
                            "/profiles/school-partner/drives?action=record",

                        tone:
                            "success" as const,
                    };
                }

                if (
                    eligiblePickupDrive
                ) {
                    return {
                        icon:
                            Truck,

                        title:
                            "Collected materials are ready for pickup",

                        description:
                            `${eligiblePickupDrive.title} has ${formatWeight(
                                eligiblePickupDrive.collected_weight_kg
                            )} kg available for recycler coordination.`,

                        actionLabel:
                            "Request pickup",

                        route:
                            "/profiles/school-partner/pickups?action=create",

                        tone:
                            "success" as const,
                    };
                }

                if (
                    partner.verification_status ===
                    "pending"
                ) {
                    return {
                        icon:
                            Clock3,

                        title:
                            "Partner verification is pending",

                        description:
                            "You may continue preparing drives while the organization profile is under review.",

                        actionLabel:
                            "View profile",

                        route:
                            "/profiles/school-partner/profile",

                        tone:
                            "warning" as const,
                    };
                }

                return null;
            },
            [
                activeDrives,
                eligiblePickupDrive,
                interestedResponseCount,
                partner,
                recentCollections.length,
            ]
        );


    /* =====================================================
       STATES
    ===================================================== */

    if (
        loading
    ) {
        return (
            <DashboardSkeleton />
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
                    "School partner account was not found."
                }
                onRetry={() =>
                    void loadDashboard()
                }
            />
        );
    }


    if (
        !partner
    ) {
        return (
            <MissingPartnerState
                profileName={
                    profile.full_name
                }
                onSetup={() =>
                    router.push(
                        "/profiles/school-partner/profile"
                    )
                }
            />
        );
    }


    const verification =
        getVerificationDetails(
            partner.verification_status
        );

    const VerificationIcon =
        verification.icon;


    /* =====================================================
       UI
    ===================================================== */

    return (
        <>
            <style jsx global>{`
                @keyframes schoolDashboardFadeUp {
                    from {
                        opacity: 0;
                        transform: translateY(9px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes schoolDashboardScale {
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
                    .school-dashboard-motion {
                        animation: none !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>


            <div className="space-y-7">
                {/* HEADING */}

                <section className="school-dashboard-motion animate-[schoolDashboardFadeUp_.35s_ease-out_both]">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-sm font-bold text-green-600">
                                School sustainability workspace
                            </p>

                            <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
                                {greeting},{" "}
                                {getFirstName(
                                    profile.full_name
                                )}
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                                Manage collection drives, record recyclable
                                materials, coordinate recycler pickups, and
                                monitor recovery progress.
                            </p>
                        </div>


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
                            className="w-fit rounded-full border-green-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-50 hover:text-green-700"
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


                {/* HERO */}

                <section className="school-dashboard-motion animate-[schoolDashboardScale_.4s_ease-out_.04s_both] overflow-hidden rounded-[32px] border border-green-100 bg-white shadow-sm">
                    <div className="relative min-h-64 overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-emerald-800 p-6 text-white sm:p-8">
                        {partner.photo_url && (
                            <>
                                <img
                                    src={
                                        partner.photo_url
                                    }
                                    alt={
                                        partner.organization_name
                                    }
                                    className="absolute inset-0 h-full w-full object-cover opacity-25"
                                />

                                <div className="absolute inset-0 bg-gradient-to-r from-green-950/90 via-emerald-800/80 to-emerald-700/60" />
                            </>
                        )}


                        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />

                        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-white/5" />


                        <div className="relative flex min-h-48 flex-col justify-between gap-8 lg:flex-row lg:items-end">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[26px] border-4 border-white bg-white p-3 shadow-xl">
                                    <img
                                        src="/logo.png"
                                        alt="Trashure logo"
                                        className="h-full w-full object-contain"
                                    />
                                </div>


                                <div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge className="border-white/20 bg-white/15 text-white hover:bg-white/15">
                                            <School className="mr-1.5 h-3.5 w-3.5" />

                                            School partner
                                        </Badge>

                                        <Badge
                                            className={
                                                verification.className
                                            }
                                        >
                                            <VerificationIcon className="mr-1.5 h-3.5 w-3.5" />

                                            {
                                                verification.label
                                            }
                                        </Badge>

                                        <Badge className="border-white/20 bg-black/20 text-white hover:bg-black/20">
                                            {partner.is_active
                                                ? "Active organization"
                                                : "Organization paused"}
                                        </Badge>
                                    </div>


                                    <h2 className="mt-4 text-2xl font-black sm:text-3xl">
                                        {
                                            partner.organization_name
                                        }
                                    </h2>

                                    <p className="mt-2 flex items-center gap-2 text-sm text-green-50/85">
                                        <MapPin className="h-4 w-4" />

                                        {formatLocation(
                                            partner
                                        ) ||
                                            "Organization location not provided"}
                                    </p>
                                </div>
                            </div>


                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            "/profiles/school-partner/drives?action=create"
                                        )
                                    }
                                    className="rounded-full bg-white text-green-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-50"
                                >
                                    <Plus className="mr-2 h-4 w-4" />

                                    Create drive
                                </Button>

                                <Button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            "/profiles/school-partner/pickups?action=create"
                                        )
                                    }
                                    className="rounded-full border border-white/30 bg-white/15 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/25"
                                >
                                    <Truck className="mr-2 h-4 w-4" />

                                    Request pickup
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>


                {/* PRIORITY */}

                {priorityNotice && (
                    <PriorityNotice
                        icon={
                            priorityNotice.icon
                        }
                        title={
                            priorityNotice.title
                        }
                        description={
                            priorityNotice.description
                        }
                        actionLabel={
                            priorityNotice.actionLabel
                        }
                        tone={
                            priorityNotice.tone
                        }
                        onAction={() =>
                            router.push(
                                priorityNotice.route
                            )
                        }
                    />
                )}


                {/* SUMMARY */}

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        title="Active drives"
                        value={
                            activeDrives.length
                        }
                        description="Campaigns currently collecting"
                        icon={
                            ClipboardList
                        }
                        delay={
                            0
                        }
                        onClick={() =>
                            router.push(
                                "/profiles/school-partner/drives"
                            )
                        }
                    />

                    <SummaryCard
                        title="Collected weight"
                        value={`${formatWeight(
                            totalCollectedWeight
                        )} kg`}
                        description="Recorded across all drives"
                        icon={
                            Weight
                        }
                        delay={
                            50
                        }
                        onClick={() =>
                            router.push(
                                "/profiles/school-partner/drives"
                            )
                        }
                    />

                    <SummaryCard
                        title="Open pickups"
                        value={
                            pendingPickupCount
                        }
                        description="Pending or accepted requests"
                        icon={
                            Truck
                        }
                        delay={
                            100
                        }
                        onClick={() =>
                            router.push(
                                "/profiles/school-partner/pickups"
                            )
                        }
                    />

                    <SummaryCard
                        title="Completed recoveries"
                        value={
                            completedRecoveryCount
                        }
                        description="Successful recycler handoffs"
                        icon={
                            CheckCircle2
                        }
                        delay={
                            150
                        }
                        onClick={() =>
                            router.push(
                                "/profiles/school-partner/impact"
                            )
                        }
                    />
                </section>


                {/* ACTIVE DRIVES + QUICK ACTIONS */}

                <section className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
                    <DashboardSection
                        title="Active collection drives"
                        description="Campaigns currently receiving recyclable materials."
                        animationDelay="200ms"
                        actionLabel="View all drives"
                        onAction={() =>
                            router.push(
                                "/profiles/school-partner/drives"
                            )
                        }
                    >
                        {activeDrives.length ===
                        0 ? (
                            <DashboardEmptyState
                                icon={
                                    ClipboardList
                                }
                                title="No active collection drives"
                                description="Create a campaign, select accepted materials, set a target, and start collecting."
                                actionLabel="Create collection drive"
                                onAction={() =>
                                    router.push(
                                        "/profiles/school-partner/drives?action=create"
                                    )
                                }
                            />
                        ) : (
                            <div className="space-y-4">
                                {activeDrives
                                    .slice(
                                        0,
                                        2
                                    )
                                    .map(
                                        (
                                            drive
                                        ) => (
                                            <ActiveDriveCard
                                                key={
                                                    drive.id
                                                }
                                                drive={
                                                    drive
                                                }
                                                onOpen={() =>
                                                    router.push(
                                                        "/profiles/school-partner/drives"
                                                    )
                                                }
                                                onRecord={() =>
                                                    router.push(
                                                        "/profiles/school-partner/drives?action=record"
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
                                    ClipboardList
                                }
                                title="Create collection drive"
                                description="Start a new recovery campaign."
                                onClick={() =>
                                    router.push(
                                        "/profiles/school-partner/drives?action=create"
                                    )
                                }
                            />

                            <QuickAction
                                icon={
                                    Weight
                                }
                                title="Record collection"
                                description="Add material weight and source."
                                onClick={() =>
                                    router.push(
                                        "/profiles/school-partner/drives?action=record"
                                    )
                                }
                            />

                            <QuickAction
                                icon={
                                    Send
                                }
                                title="Request pickup"
                                description="Publish a collected batch to recyclers."
                                onClick={() =>
                                    router.push(
                                        "/profiles/school-partner/pickups?action=create"
                                    )
                                }
                            />

                            <QuickAction
                                icon={
                                    UserRound
                                }
                                title="Edit partner profile"
                                description="Manage organization and contact details."
                                onClick={() =>
                                    router.push(
                                        "/profiles/school-partner/profile"
                                    )
                                }
                            />
                        </div>
                    </DashboardSection>
                </section>


                {/* PICKUPS + COLLECTIONS */}

                <section className="grid gap-5 xl:grid-cols-2">
                    <DashboardSection
                        title="Pickup requests"
                        description="Recent requests and recycler-response activity."
                        animationDelay="300ms"
                        actionLabel="View all pickups"
                        onAction={() =>
                            router.push(
                                "/profiles/school-partner/pickups"
                            )
                        }
                    >
                        {pickupRequests.length ===
                        0 ? (
                            <DashboardEmptyState
                                icon={
                                    Truck
                                }
                                title="No pickup requests"
                                description="Collected materials ready for recovery can be published to recycler partners."
                                actionLabel="Request pickup"
                                onAction={() =>
                                    router.push(
                                        "/profiles/school-partner/pickups?action=create"
                                    )
                                }
                            />
                        ) : (
                            <div className="space-y-3">
                                {pickupRequests
                                    .slice(
                                        0,
                                        3
                                    )
                                    .map(
                                        (
                                            request
                                        ) => (
                                            <PickupPreviewCard
                                                key={
                                                    request.id
                                                }
                                                request={
                                                    request
                                                }
                                                onOpen={() =>
                                                    router.push(
                                                        "/profiles/school-partner/pickups"
                                                    )
                                                }
                                            />
                                        )
                                    )}
                            </div>
                        )}
                    </DashboardSection>


                    <DashboardSection
                        title="Recent collections"
                        description="Newest material entries recorded by the organization."
                        animationDelay="350ms"
                        actionLabel="View collection drives"
                        onAction={() =>
                            router.push(
                                "/profiles/school-partner/drives"
                            )
                        }
                    >
                        {recentCollections.length ===
                        0 ? (
                            <DashboardEmptyState
                                icon={
                                    PackageCheck
                                }
                                title="No collections recorded"
                                description="Record material contributions after starting an active collection drive."
                                actionLabel="Record collection"
                                onAction={() =>
                                    router.push(
                                        "/profiles/school-partner/drives?action=record"
                                    )
                                }
                            />
                        ) : (
                            <div className="divide-y divide-zinc-100">
                                {recentCollections.map(
                                    (
                                        entry
                                    ) => (
                                        <RecentCollectionRow
                                            key={
                                                entry.id
                                            }
                                            entry={
                                                entry
                                            }
                                        />
                                    )
                                )}
                            </div>
                        )}
                    </DashboardSection>
                </section>


                {/* IMPACT CTA */}

                <section className="school-dashboard-motion animate-[schoolDashboardFadeUp_.4s_ease-out_.4s_both] overflow-hidden rounded-[28px] border border-green-100 bg-white shadow-sm">
                    <div className="grid lg:grid-cols-[1fr_auto]">
                        <div className="p-6 sm:p-8">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                                <BarChart3 className="h-6 w-6" />
                            </div>

                            <h2 className="mt-5 text-2xl font-black text-zinc-900">
                                Environmental impact
                            </h2>

                            <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-500">
                                Turn completed collections and recycler
                                handoffs into a measurable record of recovered
                                materials and school participation.
                            </p>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    router.push(
                                        "/profiles/school-partner/impact"
                                    )
                                }
                                className="mt-5 rounded-full border-green-200 text-green-700 hover:bg-green-50"
                            >
                                <Leaf className="mr-2 h-4 w-4" />

                                View impact

                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>


                        <div className="flex min-w-72 items-center justify-center bg-gradient-to-br from-green-600 to-emerald-800 p-8 text-white">
                            <div className="text-center">
                                <Recycle className="mx-auto h-9 w-9 text-green-100" />

                                <p className="mt-4 text-4xl font-black">
                                    {formatWeight(
                                        totalCollectedWeight
                                    )}{" "}
                                    kg
                                </p>

                                <p className="mt-2 text-sm font-semibold text-green-100">
                                    Total material recorded
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}


/* =========================================================
   COMPONENTS
========================================================= */

function PriorityNotice({
    icon: Icon,
    title,
    description,
    actionLabel,
    tone,
    onAction,
}: {
    icon:
        ComponentType<{
            className?: string;
        }>;

    title: string;
    description: string;
    actionLabel: string;

    tone:
        | "success"
        | "warning"
        | "danger";

    onAction: () => void;
}) {
    const toneClasses = {
        success:
            {
                panel:
                    "border-green-200 bg-green-50",

                icon:
                    "bg-green-100 text-green-700",

                button:
                    "border-green-200 text-green-700 hover:bg-green-100",
            },

        warning:
            {
                panel:
                    "border-amber-200 bg-amber-50",

                icon:
                    "bg-amber-100 text-amber-700",

                button:
                    "border-amber-200 text-amber-700 hover:bg-amber-100",
            },

        danger:
            {
                panel:
                    "border-red-200 bg-red-50",

                icon:
                    "bg-red-100 text-red-700",

                button:
                    "border-red-200 text-red-700 hover:bg-red-100",
            },
    }[tone];

    return (
        <section
            className={`school-dashboard-motion animate-[schoolDashboardFadeUp_.38s_ease-out_.08s_both] flex flex-col gap-4 rounded-[24px] border p-5 sm:flex-row sm:items-center ${toneClasses.panel}`}
        >
            <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneClasses.icon}`}
            >
                <Icon className="h-6 w-6" />
            </div>

            <div className="flex-1">
                <h2 className="font-black text-zinc-900">
                    {title}
                </h2>

                <p className="mt-1 text-sm leading-6 text-zinc-600">
                    {description}
                </p>
            </div>

            <Button
                type="button"
                variant="outline"
                onClick={
                    onAction
                }
                className={`w-fit rounded-full bg-white ${toneClasses.button}`}
            >
                {actionLabel}

                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </section>
    );
}


function SummaryCard({
    title,
    value,
    description,
    icon: Icon,
    delay,
    onClick,
}: {
    title: string;
    value:
        | string
        | number;
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
            className="school-dashboard-motion group animate-[schoolDashboardFadeUp_.38s_ease-out_both] rounded-[24px] border border-green-100 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-300 hover:shadow-md"
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
    animationDelay,
    actionLabel,
    onAction,
    children,
}: {
    title: string;
    description: string;
    animationDelay: string;
    actionLabel?: string;
    onAction?: () => void;
    children: ReactNode;
}) {
    return (
        <section
            style={{
                animationDelay,
            }}
            className="school-dashboard-motion animate-[schoolDashboardFadeUp_.4s_ease-out_both] rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-6"
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
                            {actionLabel}

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
                        {actionLabel}

                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
        </section>
    );
}


function DashboardEmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
}: {
    icon:
        ComponentType<{
            className?: string;
        }>;

    title: string;
    description: string;
    actionLabel: string;
    onAction: () => void;
}) {
    return (
        <div className="flex flex-col items-center rounded-[24px] border border-dashed border-green-200 bg-green-50/60 px-6 py-9 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-green-600 shadow-sm">
                <Icon className="h-6 w-6" />
            </div>

            <h3 className="mt-4 font-black text-zinc-900">
                {title}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                {description}
            </p>

            <Button
                type="button"
                onClick={
                    onAction
                }
                className="mt-5 rounded-full bg-green-600 hover:bg-green-700"
            >
                <Plus className="mr-2 h-4 w-4" />

                {actionLabel}
            </Button>
        </div>
    );
}


function ActiveDriveCard({
    drive,
    onOpen,
    onRecord,
}: {
    drive: DriveView;
    onOpen: () => void;
    onRecord: () => void;
}) {
    return (
        <div className="group overflow-hidden rounded-[22px] border border-green-100 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-green-200 hover:shadow-sm">
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-2xl bg-green-100 sm:w-24">
                    {drive.photo_url ? (
                        <img
                            src={
                                drive.photo_url
                            }
                            alt={
                                drive.title
                            }
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 text-green-600">
                            <ClipboardList className="h-7 w-7" />
                        </div>
                    )}
                </div>


                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                            Active
                        </Badge>

                        <p className="text-xs text-zinc-400">
                            {formatDate(
                                drive.start_date
                            )}{" "}
                            to{" "}
                            {formatDate(
                                drive.end_date
                            )}
                        </p>
                    </div>

                    <h3 className="mt-2 truncate font-black text-zinc-900">
                        {drive.title}
                    </h3>

                    <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-zinc-500">
                        <MapPin className="h-3.5 w-3.5 text-green-600" />

                        {
                            drive.collection_location
                        }
                    </p>


                    <div className="mt-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-zinc-500">
                                {formatWeight(
                                    drive.collected_weight_kg
                                )}{" "}
                                kg collected
                            </span>

                            <span className="font-black text-green-700">
                                {drive.target_weight_kg
                                    ? `${drive.progress_percentage}%`
                                    : `${drive.collection_count} entries`}
                            </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-green-50">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-700 transition-all duration-700"
                                style={{
                                    width:
                                        drive.target_weight_kg
                                            ? `${drive.progress_percentage}%`
                                            : drive.collected_weight_kg >
                                                0
                                              ? "12%"
                                              : "0%",
                                }}
                            />
                        </div>
                    </div>
                </div>


                <div className="flex shrink-0 gap-2 sm:flex-col">
                    <Button
                        type="button"
                        onClick={
                            onRecord
                        }
                        className="flex-1 rounded-full bg-green-600 hover:bg-green-700 sm:flex-none"
                    >
                        <Weight className="mr-2 h-4 w-4" />

                        Record
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={
                            onOpen
                        }
                        className="flex-1 rounded-full border-green-200 text-green-700 hover:bg-green-50 sm:flex-none"
                    >
                        Open
                    </Button>
                </div>
            </div>
        </div>
    );
}


function PickupPreviewCard({
    request,
    onOpen,
}: {
    request: PickupRequestView;
    onOpen: () => void;
}) {
    const statusDetails =
        getPickupStatusDetails(
            request.status
        );

    const StatusIcon =
        statusDetails.icon;

    return (
        <button
            type="button"
            onClick={
                onOpen
            }
            className="group flex w-full items-center gap-4 rounded-[20px] border border-zinc-100 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50/50"
        >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <Truck className="h-5 w-5" />
            </div>


            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge
                        variant="outline"
                        className={
                            statusDetails.className
                        }
                    >
                        <StatusIcon className="mr-1 h-3.5 w-3.5" />

                        {
                            statusDetails.label
                        }
                    </Badge>

                    {request.interested_response_count >
                        0 && (
                        <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                            <Inbox className="mr-1 h-3.5 w-3.5" />

                            {
                                request.interested_response_count
                            }{" "}
                            response
                            {request.interested_response_count ===
                            1
                                ? ""
                                : "s"}
                        </Badge>
                    )}
                </div>

                <h3 className="mt-2 truncate font-black text-zinc-900">
                    {request.drive_title}
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                    Pickup{" "}
                    {formatDate(
                        request.preferred_pickup_date
                    )}{" "}
                    ·{" "}
                    {formatWeight(
                        request.total_weight_kg
                    )}{" "}
                    kg
                </p>
            </div>


            <ArrowRight className="h-4 w-4 shrink-0 text-green-600 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
    );
}


function RecentCollectionRow({
    entry,
}: {
    entry: CollectionEntryView;
}) {
    return (
        <div className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-green-100">
                {entry.photo_url ? (
                    <img
                        src={
                            entry.photo_url
                        }
                        alt={
                            entry.material_name
                        }
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 text-green-600">
                        <PackageCheck className="h-5 w-5" />
                    </div>
                )}
            </div>


            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-black text-zinc-900">
                        {
                            entry.material_name
                        }
                    </h3>

                    <Badge
                        variant="secondary"
                        className="bg-zinc-100 text-zinc-600"
                    >
                        {
                            entry.drive_title
                        }
                    </Badge>
                </div>

                <p className="mt-1 truncate text-xs text-zinc-500">
                    {
                        entry.source_name
                    }{" "}
                    ·{" "}
                    {formatRelativeDate(
                        entry.collected_at
                    )}
                </p>
            </div>


            <div className="rounded-full bg-green-50 px-3 py-1.5 text-sm font-black text-green-700">
                {formatWeight(
                    entry.weight_kg
                )}{" "}
                kg
            </div>
        </div>
    );
}


function QuickAction({
    icon: Icon,
    title,
    description,
    onClick,
}: {
    icon:
        ComponentType<{
            className?: string;
        }>;

    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={
                onClick
            }
            className="group flex w-full items-center gap-4 rounded-2xl border border-zinc-100 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50"
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

            <ArrowRight className="h-4 w-4 shrink-0 text-green-600 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
    );
}


function MissingPartnerState({
    profileName,
    onSetup,
}: {
    profileName: string;
    onSetup: () => void;
}) {
    return (
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
            <div className="w-full overflow-hidden rounded-[32px] border border-green-100 bg-white shadow-sm">
                <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-800 p-8 text-white sm:p-10">
                        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />

                        <div className="relative">
                            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white p-2 shadow-lg">
                                <img
                                    src="/logo.png"
                                    alt="Trashure logo"
                                    className="h-full w-full object-contain"
                                />
                            </div>

                            <p className="mt-6 text-sm font-semibold text-green-100">
                                Welcome,{" "}
                                {getFirstName(
                                    profileName
                                )}
                            </p>

                            <h1 className="mt-2 text-3xl font-black">
                                Create the partner profile
                            </h1>

                            <p className="mt-3 text-sm leading-7 text-green-50">
                                Add the organization identity, address,
                                contact person, and project description before
                                creating collection drives.
                            </p>

                            <Button
                                type="button"
                                onClick={
                                    onSetup
                                }
                                className="mt-7 rounded-full bg-white px-6 text-green-700 hover:bg-green-50"
                            >
                                <School className="mr-2 h-4 w-4" />

                                Set up organization

                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>


                    <div className="p-8 sm:p-10">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
                            After setup
                        </p>

                        <div className="mt-6 space-y-5">
                            <SetupFeature
                                icon={
                                    ClipboardList
                                }
                                title="Create collection drives"
                                description="Set campaign dates, accepted materials, and target weight."
                            />

                            <SetupFeature
                                icon={
                                    Weight
                                }
                                title="Record collections"
                                description="Track material weight from classes and school groups."
                            />

                            <SetupFeature
                                icon={
                                    Truck
                                }
                                title="Coordinate pickups"
                                description="Publish ready batches to matching recycler partners."
                            />

                            <SetupFeature
                                icon={
                                    Leaf
                                }
                                title="Measure impact"
                                description="Review completed recovery activity and total materials."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


function SetupFeature({
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
                    School dashboard unavailable
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


function DashboardSkeleton() {
    return (
        <div className="space-y-7">
            <div className="flex justify-between gap-4">
                <div className="space-y-3">
                    <Skeleton className="h-4 w-48 bg-green-100" />

                    <Skeleton className="h-9 w-80 max-w-full bg-green-100" />

                    <Skeleton className="h-4 w-96 max-w-full bg-green-100" />
                </div>

                <Skeleton className="hidden h-10 w-28 rounded-full bg-green-100 sm:block" />
            </div>


            <Skeleton className="h-64 rounded-[32px] bg-green-100" />

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


            <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
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
