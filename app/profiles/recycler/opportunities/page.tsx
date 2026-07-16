"use client";

import {
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import type {
    ComponentType,
    FormEvent,
} from "react";

import {
    AlertCircle,
    ArrowLeft,
    Check,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    Handshake,
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

import { useRouter } from "next/navigation";
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
    | "accepted";


type OpportunityStatus =
    | "open"
    | "accepted"
    | "completed"
    | "cancelled";


type ResponseStatus =
    | "interested"
    | "accepted"
    | "declined"
    | "withdrawn";


type FulfillmentMethod =
    | "drop_off"
    | "pickup"
    | "either";


interface RecyclerProfile {
    id: string;
    auth_id: string;
    full_name: string;
    role: string;
}


interface Junkshop {
    id: string;
    profile_id: string;
    junkshop_name: string;
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


interface MaterialRelation {
    id: string;
    material_name: string;
    category: string;
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


interface AcceptedMaterialRow {
    material_id: string;
    price_per_kg:
    | number
    | string;

    is_accepting: boolean;
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


function normalizeMaterialRelation(
    relation:
        | MaterialRelation
        | MaterialRelation[]
        | null
) {
    if (
        Array.isArray(relation)
    ) {
        return relation[0] ?? null;
    }

    return relation;
}


function formatRelativeDate(
    value: string
) {
    const createdAt =
        new Date(value).getTime();

    const now =
        Date.now();

    const difference =
        Math.max(
            0,
            now - createdAt
        );

    const minutes =
        Math.floor(
            difference /
            60_000
        );

    if (minutes < 1) {
        return "Just now";
    }

    if (minutes < 60) {
        return `${minutes} min ago`;
    }

    const hours =
        Math.floor(
            minutes / 60
        );

    if (hours < 24) {
        return `${hours} hr${hours === 1
                ? ""
                : "s"
            } ago`;
    }

    const days =
        Math.floor(
            hours / 24
        );

    if (days < 7) {
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
            month: "short",
            day: "numeric",
            year: "numeric",
        }
    );
}


function getFulfillmentLabel(
    method: FulfillmentMethod
) {
    switch (method) {
        case "pickup":
            return "Pickup requested";

        case "either":
            return "Pickup or drop-off";

        default:
            return "Resident drop-off";
    }
}


function getLocationText(
    opportunity: Opportunity
) {
    return [
        opportunity.barangay,
        opportunity.city,
        opportunity.province,
    ]
        .filter(Boolean)
        .join(", ");
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
            []
        );


    const [
        junkshop,
        setJunkshop,
    ] =
        useState<Junkshop | null>(
            null
        );

    const [
        opportunities,
        setOpportunities,
    ] =
        useState<Opportunity[]>([]);

    const [
        responses,
        setResponses,
    ] =
        useState<OpportunityResponse[]>([]);

    const [
        materialPrices,
        setMaterialPrices,
    ] =
        useState<Record<string, number>>(
            {}
        );


    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        refreshing,
        setRefreshing,
    ] =
        useState(false);

    const [
        pageError,
        setPageError,
    ] =
        useState<string | null>(
            null
        );


    const [
        activeTab,
        setActiveTab,
    ] =
        useState<OpportunityTab>(
            "available"
        );

    const [
        search,
        setSearch,
    ] =
        useState("");

    const [
        categoryFilter,
        setCategoryFilter,
    ] =
        useState("all");

    const [
        fulfillmentFilter,
        setFulfillmentFilter,
    ] =
        useState<FulfillmentFilter>(
            "all"
        );


    const [
        selectedOpportunity,
        setSelectedOpportunity,
    ] =
        useState<Opportunity | null>(
            null
        );

    const [
        opportunityDialogOpen,
        setOpportunityDialogOpen,
    ] =
        useState(false);

    const [
        responseForm,
        setResponseForm,
    ] =
        useState<ResponseForm>(
            emptyResponseForm
        );

    const [
        savingResponse,
        setSavingResponse,
    ] =
        useState(false);

    const [
        withdrawingResponseId,
        setWithdrawingResponseId,
    ] =
        useState<string | null>(
            null
        );



    const loadPageData =
        useCallback(
            async (
                silent = false
            ) => {
                if (silent) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setPageError(null);

                try {
                    const {
                        data: {
                            user,
                        },
                        error: authError,
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
                        data: profileData,
                        error: profileError,
                    } =
                        await supabase
                            .from(
                                "profiles"
                            )
                            .select(`
                                id,
                                auth_id,
                                full_name,
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
                        profileData as RecyclerProfile;


                    if (
                        currentProfile.role !==
                        "recycler_partner"
                    ) {
                        throw new Error(
                            "This page is available only to recycler partners."
                        );
                    }


                    const {
                        data: junkshopData,
                        error: junkshopError,
                    } =
                        await supabase
                            .from(
                                "junkshops"
                            )
                            .select(`
                                id,
                                profile_id,
                                junkshop_name,
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


                    if (junkshopError) {
                        throw junkshopError;
                    }


                    const currentJunkshop =
                        (
                            junkshopData as Junkshop | null
                        ) ?? null;


                    setJunkshop(
                        currentJunkshop
                    );


                    if (
                        !currentJunkshop
                    ) {
                        setMaterialPrices({});
                        setOpportunities([]);
                        setResponses([]);

                        return;
                    }


                    const {
                        data: acceptedMaterialData,
                        error: acceptedMaterialError,
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
                            )
                            .eq(
                                "is_accepting",
                                true
                            );


                    if (
                        acceptedMaterialError
                    ) {
                        throw acceptedMaterialError;
                    }


                    const acceptedRows =
                        (
                            acceptedMaterialData ??
                            []
                        ) as AcceptedMaterialRow[];


                    const acceptedMaterialIds =
                        acceptedRows.map(
                            (
                                row
                            ) =>
                                row.material_id
                        );


                    const nextMaterialPrices =
                        acceptedRows.reduce<
                            Record<string, number>
                        >(
                            (
                                result,
                                row
                            ) => {
                                result[
                                    row.material_id
                                ] =
                                    Number(
                                        row.price_per_kg ??
                                        0
                                    );

                                return result;
                            },
                            {}
                        );


                    setMaterialPrices(
                        nextMaterialPrices
                    );


                    if (
                        acceptedMaterialIds.length ===
                        0
                    ) {
                        setOpportunities([]);
                        setResponses([]);

                        return;
                    }


                    const {
                        data: opportunityData,
                        error: opportunityError,
                    } =
                        await supabase
                            .from(
                                "material_opportunities"
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
                            .in(
                                "material_id",
                                acceptedMaterialIds
                            )
                            .in(
                                "status",
                                [
                                    "open",
                                    "accepted",
                                    "completed",
                                ]
                            )
                            .order(
                                "created_at",
                                {
                                    ascending: false,
                                }
                            );


                    if (
                        opportunityError
                    ) {
                        throw opportunityError;
                    }


                    const normalizedOpportunities =
                        (
                            (
                                opportunityData ??
                                []
                            ) as OpportunityDatabaseRow[]
                        )
                            .map(
                                (
                                    row
                                ) => {
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
                            )
                            .filter(
                                (
                                    opportunity
                                ) =>
                                    opportunity.status ===
                                    "open" ||
                                    opportunity.selected_junkshop_id ===
                                    currentJunkshop.id
                            );


                    setOpportunities(
                        normalizedOpportunities
                    );


                    const opportunityIds =
                        normalizedOpportunities.map(
                            (
                                opportunity
                            ) =>
                                opportunity.id
                        );


                    if (
                        opportunityIds.length ===
                        0
                    ) {
                        setResponses([]);

                        return;
                    }


                    const {
                        data: responseData,
                        error: responseError,
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
                            )
                            .in(
                                "opportunity_id",
                                opportunityIds
                            );


                    if (
                        responseError
                    ) {
                        throw responseError;
                    }


                    setResponses(
                        (
                            responseData ??
                            []
                        ) as OpportunityResponse[]
                    );
                } catch (error) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : "Unable to load recovery opportunities.";


                    setPageError(
                        message
                    );


                    if (silent) {
                        toast.error(
                            message
                        );
                    }
                } finally {
                    setLoading(false);
                    setRefreshing(false);
                }
            },
            [
                router,
                supabase,
            ]
        );


    useEffect(() => {
        void loadPageData();
    }, [
        loadPageData,
    ]);


    const responseMap =
        useMemo(
            () => {
                return new Map(
                    responses.map(
                        (
                            response
                        ) => [
                                response.opportunity_id,
                                response,
                            ]
                    )
                );
            },
            [
                responses,
            ]
        );


    const availableOpportunities =
        useMemo(
            () => {
                return opportunities.filter(
                    (
                        opportunity
                    ) => {
                        if (
                            opportunity.status !==
                            "open"
                        ) {
                            return false;
                        }


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
                );
            },
            [
                opportunities,
                responseMap,
            ]
        );


    const interestedOpportunities =
        useMemo(
            () => {
                return opportunities.filter(
                    (
                        opportunity
                    ) => {
                        const response =
                            responseMap.get(
                                opportunity.id
                            );


                        return (
                            opportunity.status ===
                            "open" &&
                            response?.status ===
                            "interested"
                        );
                    }
                );
            },
            [
                opportunities,
                responseMap,
            ]
        );


    const acceptedOpportunities =
        useMemo(
            () => {
                if (!junkshop) {
                    return [];
                }


                return opportunities.filter(
                    (
                        opportunity
                    ) =>
                        opportunity.selected_junkshop_id ===
                        junkshop.id
                );
            },
            [
                junkshop,
                opportunities,
            ]
        );


    const categories =
        useMemo(
            () => {
                return Array.from(
                    new Set(
                        opportunities.map(
                            (
                                opportunity
                            ) =>
                                opportunity.category
                        )
                    )
                ).sort(
                    (
                        first,
                        second
                    ) =>
                        first.localeCompare(
                            second
                        )
                );
            },
            [
                opportunities,
            ]
        );


    const currentTabItems =
        useMemo(
            () => {
                switch (activeTab) {
                    case "interested":
                        return interestedOpportunities;

                    case "accepted":
                        return acceptedOpportunities;

                    default:
                        return availableOpportunities;
                }
            },
            [
                acceptedOpportunities,
                activeTab,
                availableOpportunities,
                interestedOpportunities,
            ]
        );


    const filteredItems =
        useMemo(
            () => {
                const normalizedSearch =
                    search
                        .trim()
                        .toLowerCase();


                return currentTabItems.filter(
                    (
                        opportunity
                    ) => {
                        const matchesSearch =
                            !normalizedSearch ||
                            opportunity.material_name
                                .toLowerCase()
                                .includes(
                                    normalizedSearch
                                ) ||
                            opportunity.category
                                .toLowerCase()
                                .includes(
                                    normalizedSearch
                                ) ||
                            opportunity.barangay
                                .toLowerCase()
                                .includes(
                                    normalizedSearch
                                ) ||
                            opportunity.city
                                .toLowerCase()
                                .includes(
                                    normalizedSearch
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


                        return (
                            matchesSearch &&
                            matchesCategory &&
                            matchesFulfillment
                        );
                    }
                );
            },
            [
                categoryFilter,
                currentTabItems,
                fulfillmentFilter,
                search,
            ]
        );


    const completedCount =
        acceptedOpportunities.filter(
            (
                opportunity
            ) =>
                opportunity.status ===
                "completed"
        ).length;


    const openOpportunityDialog =
        (
            opportunity: Opportunity
        ) => {
            const response =
                responseMap.get(
                    opportunity.id
                );


            const defaultPrice =
                materialPrices[
                opportunity.material_id
                ] ?? 0;


            setSelectedOpportunity(
                opportunity
            );


            setResponseForm({
                offered_price_per_kg:
                    response
                        ? String(
                            Number(
                                response.offered_price_per_kg
                            )
                        )
                        : String(
                            defaultPrice
                        ),

                pickup_available:
                    response?.pickup_available ??
                    (
                        opportunity.fulfillment_method !==
                        "drop_off"
                    ),

                message:
                    response?.message ??
                    "",
            });


            setOpportunityDialogOpen(
                true
            );
        };


    const closeOpportunityDialog =
        (
            open: boolean
        ) => {
            if (savingResponse) {
                return;
            }


            setOpportunityDialogOpen(
                open
            );


            if (!open) {
                setSelectedOpportunity(
                    null
                );

                setResponseForm(
                    emptyResponseForm
                );
            }
        };


    const submitInterest =
        async (
            event: FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();


            if (
                !selectedOpportunity ||
                !junkshop ||
                savingResponse
            ) {
                return;
            }


            const offer =
                Number(
                    responseForm.offered_price_per_kg
                );


            if (
                !Number.isFinite(offer) ||
                offer < 0
            ) {
                toast.error(
                    "Enter a valid offer per kilogram."
                );

                return;
            }


            setSavingResponse(true);


            const existingResponse =
                responseMap.get(
                    selectedOpportunity.id
                );


            const savePromise =
                (async () => {
                    const payload = {
                        opportunity_id:
                            selectedOpportunity.id,

                        junkshop_id:
                            junkshop.id,

                        offered_price_per_kg:
                            offer,

                        pickup_available:
                            responseForm.pickup_available,

                        message:
                            responseForm.message.trim() ||
                            null,

                        status:
                            "interested" as const,

                        updated_at:
                            new Date().toISOString(),
                    };


                    if (existingResponse) {
                        const {
                            error,
                        } =
                            await supabase
                                .from(
                                    "opportunity_responses"
                                )
                                .update(
                                    payload
                                )
                                .eq(
                                    "id",
                                    existingResponse.id
                                )
                                .eq(
                                    "junkshop_id",
                                    junkshop.id
                                );


                        if (error) {
                            throw error;
                        }
                    } else {
                        const {
                            error,
                        } =
                            await supabase
                                .from(
                                    "opportunity_responses"
                                )
                                .insert(
                                    payload
                                );


                        if (error) {
                            throw error;
                        }
                    }
                })();


            toast.promise(
                savePromise,
                {
                    loading:
                        existingResponse
                            ? "Updating your response..."
                            : "Sending your interest...",

                    success:
                        existingResponse
                            ? "Your response was updated."
                            : "Interest sent to the resident.",

                    error:
                        (
                            error
                        ) =>
                            error instanceof Error
                                ? error.message
                                : "Unable to send your interest.",
                }
            );


            try {
                await savePromise;

                setOpportunityDialogOpen(
                    false
                );

                setSelectedOpportunity(
                    null
                );

                await loadPageData(
                    true
                );

                setActiveTab(
                    "interested"
                );
            } catch {
                // Sonner displays the error.
            } finally {
                setSavingResponse(false);
            }
        };


    const withdrawResponse =
        async (
            opportunity: Opportunity
        ) => {
            const response =
                responseMap.get(
                    opportunity.id
                );


            if (
                !response ||
                withdrawingResponseId
            ) {
                return;
            }


            setWithdrawingResponseId(
                response.id
            );


            try {
                const {
                    error,
                } =
                    await supabase
                        .from(
                            "opportunity_responses"
                        )
                        .update({
                            status:
                                "withdrawn",

                            updated_at:
                                new Date().toISOString(),
                        })
                        .eq(
                            "id",
                            response.id
                        );


                if (error) {
                    throw error;
                }


                toast.success(
                    "Your interest was withdrawn."
                );


                await loadPageData(
                    true
                );
            } catch (error) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Unable to withdraw your response."
                );
            } finally {
                setWithdrawingResponseId(
                    null
                );
            }
        };





    const clearFilters =
        () => {
            setSearch("");
            setCategoryFilter("all");
            setFulfillmentFilter("all");
        };


    const hasFilters =
        Boolean(
            search.trim()
        ) ||
        categoryFilter !==
        "all" ||
        fulfillmentFilter !==
        "all";


    if (loading) {
        return (
            <OpportunitiesPageSkeleton />
        );
    }


    if (pageError) {
        return (
            <PageErrorState
                message={pageError}
                onRetry={() =>
                    void loadPageData()
                }
            />
        );
    }


    if (!junkshop) {
        return (
            <MissingJunkshopState
                onBack={() =>
                    router.push(
                        "/profiles/recycler"
                    )
                }
            />
        );
    }


    if (
        Object.keys(
            materialPrices
        ).length === 0
    ) {
        return (
            <MissingMaterialsState
                onBack={() =>
                    router.push(
                        "/profiles/recycler"
                    )
                }
                onManageMaterials={() =>
                    router.push(
                        "/profiles/recycler/materials"
                    )
                }
            />
        );
    }


    const selectedResponse =
        selectedOpportunity
            ? responseMap.get(
                selectedOpportunity.id
            ) ?? null
            : null;


    const selectedLocalPrice =
        selectedOpportunity
            ? materialPrices[
            selectedOpportunity.material_id
            ] ?? 0
            : 0;


    const selectedEstimatedTotal =
        selectedOpportunity
            ? selectedOpportunity
                .estimated_weight_kg *
            Number(
                responseForm.offered_price_per_kg ||
                selectedLocalPrice
            )
            : 0;


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
                {/* PAGE HEADER */}

                <section className="animate-[trashureFadeUp_.35s_ease-out_both]">
                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                                "/profiles/recycler"
                            )
                        }
                        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-green-700"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />

                        Recycler dashboard
                    </button>


                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-sm font-bold text-green-600">
                                Recovery network
                            </p>

                            <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
                                Recovery Opportunities
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                                Find nearby materials that match what
                                your junkshop currently accepts.
                            </p>
                        </div>


                        <Button
                            type="button"
                            variant="outline"
                            disabled={refreshing}
                            onClick={() =>
                                void loadPageData(
                                    true
                                )
                            }
                            className="w-fit rounded-full border-green-200 bg-white transition-all hover:-translate-y-0.5 hover:bg-green-50 hover:text-green-700"
                        >
                            <RefreshCcw
                                className={`mr-2 h-4 w-4 ${refreshing
                                        ? "animate-spin"
                                        : ""
                                    }`}
                            />

                            Refresh
                        </Button>
                    </div>
                </section>


                {/* SHOP SUMMARY */}

                <section className="animate-[trashureFadeUp_.4s_ease-out_both] rounded-[24px] border border-green-100 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                                <Store className="h-6 w-6" />
                            </div>

                            <div>
                                <p className="font-black text-zinc-900">
                                    {junkshop.junkshop_name}
                                </p>

                                <p className="mt-0.5 text-xs text-zinc-500">
                                    Opportunities are matched with your
                                    active material listings.
                                </p>
                            </div>
                        </div>

                        <Badge
                            variant="outline"
                            className="w-fit border-green-200 bg-green-50 text-green-700"
                        >
                            <PackageCheck className="mr-1.5 h-3.5 w-3.5" />

                            {
                                Object.keys(
                                    materialPrices
                                ).length
                            }{" "}
                            accepted materials
                        </Badge>
                    </div>
                </section>


                {/* SUMMARY CARDS */}

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        title="Available"
                        value={
                            availableOpportunities.length
                        }
                        description="Open material offers"
                        icon={Inbox}
                        delay={0}
                    />

                    <SummaryCard
                        title="Interested"
                        value={
                            interestedOpportunities.length
                        }
                        description="Responses awaiting a decision"
                        icon={Handshake}
                        delay={60}
                    />

                    <SummaryCard
                        title="Accepted"
                        value={
                            acceptedOpportunities.length
                        }
                        description="Assigned to your junkshop"
                        icon={CheckCircle2}
                        delay={120}
                    />

                    <SummaryCard
                        title="Completed"
                        value={completedCount}
                        description="Finished recoveries"
                        icon={PackageCheck}
                        delay={180}
                    />
                </section>


                {/* TABS */}

                <section className="animate-[trashureFadeUp_.45s_ease-out_both] overflow-x-auto rounded-[24px] border border-green-100 bg-white p-2 shadow-sm">
                    <div className="flex min-w-max gap-2">
                        <OpportunityTabButton
                            active={
                                activeTab ===
                                "available"
                            }
                            label="Available"
                            count={
                                availableOpportunities.length
                            }
                            onClick={() =>
                                setActiveTab(
                                    "available"
                                )
                            }
                        />

                        <OpportunityTabButton
                            active={
                                activeTab ===
                                "interested"
                            }
                            label="Interested"
                            count={
                                interestedOpportunities.length
                            }
                            onClick={() =>
                                setActiveTab(
                                    "interested"
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
                                acceptedOpportunities.length
                            }
                            onClick={() =>
                                setActiveTab(
                                    "accepted"
                                )
                            }
                        />
                    </div>
                </section>


                {/* FILTERS */}

                <section className="animate-[trashureFadeUp_.5s_ease-out_both] rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-6">
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_210px_210px_auto]">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search material or barangay"
                                className="h-12 rounded-xl border-zinc-300 bg-white pl-11 pr-11 text-zinc-900 focus-visible:ring-green-500"
                            />

                            {search && (
                                <button
                                    type="button"
                                    aria-label="Clear search"
                                    onClick={() =>
                                        setSearch("")
                                    }
                                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>


                        <select
                            value={categoryFilter}
                            onChange={(event) =>
                                setCategoryFilter(
                                    event.target.value
                                )
                            }
                            aria-label="Filter by material category"
                            className="h-12 rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        >
                            <option value="all">
                                All categories
                            </option>

                            {categories.map(
                                (
                                    category
                                ) => (
                                    <option
                                        key={category}
                                        value={category}
                                    >
                                        {category}
                                    </option>
                                )
                            )}
                        </select>


                        <select
                            value={
                                fulfillmentFilter
                            }
                            onChange={(event) =>
                                setFulfillmentFilter(
                                    event.target
                                        .value as FulfillmentFilter
                                )
                            }
                            aria-label="Filter by delivery method"
                            className="h-12 rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        >
                            <option value="all">
                                All methods
                            </option>

                            <option value="pickup">
                                Pickup requested
                            </option>

                            <option value="drop_off">
                                Resident drop-off
                            </option>

                            <option value="either">
                                Pickup or drop-off
                            </option>
                        </select>


                        {hasFilters ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={clearFilters}
                                className="h-12 rounded-xl border-zinc-300"
                            >
                                <X className="mr-2 h-4 w-4" />

                                Clear
                            </Button>
                        ) : (
                            <div className="hidden lg:block" />
                        )}
                    </div>
                </section>


                {/* OPPORTUNITY LIST */}

                <section className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
                    <div>
                        <h2 className="text-xl font-black text-zinc-900">
                            {activeTab ===
                                "available"
                                ? "Available opportunities"
                                : activeTab ===
                                    "interested"
                                    ? "My responses"
                                    : "Accepted recoveries"}
                        </h2>

                        <p className="mt-1 text-sm text-zinc-500">
                            {filteredItems.length}{" "}
                            {filteredItems.length ===
                                1
                                ? "opportunity"
                                : "opportunities"}{" "}
                            shown
                        </p>
                    </div>


                    {filteredItems.length ===
                        0 ? (
                        <OpportunityEmptyState
                            tab={activeTab}
                            hasFilters={hasFilters}
                            onClearFilters={clearFilters}
                        />
                    ) : (
                        <div className="mt-6 grid gap-5 lg:grid-cols-2">
                            {filteredItems.map(
                                (
                                    opportunity,
                                    index
                                ) => {
                                    const response =
                                        responseMap.get(
                                            opportunity.id
                                        ) ?? null;

                                    const localPrice =
                                        materialPrices[
                                        opportunity
                                            .material_id
                                        ] ?? 0;


                                    return (
                                        <OpportunityCard
                                            key={opportunity.id}
                                            opportunity={opportunity}
                                            response={response}
                                            localPrice={localPrice}
                                            tab={activeTab}
                                            animationDelay={index * 45}
                                            withdrawing={
                                                response
                                                    ? withdrawingResponseId === response.id
                                                    : false
                                            }
                                            onView={() =>
                                                openOpportunityDialog(opportunity)
                                            }
                                            onRespond={() =>
                                                openOpportunityDialog(opportunity)
                                            }
                                            onWithdraw={() =>
                                                void withdrawResponse(opportunity)
                                            }
                                        />
                                    );
                                }
                            )}
                        </div>
                    )}
                </section>
            </div>


            {/* OPPORTUNITY DETAIL AND RESPONSE DIALOG */}

            <Dialog
                open={
                    opportunityDialogOpen
                }
                onOpenChange={
                    closeOpportunityDialog
                }
            >
                <DialogContent
                    className="
                        max-h-[94dvh]
                        !w-[calc(100vw-1rem)]
                        !max-w-none
                        gap-0
                        overflow-hidden
                        rounded-[26px]
                        border
                        border-green-200
                        !bg-white
                        p-0
                        text-zinc-900
                        shadow-[0_28px_100px_rgba(0,0,0,0.35)]
                        sm:!w-[94vw]
                        lg:!w-[820px]
                        lg:rounded-[30px]
                    "
                >
                    <DialogHeader className="sr-only">
                        <DialogTitle>
                            Recovery opportunity
                        </DialogTitle>

                        <DialogDescription>
                            Review the opportunity and submit your
                            interest.
                        </DialogDescription>
                    </DialogHeader>


                    {selectedOpportunity && (
                        <form
                            onSubmit={submitInterest}
                            className="grid max-h-[94dvh] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-white"
                        >
                            {/* DIALOG HEADER */}

                            <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-700 px-5 py-5 text-white sm:px-7">
                                <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-white/10" />

                                <div className="relative flex items-start gap-4 pr-9">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                                        <Handshake className="h-6 w-6" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-100">
                                            Recovery opportunity
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


                            {/* DIALOG BODY */}

                            <div className="min-h-0 overflow-y-auto bg-white p-5 sm:p-7">
                                <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
                                    <div>
                                        <div className="relative h-52 overflow-hidden rounded-2xl bg-green-50">
                                            {selectedOpportunity.image_url ? (
                                                <img
                                                    src={
                                                        selectedOpportunity.image_url
                                                    }
                                                    alt={
                                                        selectedOpportunity.material_name
                                                    }
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-green-600">
                                                    <Package className="h-14 w-14" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-3 rounded-2xl border border-green-100 bg-green-50 p-4">
                                            <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                                                Estimated value
                                            </p>

                                            <p className="mt-1 text-2xl font-black text-green-700">
                                                {formatPeso(
                                                    selectedEstimatedTotal
                                                )}
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                                                Based on the weight and
                                                your current offer.
                                            </p>
                                        </div>
                                    </div>


                                    <div className="space-y-5">
                                        <OpportunityDetailGrid
                                            opportunity={
                                                selectedOpportunity
                                            }
                                        />


                                        {selectedOpportunity.status ===
                                            "open" ? (
                                            <>
                                                <div className="border-t border-zinc-200 pt-5">
                                                    <h3 className="font-black text-zinc-900">
                                                        Your response
                                                    </h3>

                                                    <p className="mt-1 text-sm text-zinc-500">
                                                        The resident will
                                                        decide which
                                                        junkshop to select.
                                                    </p>
                                                </div>


                                                <div className="space-y-2">
                                                    <Label htmlFor="opportunity_offer">
                                                        Offer per kilogram
                                                    </Label>

                                                    <div className="relative">
                                                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-green-700">
                                                            ₱
                                                        </span>

                                                        <Input
                                                            id="opportunity_offer"
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={
                                                                responseForm.offered_price_per_kg
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                setResponseForm(
                                                                    (
                                                                        current
                                                                    ) => ({
                                                                        ...current,
                                                                        offered_price_per_kg:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                            }
                                                            className="h-12 rounded-xl border-zinc-300 bg-white pl-9 text-zinc-900 focus-visible:ring-green-500"
                                                        />
                                                    </div>

                                                    <p className="text-xs text-zinc-500">
                                                        Your listed price is{" "}
                                                        {formatPeso(
                                                            selectedLocalPrice
                                                        )}
                                                        /kg.
                                                    </p>
                                                </div>


                                                <div className="space-y-2">
                                                    <Label htmlFor="opportunity_message">
                                                        Short message
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
                                                            event
                                                        ) =>
                                                            setResponseForm(
                                                                (
                                                                    current
                                                                ) => ({
                                                                    ...current,
                                                                    message:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        placeholder="Example: We can receive this on Saturday morning."
                                                        rows={4}
                                                        className="resize-none rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
                                                    />

                                                    <p className="text-right text-xs text-zinc-400">
                                                        {
                                                            responseForm
                                                                .message
                                                                .length
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
                                                            Enable this if
                                                            your junkshop
                                                            can collect the
                                                            material.
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={
                                                            responseForm.pickup_available
                                                        }
                                                        onClick={() =>
                                                            setResponseForm(
                                                                (
                                                                    current
                                                                ) => ({
                                                                    ...current,
                                                                    pickup_available:
                                                                        !current.pickup_available,
                                                                })
                                                            )
                                                        }
                                                        className={`relative h-7 w-12 shrink-0 rounded-full transition ${responseForm.pickup_available
                                                                ? "bg-green-600"
                                                                : "bg-zinc-300"
                                                            }`}
                                                    >
                                                        <span
                                                            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${responseForm.pickup_available
                                                                    ? "left-6"
                                                                    : "left-1"
                                                                }`}
                                                        />
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                                                <div className="flex gap-3">
                                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />

                                                    <div>
                                                        <p className="font-black text-zinc-900">
                                                            Assigned to your
                                                            junkshop
                                                        </p>

                                                        <p className="mt-1 text-xs leading-5 text-zinc-500">
                                                            This opportunity
                                                            has already been
                                                            accepted.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>


                            {/* DIALOG FOOTER */}

                            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-green-200 bg-white px-5 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] sm:px-7">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={
                                        savingResponse
                                    }
                                    onClick={() =>
                                        setOpportunityDialogOpen(
                                            false
                                        )
                                    }
                                    className="rounded-full"
                                >
                                    Cancel
                                </Button>


                                {selectedOpportunity.status ===
                                    "open" && (
                                        <Button
                                            type="submit"
                                            disabled={
                                                savingResponse ||
                                                !responseForm.offered_price_per_kg
                                            }
                                            className="min-w-40 rounded-full bg-green-600 px-6 text-white hover:bg-green-700 disabled:bg-zinc-200 disabled:text-zinc-400"
                                        >
                                            {savingResponse ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="mr-2 h-4 w-4" />
                                            )}

                                            {savingResponse
                                                ? "Sending..."
                                                : selectedResponse
                                                    ? "Update response"
                                                    : "Send interest"}
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
    icon: ComponentType<{
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

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600 transition-transform duration-300 group-hover:scale-105">
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
            onClick={onClick}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all duration-300 ${active
                    ? "bg-green-600 text-white shadow-sm shadow-green-600/20"
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


function OpportunityCard({
    opportunity,
    response,
    localPrice,
    tab,
    animationDelay,
    withdrawing,
    onView,
    onRespond,
    onWithdraw,
}: {
    opportunity: Opportunity;
    response: OpportunityResponse | null;
    localPrice: number;
    tab: OpportunityTab;
    animationDelay: number;
    withdrawing: boolean;
    onView: () => void;
    onRespond: () => void;
    onWithdraw: () => void;
}) {
    const displayedPrice =
        response
            ? Number(
                response.offered_price_per_kg
            )
            : localPrice;


    const estimatedTotal =
        opportunity.estimated_weight_kg *
        displayedPrice;


    return (
        <article
            className="animate-[trashureFadeUp_.35s_ease-out_both] overflow-hidden rounded-[26px] border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-300 hover:shadow-lg"
            style={{
                animationDelay:
                    `${animationDelay}ms`,
            }}
        >
            <div className="relative h-48 overflow-hidden bg-green-50">
                {opportunity.image_url ? (
                    <img
                        src={
                            opportunity.image_url
                        }
                        alt={
                            opportunity.material_name
                        }
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 text-green-600">
                        <Package className="h-14 w-14" />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                <div className="absolute bottom-4 left-4 right-4">
                    <Badge className="border-white/20 bg-black/30 text-white backdrop-blur-sm hover:bg-black/30">
                        {opportunity.category}
                    </Badge>

                    <h3 className="mt-2 text-xl font-black text-white">
                        {opportunity.material_name}
                    </h3>
                </div>
            </div>


            <div className="p-5">
                <div className="grid grid-cols-2 gap-3">
                    <OpportunityMetric
                        icon={Scale}
                        label="Estimated weight"
                        value={`${opportunity.estimated_weight_kg} kg`}
                    />

                    <OpportunityMetric
                        icon={WalletCards}
                        label="Estimated value"
                        value={formatPeso(
                            estimatedTotal
                        )}
                    />
                </div>


                <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />

                        <div>
                            <p className="text-xs font-bold text-zinc-700">
                                Approximate location
                            </p>

                            <p className="mt-0.5 text-sm text-zinc-500">
                                {getLocationText(
                                    opportunity
                                )}
                            </p>
                        </div>
                    </div>


                    <div className="flex items-start gap-3">
                        <Truck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />

                        <div>
                            <p className="text-xs font-bold text-zinc-700">
                                Method
                            </p>

                            <p className="mt-0.5 text-sm text-zinc-500">
                                {getFulfillmentLabel(
                                    opportunity.fulfillment_method
                                )}
                            </p>
                        </div>
                    </div>


                    <div className="flex items-start gap-3">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />

                        <div>
                            <p className="text-xs font-bold text-zinc-700">
                                Condition
                            </p>

                            <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500">
                                {opportunity.material_condition ||
                                    "No condition was provided."}
                            </p>
                        </div>
                    </div>
                </div>


                <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Clock3 className="h-3.5 w-3.5" />

                        {formatRelativeDate(
                            opportunity.created_at
                        )}
                    </div>

                    <Badge
                        variant="outline"
                        className={
                            opportunity.status ===
                                "completed"
                                ? "border-green-200 bg-green-50 text-green-700"
                                : response?.status ===
                                    "interested"
                                    ? "border-amber-200 bg-amber-50 text-amber-700"
                                    : opportunity.status ===
                                        "accepted"
                                        ? "border-blue-200 bg-blue-50 text-blue-700"
                                        : "border-zinc-200 bg-zinc-50 text-zinc-600"
                        }
                    >
                        {opportunity.status ===
                            "completed"
                            ? "Completed"
                            : response?.status ===
                                "interested"
                                ? "Interest sent"
                                : opportunity.status ===
                                    "accepted"
                                    ? "Accepted"
                                    : "Available"}
                    </Badge>
                </div>


                <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onView}
                        className="flex-1 rounded-full border-green-200 transition-all hover:bg-green-50 hover:text-green-700"
                    >
                        View details
                    </Button>


                    {tab ===
                        "available" && (
                            <Button
                                type="button"
                                onClick={onRespond}
                                className="flex-1 rounded-full bg-green-600 transition-all hover:-translate-y-0.5 hover:bg-green-700"
                            >
                                <Handshake className="mr-2 h-4 w-4" />

                                I’m interested
                            </Button>
                        )}


                    {tab ===
                        "interested" && (
                            <>
                                <Button
                                    type="button"
                                    onClick={onRespond}
                                    className="flex-1 rounded-full bg-green-600 hover:bg-green-700"
                                >
                                    <MessageSquare className="mr-2 h-4 w-4" />

                                    Update
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={
                                        withdrawing
                                    }
                                    onClick={onWithdraw}
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


                    {tab === "accepted" && (
                        <div className="flex flex-1 items-center justify-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700">
                            {opportunity.status === "completed" ? (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />

                                    Recovery completed
                                </>
                            ) : (
                                <>
                                    <Clock3 className="h-4 w-4" />

                                    Awaiting resident confirmation
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}


function OpportunityMetric({
    icon: Icon,
    label,
    value,
}: {
    icon: ComponentType<{
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


function OpportunityDetailGrid({
    opportunity,
}: {
    opportunity: Opportunity;
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <OpportunityDetail
                icon={Scale}
                label="Estimated weight"
                value={`${opportunity.estimated_weight_kg} kg`}
            />

            <OpportunityDetail
                icon={MapPin}
                label="Approximate location"
                value={getLocationText(
                    opportunity
                )}
            />

            <OpportunityDetail
                icon={Truck}
                label="Method"
                value={getFulfillmentLabel(
                    opportunity.fulfillment_method
                )}
            />

            <OpportunityDetail
                icon={Info}
                label="Condition"
                value={
                    opportunity.material_condition ||
                    "No condition provided."
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
    icon: ComponentType<{
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
        tab === "available"
            ? {
                title:
                    "No matching opportunities yet",
                description:
                    "New resident offers matching your accepted materials will appear here.",
            }
            : tab === "interested"
                ? {
                    title:
                        "No active responses",
                    description:
                        "Opportunities where you express interest will appear here.",
                }
                : {
                    title:
                        "No accepted recoveries yet",
                    description:
                        "Offers assigned to your junkshop will appear here.",
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


function MissingJunkshopState({
    onBack,
}: {
    onBack: () => void;
}) {
    return (
        <div className="space-y-6">
            <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-green-700"
            >
                <ArrowLeft className="h-4 w-4" />

                Recycler dashboard
            </button>

            <div className="overflow-hidden rounded-[30px] border border-green-100 bg-white shadow-sm">
                <div className="bg-gradient-to-br from-green-600 to-emerald-800 p-8 text-white sm:p-10">
                    <Store className="h-12 w-12" />

                    <h1 className="mt-5 text-3xl font-black">
                        Create your junkshop first
                    </h1>

                    <p className="mt-3 max-w-xl text-sm leading-7 text-green-50">
                        Opportunities must be connected to an active
                        junkshop profile.
                    </p>

                    <Button
                        type="button"
                        onClick={onBack}
                        className="mt-6 rounded-full bg-white text-green-700 hover:bg-green-50"
                    >
                        Set up junkshop
                    </Button>
                </div>
            </div>
        </div>
    );
}


function MissingMaterialsState({
    onBack,
    onManageMaterials,
}: {
    onBack: () => void;
    onManageMaterials: () => void;
}) {
    return (
        <div className="space-y-6">
            <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-green-700"
            >
                <ArrowLeft className="h-4 w-4" />

                Recycler dashboard
            </button>

            <div className="rounded-[30px] border border-green-100 bg-white p-8 text-center shadow-sm sm:p-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
                    <Package className="h-8 w-8" />
                </div>

                <h1 className="mt-5 text-2xl font-black text-zinc-900">
                    Add accepted materials first
                </h1>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">
                    Opportunities are matched with the materials your
                    junkshop is actively buying.
                </p>

                <Button
                    type="button"
                    onClick={onManageMaterials}
                    className="mt-6 rounded-full bg-green-600 hover:bg-green-700"
                >
                    Manage materials
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
                    onClick={onRetry}
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
                <Skeleton className="h-4 w-40 bg-green-100" />
                <Skeleton className="h-9 w-80 max-w-full bg-green-100" />
                <Skeleton className="h-4 w-96 max-w-full bg-green-100" />
            </div>

            <Skeleton className="h-20 rounded-[24px] bg-green-100" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({
                    length: 4,
                }).map(
                    (
                        _,
                        index
                    ) => (
                        <Skeleton
                            key={index}
                            className="h-32 rounded-[24px] bg-green-100"
                        />
                    )
                )}
            </div>

            <Skeleton className="h-16 rounded-[24px] bg-green-100" />
            <Skeleton className="h-28 rounded-[28px] bg-green-100" />

            <div className="grid gap-5 lg:grid-cols-2">
                {Array.from({
                    length: 4,
                }).map(
                    (
                        _,
                        index
                    ) => (
                        <Skeleton
                            key={index}
                            className="h-[480px] rounded-[26px] bg-green-100"
                        />
                    )
                )}
            </div>
        </div>
    );
}