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
    Leaf,
    Loader2,
    MapPin,
    PackageCheck,
    Printer,
    Recycle,
    RefreshCcw,
    School,
    Target,
    Trophy,
    Truck,
    UserRound,
    UsersRound,
    Weight,
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
    created_at: string;
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
    verification_status: VerificationStatus;
    is_active: boolean;
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
    status:
        | "pending"
        | "accepted"
        | "completed"
        | "cancelled";
    updated_at: string;
}


interface PickupItemRow {
    id: string;
    pickup_request_id: string;
    material_id: string;
    estimated_weight_kg:
        | number
        | string;
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
    photo_url: string | null;
    collected_at: string;
}


interface DriveImpact {
    id: string;
    title: string;
    status: DriveStatus;
    start_date: string;
    end_date: string;
    target_weight_kg: number | null;
    collected_weight_kg: number;
    progress_percentage: number;
    collection_count: number;
    source_count: number;
    photo_url: string | null;
}


interface MaterialImpact {
    material_id: string;
    material_name: string;
    category: string;
    weight_kg: number;
    entry_count: number;
    percentage: number;
}


interface SourceImpact {
    source_name: string;
    weight_kg: number;
    entry_count: number;
}


interface MonthlyImpact {
    key: string;
    label: string;
    collected_weight_kg: number;
    recovered_weight_kg: number;
}


interface CompletedPickupImpact {
    id: string;
    drive_id: string;
    drive_title: string;
    weight_kg: number;
    completed_at: string;
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


function formatDateTime(
    value: string
) {
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


function monthKey(
    value: string
) {
    const date =
        new Date(
            value
        );

    return `${date.getFullYear()}-${String(
        date.getMonth() +
            1
    ).padStart(
        2,
        "0"
    )}`;
}


function getLastSixMonths() {
    const result: Array<{
        key: string;
        label: string;
    }> = [];

    const now =
        new Date();

    for (
        let offset = 5;
        offset >= 0;
        offset -= 1
    ) {
        const date =
            new Date(
                now.getFullYear(),
                now.getMonth() -
                    offset,
                1
            );

        result.push({
            key:
                `${date.getFullYear()}-${String(
                    date.getMonth() +
                        1
                ).padStart(
                    2,
                    "0"
                )}`,

            label:
                date.toLocaleDateString(
                    "en-PH",
                    {
                        month:
                            "short",
                    }
                ),
        });
    }

    return result;
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
                icon:
                    BadgeCheck,
            };

        case "rejected":
            return {
                label:
                    "Needs correction",
                icon:
                    AlertCircle,
            };

        case "suspended":
            return {
                label:
                    "Suspended",
                icon:
                    AlertCircle,
            };

        default:
            return {
                label:
                    "Pending verification",
                icon:
                    Clock3,
            };
    }
}


/* =========================================================
   PAGE
========================================================= */

