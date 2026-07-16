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
    Boxes,
    CalendarDays,
    Camera,
    History,
    Leaf,
    MapPin,
    MapPinned,
    PackageCheck,
    Recycle,
    RefreshCcw,
    ScanLine,
    School,
    Sparkles,
    Store,
    Target,
    UserRound,
} from "lucide-react";

import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";


const RESIDENT_BASE_PATH =
    "/profiles/resident";




interface ResidentProfile {
    id: string;
    auth_id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    age: number | null;
    sex: string | null;
    role: string;
    barangay: string | null;
    city: string | null;
    province: string | null;
    onboarding_completed: boolean;
    created_at: string;
    updated_at: string;
}


interface ScanRow {
    id: string;
    user_id: string;
    image_url: string | null;
    detected_object: string;
    material_type: string;
    confidence_score:
    | number
    | string
    | null;
    recommended_action: unknown;
    barangay: string | null;
    created_at: string;
}


interface ScanView extends ScanRow {
    confidence: number;
    action_label: string;
    action_description: string | null;
}


interface Junkshop {
    id: string;
    junkshop_name: string;
    photo_url: string | null;
    barangay: string | null;
    city: string | null;
    province: string | null;
    contact_number: string | null;
    verification_status:
    | "pending"
    | "approved"
    | "rejected"
    | "suspended";
    is_active: boolean;
}


interface SchoolPartner {
    id: string;
    organization_name: string;
    photo_url: string | null;
    barangay: string | null;
    city: string | null;
    province: string | null;
    verification_status:
    | "pending"
    | "approved"
    | "rejected"
    | "suspended";
    is_active: boolean;
}


interface SchoolDriveRow {
    id: string;
    school_partner_id: string;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string;
    collection_location: string;
    photo_url: string | null;
    status:
    | "draft"
    | "active"
    | "completed"
    | "cancelled";
}


interface DriveMaterialRow {
    drive_id: string;
    material_id: string;
}


interface Material {
    id: string;
    material_name: string;
    category: string;
}


