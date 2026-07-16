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
    Building2,
    CalendarDays,
    CheckCircle2,
    ClipboardCopy,
    Clock3,
    Filter,
    Loader2,
    MapPin,
    MapPinned,
    Navigation,
    Phone,
    Recycle,
    RefreshCcw,
    ScanLine,
    School,
    Search,
    Store,
    Truck,
    UserRound,
} from "lucide-react";

import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";


const RESIDENT_BASE_PATH =
    "/profiles/resident";


type RecoveryType =
    | "all"
    | "junkshop"
    | "school_drive";


type LocationScope =
    | "all"
    | "barangay"
    | "city"
    | "province";


interface ResidentProfile {
    id: string;
    auth_id: string;
    full_name: string;
    role: string;
    barangay: string | null;
    city: string | null;
    province: string | null;
    onboarding_completed: boolean;
}


interface Material {
    id: string;
    material_name: string;
    category: string;
}


interface JunkshopRow {
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


interface JunkshopMaterialRow {
    junkshop_id: string;
    material_id: string;
    is_accepting: boolean;
}


interface SchoolPartnerRow {
    id: string;
    organization_name: string;
    photo_url: string | null;
    address_line: string;
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


interface JunkshopView extends JunkshopRow {
    materials: Material[];
    match_score: number;
    match_label: string;
}


interface SchoolDriveView extends SchoolDriveRow {
    organization_name: string;
    organization_photo_url: string | null;
    organization_address: string;
    barangay: string | null;
    city: string | null;
    province: string | null;
    contact_number: string | null;
    materials: Material[];
    match_score: number;
    match_label: string;
}


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


function getMatchScore(
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
        return 4;
    }

    if (
        profileCity &&
        targetCity &&
        profileCity ===
            targetCity
    ) {
        return 3;
    }

    if (
        profileProvince &&
        targetProvince &&
        profileProvince ===
            targetProvince
    ) {
        return 2;
    }