export default function SchoolPartnerImpactPage() {
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
        useState<DriveRow[]>(
            []
        );

    const [
        collections,
        setCollections,
    ] =
        useState<CollectionEntryView[]>(
            []
        );

    const [
        completedPickups,
        setCompletedPickups,
    ] =
        useState<CompletedPickupImpact[]>(
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
        recoveryWarning,
        setRecoveryWarning,
    ] =
        useState<string | null>(
            null
        );


    const loadImpactPage =
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

                setRecoveryWarning(
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
                                created_at
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
                            "This page is available only to school partners."
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
                                verification_status,
                                is_active
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

                        setCollections(
                            []
                        );

                        setCompletedPickups(
                            []
                        );

                        return;
                    }


                    const [
                        driveResult,
                        materialResult,
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


                    const driveRows =
                        (
                            driveResult.data ??
                            []
                        ) as DriveRow[];

                    const materialRows =
                        (
                            materialResult.data ??
                            []
                        ) as Material[];

                    setDrives(
                        driveRows
                    );


                    const driveIds =
                        driveRows.map(
                            (
                                drive
                            ) =>
                                drive.id
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


                    const driveMap =
                        new Map(
                            driveRows.map(
                                (
                                    drive
                                ) => [
                                    drive.id,
                                    drive,
                                ]
                            )
                        );

                    const materialMap =
                        new Map(
                            materialRows.map(
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
                                    driveMap.get(
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

                                    photo_url:
                                        entry.photo_url,

                                    collected_at:
                                        entry.collected_at,
                                };
                            }
                        );


                    setCollections(
                        normalizedCollections
                    );


                    const {
                        data:
                            pickupRequestData,
                        error:
                            pickupRequestError,
                    } =
                        await supabase
                            .from(
                                "school_pickup_requests"
                            )
                            .select(`
                                id,
                                school_partner_id,
                                drive_id,
                                status,
                                updated_at
                            `)
                            .eq(
                                "school_partner_id",
                                currentPartner.id
                            )
                            .eq(
                                "status",
                                "completed"
                            )
                            .order(
                                "updated_at",
                                {
                                    ascending:
                                        false,
                                }
                            );


                    if (
                        pickupRequestError
                    ) {
                        console.warn(
                            "Completed pickup requests could not be loaded:",
                            pickupRequestError
                        );

                        setRecoveryWarning(
                            getErrorMessage(
                                pickupRequestError,
                                "Completed recovery data is temporarily unavailable."
                            )
                        );

                        setCompletedPickups(
                            []
                        );

                        return;
                    }


                    const pickupRequests =
                        (
                            pickupRequestData ??
                            []
                        ) as PickupRequestRow[];

                    const pickupIds =
                        pickupRequests.map(
                            (
                                request
                            ) =>
                                request.id
                        );


                    let pickupItems:
                        PickupItemRow[] = [];

                    if (
                        pickupIds.length >
                        0
                    ) {
                        const {
                            data,
                            error,
                        } =
                            await supabase
                                .from(
                                    "school_pickup_items"
                                )
                                .select(`
                                    id,
                                    pickup_request_id,
                                    material_id,
                                    estimated_weight_kg
                                `)
                                .in(
                                    "pickup_request_id",
                                    pickupIds
                                );

                        if (
                            error
                        ) {
                            console.warn(
                                "Completed pickup items could not be loaded:",
                                error
                            );

                            setRecoveryWarning(
                                getErrorMessage(
                                    error,
                                    "Completed recovery weight is temporarily unavailable."
                                )
                            );
                        } else {
                            pickupItems =
                                (
                                    data ??
                                    []
                                ) as PickupItemRow[];
                        }
                    }


                    const normalizedPickups =
                        pickupRequests.map(
                            (
                                request
                            ): CompletedPickupImpact => ({
                                id:
                                    request.id,

                                drive_id:
                                    request.drive_id,

                                drive_title:
                                    driveMap.get(
                                        request.drive_id
                                    )?.title ??
                                    "Collection drive",

                                weight_kg:
                                    pickupItems
                                        .filter(
                                            (
                                                item
                                            ) =>
                                                item.pickup_request_id ===
                                                request.id
                                        )
                                        .reduce(
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

                                completed_at:
                                    request.updated_at,
                            })
                        );


                    setCompletedPickups(
                        normalizedPickups
                    );
                } catch (
                    error
                ) {
                    const message =
                        getErrorMessage(
                            error,
                            "Unable to load environmental impact data."
                        );

                    console.error(
                        "School impact page loading failed:",
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
            void loadImpactPage();
        },
        [
            loadImpactPage,
        ]
    );


    /* =====================================================
       DERIVED DATA
    ===================================================== */

    const totalCollectedWeight =
        useMemo(
            () =>
                collections.reduce(
                    (
                        total,
                        entry
                    ) =>
                        total +
                        entry.weight_kg,
                    0
                ),
            [
                collections,
            ]
        );


    const completedRecoveryWeight =
        useMemo(
            () =>
                completedPickups.reduce(
                    (
                        total,
                        pickup
                    ) =>
                        total +
                        pickup.weight_kg,
                    0
                ),
            [
                completedPickups,
            ]
        );


    const uniqueSourceCount =
        useMemo(
            () =>
                new Set(
                    collections
                        .map(
                            (
                                entry
                            ) =>
                                entry.source_name
                                    .trim()
                                    .toLowerCase()
                        )
                        .filter(
                            Boolean
                        )
                ).size,
            [
                collections,
            ]
        );


    const completedDriveCount =
        useMemo(
            () =>
                drives.filter(
                    (
                        drive
                    ) =>
                        drive.status ===
                        "completed"
                ).length,
            [
                drives,
            ]
        );


    const recoveryRate =
        useMemo(
            () =>
                totalCollectedWeight >
                0
                    ? Math.min(
                          100,
                          Math.round(
                              (
                                  completedRecoveryWeight /
                                  totalCollectedWeight
                              ) *
                                  100
                          )
                      )
                    : 0,
            [
                completedRecoveryWeight,
                totalCollectedWeight,
            ]
        );


    const materialImpacts =
        useMemo(
            () => {
                const grouped =
                    new Map<
                        string,
                        {
                            material_id: string;
                            material_name: string;
                            category: string;
                            weight_kg: number;
                            entry_count: number;
                        }
                    >();


                collections.forEach(
                    (
                        entry
                    ) => {
                        const current =
                            grouped.get(
                                entry.material_id
                            );

                        if (
                            current
                        ) {
                            current.weight_kg +=
                                entry.weight_kg;

                            current.entry_count +=
                                1;
                        } else {
                            grouped.set(
                                entry.material_id,
                                {
                                    material_id:
                                        entry.material_id,

                                    material_name:
                                        entry.material_name,

                                    category:
                                        entry.category,

                                    weight_kg:
                                        entry.weight_kg,

                                    entry_count:
                                        1,
                                }
                            );
                        }
                    }
                );


                return Array.from(
                    grouped.values()
                )
                    .map(
                        (
                            item
                        ): MaterialImpact => ({
                            ...item,

                            percentage:
                                totalCollectedWeight >
                                0
                                    ? Math.round(
                                          (
                                              item.weight_kg /
                                              totalCollectedWeight
                                          ) *
                                              100
                                      )
                                    : 0,
                        })
                    )
                    .sort(
                        (
                            first,
                            second
                        ) =>
                            second.weight_kg -
                            first.weight_kg
                    );
            },
            [
                collections,
                totalCollectedWeight,
            ]
        );


    const sourceImpacts =
        useMemo(
            () => {
                const grouped =
                    new Map<
                        string,
                        SourceImpact
                    >();


                collections.forEach(
                    (
                        entry
                    ) => {
                        const normalizedName =
                            entry.source_name.trim() ||
                            "Unspecified source";

                        const key =
                            normalizedName.toLowerCase();

                        const current =
                            grouped.get(
                                key
                            );

                        if (
                            current
                        ) {
                            current.weight_kg +=
                                entry.weight_kg;

                            current.entry_count +=
                                1;
                        } else {
                            grouped.set(
                                key,
                                {
                                    source_name:
                                        normalizedName,

                                    weight_kg:
                                        entry.weight_kg,

                                    entry_count:
                                        1,
                                }
                            );
                        }
                    }
                );


                return Array.from(
                    grouped.values()
                )
                    .sort(
                        (
                            first,
                            second
                        ) =>
                            second.weight_kg -
                            first.weight_kg
                    )
                    .slice(
                        0,
                        6
                    );
            },
            [
                collections,
            ]
        );


    const driveImpacts =
        useMemo(
            () =>
                drives
                    .map(
                        (
                            drive
                        ): DriveImpact => {
                            const driveEntries =
                                collections.filter(
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

                            return {
                                id:
                                    drive.id,

                                title:
                                    drive.title,

                                status:
                                    drive.status,

                                start_date:
                                    drive.start_date,

                                end_date:
                                    drive.end_date,

                                target_weight_kg:
                                    targetWeight,

                                collected_weight_kg:
                                    collectedWeight,

                                progress_percentage:
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
                                        : 0,

                                collection_count:
                                    driveEntries.length,

                                source_count:
                                    new Set(
                                        driveEntries.map(
                                            (
                                                entry
                                            ) =>
                                                entry.source_name
                                                    .trim()
                                                    .toLowerCase()
                                        )
                                    ).size,

                                photo_url:
                                    drive.photo_url,
                            };
                        }
                    )
                    .filter(
                        (
                            drive
                        ) =>
                            drive.collected_weight_kg >
                                0 ||
                            drive.status ===
                                "active"
                    )
                    .sort(
                        (
                            first,
                            second
                        ) =>
                            second.collected_weight_kg -
                            first.collected_weight_kg
                    )
                    .slice(
                        0,
                        6
                    ),
            [
                collections,
                drives,
            ]
        );


    const monthlyImpacts =
        useMemo(
            () => {
                const months =
                    getLastSixMonths();

                const collectedMap =
                    new Map<
                        string,
                        number
                    >();

                const recoveredMap =
                    new Map<
                        string,
                        number
                    >();


                collections.forEach(
                    (
                        entry
                    ) => {
                        const key =
                            monthKey(
                                entry.collected_at
                            );

                        collectedMap.set(
                            key,
                            (
                                collectedMap.get(
                                    key
                                ) ??
                                0
                            ) +
                                entry.weight_kg
                        );
                    }
                );


                completedPickups.forEach(
                    (
                        pickup
                    ) => {
                        const key =
                            monthKey(
                                pickup.completed_at
                            );

                        recoveredMap.set(
                            key,
                            (
                                recoveredMap.get(
                                    key
                                ) ??
                                0
                            ) +
                                pickup.weight_kg
                        );
                    }
                );


                return months.map(
                    (
                        month
                    ): MonthlyImpact => ({
                        ...month,

                        collected_weight_kg:
                            collectedMap.get(
                                month.key
                            ) ??
                            0,

                        recovered_weight_kg:
                            recoveredMap.get(
                                month.key
                            ) ??
                            0,
                    })
                );
            },
            [
                collections,
                completedPickups,
            ]
        );


    const maximumMonthlyWeight =
        useMemo(
            () =>
                Math.max(
                    1,
                    ...monthlyImpacts.flatMap(
                        (
                            month
                        ) => [
                            month.collected_weight_kg,
                            month.recovered_weight_kg,
                        ]
                    )
                ),
            [
                monthlyImpacts,
            ]
        );


    const hasImpactData =
        collections.length >
            0 ||
        completedPickups.length >
            0;


    if (
        loading
    ) {
        return (
            <ImpactPageSkeleton />
        );
    }


    if (
        pageError ||
        !profile
    ) {
        return (
            <ImpactErrorState
                message={
                    pageError ??
                    "School partner account was not found."
                }
                onRetry={() =>
                    void loadImpactPage()
                }
            />
        );
    }


    if (
        !partner
    ) {
        return (
            <MissingPartnerState
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


    return (
        <>
            <style jsx global>{`
                @keyframes impactFadeUp {
                    from {
                        opacity: 0;
                        transform: translateY(9px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes impactScaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.985);
                    }

                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @media print {
                    aside,
                    nav,
                    header,
                    .impact-no-print {
                        display: none !important;
                    }

                    main {
                        padding: 0 !important;
                    }

                    .impact-print-card {
                        break-inside: avoid;
                        box-shadow: none !important;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .impact-motion {
                        animation: none !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>


            <div className="space-y-7">
                {/* HEADER */}

                <section className="impact-motion animate-[impactFadeUp_.35s_ease-out_both]">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-sm font-bold text-green-600">
                                Measured recovery activity
                            </p>

                            <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
                                Environmental Impact
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                                Review recorded collections, completed
                                recycler handoffs, participating groups, and
                                material performance.
                            </p>
                        </div>


                        <div className="impact-no-print flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={
                                    refreshing
                                }
                                onClick={() =>
                                    void loadImpactPage(
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
                                variant="outline"
                                onClick={() =>
                                    window.print()
                                }
                                className="rounded-full border-green-200 bg-white text-green-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-50"
                            >
                                <Printer className="mr-2 h-4 w-4" />

                                Print report
                            </Button>
                        </div>
                    </div>
                </section>


                {/* HERO */}

                <section className="impact-print-card impact-motion animate-[impactScaleIn_.4s_ease-out_.04s_both] overflow-hidden rounded-[32px] border border-green-100 bg-white shadow-sm">
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
                                    className="absolute inset-0 h-full w-full object-cover opacity-20"
                                />

                                <div className="absolute inset-0 bg-gradient-to-r from-green-950/90 via-emerald-800/80 to-emerald-700/60" />
                            </>
                        )}


                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />

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

                                        <Badge className="border-white/20 bg-black/20 text-white hover:bg-black/20">
                                            <VerificationIcon className="mr-1.5 h-3.5 w-3.5" />

                                            {
                                                verification.label
                                            }
                                        </Badge>

                                        <Badge className="border-white/20 bg-black/20 text-white hover:bg-black/20">
                                            <Leaf className="mr-1.5 h-3.5 w-3.5" />

                                            Impact report
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


                            <div className="rounded-[24px] border border-white/20 bg-white/10 px-6 py-5 backdrop-blur-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.15em] text-green-100">
                                    Total recorded
                                </p>

                                <p className="mt-2 text-4xl font-black">
                                    {formatWeight(
                                        totalCollectedWeight
                                    )}{" "}
                                    kg
                                </p>

                                <p className="mt-1 text-sm text-green-50/80">
                                    Recyclable material collected
                                </p>
                            </div>
                        </div>
                    </div>
                </section>


                {/* RECOVERY WARNING */}

                {recoveryWarning && (
                    <section className="impact-print-card impact-motion animate-[impactFadeUp_.38s_ease-out_.08s_both] flex flex-col gap-4 rounded-[24px] border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                            <AlertCircle className="h-6 w-6" />
                        </div>

                        <div className="flex-1">
                            <h2 className="font-black text-zinc-900">
                                Recovery details are incomplete
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-zinc-600">
                                {recoveryWarning}
                            </p>
                        </div>
                    </section>
                )}


                {/* SUMMARY */}

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <ImpactSummaryCard
                        title="Total collected"
                        value={`${formatWeight(
                            totalCollectedWeight
                        )} kg`}
                        description="All recorded collection entries"
                        icon={
                            Weight
                        }
                        delay={
                            0
                        }
                    />

                    <ImpactSummaryCard
                        title="Completed pickup weight"
                        value={`${formatWeight(
                            completedRecoveryWeight
                        )} kg`}
                        description="Material in completed handoffs"
                        icon={
                            Truck
                        }
                        delay={
                            50
                        }
                    />

                    <ImpactSummaryCard
                        title="Participating sources"
                        value={
                            uniqueSourceCount
                        }
                        description="Classes, clubs, or departments"
                        icon={
                            UsersRound
                        }
                        delay={
                            100
                        }
                    />

                    <ImpactSummaryCard
                        title="Completed drives"
                        value={
                            completedDriveCount
                        }
                        description="Finished collection campaigns"
                        icon={
                            CheckCircle2
                        }
                        delay={
                            150
                        }
                    />
                </section>


                {!hasImpactData ? (
                    <ImpactEmptyState
                        onCreateDrive={() =>
                            router.push(
                                "/profiles/school-partner/drives?action=create"
                            )
                        }
                    />
                ) : (
                    <>
                        {/* RECOVERY + MONTHLY */}

                        <section className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
                            <ImpactSection
                                title="Recovery handoff"
                                description="Completed pickup weight compared with all recorded collections."
                                animationDelay="200ms"
                            >
                                <div className="flex flex-col items-center py-3 text-center">
                                    <div className="relative flex h-48 w-48 items-center justify-center rounded-full bg-green-50">
                                        <div
                                            className="absolute inset-0 rounded-full"
                                            style={{
                                                background:
                                                    `conic-gradient(rgb(22 163 74) ${recoveryRate}%, rgb(220 252 231) ${recoveryRate}% 100%)`,
                                            }}
                                        />

                                        <div className="relative flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white shadow-sm">
                                            <p className="text-4xl font-black text-zinc-900">
                                                {
                                                    recoveryRate
                                                }
                                                %
                                            </p>

                                            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-zinc-400">
                                                Handoff rate
                                            </p>
                                        </div>
                                    </div>


                                    <p className="mt-5 text-sm leading-6 text-zinc-500">
                                        {formatWeight(
                                            completedRecoveryWeight
                                        )}{" "}
                                        kg completed from{" "}
                                        {formatWeight(
                                            totalCollectedWeight
                                        )}{" "}
                                        kg recorded.
                                    </p>


                                    {completedRecoveryWeight >
                                        totalCollectedWeight &&
                                        totalCollectedWeight >
                                            0 && (
                                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left text-xs leading-5 text-amber-800">
                                            Completed pickup totals exceed
                                            recorded collection weight. Review
                                            repeated pickup requests for
                                            duplicated batches.
                                        </div>
                                    )}
                                </div>
                            </ImpactSection>


                            <ImpactSection
                                title="Six-month activity"
                                description="Monthly recorded collections and completed pickup weight."
                                animationDelay="250ms"
                            >
                                <div className="mt-2">
                                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-zinc-500">
                                        <div className="flex items-center gap-2">
                                            <span className="h-3 w-3 rounded-full bg-green-600" />

                                            Collected
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="h-3 w-3 rounded-full bg-emerald-200" />

                                            Completed pickup
                                        </div>
                                    </div>


                                    <div className="mt-6 grid h-64 grid-cols-6 gap-3">
                                        {monthlyImpacts.map(
                                            (
                                                month
                                            ) => (
                                                <div
                                                    key={
                                                        month.key
                                                    }
                                                    className="flex min-w-0 flex-col"
                                                >
                                                    <div className="flex flex-1 items-end justify-center gap-1.5 rounded-2xl bg-zinc-50 px-2 pt-4">
                                                        <div
                                                            title={`${formatWeight(
                                                                month.collected_weight_kg
                                                            )} kg collected`}
                                                            className="w-1/2 rounded-t-lg bg-green-600 transition-all duration-700"
                                                            style={{
                                                                height:
                                                                    `${Math.max(
                                                                        month.collected_weight_kg >
                                                                            0
                                                                            ? 8
                                                                            : 0,
                                                                        (
                                                                            month.collected_weight_kg /
                                                                            maximumMonthlyWeight
                                                                        ) *
                                                                            100
                                                                    )}%`,
                                                            }}
                                                        />

                                                        <div
                                                            title={`${formatWeight(
                                                                month.recovered_weight_kg
                                                            )} kg completed`}
                                                            className="w-1/2 rounded-t-lg bg-emerald-200 transition-all duration-700"
                                                            style={{
                                                                height:
                                                                    `${Math.max(
                                                                        month.recovered_weight_kg >
                                                                            0
                                                                            ? 8
                                                                            : 0,
                                                                        (
                                                                            month.recovered_weight_kg /
                                                                            maximumMonthlyWeight
                                                                        ) *
                                                                            100
                                                                    )}%`,
                                                            }}
                                                        />
                                                    </div>

                                                    <p className="mt-3 truncate text-center text-xs font-bold text-zinc-500">
                                                        {
                                                            month.label
                                                        }
                                                    </p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </ImpactSection>
                        </section>


                        {/* MATERIALS + CONTRIBUTORS */}

                        <section className="grid gap-5 xl:grid-cols-2">
                            <ImpactSection
                                title="Material breakdown"
                                description="Collected weight grouped by material type."
                                animationDelay="300ms"
                            >
                                {materialImpacts.length ===
                                0 ? (
                                    <SmallEmptyState
                                        icon={
                                            Recycle
                                        }
                                        text="No material totals are available."
                                    />
                                ) : (
                                    <div className="space-y-4">
                                        {materialImpacts
                                            .slice(
                                                0,
                                                7
                                            )
                                            .map(
                                                (
                                                    material
                                                ) => (
                                                    <MaterialImpactRow
                                                        key={
                                                            material.material_id
                                                        }
                                                        material={
                                                            material
                                                        }
                                                    />
                                                )
                                            )}
                                    </div>
                                )}
                            </ImpactSection>


                            <ImpactSection
                                title="Top participating groups"
                                description="Highest recorded contributions by source."
                                animationDelay="350ms"
                            >
                                {sourceImpacts.length ===
                                0 ? (
                                    <SmallEmptyState
                                        icon={
                                            UsersRound
                                        }
                                        text="No participating groups are recorded."
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        {sourceImpacts.map(
                                            (
                                                source,
                                                index
                                            ) => (
                                                <SourceImpactRow
                                                    key={
                                                        source.source_name.toLowerCase()
                                                    }
                                                    source={
                                                        source
                                                    }
                                                    rank={
                                                        index +
                                                        1
                                                    }
                                                    maximumWeight={
                                                        sourceImpacts[0]
                                                            ?.weight_kg ??
                                                        1
                                                    }
                                                />
                                            )
                                        )}
                                    </div>
                                )}
                            </ImpactSection>
                        </section>


                        {/* DRIVE PERFORMANCE */}

                        <ImpactSection
                            title="Drive performance"
                            description="Progress and participation across collection campaigns."
                            animationDelay="400ms"
                            actionLabel="Manage drives"
                            onAction={() =>
                                router.push(
                                    "/profiles/school-partner/drives"
                                )
                            }
                        >
                            {driveImpacts.length ===
                            0 ? (
                                <SmallEmptyState
                                    icon={
                                        ClipboardList
                                    }
                                    text="No drive performance is available yet."
                                />
                            ) : (
                                <div className="grid gap-4 lg:grid-cols-2">
                                    {driveImpacts.map(
                                        (
                                            drive
                                        ) => (
                                            <DriveImpactCard
                                                key={
                                                    drive.id
                                                }
                                                drive={
                                                    drive
                                                }
                                            />
                                        )
                                    )}
                                </div>
                            )}
                        </ImpactSection>


                        {/* COMPLETED PICKUPS */}

                        <ImpactSection
                            title="Completed recovery handoffs"
                            description="Pickup requests confirmed as completed by the organization."
                            animationDelay="450ms"
                            actionLabel="View pickups"
                            onAction={() =>
                                router.push(
                                    "/profiles/school-partner/pickups"
                                )
                            }
                        >
                            {completedPickups.length ===
                            0 ? (
                                <SmallEmptyState
                                    icon={
                                        Truck
                                    }
                                    text="No completed pickup handoffs are recorded."
                                />
                            ) : (
                                <div className="divide-y divide-zinc-100">
                                    {completedPickups
                                        .slice(
                                            0,
                                            6
                                        )
                                        .map(
                                            (
                                                pickup
                                            ) => (
                                                <CompletedPickupRow
                                                    key={
                                                        pickup.id
                                                    }
                                                    pickup={
                                                        pickup
                                                    }
                                                />
                                            )
                                        )}
                                </div>
                            )}
                        </ImpactSection>
                    </>
                )}
            </div>
        </>
    );
}


/* =========================================================
   COMPONENTS
========================================================= */

function ImpactSummaryCard({
    title,
    value,
    description,
    icon: Icon,
    delay,
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
}) {
    return (
        <div
            style={{
                animationDelay:
                    `${delay}ms`,
            }}
            className="impact-print-card impact-motion group animate-[impactFadeUp_.38s_ease-out_both] rounded-[24px] border border-green-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-300 hover:shadow-md"
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
        </div>
    );
}


function ImpactSection({
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
            className="impact-print-card impact-motion animate-[impactFadeUp_.4s_ease-out_both] rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-7"
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
                            className="impact-no-print hidden shrink-0 rounded-full text-green-700 hover:bg-green-50 sm:flex"
                        >
                            {actionLabel}

                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
            </div>

            <div className="mt-6">
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
                        className="impact-no-print mt-4 w-full rounded-xl text-green-700 hover:bg-green-50 sm:hidden"
                    >
                        {actionLabel}

                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
        </section>
    );
}


function MaterialImpactRow({
    material,
}: {
    material: MaterialImpact;
}) {
    return (
        <div>
            <div className="flex items-end justify-between gap-4">
                <div>
                    <p className="font-black text-zinc-900">
                        {
                            material.material_name
                        }
                    </p>

                    <p className="mt-1 text-xs text-zinc-400">
                        {
                            material.category
                        }{" "}
                        ·{" "}
                        {
                            material.entry_count
                        }{" "}
                        entr
                        {material.entry_count ===
                        1
                            ? "y"
                            : "ies"}
                    </p>
                </div>

                <div className="text-right">
                    <p className="font-black text-green-700">
                        {formatWeight(
                            material.weight_kg
                        )}{" "}
                        kg
                    </p>

                    <p className="mt-1 text-xs font-semibold text-zinc-400">
                        {
                            material.percentage
                        }
                        %
                    </p>
                </div>
            </div>

            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-green-50">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-700 transition-all duration-700"
                    style={{
                        width:
                            `${material.percentage}%`,
                    }}
                />
            </div>
        </div>
    );
}


function SourceImpactRow({
    source,
    rank,
    maximumWeight,
}: {
    source: SourceImpact;
    rank: number;
    maximumWeight: number;
}) {
    const width =
        maximumWeight >
        0
            ? Math.max(
                  6,
                  (
                      source.weight_kg /
                      maximumWeight
                  ) *
                      100
              )
            : 0;

    return (
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-black text-green-700 shadow-sm">
                    {rank}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                        <p className="truncate font-black text-zinc-900">
                            {
                                source.source_name
                            }
                        </p>

                        <p className="shrink-0 text-sm font-black text-green-700">
                            {formatWeight(
                                source.weight_kg
                            )}{" "}
                            kg
                        </p>
                    </div>

                    <p className="mt-1 text-xs text-zinc-400">
                        {
                            source.entry_count
                        }{" "}
                        contribution
                        {source.entry_count ===
                        1
                            ? ""
                            : "s"}
                    </p>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                        <div
                            className="h-full rounded-full bg-green-600 transition-all duration-700"
                            style={{
                                width:
                                    `${width}%`,
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}


function DriveImpactCard({
    drive,
}: {
    drive: DriveImpact;
}) {
    const statusClass =
        drive.status ===
        "active"
            ? "border-green-200 bg-green-50 text-green-700"
            : drive.status ===
                "completed"
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : drive.status ===
                  "cancelled"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-amber-200 bg-amber-50 text-amber-700";

    return (
        <div className="group overflow-hidden rounded-[24px] border border-green-100 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-green-200 hover:shadow-sm">
            <div className="relative h-36 overflow-hidden bg-green-100">
                {drive.photo_url ? (
                    <img
                        src={
                            drive.photo_url
                        }
                        alt={
                            drive.title
                        }
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 text-green-600">
                        <ClipboardList className="h-10 w-10" />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                <Badge
                    variant="outline"
                    className={`absolute bottom-3 left-3 capitalize ${statusClass}`}
                >
                    {
                        drive.status
                    }
                </Badge>
            </div>


            <div className="p-5">
                <h3 className="truncate font-black text-zinc-900">
                    {
                        drive.title
                    }
                </h3>

                <p className="mt-1 text-xs text-zinc-400">
                    {formatDate(
                        drive.start_date
                    )}{" "}
                    to{" "}
                    {formatDate(
                        drive.end_date
                    )}
                </p>


                <div className="mt-4 grid grid-cols-3 gap-2">
                    <DriveMetric
                        icon={
                            Weight
                        }
                        value={`${formatWeight(
                            drive.collected_weight_kg
                        )} kg`}
                        label="Collected"
                    />

                    <DriveMetric
                        icon={
                            PackageCheck
                        }
                        value={
                            drive.collection_count
                        }
                        label="Entries"
                    />

                    <DriveMetric
                        icon={
                            UsersRound
                        }
                        value={
                            drive.source_count
                        }
                        label="Sources"
                    />
                </div>


                <div className="mt-5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-500">
                            {drive.target_weight_kg
                                ? `${formatWeight(
                                      drive.collected_weight_kg
                                  )} of ${formatWeight(
                                      drive.target_weight_kg
                                  )} kg`
                                : "No target weight"}
                        </span>

                        <span className="font-black text-green-700">
                            {drive.target_weight_kg
                                ? `${drive.progress_percentage}%`
                                : "Recorded"}
                        </span>
                    </div>

                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-green-50">
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
        </div>
    );
}


function DriveMetric({
    icon: Icon,
    value,
    label,
}: {
    icon:
        ComponentType<{
            className?: string;
        }>;
    value:
        | string
        | number;
    label: string;
}) {
    return (
        <div className="rounded-2xl bg-zinc-50 p-3 text-center">
            <Icon className="mx-auto h-4 w-4 text-green-600" />

            <p className="mt-2 text-sm font-black text-zinc-900">
                {value}
            </p>

            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                {label}
            </p>
        </div>
    );
}


function CompletedPickupRow({
    pickup,
}: {
    pickup: CompletedPickupImpact;
}) {
    return (
        <div className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <Truck className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate font-black text-zinc-900">
                    {
                        pickup.drive_title
                    }
                </p>

                <p className="mt-1 text-xs text-zinc-400">
                    Completed{" "}
                    {formatDateTime(
                        pickup.completed_at
                    )}
                </p>
            </div>

            <div className="rounded-full bg-green-50 px-4 py-2 text-sm font-black text-green-700">
                {formatWeight(
                    pickup.weight_kg
                )}{" "}
                kg
            </div>
        </div>
    );
}


function SmallEmptyState({
    icon: Icon,
    text,
}: {
    icon:
        ComponentType<{
            className?: string;
        }>;
    text: string;
}) {
    return (
        <div className="flex flex-col items-center rounded-[22px] border border-dashed border-green-200 bg-green-50/50 px-5 py-9 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-green-600 shadow-sm">
                <Icon className="h-5 w-5" />
            </div>

            <p className="mt-4 text-sm font-semibold text-zinc-500">
                {text}
            </p>
        </div>
    );
}


function ImpactEmptyState({
    onCreateDrive,
}: {
    onCreateDrive: () => void;
}) {
    return (
        <section className="impact-print-card impact-motion animate-[impactFadeUp_.4s_ease-out_.2s_both] overflow-hidden rounded-[30px] border border-green-100 bg-white shadow-sm">
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

                        <h2 className="mt-6 text-3xl font-black">
                            Start measuring impact
                        </h2>

                        <p className="mt-3 max-w-xl text-sm leading-7 text-green-50">
                            Create a collection drive and record material
                            contributions. This report will update
                            automatically from actual collection and pickup
                            records.
                        </p>

                        <Button
                            type="button"
                            onClick={
                                onCreateDrive
                            }
                            className="impact-no-print mt-7 rounded-full bg-white px-6 text-green-700 hover:bg-green-50"
                        >
                            <ClipboardList className="mr-2 h-4 w-4" />

                            Create collection drive

                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>


                <div className="p-8 sm:p-10">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
                        This report measures
                    </p>

                    <div className="mt-6 space-y-5">
                        <ImpactFeature
                            icon={
                                Weight
                            }
                            title="Collected material"
                            description="Actual weight recorded through collection entries."
                        />

                        <ImpactFeature
                            icon={
                                UsersRound
                            }
                            title="Participation"
                            description="Classes, clubs, departments, and community sources."
                        />

                        <ImpactFeature
                            icon={
                                Truck
                            }
                            title="Completed recovery"
                            description="Material batches confirmed through completed pickups."
                        />

                        <ImpactFeature
                            icon={
                                Target
                            }
                            title="Drive performance"
                            description="Progress against campaign targets and collection activity."
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}


function ImpactFeature({
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


function MissingPartnerState({
    onSetup,
}: {
    onSetup: () => void;
}) {
    return (
        <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center">
            <div className="w-full overflow-hidden rounded-[30px] border border-green-100 bg-white shadow-sm">
                <div className="bg-gradient-to-br from-green-600 to-emerald-800 p-8 text-center text-white">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white p-2 shadow-lg">
                        <img
                            src="/logo.png"
                            alt="Trashure logo"
                            className="h-full w-full object-contain"
                        />
                    </div>

                    <h1 className="mt-5 text-2xl font-black">
                        Complete the partner profile
                    </h1>

                    <p className="mt-3 text-sm leading-7 text-green-50">
                        The organization identity is required before
                        collection drives and environmental impact can be
                        measured.
                    </p>

                    <Button
                        type="button"
                        onClick={
                            onSetup
                        }
                        className="mt-6 rounded-full bg-white text-green-700 hover:bg-green-50"
                    >
                        <UserRound className="mr-2 h-4 w-4" />

                        Set up profile
                    </Button>
                </div>
            </div>
        </div>
    );
}


function ImpactErrorState({
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
                    Impact report unavailable
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


function ImpactPageSkeleton() {
    return (
        <div className="space-y-7">
            <div className="space-y-3">
                <Skeleton className="h-4 w-48 bg-green-100" />

                <Skeleton className="h-9 w-80 max-w-full bg-green-100" />

                <Skeleton className="h-4 w-96 max-w-full bg-green-100" />
            </div>


            <Skeleton className="h-64 rounded-[32px] bg-green-100" />


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


            <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
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