interface NearbyDrive {
    id: string;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string;
    collection_location: string;
    photo_url: string | null;
    organization_name: string;
    organization_photo_url: string | null;
    barangay: string | null;
    city: string | null;
    province: string | null;
    materials: Material[];
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


function formatDate(
    value: string
) {
    return new Date(
        `${value}T00:00:00`
    ).toLocaleDateString(
        "en-PH",
        {
            month:
                "short",
            day:
                "numeric",
            year:
                "numeric",
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
        return `${hours} hr${hours === 1
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
        return `${days} day${days === 1
                ? ""
                : "s"
            } ago`;
    }

    return new Date(
        value
    ).toLocaleDateString(
        "en-PH",
        {
            month:
                "short",
            day:
                "numeric",
            year:
                "numeric",
        }
    );
}


function formatConfidence(
    value: number
) {
    const percentage =
        value <=
            1
            ? value *
            100
            : value;

    return `${Math.max(
        0,
        Math.min(
            100,
            Math.round(
                percentage
            )
        )
    )}%`;
}


function normalizeText(
    value: string | null
) {
    return (
        value ??
        ""
    )
        .trim()
        .toLowerCase();
}


function isSameArea(
    profile: ResidentProfile,
    target: {
        barangay: string | null;
        city: string | null;
        province: string | null;
    }
) {
    const profileBarangay =
        normalizeText(
            profile.barangay
        );

    const profileCity =
        normalizeText(
            profile.city
        );

    const profileProvince =
        normalizeText(
            profile.province
        );

    const targetBarangay =
        normalizeText(
            target.barangay
        );

    const targetCity =
        normalizeText(
            target.city
        );

    const targetProvince =
        normalizeText(
            target.province
        );

    if (
        profileBarangay &&
        targetBarangay &&
        profileBarangay ===
        targetBarangay
    ) {
        return 3;
    }

    if (
        profileCity &&
        targetCity &&
        profileCity ===
        targetCity
    ) {
        return 2;
    }

    if (
        profileProvince &&
        targetProvince &&
        profileProvince ===
        targetProvince
    ) {
        return 1;
    }

    return 0;
}


function getLocationLabel(
    value: {
        barangay: string | null;
        city: string | null;
        province: string | null;
    }
) {
    return [
        value.barangay,
        value.city,
        value.province,
    ]
        .filter(
            Boolean
        )
        .join(
            ", "
        );
}


function parseRecommendedAction(
    value: unknown
) {
    let normalized:
        unknown = value;

    if (
        typeof value ===
        "string"
    ) {
        try {
            normalized =
                JSON.parse(
                    value
                );
        } catch {
            return {
                label:
                    value.trim() ||
                    "Review recommendation",

                description:
                    null,
            };
        }
    }

    if (
        typeof normalized ===
        "object" &&
        normalized !==
        null
    ) {
        const record =
            normalized as Record<
                string,
                unknown
            >;

        const labelCandidates = [
            record.primary,
            record.action,
            record.title,
            record.recommended_action,
            record.recommendation,
        ];

        const descriptionCandidates = [
            record.description,
            record.reason,
            record.details,
            record.instructions,
        ];

        const label =
            labelCandidates.find(
                (
                    item
                ) =>
                    typeof item ===
                    "string" &&
                    item.trim().length >
                    0
            );

        const description =
            descriptionCandidates.find(
                (
                    item
                ) =>
                    typeof item ===
                    "string" &&
                    item.trim().length >
                    0
            );

        return {
            label:
                typeof label ===
                    "string"
                    ? label
                    : "Review recommendation",

            description:
                typeof description ===
                    "string"
                    ? description
                    : null,
        };
    }

    return {
        label:
            "Review recommendation",

        description:
            null,
    };
}


/* =========================================================
   PAGE
========================================================= */

export default function ResidentDashboardPage() {
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
        useState<ResidentProfile | null>(
            null
        );

    const [
        scans,
        setScans,
    ] =
        useState<ScanView[]>(
            []
        );

    const [
        junkshops,
        setJunkshops,
    ] =
        useState<Junkshop[]>(
            []
        );

    const [
        nearbyDrives,
        setNearbyDrives,
    ] =
        useState<NearbyDrive[]>(
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
        networkNotice,
        setNetworkNotice,
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

                setNetworkNotice(
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
                                age,
                                sex,
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
                                "Resident account was not found."
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
                            "This dashboard is available only to resident accounts."
                        );
                    }

                    setProfile(
                        currentProfile
                    );


                    const {
                        data:
                        scanRows,
                        error:
                        scanError,
                    } =
                        await supabase
                            .from(
                                "scans"
                            )
                            .select(`
                                id,
                                user_id,
                                image_url,
                                detected_object,
                                material_type,
                                confidence_score,
                                recommended_action,
                                barangay,
                                created_at
                            `)
                            .eq(
                                "user_id",
                                currentProfile.id
                            )
                            .order(
                                "created_at",
                                {
                                    ascending:
                                        false,
                                }
                            )
                            .limit(
                                50
                            );

                    if (
                        scanError
                    ) {
                        throw scanError;
                    }


                    const normalizedScans =
                        (
                            (
                                scanRows ??
                                []
                            ) as ScanRow[]
                        ).map(
                            (
                                scan
                            ): ScanView => {
                                const recommendation =
                                    parseRecommendedAction(
                                        scan.recommended_action
                                    );

                                return {
                                    ...scan,

                                    confidence:
                                        Number(
                                            scan.confidence_score ??
                                            0
                                        ),

                                    action_label:
                                        recommendation.label,

                                    action_description:
                                        recommendation.description,
                                };
                            }
                        );

                    setScans(
                        normalizedScans
                    );


                    const notices:
                        string[] = [];


                    const {
                        data:
                        junkshopRows,
                        error:
                        junkshopError,
                    } =
                        await supabase
                            .from(
                                "junkshops"
                            )
                            .select(`
                                id,
                                junkshop_name,
                                photo_url,
                                barangay,
                                city,
                                province,
                                contact_number,
                                verification_status,
                                is_active
                            `)
                            .eq(
                                "is_active",
                                true
                            )
                            .eq(
                                "verification_status",
                                "approved"
                            );

                    if (
                        junkshopError
                    ) {
                        console.warn(
                            "Resident junkshop discovery unavailable:",
                            junkshopError
                        );

                        notices.push(
                            "Nearby recycler partners are temporarily unavailable."
                        );

                        setJunkshops(
                            []
                        );
                    } else {
                        const sorted =
                            (
                                (
                                    junkshopRows ??
                                    []
                                ) as Junkshop[]
                            )
                                .sort(
                                    (
                                        first,
                                        second
                                    ) =>
                                        isSameArea(
                                            currentProfile,
                                            second
                                        ) -
                                        isSameArea(
                                            currentProfile,
                                            first
                                        )
                                )
                                .slice(
                                    0,
                                    6
                                );

                        setJunkshops(
                            sorted
                        );
                    }


                    const {
                        data:
                        driveRows,
                        error:
                        driveError,
                    } =
                        await supabase
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
                                collection_location,
                                photo_url,
                                status
                            `)
                            .eq(
                                "status",
                                "active"
                            )
                            .order(
                                "end_date",
                                {
                                    ascending:
                                        true,
                                }
                            );

                    if (
                        driveError
                    ) {
                        console.warn(
                            "Resident school drive discovery unavailable:",
                            driveError
                        );

                        notices.push(
                            "Community collection drives are temporarily unavailable."
                        );

                        setNearbyDrives(
                            []
                        );
                    } else {
                        const currentDriveRows =
                            (
                                driveRows ??
                                []
                            ) as SchoolDriveRow[];

                        const partnerIds =
                            Array.from(
                                new Set(
                                    currentDriveRows.map(
                                        (
                                            drive
                                        ) =>
                                            drive.school_partner_id
                                    )
                                )
                            );

                        const driveIds =
                            currentDriveRows.map(
                                (
                                    drive
                                ) =>
                                    drive.id
                            );


                        let partnerRows:
                            SchoolPartner[] = [];

                        let driveMaterialRows:
                            DriveMaterialRow[] = [];

                        let materialRows:
                            Material[] = [];


                        if (
                            partnerIds.length >
                            0
                        ) {
                            const {
                                data,
                                error,
                            } =
                                await supabase
                                    .from(
                                        "school_partners"
                                    )
                                    .select(`
                                        id,
                                        organization_name,
                                        photo_url,
                                        barangay,
                                        city,
                                        province,
                                        verification_status,
                                        is_active
                                    `)
                                    .in(
                                        "id",
                                        partnerIds
                                    )
                                    .eq(
                                        "is_active",
                                        true
                                    )
                                    .eq(
                                        "verification_status",
                                        "approved"
                                    );

                            if (
                                error
                            ) {
                                notices.push(
                                    "Some school partner details could not be loaded."
                                );
                            } else {
                                partnerRows =
                                    (
                                        data ??
                                        []
                                    ) as SchoolPartner[];
                            }
                        }


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
                                        "school_drive_materials"
                                    )
                                    .select(`
                                        drive_id,
                                        material_id
                                    `)
                                    .in(
                                        "drive_id",
                                        driveIds
                                    );

                            if (
                                !error
                            ) {
                                driveMaterialRows =
                                    (
                                        data ??
                                        []
                                    ) as DriveMaterialRow[];
                            }
                        }


                        const materialIds =
                            Array.from(
                                new Set(
                                    driveMaterialRows.map(
                                        (
                                            row
                                        ) =>
                                            row.material_id
                                    )
                                )
                            );

                        if (
                            materialIds.length >
                            0
                        ) {
                            const {
                                data,
                                error,
                            } =
                                await supabase
                                    .from(
                                        "materials"
                                    )
                                    .select(`
                                        id,
                                        material_name,
                                        category
                                    `)
                                    .in(
                                        "id",
                                        materialIds
                                    );

                            if (
                                !error
                            ) {
                                materialRows =
                                    (
                                        data ??
                                        []
                                    ) as Material[];
                            }
                        }


                        const partnerMap =
                            new Map(
                                partnerRows.map(
                                    (
                                        partner
                                    ) => [
                                            partner.id,
                                            partner,
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


                        const normalizedDrives =
                            currentDriveRows
                                .map(
                                    (
                                        drive
                                    ): NearbyDrive | null => {
                                        const partner =
                                            partnerMap.get(
                                                drive.school_partner_id
                                            );

                                        if (
                                            !partner
                                        ) {
                                            return null;
                                        }

                                        const materials =
                                            driveMaterialRows
                                                .filter(
                                                    (
                                                        row
                                                    ) =>
                                                        row.drive_id ===
                                                        drive.id
                                                )
                                                .map(
                                                    (
                                                        row
                                                    ) =>
                                                        materialMap.get(
                                                            row.material_id
                                                        )
                                                )
                                                .filter(
                                                    (
                                                        material
                                                    ): material is Material =>
                                                        Boolean(
                                                            material
                                                        )
                                                );

                                        return {
                                            id:
                                                drive.id,

                                            title:
                                                drive.title,

                                            description:
                                                drive.description,

                                            start_date:
                                                drive.start_date,

                                            end_date:
                                                drive.end_date,

                                            collection_location:
                                                drive.collection_location,

                                            photo_url:
                                                drive.photo_url,

                                            organization_name:
                                                partner.organization_name,

                                            organization_photo_url:
                                                partner.photo_url,

                                            barangay:
                                                partner.barangay,

                                            city:
                                                partner.city,

                                            province:
                                                partner.province,

                                            materials,
                                        };
                                    }
                                )
                                .filter(
                                    (
                                        drive
                                    ): drive is NearbyDrive =>
                                        Boolean(
                                            drive
                                        )
                                )
                                .sort(
                                    (
                                        first,
                                        second
                                    ) =>
                                        isSameArea(
                                            currentProfile,
                                            second
                                        ) -
                                        isSameArea(
                                            currentProfile,
                                            first
                                        )
                                )
                                .slice(
                                    0,
                                    4
                                );

                        setNearbyDrives(
                            normalizedDrives
                        );
                    }


                    if (
                        notices.length >
                        0
                    ) {
                        setNetworkNotice(
                            notices.join(
                                " "
                            )
                        );
                    }
                } catch (
                error
                ) {
                    const message =
                        getErrorMessage(
                            error,
                            "Unable to load the resident dashboard."
                        );

                    console.error(
                        "Resident dashboard loading failed:",
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


    const scansThisMonth =
        useMemo(
            () => {
                const now =
                    new Date();

                return scans.filter(
                    (
                        scan
                    ) => {
                        const date =
                            new Date(
                                scan.created_at
                            );

                        return (
                            date.getMonth() ===
                            now.getMonth() &&
                            date.getFullYear() ===
                            now.getFullYear()
                        );
                    }
                ).length;
            },
            [
                scans,
            ]
        );


    const uniqueMaterials =
        useMemo(
            () =>
                new Set(
                    scans
                        .map(
                            (
                                scan
                            ) =>
                                scan.material_type
                                    .trim()
                                    .toLowerCase()
                        )
                        .filter(
                            Boolean
                        )
                ).size,
            [
                scans,
            ]
        );


    const highConfidenceCount =
        useMemo(
            () =>
                scans.filter(
                    (
                        scan
                    ) => {
                        const normalized =
                            scan.confidence <=
                                1
                                ? scan.confidence
                                : scan.confidence /
                                100;

                        return (
                            normalized >=
                            0.8
                        );
                    }
                ).length,
            [
                scans,
            ]
        );


    const latestScan =
        scans[0] ??
        null;


    const priorityAction =
        useMemo(
            () => {
                if (
                    !profile
                ) {
                    return null;
                }

                if (
                    !profile.onboarding_completed
                ) {
                    return {
                        icon:
                            UserRound,

                        title:
                            "Complete your resident profile",

                        description:
                            "Add your barangay, city, and province so Trashure can prioritize nearby recovery options.",

                        actionLabel:
                            "Complete profile",

                        route:
                            `${RESIDENT_BASE_PATH}/profile`,
                    };
                }

                if (
                    scans.length ===
                    0
                ) {
                    return {
                        icon:
                            ScanLine,

                        title:
                            "Scan your first discarded item",

                        description:
                            "Take a clear photo and let Trashure identify the material and suggest the next recovery action.",

                        actionLabel:
                            "Start scanning",

                        route:
                            `${RESIDENT_BASE_PATH}/scan`,
                    };
                }

                if (
                    latestScan
                ) {
                    return {
                        icon:
                            Sparkles,

                        title:
                            `${latestScan.detected_object} was identified`,

                        description:
                            `${latestScan.action_label}. Open your history to review the result and recommendation.`,

                        actionLabel:
                            "View result",

                        route:
                            `${RESIDENT_BASE_PATH}/history`,
                    };
                }

                return null;
            },
            [
                latestScan,
                profile,
                scans.length,
            ]
        );


    if (
        loading
    ) {
        return (
            <ResidentDashboardSkeleton />
        );
    }


    if (
        pageError ||
        !profile
    ) {
        return (
            <ResidentErrorState
                message={
                    pageError ??
                    "Resident account was not found."
                }
                onRetry={() =>
                    void loadDashboard()
                }
            />
        );
    }


    return (
        <>
            <style jsx global>{`
                @keyframes residentFadeUp {
                    from {
                        opacity: 0;
                        transform: translateY(9px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes residentScaleIn {
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
                    .resident-motion {
                        animation: none !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>


            <div className="box-border w-full min-w-0 max-w-full space-y-7 overflow-x-clip">
                {/* HEADER */}

                <section className="resident-motion w-full min-w-0 animate-[residentFadeUp_.35s_ease-out_both]">
                    <div className="flex w-full min-w-0 flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-green-600">
                                Personal recovery workspace
                            </p>

                            <h1 className="mt-1 break-words text-3xl font-black tracking-tight text-zinc-900">
                                {greeting},{" "}
                                {firstName(
                                    profile.full_name
                                )}
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                                Identify discarded items, review recovery
                                recommendations, and discover nearby partners
                                that can keep useful materials in circulation.
                            </p>
                        </div>


                        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:flex-wrap">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={refreshing}
                                onClick={() =>
                                    void loadDashboard(true)
                                }
                               className="min-w-0 rounded-full border-green-200 bg-white px-3 text-xs text-green-700 transition-all duration-200 hover:bg-green-50 hover:text-green-800 sm:px-4 sm:text-sm">
                                <RefreshCcw
                                    className={`mr-2 h-4 w-4 shrink-0 ${refreshing
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
                                        `${RESIDENT_BASE_PATH}/scan`
                                    )
                                }
                                className="min-w-0 rounded-full bg-green-600 px-3 text-xs transition-all duration-200 hover:bg-green-700 sm:px-6 sm:text-sm"
                            >
                                <ScanLine className="mr-2 h-4 w-4 shrink-0" />

                                Scan item
                            </Button>
                        </div>
                    </div>
                </section>


                {/* HERO */}

               <section className="resident-motion w-full min-w-0 max-w-full animate-[residentScaleIn_.4s_ease-out_.04s_both] overflow-hidden rounded-[24px] border border-green-100 bg-white shadow-sm sm:rounded-[32px]">
                    <div className="relative w-full min-w-0 overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-emerald-800 p-5 text-white sm:min-h-64 sm:p-8">
                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />

                        <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-white/5" />


                        <div className="relative flex w-full min-w-0 flex-col justify-between gap-7 lg:min-h-48 lg:flex-row lg:items-end">
                            <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:items-end">
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border-4 border-white bg-white shadow-xl min-[380px]:h-24 min-[380px]:w-24 min-[380px]:rounded-[28px]">
                                    {profile.avatar_url ? (
                                        <img
                                            src={
                                                profile.avatar_url
                                            }
                                            alt={
                                                profile.full_name
                                            }
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <img
                                            src="/logo.png"
                                            alt="Trashure logo"
                                            className="h-16 w-16 object-contain"
                                        />
                                    )}
                                </div>


                             <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap gap-2">
                                        <Badge className="border-white/20 bg-white/15 text-white hover:bg-white/15">
                                            <UserRound className="mr-1.5 h-3.5 w-3.5" />

                                            Resident
                                        </Badge>

                                        {profile.onboarding_completed && (
                                            <Badge className="border-white/20 bg-black/20 text-white hover:bg-black/20">
                                                <BadgeCheck className="mr-1.5 h-3.5 w-3.5" />

                                                Profile ready
                                            </Badge>
                                        )}

                                        <Badge className="max-w-full border-white/20 bg-black/20 text-white hover:bg-black/20">
                                            <MapPin className="mr-1.5 h-3.5 w-3.5" />

                                            {[
                                                profile.barangay,
                                                profile.city,
                                            ]
                                                .filter(
                                                    Boolean
                                                )
                                                .join(
                                                    ", "
                                                ) ||
                                                "Location not set"}
                                        </Badge>
                                    </div>


                                    <h2 className="mt-4 break-words text-3xl font-black leading-tight sm:text-4xl">
    Scan. Understand. Recover.
</h2>

                                    <p className="mt-2 max-w-2xl text-sm leading-7 text-green-50/85">
                                        A single clear photo can become a
                                        practical reuse, donation, selling, or
                                        recycling decision.
                                    </p>
                                </div>
                            </div>


                            <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:flex-wrap">
                                <Button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            `${RESIDENT_BASE_PATH}/scan`
                                        )
                                    }
                                    className="min-w-0 rounded-full bg-white px-3 text-xs text-green-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-50 sm:px-4 sm:text-sm"
                                >
                                    <Camera className="mr-2 h-4 w-4 shrink-0" />

                                    Open scanner
                                </Button>

                                <Button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            `${RESIDENT_BASE_PATH}/history`
                                        )
                                    }
                                    className="min-w-0 rounded-full border border-white/30 bg-white/15 px-3 text-xs text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/25 sm:px-4 sm:text-sm"
                                >
                                    <History className="mr-2 h-4 w-4 shrink-0" />

                                    View history
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>


                {networkNotice && (
                    <section className="resident-motion flex w-full min-w-0 flex-col gap-4 overflow-hidden rounded-[24px] border border-amber-200 bg-amber-50 p-5 animate-[residentFadeUp_.38s_ease-out_.08s_both] sm:flex-row sm:items-center">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                            <AlertCircle className="h-6 w-6" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <h2 className="font-black text-zinc-900">
                                Some recovery connections are unavailable
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-zinc-600">
                                {networkNotice}
                            </p>
                        </div>
                    </section>
                )}


                {priorityAction && (
                    <PriorityAction
                        icon={
                            priorityAction.icon
                        }
                        title={
                            priorityAction.title
                        }
                        description={
                            priorityAction.description
                        }
                        actionLabel={
                            priorityAction.actionLabel
                        }
                        onAction={() =>
                            router.push(
                                priorityAction.route
                            )
                        }
                    />
                )}


                {/* STATS */}

                <section className="grid w-full min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        title="Total scans"
                        value={
                            scans.length
                        }
                        description="Items analyzed by Trashure"
                        icon={
                            ScanLine
                        }
                        delay={
                            0
                        }
                    />

                    <SummaryCard
                        title="This month"
                        value={
                            scansThisMonth
                        }
                        description="New scans during the month"
                        icon={
                            CalendarDays
                        }
                        delay={
                            50
                        }
                    />

                    <SummaryCard
                        title="Material types"
                        value={
                            uniqueMaterials
                        }
                        description="Unique materials identified"
                        icon={
                            Boxes
                        }
                        delay={
                            100
                        }
                    />

                    <SummaryCard
                        title="High confidence"
                        value={
                            highConfidenceCount
                        }
                        description="Results at 80% confidence or higher"
                        icon={
                            Target
                        }
                        delay={
                            150
                        }
                    />
                </section>


                {/* RECENT SCANS + QUICK ACTIONS */}

                <section className="grid w-full min-w-0 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                    <DashboardSection
                        title="Recent scans"
                        description="Your newest item identifications and recommendations."
                        animationDelay="200ms"
                        actionLabel="View full history"
                        onAction={() =>
                            router.push(
                                `${RESIDENT_BASE_PATH}/history`
                            )
                        }
                    >
                        {scans.length ===
                            0 ? (
                            <DashboardEmptyState
                                icon={
                                    ScanLine
                                }
                                title="No scans yet"
                                description="Take a clear photo of a discarded item to identify its material and recovery options."
                                actionLabel="Scan first item"
                                onAction={() =>
                                    router.push(
                                        `${RESIDENT_BASE_PATH}/scan`
                                    )
                                }
                            />
                        ) : (
                            <div className="w-full min-w-0 space-y-3">
                                {scans
                                    .slice(
                                        0,
                                        4
                                    )
                                    .map(
                                        (
                                            scan
                                        ) => (
                                            <RecentScanCard
                                                key={
                                                    scan.id
                                                }
                                                scan={
                                                    scan
                                                }
                                                onOpen={() =>
                                                    router.push(
                                                        `${RESIDENT_BASE_PATH}/history`
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
                        description="Move from an item to a recovery option."
                        animationDelay="250ms"
                    >
                        <div className="grid w-full min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            <QuickAction
                                icon={
                                    Camera
                                }
                                title="Scan an item"
                                description="Capture or upload a discarded object."
                                onClick={() =>
                                    router.push(
                                        `${RESIDENT_BASE_PATH}/scan`
                                    )
                                }
                            />

                            <QuickAction
                                icon={
                                    History
                                }
                                title="Review scan history"
                                description="Open past identifications and actions."
                                onClick={() =>
                                    router.push(
                                        `${RESIDENT_BASE_PATH}/history`
                                    )
                                }
                            />

                            <QuickAction
                                icon={
                                    MapPinned
                                }
                                title="Find nearby recovery"
                                description="Explore junkshops and collection drives."
                                onClick={() =>
                                    router.push(
                                        `${RESIDENT_BASE_PATH}/nearby`
                                    )
                                }
                            />

                            <QuickAction
                                icon={
                                    UserRound
                                }
                                title="Update location"
                                description="Improve nearby partner matching."
                                onClick={() =>
                                    router.push(
                                        `${RESIDENT_BASE_PATH}/profile`
                                    )
                                }
                            />
                        </div>
                    </DashboardSection>
                </section>


                {/* JUNKSHOPS */}

                <DashboardSection
                    title="Nearby recycler partners"
                    description="Approved active junkshops, prioritized using your saved location."
                    animationDelay="300ms"
                    actionLabel="Explore nearby recovery"
                    onAction={() =>
                        router.push(
                            `${RESIDENT_BASE_PATH}/nearby`
                        )
                    }
                >
                    {junkshops.length ===
                        0 ? (
                        <DashboardEmptyState
                            icon={
                                Store
                            }
                            title="No recycler partners available"
                            description="Recycler partners will appear after approved junkshops are available to resident accounts."
                            actionLabel="Review your location"
                            onAction={() =>
                                router.push(
                                    `${RESIDENT_BASE_PATH}/profile`
                                )
                            }
                        />
                    ) : (
                        <div className="grid w-full min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {junkshops
                                .slice(
                                    0,
                                    3
                                )
                                .map(
                                    (
                                        junkshop
                                    ) => (
                                        <JunkshopCard
                                            key={
                                                junkshop.id
                                            }
                                            junkshop={
                                                junkshop
                                            }
                                        />
                                    )
                                )}
                        </div>
                    )}
                </DashboardSection>


                {/* SCHOOL DRIVES */}

                <DashboardSection
                    title="Community collection drives"
                    description="Active school-partner campaigns that may accept household recyclable materials."
                    animationDelay="350ms"
                    actionLabel="View nearby opportunities"
                    onAction={() =>
                        router.push(
                            `${RESIDENT_BASE_PATH}/nearby`
                        )
                    }
                >
                    {nearbyDrives.length ===
                        0 ? (
                        <DashboardEmptyState
                            icon={
                                School
                            }
                            title="No active collection drives"
                            description="Approved school-partner campaigns will appear here when they are active and visible to residents."
                            actionLabel="Scan another item"
                            onAction={() =>
                                router.push(
                                    `${RESIDENT_BASE_PATH}/scan`
                                )
                            }
                        />
                    ) : (
                        <div className="grid w-full min-w-0 gap-4 lg:grid-cols-2">
                            {nearbyDrives.map(
                                (
                                    drive
                                ) => (
                                    <SchoolDriveCard
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
                </DashboardSection>


                {/* CLOSING CTA */}

                <section className="resident-motion w-full min-w-0 max-w-full animate-[residentFadeUp_.4s_ease-out_.4s_both] overflow-hidden rounded-[28px] border border-green-100 bg-white shadow-sm">
                    <div className="grid w-full min-w-0 lg:grid-cols-[minmax(0,1fr)_auto]">
                        <div className="min-w-0 p-6 sm:p-8">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                                <Leaf className="h-6 w-6" />
                            </div>

                            <h2 className="mt-5 text-2xl font-black text-zinc-900">
                                Every item deserves a better next step
                            </h2>

                            <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-500">
                                Use the scan result as a decision tool, then
                                connect with a recycler or collection drive
                                instead of sending reusable material directly
                                to disposal.
                            </p>

                            <Button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        `${RESIDENT_BASE_PATH}/scan`
                                    )
                                }
                                className="mt-5 rounded-full bg-green-600 hover:bg-green-700"
                            >
                                <Recycle className="mr-2 h-4 w-4" />

                                Scan another item

                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>


                        <div className="flex w-full min-w-0 items-center justify-center bg-gradient-to-br from-green-600 to-emerald-800 p-8 text-white lg:w-auto lg:min-w-72">
                            <div className="text-center">
                                <ScanLine className="mx-auto h-10 w-10 text-green-100" />

                                <p className="mt-4 text-5xl font-black">
                                    {
                                        scans.length
                                    }
                                </p>

                                <p className="mt-2 text-sm font-semibold text-green-100">
                                    Items analyzed
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}




function PriorityAction({
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
        <section className="resident-motion flex w-full min-w-0 flex-col gap-4 overflow-hidden rounded-[24px] border border-green-200 bg-green-50 p-5 animate-[residentFadeUp_.38s_ease-out_.1s_both] sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                <Icon className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
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
                className="w-full rounded-full border-green-200 bg-white text-green-700 hover:bg-green-100 sm:w-fit"
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
            className="resident-motion group w-full min-w-0 max-w-full animate-[residentFadeUp_.38s_ease-out_both] overflow-hidden rounded-[24px] border border-green-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-300 hover:shadow-md"
        >
            <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
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
            className="resident-motion w-full min-w-0 max-w-full animate-[residentFadeUp_.4s_ease-out_both] overflow-hidden rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-6"
        >
            <div className="flex min-w-0 items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
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

            <div className="mt-5 w-full min-w-0">
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
        <div className="flex w-full min-w-0 flex-col items-center overflow-hidden rounded-[24px] border border-dashed border-green-200 bg-green-50/60 px-5 py-9 text-center sm:px-6">
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
                {actionLabel}

                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
    );
}


function RecentScanCard({
    scan,
    onOpen,
}: {
    scan: ScanView;
    onOpen: () => void;
}) {
    return (
        <button
            type="button"
            onClick={
                onOpen
            }
            className="group flex w-full min-w-0 max-w-full items-center gap-3 overflow-hidden rounded-[20px] border border-zinc-100 p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50/50 min-[380px]:gap-4 min-[380px]:p-4"
        >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-green-50 text-green-600 min-[380px]:h-16 min-[380px]:w-16">
                {scan.image_url ? (
                    <img
                        src={
                            scan.image_url
                        }
                        alt={
                            scan.detected_object
                        }
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                ) : (
                    <PackageCheck className="h-6 w-6" />
                )}
            </div>


            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                        {
                            scan.material_type
                        }
                    </Badge>

                    <span className="text-xs font-bold text-zinc-400">
                        {formatConfidence(
                            scan.confidence
                        )}
                    </span>
                </div>

                <h3 className="mt-2 truncate font-black text-zinc-900">
                    {
                        scan.detected_object
                    }
                </h3>

                <p className="mt-1 truncate text-xs text-zinc-500">
                    {
                        scan.action_label
                    }{" "}
                    ·{" "}
                    {formatRelativeDate(
                        scan.created_at
                    )}
                </p>
            </div>


            <ArrowRight className="h-4 w-4 shrink-0 text-green-600 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
    );
}


function JunkshopCard({
    junkshop,
}: {
    junkshop: Junkshop;
}) {
    return (
        <article className="group w-full min-w-0 max-w-full overflow-hidden rounded-[24px] border border-green-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-md">
            <div className="relative h-36 overflow-hidden bg-green-100">
                {junkshop.photo_url ? (
                    <img
                        src={
                            junkshop.photo_url
                        }
                        alt={
                            junkshop.junkshop_name
                        }
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 text-green-600">
                        <Store className="h-10 w-10" />
                    </div>
                )}

                <Badge className="absolute left-3 top-3 border-white/40 bg-white/90 text-green-700 hover:bg-white/90">
                    <BadgeCheck className="mr-1 h-3.5 w-3.5" />

                    Verified
                </Badge>
            </div>


            <div className="p-5">
                <h3 className="truncate font-black text-zinc-900">
                    {
                        junkshop.junkshop_name
                    }
                </h3>

                <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-zinc-500">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />

                    {getLocationLabel(
                        junkshop
                    ) ||
                        "Location not provided"}
                </p>

                {junkshop.contact_number && (
                    <p className="mt-2 text-xs font-semibold text-green-700">
                        {
                            junkshop.contact_number
                        }
                    </p>
                )}
            </div>
        </article>
    );
}


function SchoolDriveCard({
    drive,
}: {
    drive: NearbyDrive;
}) {
    return (
        <article className="group w-full min-w-0 max-w-full overflow-hidden rounded-[24px] border border-green-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-md">
            <div className="flex flex-col gap-4 p-4 sm:flex-row">
                <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-2xl bg-green-100 sm:w-40">
                    {drive.photo_url ? (
                        <img
                            src={
                                drive.photo_url
                            }
                            alt={
                                drive.title
                            }
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 text-green-600">
                            <School className="h-9 w-9" />
                        </div>
                    )}
                </div>


                <div className="min-w-0 flex-1 py-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                            Active drive
                        </Badge>

                        <span className="text-xs text-zinc-400">
                            Until{" "}
                            {formatDate(
                                drive.end_date
                            )}
                        </span>
                    </div>

                    <h3 className="mt-3 truncate font-black text-zinc-900">
                        {
                            drive.title
                        }
                    </h3>

                    <p className="mt-1 truncate text-xs font-semibold text-green-700">
                        {
                            drive.organization_name
                        }
                    </p>

                    <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-zinc-500">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />

                        {
                            drive.collection_location
                        }
                    </p>


                    {drive.materials.length >
                        0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {drive.materials
                                    .slice(
                                        0,
                                        3
                                    )
                                    .map(
                                        (
                                            material
                                        ) => (
                                            <Badge
                                                key={
                                                    material.id
                                                }
                                                variant="secondary"
                                                className="bg-zinc-100 text-zinc-600"
                                            >
                                                {
                                                    material.material_name
                                                }
                                            </Badge>
                                        )
                                    )}
                            </div>
                        )}
                </div>
            </div>
        </article>
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
            className="group flex w-full min-w-0 max-w-full items-center gap-3 overflow-hidden rounded-2xl border border-zinc-100 p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50 min-[380px]:gap-4 min-[380px]:p-4"
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


function ResidentErrorState({
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
                    Resident dashboard unavailable
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


function ResidentDashboardSkeleton() {
    return (
        <div className="space-y-7">
            <div className="w-full min-w-0 space-y-3">
                <Skeleton className="h-4 w-48 bg-green-100" />

                <Skeleton className="h-9 w-80 max-w-full bg-green-100" />

                <Skeleton className="h-4 w-96 max-w-full bg-green-100" />
            </div>


            <Skeleton className="h-64 rounded-[32px] bg-green-100" />

            <Skeleton className="h-24 rounded-[24px] bg-green-100" />


            <div className="grid w-full min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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


            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <Skeleton className="h-96 rounded-[28px] bg-green-100" />

                <Skeleton className="h-96 rounded-[28px] bg-green-100" />
            </div>


            <Skeleton className="h-96 rounded-[28px] bg-green-100" />

            <Skeleton className="h-96 rounded-[28px] bg-green-100" />
        </div>
    );
}