    return 1;
}


function getMatchLabel(
    score: number
) {
    if (
        score ===
        4
    ) {
        return "Same barangay";
    }

    if (
        score ===
        3
    ) {
        return "Same city";
    }

    if (
        score ===
        2
    ) {
        return "Same province";
    }

    return "Other area";
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


function matchesScope(
    score: number,
    scope: LocationScope
) {
    if (
        scope ===
        "all"
    ) {
        return true;
    }

    if (
        scope ===
        "barangay"
    ) {
        return score ===
            4;
    }

    if (
        scope ===
        "city"
    ) {
        return score >=
            3;
    }

    return score >=
        2;
}


function buildMapUrl(
    query: string
) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        query
    )}`;
}


export default function ResidentNearbyRecoveryPage() {
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
        junkshops,
        setJunkshops,
    ] =
        useState<JunkshopView[]>(
            []
        );

    const [
        schoolDrives,
        setSchoolDrives,
    ] =
        useState<SchoolDriveView[]>(
            []
        );

    const [
        materials,
        setMaterials,
    ] =
        useState<Material[]>(
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
        discoveryNotice,
        setDiscoveryNotice,
    ] =
        useState<string | null>(
            null
        );


    const [
        searchQuery,
        setSearchQuery,
    ] =
        useState(
            ""
        );

    const [
        recoveryType,
        setRecoveryType,
    ] =
        useState<RecoveryType>(
            "all"
        );

    const [
        locationScope,
        setLocationScope,
    ] =
        useState<LocationScope>(
            "all"
        );

    const [
        selectedMaterialId,
        setSelectedMaterialId,
    ] =
        useState(
            "all"
        );


    const loadNearbyRecovery =
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

                setDiscoveryNotice(
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
                                role,
                                barangay,
                                city,
                                province,
                                onboarding_completed
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
                            "This page is available only to resident accounts."
                        );
                    }

                    setProfile(
                        currentProfile
                    );


                    const notices:
                        string[] = [];


                    const [
                        materialResult,
                        junkshopResult,
                        driveResult,
                    ] =
                        await Promise.all([
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
                                    "verification_status",
                                    "approved"
                                )
                                .eq(
                                    "is_active",
                                    true
                                ),

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
                                ),
                        ]);


                    if (
                        materialResult.error
                    ) {
                        throw materialResult.error;
                    }

                    const currentMaterials =
                        (
                            materialResult.data ??
                            []
                        ) as Material[];

                    setMaterials(
                        currentMaterials
                    );

                    const materialMap =
                        new Map(
                            currentMaterials.map(
                                (
                                    material
                                ) => [
                                    material.id,
                                    material,
                                ]
                            )
                        );


                    let normalizedJunkshops:
                        JunkshopView[] = [];

                    if (
                        junkshopResult.error
                    ) {
                        console.warn(
                            "Resident junkshop discovery failed:",
                            junkshopResult.error
                        );

                        notices.push(
                            "Recycler partners could not be loaded."
                        );
                    } else {
                        const rawJunkshops =
                            (
                                junkshopResult.data ??
                                []
                            ) as JunkshopRow[];

                        const junkshopIds =
                            rawJunkshops.map(
                                (
                                    junkshop
                                ) =>
                                    junkshop.id
                            );

                        let junkshopMaterialRows:
                            JunkshopMaterialRow[] = [];


                        if (
                            junkshopIds.length >
                            0
                        ) {
                            const {
                                data,
                                error,
                            } =
                                await supabase
                                    .from(
                                        "junkshop_materials"
                                    )
                                    .select(`
                                        junkshop_id,
                                        material_id,
                                        is_accepting
                                    `)
                                    .in(
                                        "junkshop_id",
                                        junkshopIds
                                    )
                                    .eq(
                                        "is_accepting",
                                        true
                                    );

                            if (
                                error
                            ) {
                                console.warn(
                                    "Junkshop accepted materials unavailable:",
                                    error
                                );

                                notices.push(
                                    "Some recycler material details are unavailable."
                                );
                            } else {
                                junkshopMaterialRows =
                                    (
                                        data ??
                                        []
                                    ) as JunkshopMaterialRow[];
                            }
                        }


                        normalizedJunkshops =
                            rawJunkshops
                                .map(
                                    (
                                        junkshop
                                    ): JunkshopView => {
                                        const score =
                                            getMatchScore(
                                                currentProfile,
                                                junkshop
                                            );

                                        const acceptedMaterials =
                                            junkshopMaterialRows
                                                .filter(
                                                    (
                                                        row
                                                    ) =>
                                                        row.junkshop_id ===
                                                            junkshop.id &&
                                                        row.is_accepting
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
                                            ...junkshop,

                                            materials:
                                                acceptedMaterials,

                                            match_score:
                                                score,

                                            match_label:
                                                getMatchLabel(
                                                    score
                                                ),
                                        };
                                    }
                                )
                                .sort(
                                    (
                                        first,
                                        second
                                    ) =>
                                        second.match_score -
                                            first.match_score ||
                                        first.junkshop_name.localeCompare(
                                            second.junkshop_name
                                        )
                                );
                    }

                    setJunkshops(
                        normalizedJunkshops
                    );


                    let normalizedSchoolDrives:
                        SchoolDriveView[] = [];

                    if (
                        driveResult.error
                    ) {
                        console.warn(
                            "Resident school-drive discovery failed:",
                            driveResult.error
                        );

                        notices.push(
                            "School collection drives could not be loaded."
                        );
                    } else {
                        const rawDrives =
                            (
                                driveResult.data ??
                                []
                            ) as SchoolDriveRow[];

                        const schoolPartnerIds =
                            Array.from(
                                new Set(
                                    rawDrives.map(
                                        (
                                            drive
                                        ) =>
                                            drive.school_partner_id
                                    )
                                )
                            );

                        const driveIds =
                            rawDrives.map(
                                (
                                    drive
                                ) =>
                                    drive.id
                            );

                        let partnerRows:
                            SchoolPartnerRow[] = [];

                        let driveMaterialRows:
                            DriveMaterialRow[] = [];


                        if (
                            schoolPartnerIds.length >
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
                                        address_line,
                                        barangay,
                                        city,
                                        province,
                                        contact_number,
                                        verification_status,
                                        is_active
                                    `)
                                    .in(
                                        "id",
                                        schoolPartnerIds
                                    )
                                    .eq(
                                        "verification_status",
                                        "approved"
                                    )
                                    .eq(
                                        "is_active",
                                        true
                                    );

                            if (
                                error
                            ) {
                                console.warn(
                                    "School partner details unavailable:",
                                    error
                                );

                                notices.push(
                                    "Some school partner details are unavailable."
                                );
                            } else {
                                partnerRows =
                                    (
                                        data ??
                                        []
                                    ) as SchoolPartnerRow[];
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
                                error
                            ) {
                                console.warn(
                                    "School drive materials unavailable:",
                                    error
                                );

                                notices.push(
                                    "Some collection-drive material details are unavailable."
                                );
                            } else {
                                driveMaterialRows =
                                    (
                                        data ??
                                        []
                                    ) as DriveMaterialRow[];
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


                        normalizedSchoolDrives =
                            rawDrives
                                .map(
                                    (
                                        drive
                                    ): SchoolDriveView | null => {
                                        const partner =
                                            partnerMap.get(
                                                drive.school_partner_id
                                            );

                                        if (
                                            !partner
                                        ) {
                                            return null;
                                        }

                                        const score =
                                            getMatchScore(
                                                currentProfile,
                                                partner
                                            );

                                        const acceptedMaterials =
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
                                            ...drive,

                                            organization_name:
                                                partner.organization_name,

                                            organization_photo_url:
                                                partner.photo_url,

                                            organization_address:
                                                partner.address_line,

                                            barangay:
                                                partner.barangay,

                                            city:
                                                partner.city,

                                            province:
                                                partner.province,

                                            contact_number:
                                                partner.contact_number,

                                            materials:
                                                acceptedMaterials,

                                            match_score:
                                                score,

                                            match_label:
                                                getMatchLabel(
                                                    score
                                                ),
                                        };
                                    }
                                )
                                .filter(
                                    (
                                        drive
                                    ): drive is SchoolDriveView =>
                                        Boolean(
                                            drive
                                        )
                                )
                                .sort(
                                    (
                                        first,
                                        second
                                    ) =>
                                        second.match_score -
                                            first.match_score ||
                                        new Date(
                                            first.end_date
                                        ).getTime() -
                                            new Date(
                                                second.end_date
                                            ).getTime()
                                );
                    }

                    setSchoolDrives(
                        normalizedSchoolDrives
                    );


                    if (
                        notices.length >
                        0
                    ) {
                        setDiscoveryNotice(
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
                            "Unable to load nearby recovery options."
                        );

                    console.error(
                        "Nearby recovery loading failed:",
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
            void loadNearbyRecovery();
        },
        [
            loadNearbyRecovery,
        ]
    );


    const filteredJunkshops =
        useMemo(
            () => {
                const query =
                    searchQuery
                        .trim()
                        .toLowerCase();

                return junkshops.filter(
                    (
                        junkshop
                    ) => {
                        const matchesType =
                            recoveryType ===
                                "all" ||
                            recoveryType ===
                                "junkshop";

                        const matchesLocation =
                            matchesScope(
                                junkshop.match_score,
                                locationScope
                            );

                        const matchesMaterial =
                            selectedMaterialId ===
                                "all" ||
                            junkshop.materials.some(
                                (
                                    material
                                ) =>
                                    material.id ===
                                    selectedMaterialId
                            );

                        const searchableText = [
                            junkshop.junkshop_name,
                            junkshop.barangay ??
                                "",
                            junkshop.city ??
                                "",
                            junkshop.province ??
                                "",
                            ...junkshop.materials.map(
                                (
                                    material
                                ) =>
                                    material.material_name
                            ),
                        ]
                            .join(
                                " "
                            )
                            .toLowerCase();

                        return (
                            matchesType &&
                            matchesLocation &&
                            matchesMaterial &&
                            (
                                !query ||
                                searchableText.includes(
                                    query
                                )
                            )
                        );
                    }
                );
            },
            [
                junkshops,
                locationScope,
                recoveryType,
                searchQuery,
                selectedMaterialId,
            ]
        );


    const filteredSchoolDrives =
        useMemo(
            () => {
                const query =
                    searchQuery
                        .trim()
                        .toLowerCase();

                return schoolDrives.filter(
                    (
                        drive
                    ) => {
                        const matchesType =
                            recoveryType ===
                                "all" ||
                            recoveryType ===
                                "school_drive";

                        const matchesLocation =
                            matchesScope(
                                drive.match_score,
                                locationScope
                            );

                        const matchesMaterial =
                            selectedMaterialId ===
                                "all" ||
                            drive.materials.some(
                                (
                                    material
                                ) =>
                                    material.id ===
                                    selectedMaterialId
                            );

                        const searchableText = [
                            drive.title,
                            drive.organization_name,
                            drive.collection_location,
                            drive.barangay ??
                                "",
                            drive.city ??
                                "",
                            drive.province ??
                                "",
                            ...drive.materials.map(
                                (
                                    material
                                ) =>
                                    material.material_name
                            ),
                        ]
                            .join(
                                " "
                            )
                            .toLowerCase();

                        return (
                            matchesType &&
                            matchesLocation &&
                            matchesMaterial &&
                            (
                                !query ||
                                searchableText.includes(
                                    query
                                )
                            )
                        );
                    }
                );
            },
            [
                locationScope,
                recoveryType,
                schoolDrives,
                searchQuery,
                selectedMaterialId,
            ]
        );


    const totalVisible =
        filteredJunkshops.length +
        filteredSchoolDrives.length;


    const sameBarangayCount =
        junkshops.filter(
            (
                junkshop
            ) =>
                junkshop.match_score ===
                4
        ).length +
        schoolDrives.filter(
            (
                drive
            ) =>
                drive.match_score ===
                4
        ).length;


    const availableMaterialCount =
        new Set([
            ...junkshops.flatMap(
                (
                    junkshop
                ) =>
                    junkshop.materials.map(
                        (
                            material
                        ) =>
                            material.id
                    )
            ),
            ...schoolDrives.flatMap(
                (
                    drive
                ) =>
                    drive.materials.map(
                        (
                            material
                        ) =>
                            material.id
                    )
            ),
        ]).size;


    const locationIsComplete =
        Boolean(
            profile?.barangay &&
                profile.city &&
                profile.province
        );


    const resetFilters =
        () => {
            setSearchQuery(
                ""
            );

            setRecoveryType(
                "all"
            );

            setLocationScope(
                "all"
            );

            setSelectedMaterialId(
                "all"
            );
        };


    const copyLocation =
        async (
            value: string
        ) => {
            try {
                await navigator.clipboard.writeText(
                    value
                );

                toast.success(
                    "Location copied."
                );
            } catch {
                toast.error(
                    "Unable to copy the location."
                );
            }
        };


    if (
        loading
    ) {
        return (
            <NearbyRecoverySkeleton />
        );
    }


    if (
        pageError ||
        !profile
    ) {
        return (
            <NearbyRecoveryError
                message={
                    pageError ??
                    "Resident account was not found."
                }
                onRetry={() =>
                    void loadNearbyRecovery()
                }
            />
        );
    }


    return (
        <>
            <style jsx global>{`
                @keyframes nearbyFadeUp {
                    from {
                        opacity: 0;
                        transform: translateY(9px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes nearbyScaleIn {
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
                    .nearby-motion {
                        animation: none !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>


            <div className="space-y-7">
                {/* HEADER */}

                <section className="nearby-motion animate-[nearbyFadeUp_.35s_ease-out_both]">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-sm font-bold text-green-600">
                                Resident recovery network
                            </p>

                            <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
                                Nearby Recovery
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                                Discover approved junkshops and active school
                                collection drives based on your saved
                                location and selected material.
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
                                    void loadNearbyRecovery(
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
                                        `${RESIDENT_BASE_PATH}/scan`
                                    )
                                }
                                className="rounded-full bg-green-600 px-6 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700"
                            >
                                <ScanLine className="mr-2 h-4 w-4" />

                                Scan item
                            </Button>
                        </div>
                    </div>
                </section>


                {/* HERO */}

                <section className="nearby-motion animate-[nearbyScaleIn_.4s_ease-out_.04s_both] overflow-hidden rounded-[32px] border border-green-100 bg-white shadow-sm">
                    <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-emerald-800 p-6 text-white sm:p-8">
                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />

                        <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-white/5" />


                        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
                            <div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge className="border-white/20 bg-white/15 text-white hover:bg-white/15">
                                        <MapPinned className="mr-1.5 h-3.5 w-3.5" />

                                        Location matching
                                    </Badge>

                                    <Badge className="border-white/20 bg-black/20 text-white hover:bg-black/20">
                                        <Store className="mr-1.5 h-3.5 w-3.5" />

                                        Junkshops
                                    </Badge>

                                    <Badge className="border-white/20 bg-black/20 text-white hover:bg-black/20">
                                        <School className="mr-1.5 h-3.5 w-3.5" />

                                        School drives
                                    </Badge>
                                </div>


                                <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                                    Find the best next destination
                                </h2>

                                <p className="mt-2 max-w-2xl text-sm leading-7 text-green-50/85">
                                    Results are prioritized by barangay, city,
                                    and province using the location saved in
                                    your resident profile.
                                </p>
                            </div>


                            <div className="rounded-[24px] border border-white/20 bg-white p-5 text-zinc-900 shadow-lg">
                                <p className="text-xs font-black uppercase tracking-[0.15em] text-green-600">
                                    Your recovery area
                                </p>

                                <p className="mt-2 max-w-xs font-black">
                                    {getLocationLabel(
                                        profile
                                    ) ||
                                        "Location not configured"}
                                </p>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        router.push(
                                            `${RESIDENT_BASE_PATH}/profile`
                                        )
                                    }
                                    className="mt-4 w-full rounded-full border-green-200 text-green-700 hover:bg-green-50"
                                >
                                    <UserRound className="mr-2 h-4 w-4" />

                                    Update location
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>


                {!locationIsComplete && (
                    <section className="nearby-motion animate-[nearbyFadeUp_.38s_ease-out_.08s_both] flex flex-col gap-4 rounded-[24px] border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                            <AlertCircle className="h-6 w-6" />
                        </div>

                        <div className="flex-1">
                            <h2 className="font-black text-zinc-900">
                                Complete your resident location
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-zinc-600">
                                Add your barangay, city or municipality, and
                                province to improve nearby recovery matching.
                            </p>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                router.push(
                                    `${RESIDENT_BASE_PATH}/profile`
                                )
                            }
                            className="w-fit rounded-full border-amber-200 bg-white text-amber-700 hover:bg-amber-100"
                        >
                            Complete profile

                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </section>
                )}


                {discoveryNotice && (
                    <section className="nearby-motion animate-[nearbyFadeUp_.38s_ease-out_.1s_both] flex flex-col gap-4 rounded-[24px] border border-amber-200 bg-white p-5 sm:flex-row sm:items-center">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                            <AlertCircle className="h-6 w-6" />
                        </div>

                        <div>
                            <h2 className="font-black text-zinc-900">
                                Some network details are unavailable
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-zinc-600">
                                {discoveryNotice}
                            </p>
                        </div>
                    </section>
                )}


                {/* SUMMARY */}

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        title="Approved junkshops"
                        value={
                            junkshops.length
                        }
                        description="Active recycler partners"
                        icon={
                            Store
                        }
                        delay={
                            0
                        }
                    />

                    <SummaryCard
                        title="Active school drives"
                        value={
                            schoolDrives.length
                        }
                        description="Open collection campaigns"
                        icon={
                            School
                        }
                        delay={
                            50
                        }
                    />

                    <SummaryCard
                        title="Same barangay"
                        value={
                            sameBarangayCount
                        }
                        description="Closest location matches"
                        icon={
                            MapPin
                        }
                        delay={
                            100
                        }
                    />

                    <SummaryCard
                        title="Accepted materials"
                        value={
                            availableMaterialCount
                        }
                        description="Material types in the network"
                        icon={
                            Recycle
                        }
                        delay={
                            150
                        }
                    />
                </section>


                {/* FILTERS */}

                <section className="nearby-motion animate-[nearbyFadeUp_.4s_ease-out_.2s_both] rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                            <Filter className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="text-xl font-black text-zinc-900">
                                Filter recovery options
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-zinc-500">
                                Search by organization, location, campaign, or
                                accepted material.
                            </p>
                        </div>
                    </div>


                    <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_220px_220px]">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                            <Input
                                value={
                                    searchQuery
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSearchQuery(
                                        event.target.value
                                    )
                                }
                                placeholder="Search recovery options"
                                className="h-12 rounded-xl border-zinc-300 bg-white pl-11 focus-visible:ring-green-500"
                            />
                        </div>


                        <select
                            value={
                                recoveryType
                            }
                            onChange={(
                                event
                            ) =>
                                setRecoveryType(
                                    event.target.value as RecoveryType
                                )
                            }
                            className="h-12 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        >
                            <option value="all">
                                All recovery types
                            </option>

                            <option value="junkshop">
                                Junkshops only
                            </option>

                            <option value="school_drive">
                                School drives only
                            </option>
                        </select>


                        <select
                            value={
                                locationScope
                            }
                            onChange={(
                                event
                            ) =>
                                setLocationScope(
                                    event.target.value as LocationScope
                                )
                            }
                            className="h-12 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        >
                            <option value="all">
                                All areas
                            </option>

                            <option value="barangay">
                                Same barangay
                            </option>

                            <option value="city">
                                Same city
                            </option>

                            <option value="province">
                                Same province
                            </option>
                        </select>


                        <select
                            value={
                                selectedMaterialId
                            }
                            onChange={(
                                event
                            ) =>
                                setSelectedMaterialId(
                                    event.target.value
                                )
                            }
                            className="h-12 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        >
                            <option value="all">
                                All materials
                            </option>

                            {materials.map(
                                (
                                    material
                                ) => (
                                    <option
                                        key={
                                            material.id
                                        }
                                        value={
                                            material.id
                                        }
                                    >
                                        {
                                            material.material_name
                                        }
                                    </option>
                                )
                            )}
                        </select>
                    </div>


                    <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <p className="text-sm text-zinc-500">
                            Showing{" "}
                            <span className="font-black text-zinc-900">
                                {
                                    totalVisible
                                }
                            </span>{" "}
                            recovery option
                            {totalVisible ===
                            1
                                ? ""
                                : "s"}
                        </p>

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={
                                resetFilters
                            }
                            className="w-fit rounded-full text-green-700 hover:bg-green-50"
                        >
                            Reset filters
                        </Button>
                    </div>
                </section>


                {/* JUNKSHOPS */}

                {(recoveryType ===
                    "all" ||
                    recoveryType ===
                        "junkshop") && (
                    <RecoverySection
                        title="Approved junkshops"
                        description="Recycler partners that may accept household recyclable materials."
                        icon={
                            Store
                        }
                        count={
                            filteredJunkshops.length
                        }
                        animationDelay="250ms"
                    >
                        {filteredJunkshops.length ===
                        0 ? (
                            <EmptyRecoveryState
                                icon={
                                    Store
                                }
                                title="No junkshops match the filters"
                                description="Try a broader location scope or select another material."
                                onReset={
                                    resetFilters
                                }
                            />
                        ) : (
                            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {filteredJunkshops.map(
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
                                            onCopy={() =>
                                                void copyLocation(
                                                    getLocationLabel(
                                                        junkshop
                                                    )
                                                )
                                            }
                                        />
                                    )
                                )}
                            </div>
                        )}
                    </RecoverySection>
                )}


                {/* SCHOOL DRIVES */}

                {(recoveryType ===
                    "all" ||
                    recoveryType ===
                        "school_drive") && (
                    <RecoverySection
                        title="Active school collection drives"
                        description="Approved school campaigns that are currently accepting selected materials."
                        icon={
                            School
                        }
                        count={
                            filteredSchoolDrives.length
                        }
                        animationDelay="300ms"
                    >
                        {filteredSchoolDrives.length ===
                        0 ? (
                            <EmptyRecoveryState
                                icon={
                                    School
                                }
                                title="No school drives match the filters"
                                description="Try another material, search term, or location scope."
                                onReset={
                                    resetFilters
                                }
                            />
                        ) : (
                            <div className="grid gap-5 lg:grid-cols-2">
                                {filteredSchoolDrives.map(
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
                                            onCopy={() =>
                                                void copyLocation(
                                                    drive.collection_location
                                                )
                                            }
                                        />
                                    )
                                )}
                            </div>
                        )}
                    </RecoverySection>
                )}


                {/* CTA */}

                <section className="nearby-motion animate-[nearbyFadeUp_.4s_ease-out_.35s_both] overflow-hidden rounded-[28px] border border-green-100 bg-white shadow-sm">
                    <div className="grid lg:grid-cols-[1fr_auto]">
                        <div className="p-6 sm:p-8">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                                <ScanLine className="h-6 w-6" />
                            </div>

                            <h2 className="mt-5 text-2xl font-black text-zinc-900">
                                Not sure where the item belongs?
                            </h2>

                            <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-500">
                                Scan the item first. Trashure can identify the
                                likely material and help you filter this
                                recovery network more accurately.
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
                                <ScanLine className="mr-2 h-4 w-4" />

                                Scan an item

                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>


                        <div className="flex min-w-72 items-center justify-center bg-gradient-to-br from-green-600 to-emerald-800 p-8 text-white">
                            <div className="text-center">
                                <MapPinned className="mx-auto h-10 w-10 text-green-100" />

                                <p className="mt-4 text-5xl font-black">
                                    {
                                        junkshops.length +
                                        schoolDrives.length
                                    }
                                </p>

                                <p className="mt-2 text-sm font-semibold text-green-100">
                                    Network options
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
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
            className="nearby-motion group animate-[nearbyFadeUp_.38s_ease-out_both] rounded-[24px] border border-green-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-300 hover:shadow-md"
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


function RecoverySection({
    title,
    description,
    icon: Icon,
    count,
    animationDelay,
    children,
}: {
    title: string;
    description: string;
    icon:
        ComponentType<{
            className?: string;
        }>;
    count: number;
    animationDelay: string;
    children: ReactNode;
}) {
    return (
        <section
            style={{
                animationDelay,
            }}
            className="nearby-motion animate-[nearbyFadeUp_.4s_ease-out_both] rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-6"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                        <Icon className="h-5 w-5" />
                    </div>

                    <div>
                        <h2 className="text-xl font-black text-zinc-900">
                            {title}
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-zinc-500">
                            {description}
                        </p>
                    </div>
                </div>

                <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                    {count} result
                    {count ===
                    1
                        ? ""
                        : "s"}
                </Badge>
            </div>

            <div className="mt-6">
                {children}
            </div>
        </section>
    );
}


function JunkshopCard({
    junkshop,
    onCopy,
}: {
    junkshop: JunkshopView;
    onCopy: () => void;
}) {
    const location =
        getLocationLabel(
            junkshop
        );

    return (
        <article className="group overflow-hidden rounded-[26px] border border-green-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-md">
            <div className="relative h-44 overflow-hidden bg-green-100">
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
                        <Store className="h-12 w-12" />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                <Badge className="absolute left-3 top-3 border-white/30 bg-white text-green-700 hover:bg-white">
                    <BadgeCheck className="mr-1 h-3.5 w-3.5" />

                    Verified
                </Badge>

                <Badge className="absolute bottom-3 left-3 border-white/20 bg-black/40 text-white hover:bg-black/40">
                    <MapPin className="mr-1 h-3.5 w-3.5" />

                    {
                        junkshop.match_label
                    }
                </Badge>
            </div>


            <div className="p-5">
                <h3 className="truncate text-lg font-black text-zinc-900">
                    {
                        junkshop.junkshop_name
                    }
                </h3>

                <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-zinc-500">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-green-600" />

                    {location ||
                        "Location not provided"}
                </p>


                <div className="mt-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
                        Accepted materials
                    </p>

                    {junkshop.materials.length >
                    0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {junkshop.materials
                                .slice(
                                    0,
                                    5
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
                                            className="bg-green-50 text-green-700"
                                        >
                                            {
                                                material.material_name
                                            }
                                        </Badge>
                                    )
                                )}

                            {junkshop.materials.length >
                                5 && (
                                <Badge
                                    variant="secondary"
                                    className="bg-zinc-100 text-zinc-500"
                                >
                                    +
                                    {junkshop.materials.length -
                                        5}
                                </Badge>
                            )}
                        </div>
                    ) : (
                        <p className="mt-2 text-xs text-zinc-400">
                            Material list not available.
                        </p>
                    )}
                </div>


                <div className="mt-5 grid grid-cols-2 gap-2">
                    {junkshop.contact_number ? (
                        <a
                            href={`tel:${junkshop.contact_number}`}
                            className="flex h-10 items-center justify-center gap-2 rounded-full bg-green-600 px-4 text-sm font-bold text-white transition hover:bg-green-700"
                        >
                            <Phone className="h-4 w-4" />

                            Call
                        </a>
                    ) : (
                        <Button
                            type="button"
                            disabled
                            className="rounded-full"
                        >
                            <Phone className="mr-2 h-4 w-4" />

                            No contact
                        </Button>
                    )}


                    <a
                        href={
                            buildMapUrl(
                                location ||
                                    junkshop.junkshop_name
                            )
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-10 items-center justify-center gap-2 rounded-full border border-green-200 bg-white px-4 text-sm font-bold text-green-700 transition hover:bg-green-50"
                    >
                        <Navigation className="h-4 w-4" />

                        Map
                    </a>
                </div>


                <Button
                    type="button"
                    variant="ghost"
                    disabled={
                        !location
                    }
                    onClick={
                        onCopy
                    }
                    className="mt-2 w-full rounded-full text-zinc-500 hover:bg-zinc-50"
                >
                    <ClipboardCopy className="mr-2 h-4 w-4" />

                    Copy location
                </Button>
            </div>
        </article>
    );
}


function SchoolDriveCard({
    drive,
    onCopy,
}: {
    drive: SchoolDriveView;
    onCopy: () => void;
}) {
    const organizationLocation =
        getLocationLabel(
            drive
        );

    return (
        <article className="group overflow-hidden rounded-[26px] border border-green-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-md">
            <div className="grid sm:grid-cols-[190px_minmax(0,1fr)]">
                <div className="relative min-h-52 overflow-hidden bg-green-100">
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
                    ) : drive.organization_photo_url ? (
                        <img
                            src={
                                drive.organization_photo_url
                            }
                            alt={
                                drive.organization_name
                            }
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                    ) : (
                        <div className="flex h-full min-h-52 items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 text-green-600">
                            <School className="h-12 w-12" />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    <Badge className="absolute left-3 top-3 border-white/30 bg-white text-green-700 hover:bg-white">
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />

                        Active drive
                    </Badge>

                    <Badge className="absolute bottom-3 left-3 border-white/20 bg-black/40 text-white hover:bg-black/40">
                        {
                            drive.match_label
                        }
                    </Badge>
                </div>


                <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-green-600">
                        {
                            drive.organization_name
                        }
                    </p>

                    <h3 className="mt-2 text-lg font-black text-zinc-900">
                        {
                            drive.title
                        }
                    </h3>

                    {drive.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
                            {
                                drive.description
                            }
                        </p>
                    )}


                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <InformationRow
                            icon={
                                CalendarDays
                            }
                            label="Collection period"
                            value={`${formatDate(
                                drive.start_date
                            )} to ${formatDate(
                                drive.end_date
                            )}`}
                        />

                        <InformationRow
                            icon={
                                MapPin
                            }
                            label="Drop-off location"
                            value={
                                drive.collection_location
                            }
                        />
                    </div>


                    {drive.materials.length >
                        0 && (
                        <div className="mt-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
                                Accepted materials
                            </p>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {drive.materials
                                    .slice(
                                        0,
                                        5
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
                                                className="bg-green-50 text-green-700"
                                            >
                                                {
                                                    material.material_name
                                                }
                                            </Badge>
                                        )
                                    )}
                            </div>
                        </div>
                    )}


                    <div className="mt-5 flex flex-wrap gap-2">
                        <a
                            href={
                                buildMapUrl(
                                    drive.collection_location ||
                                        organizationLocation ||
                                        drive.organization_name
                                )
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-10 items-center justify-center gap-2 rounded-full bg-green-600 px-5 text-sm font-bold text-white transition hover:bg-green-700"
                        >
                            <Navigation className="h-4 w-4" />

                            Open map
                        </a>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={
                                onCopy
                            }
                            className="rounded-full border-green-200 text-green-700 hover:bg-green-50"
                        >
                            <ClipboardCopy className="mr-2 h-4 w-4" />

                            Copy location
                        </Button>

                        {drive.contact_number && (
                            <a
                                href={`tel:${drive.contact_number}`}
                                className="flex h-10 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-600 transition hover:bg-zinc-50"
                            >
                                <Phone className="h-4 w-4" />

                                Contact school
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}


function InformationRow({
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
        <div className="flex gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-green-600 shadow-sm">
                <Icon className="h-4 w-4" />
            </div>

            <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
                    {label}
                </p>

                <p className="mt-1 break-words text-xs font-semibold leading-5 text-zinc-700">
                    {value}
                </p>
            </div>
        </div>
    );
}


function EmptyRecoveryState({
    icon: Icon,
    title,
    description,
    onReset,
}: {
    icon:
        ComponentType<{
            className?: string;
        }>;
    title: string;
    description: string;
    onReset: () => void;
}) {
    return (
        <div className="flex flex-col items-center rounded-[24px] border border-dashed border-green-200 bg-green-50/50 px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-green-600 shadow-sm">
                <Icon className="h-7 w-7" />
            </div>

            <h3 className="mt-5 text-lg font-black text-zinc-900">
                {title}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                {description}
            </p>

            <Button
                type="button"
                variant="outline"
                onClick={
                    onReset
                }
                className="mt-5 rounded-full border-green-200 bg-white text-green-700 hover:bg-green-50"
            >
                Reset filters
            </Button>
        </div>
    );
}


function NearbyRecoveryError({
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
                    Nearby recovery unavailable
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


function NearbyRecoverySkeleton() {
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


            <Skeleton className="h-52 rounded-[28px] bg-green-100" />


            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({
                    length: 3,
                }).map(
                    (
                        _,
                        index
                    ) => (
                        <Skeleton
                            key={
                                index
                            }
                            className="h-[460px] rounded-[26px] bg-green-100"
                        />
                    )
                )}
            </div>


            <div className="grid gap-5 lg:grid-cols-2">
                <Skeleton className="h-[430px] rounded-[26px] bg-green-100" />

                <Skeleton className="h-[430px] rounded-[26px] bg-green-100" />
            </div>
        </div>
    );
}
