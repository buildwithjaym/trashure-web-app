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
    Dispatch,
    FormEvent,
    SetStateAction,
} from "react";
import {
    AlertCircle,
    ArrowLeft,
    Check,
    CheckCircle2,
    CircleDollarSign,
    Edit3,
    Filter,
    Info,
    Loader2,
    Package,
    PackageCheck,
    PauseCircle,
    Plus,
    RefreshCcw,
    Scale,
    Search,
    Store,
    Trash2,
    WalletCards,
    X,
} from "lucide-react";

import {
    useRouter,
    useSearchParams,
} from "next/navigation";

import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import {
    Badge,
} from "@/components/ui/badge";

import {
    Button,
} from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    Input,
} from "@/components/ui/input";

import {
    Label,
} from "@/components/ui/label";

import {
    Skeleton,
} from "@/components/ui/skeleton";

import {
    Textarea,
} from "@/components/ui/textarea";


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
    verification_status:
    | "pending"
    | "approved"
    | "rejected"
    | "suspended";
    is_active: boolean;
}


interface Material {
    id: string;
    material_name: string;
    category: string;
    recyclable: boolean;
    selling_information: string | null;
    recycling_process: string | null;
}


interface MaterialRelation {
    id: string;
    material_name: string;
    category: string;
    recyclable: boolean;
}


interface JunkshopMaterialDatabaseRow {
    id: string;
    junkshop_id: string;
    material_id: string;
    price_per_kg: number | string;
    minimum_weight_kg: number | string;
    accepted_condition: string | null;
    preparation_instructions: string | null;
    is_accepting: boolean;
    created_at: string;
    updated_at: string;

    materials:
    | MaterialRelation
    | MaterialRelation[]
    | null;
}


interface JunkshopMaterial {
    id: string;
    junkshop_id: string;
    material_id: string;
    material_name: string;
    category: string;
    recyclable: boolean;
    price_per_kg: number;
    minimum_weight_kg: number;
    accepted_condition: string | null;
    preparation_instructions: string | null;
    is_accepting: boolean;
    created_at: string;
    updated_at: string;
}


interface MaterialForm {
    material_id: string;
    price_per_kg: string;
    minimum_weight_kg: string;
    accepted_condition: string;
    preparation_instructions: string;
    is_accepting: boolean;
}


type StatusFilter =
    | "all"
    | "accepting"
    | "paused";


const emptyMaterialForm: MaterialForm = {
    material_id: "",
    price_per_kg: "",
    minimum_weight_kg: "0",
    accepted_condition: "",
    preparation_instructions: "",
    is_accepting: true,
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

function PreviewInformation({
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
        <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <Icon className="h-4 w-4" />
            </div>

            <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-700">
                    {label}
                </p>

                <p className="mt-0.5 break-words text-xs leading-5 text-zinc-500">
                    {value}
                </p>
            </div>
        </div>
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


export default function RecyclerMaterialsPage() {
    return (
        <Suspense
            fallback={
                <MaterialsPageSkeleton />
            }
        >
            <RecyclerMaterialsContent />
        </Suspense>
    );
}


function RecyclerMaterialsContent() {
    const router =
        useRouter();

    const searchParams =
        useSearchParams();

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
        useState<RecyclerProfile | null>(
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
        materialCatalog,
        setMaterialCatalog,
    ] =
        useState<Material[]>([]);

    const [
        listings,
        setListings,
    ] =
        useState<JunkshopMaterial[]>([]);


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
        statusFilter,
        setStatusFilter,
    ] =
        useState<StatusFilter>(
            "all"
        );


    const [
        materialDialogOpen,
        setMaterialDialogOpen,
    ] =
        useState(false);

    const [
        dialogStep,
        setDialogStep,
    ] =
        useState(1);

    const [
        editingMaterial,
        setEditingMaterial,
    ] =
        useState<JunkshopMaterial | null>(
            null
        );

    const [
        materialForm,
        setMaterialForm,
    ] =
        useState<MaterialForm>(
            emptyMaterialForm
        );

    const [
        materialPickerSearch,
        setMaterialPickerSearch,
    ] =
        useState("");

    const [
        materialPickerCategory,
        setMaterialPickerCategory,
    ] =
        useState("all");

    const [
        savingMaterial,
        setSavingMaterial,
    ] =
        useState(false);


    const [
        deleteTarget,
        setDeleteTarget,
    ] =
        useState<JunkshopMaterial | null>(
            null
        );

    const [
        deletingMaterial,
        setDeletingMaterial,
    ] =
        useState(false);

    const [
        togglingMaterialId,
        setTogglingMaterialId,
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


                    if (
                        profileData.role !==
                        "recycler_partner"
                    ) {
                        throw new Error(
                            "This page is available only to recycler partners."
                        );
                    }


                    const currentProfile =
                        profileData as RecyclerProfile;


                    setProfile(
                        currentProfile
                    );


                    const [
                        junkshopResult,
                        catalogResult,
                    ] =
                        await Promise.all([
                            supabase
                                .from(
                                    "junkshops"
                                )
                                .select(`
                                    id,
                                    profile_id,
                                    junkshop_name,
                                    verification_status,
                                    is_active
                                `)
                                .eq(
                                    "profile_id",
                                    currentProfile.id
                                )
                                .maybeSingle(),

                            supabase
                                .from(
                                    "materials"
                                )
                                .select(`
                                    id,
                                    material_name,
                                    category,
                                    recyclable,
                                    selling_information,
                                    recycling_process
                                `)
                                .order(
                                    "category",
                                    {
                                        ascending:
                                            true,
                                    }
                                )
                                .order(
                                    "material_name",
                                    {
                                        ascending:
                                            true,
                                    }
                                ),
                        ]);


                    if (
                        junkshopResult.error
                    ) {
                        throw junkshopResult.error;
                    }


                    if (
                        catalogResult.error
                    ) {
                        throw catalogResult.error;
                    }


                    const currentJunkshop =
                        (
                            junkshopResult.data as Junkshop | null
                        ) ?? null;


                    setJunkshop(
                        currentJunkshop
                    );

                    setMaterialCatalog(
                        (
                            catalogResult.data as Material[] | null
                        ) ?? []
                    );


                    if (
                        !currentJunkshop
                    ) {
                        setListings(
                            []
                        );

                        return;
                    }


                    const {
                        data: listingData,
                        error: listingError,
                    } =
                        await supabase
                            .from(
                                "junkshop_materials"
                            )
                            .select(`
                                id,
                                junkshop_id,
                                material_id,
                                price_per_kg,
                                minimum_weight_kg,
                                accepted_condition,
                                preparation_instructions,
                                is_accepting,
                                created_at,
                                updated_at,
                                materials (
                                    id,
                                    material_name,
                                    category,
                                    recyclable
                                )
                            `)
                            .eq(
                                "junkshop_id",
                                currentJunkshop.id
                            )
                            .order(
                                "updated_at",
                                {
                                    ascending:
                                        false,
                                }
                            );


                    if (
                        listingError
                    ) {
                        throw listingError;
                    }


                    const normalizedListings =
                        (
                            (
                                listingData ??
                                []
                            ) as JunkshopMaterialDatabaseRow[]
                        ).map(
                            (
                                row
                            ) => {
                                const relation =
                                    normalizeMaterialRelation(
                                        row.materials
                                    );


                                return {
                                    id:
                                        row.id,

                                    junkshop_id:
                                        row.junkshop_id,

                                    material_id:
                                        row.material_id,

                                    material_name:
                                        relation?.material_name ??
                                        "Unnamed material",

                                    category:
                                        relation?.category ??
                                        "Other",

                                    recyclable:
                                        relation?.recyclable ??
                                        true,

                                    price_per_kg:
                                        Number(
                                            row.price_per_kg ??
                                            0
                                        ),

                                    minimum_weight_kg:
                                        Number(
                                            row.minimum_weight_kg ??
                                            0
                                        ),

                                    accepted_condition:
                                        row.accepted_condition,

                                    preparation_instructions:
                                        row.preparation_instructions,

                                    is_accepting:
                                        Boolean(
                                            row.is_accepting
                                        ),

                                    created_at:
                                        row.created_at,

                                    updated_at:
                                        row.updated_at,
                                };
                            }
                        );


                    setListings(
                        normalizedListings
                    );
                } catch (error) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : "Unable to load your materials.";


                    setPageError(
                        message
                    );


                    if (silent) {
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


    useEffect(() => {
        void loadPageData();
    }, [
        loadPageData,
    ]);


    useEffect(() => {
        const action =
            searchParams.get(
                "action"
            );


        if (
            action !== "add" ||
            loading
        ) {
            return;
        }


        if (
            !junkshop
        ) {
            toast.info(
                "Create your junkshop profile before adding materials."
            );

            router.replace(
                "/profiles/recycler",
                {
                    scroll:
                        false,
                }
            );

            return;
        }


        setEditingMaterial(
            null
        );

        setMaterialForm(
            emptyMaterialForm
        );

        setMaterialPickerSearch(
            ""
        );

        setMaterialPickerCategory(
            "all"
        );

        setDialogStep(
            1
        );

        setMaterialDialogOpen(
            true
        );


        router.replace(
            "/profiles/recycler/materials",
            {
                scroll:
                    false,
            }
        );
    }, [
        junkshop,
        loading,
        router,
        searchParams,
    ]);


    const categories =
        useMemo(
            () => {
                return Array.from(
                    new Set(
                        materialCatalog
                            .map(
                                (
                                    material
                                ) =>
                                    material.category
                            )
                            .filter(
                                Boolean
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
                materialCatalog,
            ]
        );


    const activeCount =
        useMemo(
            () =>
                listings.filter(
                    (
                        listing
                    ) =>
                        listing.is_accepting
                ).length,
            [
                listings,
            ]
        );


    const pausedCount =
        listings.length -
        activeCount;


    const averagePrice =
        useMemo(
            () => {
                if (
                    listings.length ===
                    0
                ) {
                    return 0;
                }


                const total =
                    listings.reduce(
                        (
                            sum,
                            listing
                        ) =>
                            sum +
                            listing.price_per_kg,
                        0
                    );


                return (
                    total /
                    listings.length
                );
            },
            [
                listings,
            ]
        );


    const filteredListings =
        useMemo(
            () => {
                const normalizedSearch =
                    search
                        .trim()
                        .toLowerCase();


                return listings.filter(
                    (
                        listing
                    ) => {
                        const matchesSearch =
                            !normalizedSearch ||
                            listing.material_name
                                .toLowerCase()
                                .includes(
                                    normalizedSearch
                                ) ||
                            listing.category
                                .toLowerCase()
                                .includes(
                                    normalizedSearch
                                ) ||
                            (
                                listing.accepted_condition ??
                                ""
                            )
                                .toLowerCase()
                                .includes(
                                    normalizedSearch
                                );


                        const matchesCategory =
                            categoryFilter ===
                            "all" ||
                            listing.category ===
                            categoryFilter;


                        const matchesStatus =
                            statusFilter ===
                            "all" ||
                            (
                                statusFilter ===
                                "accepting" &&
                                listing.is_accepting
                            ) ||
                            (
                                statusFilter ===
                                "paused" &&
                                !listing.is_accepting
                            );


                        return (
                            matchesSearch &&
                            matchesCategory &&
                            matchesStatus
                        );
                    }
                );
            },
            [
                categoryFilter,
                listings,
                search,
                statusFilter,
            ]
        );


    const filteredCatalog =
        useMemo(
            () => {
                const normalizedSearch =
                    materialPickerSearch
                        .trim()
                        .toLowerCase();


                const listedMaterialIds =
                    new Set(
                        listings.map(
                            (
                                listing
                            ) =>
                                listing.material_id
                        )
                    );


                return materialCatalog.filter(
                    (
                        material
                    ) => {
                        const isCurrentEditingMaterial =
                            editingMaterial?.material_id ===
                            material.id;


                        if (
                            listedMaterialIds.has(
                                material.id
                            ) &&
                            !isCurrentEditingMaterial
                        ) {
                            return false;
                        }


                        const matchesSearch =
                            !normalizedSearch ||
                            material.material_name
                                .toLowerCase()
                                .includes(
                                    normalizedSearch
                                ) ||
                            material.category
                                .toLowerCase()
                                .includes(
                                    normalizedSearch
                                );


                        const matchesCategory =
                            materialPickerCategory ===
                            "all" ||
                            material.category ===
                            materialPickerCategory;


                        return (
                            matchesSearch &&
                            matchesCategory
                        );
                    }
                );
            },
            [
                editingMaterial,
                listings,
                materialCatalog,
                materialPickerCategory,
                materialPickerSearch,
            ]
        );


    const selectedCatalogMaterial =
        useMemo(
            () =>
                materialCatalog.find(
                    (
                        material
                    ) =>
                        material.id ===
                        materialForm.material_id
                ) ?? null,
            [
                materialCatalog,
                materialForm.material_id,
            ]
        );


    const openAddMaterial =
        () => {
            if (
                !junkshop
            ) {
                toast.info(
                    "Create your junkshop profile first."
                );

                router.push(
                    "/profiles/recycler"
                );

                return;
            }


            setEditingMaterial(
                null
            );

            setMaterialForm(
                emptyMaterialForm
            );

            setMaterialPickerSearch(
                ""
            );

            setMaterialPickerCategory(
                "all"
            );

            setDialogStep(
                1
            );

            setMaterialDialogOpen(
                true
            );
        };


    const openEditMaterial =
        (
            listing: JunkshopMaterial
        ) => {
            setEditingMaterial(
                listing
            );

            setMaterialForm({
                material_id:
                    listing.material_id,

                price_per_kg:
                    String(
                        listing.price_per_kg
                    ),

                minimum_weight_kg:
                    String(
                        listing.minimum_weight_kg
                    ),

                accepted_condition:
                    listing.accepted_condition ??
                    "",

                preparation_instructions:
                    listing.preparation_instructions ??
                    "",

                is_accepting:
                    listing.is_accepting,
            });

            setMaterialPickerSearch(
                ""
            );

            setMaterialPickerCategory(
                "all"
            );

            setDialogStep(
                2
            );

            setMaterialDialogOpen(
                true
            );
        };


    const closeMaterialDialog =
        (
            open: boolean
        ) => {
            if (
                savingMaterial
            ) {
                return;
            }


            setMaterialDialogOpen(
                open
            );


            if (
                !open
            ) {
                setEditingMaterial(
                    null
                );

                setMaterialForm(
                    emptyMaterialForm
                );

                setDialogStep(
                    1
                );
            }
        };


    const continueToDetails =
        () => {
            if (
                !materialForm.material_id
            ) {
                toast.error(
                    "Select a material first."
                );

                return;
            }


            setDialogStep(
                2
            );
        };


    const saveMaterial =
        async (
            event: FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();


            if (
                !junkshop ||
                savingMaterial
            ) {
                return;
            }


            if (
                !materialForm.material_id
            ) {
                toast.error(
                    "Select a material."
                );

                setDialogStep(
                    1
                );

                return;
            }


            const price =
                Number(
                    materialForm.price_per_kg
                );

            const minimumWeight =
                Number(
                    materialForm.minimum_weight_kg
                );


            if (
                !Number.isFinite(
                    price
                ) ||
                price < 0
            ) {
                toast.error(
                    "Enter a valid buying price."
                );

                return;
            }


            if (
                !Number.isFinite(
                    minimumWeight
                ) ||
                minimumWeight < 0
            ) {
                toast.error(
                    "Enter a valid minimum weight."
                );

                return;
            }


            setSavingMaterial(
                true
            );


            const savePromise =
                (async () => {
                    const payload = {
                        junkshop_id:
                            junkshop.id,

                        material_id:
                            materialForm.material_id,

                        price_per_kg:
                            price,

                        minimum_weight_kg:
                            minimumWeight,

                        accepted_condition:
                            materialForm.accepted_condition.trim() ||
                            null,

                        preparation_instructions:
                            materialForm.preparation_instructions.trim() ||
                            null,

                        is_accepting:
                            materialForm.is_accepting,

                        updated_at:
                            new Date().toISOString(),
                    };


                    if (
                        editingMaterial
                    ) {
                        const {
                            error,
                        } =
                            await supabase
                                .from(
                                    "junkshop_materials"
                                )
                                .update(
                                    payload
                                )
                                .eq(
                                    "id",
                                    editingMaterial.id
                                )
                                .eq(
                                    "junkshop_id",
                                    junkshop.id
                                );


                        if (
                            error
                        ) {
                            throw error;
                        }
                    } else {
                        const {
                            error,
                        } =
                            await supabase
                                .from(
                                    "junkshop_materials"
                                )
                                .insert(
                                    payload
                                );


                        if (
                            error
                        ) {
                            throw error;
                        }
                    }
                })();


            toast.promise(
                savePromise,
                {
                    loading:
                        editingMaterial
                            ? "Updating material..."
                            : "Adding material...",

                    success:
                        editingMaterial
                            ? "Material updated successfully."
                            : "Material added successfully.",

                    error:
                        (
                            error
                        ) =>
                            error instanceof Error
                                ? error.message
                                : "Unable to save material.",
                }
            );


            try {
                await savePromise;


                setMaterialDialogOpen(
                    false
                );

                setEditingMaterial(
                    null
                );

                setMaterialForm(
                    emptyMaterialForm
                );

                setDialogStep(
                    1
                );


                await loadPageData(
                    true
                );
            } catch {
                // Sonner displays the error.
            } finally {
                setSavingMaterial(
                    false
                );
            }
        };


    const toggleMaterialStatus =
        async (
            listing: JunkshopMaterial
        ) => {
            if (
                togglingMaterialId
            ) {
                return;
            }


            const nextStatus =
                !listing.is_accepting;


            setTogglingMaterialId(
                listing.id
            );


            setListings(
                (
                    current
                ) =>
                    current.map(
                        (
                            item
                        ) =>
                            item.id ===
                                listing.id
                                ? {
                                    ...item,
                                    is_accepting:
                                        nextStatus,
                                }
                                : item
                    )
            );


            try {
                const {
                    error,
                } =
                    await supabase
                        .from(
                            "junkshop_materials"
                        )
                        .update({
                            is_accepting:
                                nextStatus,

                            updated_at:
                                new Date().toISOString(),
                        })
                        .eq(
                            "id",
                            listing.id
                        );


                if (
                    error
                ) {
                    throw error;
                }


                toast.success(
                    nextStatus
                        ? `${listing.material_name} is now active.`
                        : `${listing.material_name} has been paused.`
                );
            } catch (error) {
                setListings(
                    (
                        current
                    ) =>
                        current.map(
                            (
                                item
                            ) =>
                                item.id ===
                                    listing.id
                                    ? {
                                        ...item,
                                        is_accepting:
                                            listing.is_accepting,
                                    }
                                    : item
                        )
                );


                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Unable to change the material status."
                );
            } finally {
                setTogglingMaterialId(
                    null
                );
            }
        };


    const confirmDeleteMaterial = async () => {
        if (!deleteTarget || deletingMaterial) {
            return;
        }

        const target = deleteTarget;

        setDeletingMaterial(true);

        const deletePromise = (async () => {
            const { error } = await supabase
                .from("junkshop_materials")
                .delete()
                .eq("id", target.id)
                .eq("junkshop_id", target.junkshop_id);

            if (error) {
                throw error;
            }
        })();

        toast.promise(deletePromise, {
            loading: `Removing ${target.material_name}...`,
            success: `${target.material_name} was removed.`,
            error: (error) =>
                error instanceof Error
                    ? error.message
                    : "Unable to remove the material.",
        });

        try {
            await deletePromise;

            setListings((current) =>
                current.filter((item) => item.id !== target.id)
            );

            setDeleteTarget(null);
        } catch {
            // Sonner displays the error.
        } finally {
            setDeletingMaterial(false);
        }
    };


    const clearFilters =
        () => {
            setSearch(
                ""
            );

            setCategoryFilter(
                "all"
            );

            setStatusFilter(
                "all"
            );
        };


    const hasActiveFilters =
        Boolean(
            search.trim()
        ) ||
        categoryFilter !==
        "all" ||
        statusFilter !==
        "all";


    if (
        loading
    ) {
        return (
            <MaterialsPageSkeleton />
        );
    }


    if (
        pageError
    ) {
        return (
            <div className="mx-auto flex min-h-[65vh] max-w-xl items-center justify-center">
                <div className="w-full rounded-[28px] border border-red-100 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <AlertCircle
                            size={
                                30
                            }
                        />
                    </div>


                    <h1 className="mt-5 text-xl font-black text-zinc-900">
                        Materials unavailable
                    </h1>


                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                        {
                            pageError
                        }
                    </p>


                    <Button
                        type="button"
                        onClick={() =>
                            void loadPageData()
                        }
                        className="mt-6 rounded-full bg-green-600 px-6 hover:bg-green-700"
                    >
                        <RefreshCcw className="mr-2 h-4 w-4" />

                        Try again
                    </Button>
                </div>
            </div>
        );
    }


    if (
        !junkshop
    ) {
        return (
            <div className="space-y-6">
                <PageHeader
                    onBack={() =>
                        router.push(
                            "/profiles/recycler"
                        )
                    }
                    onRefresh={() =>
                        void loadPageData(
                            true
                        )
                    }
                    refreshing={
                        refreshing
                    }
                    onAdd={
                        openAddMaterial
                    }
                />


                <section className="overflow-hidden rounded-[32px] border border-green-100 bg-white shadow-sm">
                    <div className="grid lg:grid-cols-[1fr_0.75fr]">
                        <div className="bg-gradient-to-br from-green-600 to-emerald-800 p-8 text-white sm:p-10">
                            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 ring-1 ring-white/20">
                                <Store
                                    size={
                                        31
                                    }
                                />
                            </div>


                            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-green-100">
                                Shop setup required
                            </p>


                            <h2 className="mt-3 text-3xl font-black">
                                Create your junkshop profile first
                            </h2>


                            <p className="mt-4 max-w-xl text-sm leading-7 text-green-50/90">
                                Your accepted materials must belong to a
                                junkshop. Add your shop name, location,
                                contact details, and photo before publishing
                                buying prices.
                            </p>


                            <Button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        "/profiles/recycler"
                                    )
                                }
                                className="mt-7 rounded-full bg-white px-6 text-green-700 hover:bg-green-50"
                            >
                                <Store className="mr-2 h-4 w-4" />

                                Set up junkshop
                            </Button>
                        </div>


                        <div className="flex flex-col justify-center p-8 sm:p-10">
                            <h3 className="font-black text-zinc-900">
                                After setup, you can add:
                            </h3>


                            <div className="mt-5 space-y-4">
                                {[
                                    "Accepted material types",
                                    "Buying price per kilogram",
                                    "Minimum accepted weight",
                                    "Required material condition",
                                    "Preparation instructions",
                                    "Active or paused availability",
                                ].map(
                                    (
                                        item
                                    ) => (
                                        <div
                                            key={
                                                item
                                            }
                                            className="flex items-center gap-3"
                                        >
                                            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />

                                            <p className="text-sm text-zinc-600">
                                                {
                                                    item
                                                }
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        );
    }


    return (
        <>
            <div className="space-y-7">
                <PageHeader
                    onBack={() =>
                        router.push(
                            "/profiles/recycler"
                        )
                    }
                    onRefresh={() =>
                        void loadPageData(
                            true
                        )
                    }
                    refreshing={
                        refreshing
                    }
                    onAdd={
                        openAddMaterial
                    }
                />


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
                                    These listings are connected to your
                                    junkshop profile.
                                </p>
                            </div>
                        </div>


                        <VerificationBadge
                            status={
                                junkshop.verification_status
                            }
                        />
                    </div>
                </section>


                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        title="Total listings"
                        value={
                            listings.length
                        }
                        description="All materials added"
                        icon={
                            PackageCheck
                        }
                    />

                    <SummaryCard
                        title="Actively buying"
                        value={
                            activeCount
                        }
                        description="Visible as accepted"
                        icon={
                            CheckCircle2
                        }
                    />

                    <SummaryCard
                        title="Paused"
                        value={
                            pausedCount
                        }
                        description="Temporarily unavailable"
                        icon={
                            PauseCircle
                        }
                    />

                    <SummaryCard
                        title="Average price"
                        value={formatPeso(
                            averagePrice
                        )}
                        description="Average value per kg"
                        icon={
                            WalletCards
                        }
                    />
                </section>


                <section className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-green-600" />

                        <h2 className="font-black text-zinc-900">
                            Find a listing
                        </h2>
                    </div>


                    <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px_190px_auto]">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                            <Input
                                value={
                                    search
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search material, category, or condition..."
                                className="h-12 rounded-xl border-zinc-200 pl-11 focus-visible:ring-green-500"
                            />
                        </div>


                        <select
                            value={
                                categoryFilter
                            }
                            onChange={(
                                event
                            ) =>
                                setCategoryFilter(
                                    event.target.value
                                )
                            }
                            aria-label="Filter by category"
                            className="h-12 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        >
                            <option value="all">
                                All categories
                            </option>

                            {categories.map(
                                (
                                    category
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
                                )
                            )}
                        </select>


                        <select
                            value={
                                statusFilter
                            }
                            onChange={(
                                event
                            ) =>
                                setStatusFilter(
                                    event.target.value as StatusFilter
                                )
                            }
                            aria-label="Filter by status"
                            className="h-12 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        >
                            <option value="all">
                                All statuses
                            </option>

                            <option value="accepting">
                                Accepting
                            </option>

                            <option value="paused">
                                Paused
                            </option>
                        </select>


                        {hasActiveFilters ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={
                                    clearFilters
                                }
                                className="h-12 rounded-xl border-zinc-200"
                            >
                                <X className="mr-2 h-4 w-4" />

                                Clear
                            </Button>
                        ) : (
                            <div className="hidden lg:block" />
                        )}
                    </div>
                </section>


                <section className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-black text-zinc-900">
                                Material listings
                            </h2>

                            <p className="mt-1 text-sm text-zinc-500">
                                {filteredListings.length ===
                                    listings.length
                                    ? `${listings.length} material ${listings.length ===
                                        1
                                        ? "listing"
                                        : "listings"
                                    }`
                                    : `${filteredListings.length} of ${listings.length} listings shown`}
                            </p>
                        </div>


                        <Button
                            type="button"
                            onClick={
                                openAddMaterial
                            }
                            className="hidden rounded-full bg-green-600 hover:bg-green-700 sm:inline-flex"
                        >
                            <Plus className="mr-2 h-4 w-4" />

                            Add material
                        </Button>
                    </div>


                    {listings.length ===
                        0 ? (
                        <NoListingsState
                            catalogCount={
                                materialCatalog.length
                            }
                            onAdd={
                                openAddMaterial
                            }
                        />
                    ) : filteredListings.length ===
                        0 ? (
                        <FilteredEmptyState
                            onClear={
                                clearFilters
                            }
                        />
                    ) : (
                        <div className="mt-6 space-y-4">
                            {filteredListings.map(
                                (
                                    listing
                                ) => (
                                    <MaterialListingCard
                                        key={
                                            listing.id
                                        }
                                        listing={
                                            listing
                                        }
                                        toggling={
                                            togglingMaterialId ===
                                            listing.id
                                        }
                                        onToggle={() =>
                                            void toggleMaterialStatus(
                                                listing
                                            )
                                        }
                                        onEdit={() =>
                                            openEditMaterial(
                                                listing
                                            )
                                        }
                                        onDelete={() =>
                                            setDeleteTarget(
                                                listing
                                            )
                                        }
                                    />
                                )
                            )}
                        </div>
                    )}
                </section>
            </div>


            <Dialog
                open={materialDialogOpen}
                onOpenChange={closeMaterialDialog}
            >
                <DialogContent
                    className="
            h-[96dvh]
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
            sm:h-auto
            sm:max-h-[92dvh]
            sm:!w-[94vw]
            xl:!w-[1100px]
            xl:rounded-[30px]
        "
                >
                    <DialogHeader className="sr-only">
                        <DialogTitle>
                            {editingMaterial
                                ? "Edit material"
                                : "Add material"}
                        </DialogTitle>

                        <DialogDescription>
                            Configure a material accepted by your junkshop.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={saveMaterial}
                        className="
                grid
                h-full
                min-h-0
                grid-rows-[auto_minmax(0,1fr)_auto]
                bg-white
                sm:h-auto
                sm:max-h-[92dvh]
            "
                    >
                        {/* MODAL HEADER */}

                        <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-green-600 to-emerald-700 px-5 py-5 text-white sm:px-7">
                            <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-white/10" />

                            <div className="relative flex min-w-0 items-start gap-3 pr-10 sm:gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 sm:h-12 sm:w-12">
                                    <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-green-100 sm:text-xs">
                                        Step {dialogStep} of 2
                                    </p>

                                    <h2 className="mt-1 break-words text-lg font-black leading-tight sm:text-2xl">
                                        {editingMaterial
                                            ? "Update material listing"
                                            : "Add an accepted material"}
                                    </h2>

                                    <p className="mt-1 max-w-2xl text-xs leading-5 text-green-50 sm:text-sm">
                                        {dialogStep === 1
                                            ? "Choose the exact material your junkshop currently buys."
                                            : "Set your price, minimum weight, condition, and preparation requirements."}
                                    </p>
                                </div>
                            </div>

                            {/* STEP INDICATOR */}

                            <div className="relative mt-5 grid grid-cols-2 gap-3">
                                <div>
                                    <div className="h-1.5 rounded-full bg-white" />

                                    <p className="mt-2 text-[11px] font-semibold text-white sm:text-xs">
                                        Choose material
                                    </p>
                                </div>

                                <div>
                                    <div
                                        className={`h-1.5 rounded-full ${dialogStep === 2
                                                ? "bg-white"
                                                : "bg-white/30"
                                            }`}
                                    />

                                    <p
                                        className={`mt-2 text-[11px] font-semibold sm:text-xs ${dialogStep === 2
                                                ? "text-white"
                                                : "text-green-100/70"
                                            }`}
                                    >
                                        Price and conditions
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* SINGLE SCROLLABLE CONTENT AREA */}

                        <div className="min-h-0 overflow-y-auto bg-white">
                            <div className="grid min-h-full bg-white xl:grid-cols-[minmax(0,1fr)_360px]">
                                <section className="min-w-0 bg-white p-5 sm:p-7">
                                    {dialogStep === 1 ? (
                                        <MaterialPickerStep
                                            editing={Boolean(editingMaterial)}
                                            categories={categories}
                                            filteredCatalog={filteredCatalog}
                                            search={materialPickerSearch}
                                            category={materialPickerCategory}
                                            selectedMaterialId={
                                                materialForm.material_id
                                            }
                                            onSearchChange={
                                                setMaterialPickerSearch
                                            }
                                            onCategoryChange={
                                                setMaterialPickerCategory
                                            }
                                            onSelect={(materialId) =>
                                                setMaterialForm((current) => ({
                                                    ...current,
                                                    material_id: materialId,
                                                }))
                                            }
                                        />
                                    ) : (
                                        <MaterialDetailsStep
                                            material={selectedCatalogMaterial}
                                            form={materialForm}
                                            onChange={setMaterialForm}
                                        />
                                    )}
                                </section>

                                <MaterialPreview
                                    material={selectedCatalogMaterial}
                                    form={materialForm}
                                />
                            </div>
                        </div>

                        {/* FIXED FOOTER */}

                        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-green-200 bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] sm:px-7 sm:py-4">
                            <Button
                                type="button"
                                variant="ghost"
                                disabled={savingMaterial}
                                onClick={() => {
                                    if (
                                        dialogStep === 2 &&
                                        !editingMaterial
                                    ) {
                                        setDialogStep(1);
                                        return;
                                    }

                                    setMaterialDialogOpen(false);
                                }}
                                className="rounded-full px-3 sm:px-4"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />

                                {dialogStep === 2 && !editingMaterial
                                    ? "Back"
                                    : "Cancel"}
                            </Button>

                            {dialogStep === 1 ? (
                                <Button
                                    type="button"
                                    onClick={continueToDetails}
                                    disabled={!materialForm.material_id}
                                    className="min-w-28 rounded-full bg-green-600 px-5 text-white hover:bg-green-700 disabled:bg-zinc-200 disabled:text-zinc-400 sm:min-w-32 sm:px-6"
                                >
                                    Continue
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={
                                        savingMaterial ||
                                        !materialForm.price_per_kg
                                    }
                                    className="min-w-32 rounded-full bg-green-600 px-5 text-white hover:bg-green-700 disabled:bg-zinc-200 disabled:text-zinc-400 sm:min-w-36 sm:px-6"
                                >
                                    {savingMaterial ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="mr-2 h-4 w-4" />
                                    )}

                                    {savingMaterial
                                        ? "Saving..."
                                        : editingMaterial
                                            ? "Save changes"
                                            : "Add material"}
                                </Button>
                            )}
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => {
                    if (deletingMaterial) {
                        return;
                    }

                    if (!open) {
                        setDeleteTarget(null);
                    }
                }}
            >
                <DialogContent
                    className="
            !w-[calc(100vw-1rem)]
            !max-w-lg
            gap-0
            overflow-hidden
            rounded-[26px]
            border
            border-red-200
            !bg-white
            p-0
            text-zinc-900
            shadow-[0_28px_90px_rgba(0,0,0,0.3)]
            sm:!w-full
            sm:rounded-[28px]
        "
                >
                    <DialogHeader className="sr-only">
                        <DialogTitle>
                            Remove material listing
                        </DialogTitle>

                        <DialogDescription>
                            Permanently remove this material from your
                            junkshop listings.
                        </DialogDescription>
                    </DialogHeader>

                    {/* DELETE HEADER */}

                    <div className="relative overflow-hidden bg-gradient-to-br from-red-600 to-rose-700 px-6 py-6 text-white">
                        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/10" />

                        <div className="relative flex items-start gap-4 pr-8">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                                <Trash2 className="h-6 w-6" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-100">
                                    Permanent action
                                </p>

                                <h2 className="mt-1 text-xl font-black leading-tight sm:text-2xl">
                                    Remove this material?
                                </h2>

                                <p className="mt-1 text-sm leading-5 text-red-50">
                                    This listing will no longer be visible to
                                    residents.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* DELETE CONTENT */}

                    <div className="bg-white p-5 sm:p-6">
                        {deleteTarget && (
                            <>
                                {/* MATERIAL SUMMARY */}

                                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                                            <Package className="h-6 w-6" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="break-words font-black text-zinc-900">
                                                    {deleteTarget.material_name}
                                                </h3>

                                                <Badge
                                                    variant="outline"
                                                    className="border-green-200 bg-green-50 text-green-700"
                                                >
                                                    {deleteTarget.category}
                                                </Badge>
                                            </div>

                                            <p className="mt-2 text-sm text-zinc-500">
                                                This material will be removed from
                                                your accepted-material list.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-200 pt-4">
                                        <div className="rounded-xl bg-white p-3">
                                            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                                                Buying price
                                            </p>

                                            <p className="mt-1 font-black text-green-700">
                                                {formatPeso(
                                                    deleteTarget.price_per_kg
                                                )}

                                                <span className="ml-1 text-xs font-medium text-zinc-500">
                                                    /kg
                                                </span>
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-white p-3">
                                            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                                                Minimum weight
                                            </p>

                                            <p className="mt-1 font-black text-zinc-900">
                                                {deleteTarget.minimum_weight_kg} kg
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center gap-2">
                                        <span
                                            className={`h-2.5 w-2.5 rounded-full ${deleteTarget.is_accepting
                                                    ? "bg-green-600"
                                                    : "bg-zinc-400"
                                                }`}
                                        />

                                        <span className="text-xs font-semibold text-zinc-600">
                                            {deleteTarget.is_accepting
                                                ? "Currently accepting"
                                                : "Currently paused"}
                                        </span>
                                    </div>
                                </div>

                                {/* WARNING */}

                                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                                    <div className="flex gap-3">
                                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                                        <div>
                                            <p className="text-sm font-bold text-red-800">
                                                This cannot be undone
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-red-700">
                                                The price, minimum weight,
                                                material condition, and preparation
                                                instructions for this listing will
                                                be permanently deleted.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* DELETE FOOTER */}

                    <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={deletingMaterial}
                            onClick={() => setDeleteTarget(null)}
                            className="h-11 w-full rounded-full border-zinc-300 bg-white sm:w-auto sm:min-w-28"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            disabled={deletingMaterial}
                            onClick={() => void confirmDeleteMaterial()}
                            className="h-11 w-full rounded-full bg-red-600 px-6 text-white hover:bg-red-700 disabled:bg-red-300 sm:w-auto sm:min-w-44"
                        >
                            {deletingMaterial ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                                    Removing...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />

                                    Remove material
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}


function PageHeader({
    onBack,
    onRefresh,
    refreshing,
    onAdd,
}: {
    onBack: () => void;
    onRefresh: () => void;
    refreshing: boolean;
    onAdd: () => void;
}) {
    return (
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
                <button
                    type="button"
                    onClick={
                        onBack
                    }
                    className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-green-700"
                >
                    <ArrowLeft className="h-4 w-4" />

                    Recycler dashboard
                </button>


                <p className="text-sm font-bold text-green-600">
                    Material management
                </p>


                <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
                    Accepted materials
                </h1>


                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                    Publish what your junkshop buys, your local price per
                    kilogram, and the condition residents must follow.
                </p>
            </div>


            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    disabled={
                        refreshing
                    }
                    onClick={
                        onRefresh
                    }
                    className="rounded-full border-green-200 bg-white hover:bg-green-50 hover:text-green-700"
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
                    onClick={
                        onAdd
                    }
                    className="rounded-full bg-green-600 hover:bg-green-700"
                >
                    <Plus className="mr-2 h-4 w-4" />

                    Add material
                </Button>
            </div>
        </section>
    );
}


function VerificationBadge({
    status,
}: {
    status: Junkshop["verification_status"];
}) {
    if (
        status ===
        "approved"
    ) {
        return (
            <Badge className="w-fit border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />

                Verified partner
            </Badge>
        );
    }


    if (
        status ===
        "rejected"
    ) {
        return (
            <Badge className="w-fit border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
                <AlertCircle className="mr-1.5 h-3.5 w-3.5" />

                Needs correction
            </Badge>
        );
    }


    if (
        status ===
        "suspended"
    ) {
        return (
            <Badge className="w-fit border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-50">
                <PauseCircle className="mr-1.5 h-3.5 w-3.5" />

                Suspended
            </Badge>
        );
    }


    return (
        <Badge className="w-fit border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
            <Info className="mr-1.5 h-3.5 w-3.5" />

            Pending verification
        </Badge>
    );
}


function SummaryCard({
    title,
    value,
    description,
    icon: Icon,
}: {
    title: string;
    value: string | number;
    description: string;
    icon: ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <div className="rounded-[24px] border border-green-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-500">
                        {
                            title
                        }
                    </p>

                    <p className="mt-2 truncate text-2xl font-black text-zinc-900">
                        {
                            value
                        }
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                        {
                            description
                        }
                    </p>
                </div>


                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}


function MaterialListingCard({
    listing,
    toggling,
    onToggle,
    onEdit,
    onDelete,
}: {
    listing: JunkshopMaterial;
    toggling: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <article className="rounded-[24px] border border-zinc-100 bg-white p-4 transition hover:border-green-200 hover:shadow-sm sm:p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 gap-4">
                    <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                        <Package className="h-6 w-6" />
                    </div>


                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-zinc-900">
                                {
                                    listing.material_name
                                }
                            </h3>


                            <Badge
                                variant="secondary"
                                className="bg-zinc-100 text-zinc-600"
                            >
                                {
                                    listing.category
                                }
                            </Badge>


                            <Badge
                                variant="outline"
                                className={
                                    listing.is_accepting
                                        ? "border-green-200 bg-green-50 text-green-700"
                                        : "border-zinc-200 bg-zinc-50 text-zinc-500"
                                }
                            >
                                {listing.is_accepting
                                    ? "Accepting"
                                    : "Paused"}
                            </Badge>
                        </div>


                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                            <div className="flex items-center gap-2 text-zinc-500">
                                <CircleDollarSign className="h-4 w-4 text-green-600" />

                                <span>
                                    <strong className="font-black text-green-700">
                                        {formatPeso(
                                            listing.price_per_kg
                                        )}
                                    </strong>{" "}
                                    per kg
                                </span>
                            </div>


                            <div className="flex items-center gap-2 text-zinc-500">
                                <Scale className="h-4 w-4 text-green-600" />

                                <span>
                                    Minimum{" "}
                                    <strong className="text-zinc-700">
                                        {
                                            listing.minimum_weight_kg
                                        }{" "}
                                        kg
                                    </strong>
                                </span>
                            </div>
                        </div>


                        {listing.accepted_condition && (
                            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">
                                <span className="font-semibold text-zinc-700">
                                    Required condition:
                                </span>{" "}
                                {
                                    listing.accepted_condition
                                }
                            </p>
                        )}


                        {listing.preparation_instructions && (
                            <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">
                                <span className="font-semibold text-zinc-700">
                                    Preparation:
                                </span>{" "}
                                {
                                    listing.preparation_instructions
                                }
                            </p>
                        )}
                    </div>
                </div>


                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4 lg:shrink-0 lg:justify-end lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                    <button
                        type="button"
                        role="switch"
                        aria-checked={
                            listing.is_accepting
                        }
                        aria-label={`Toggle ${listing.material_name}`}
                        disabled={
                            toggling
                        }
                        onClick={
                            onToggle
                        }
                        className={`relative h-7 w-12 rounded-full transition ${listing.is_accepting
                            ? "bg-green-600"
                            : "bg-zinc-300"
                            } ${toggling
                                ? "cursor-wait opacity-60"
                                : ""
                            }`}
                    >
                        <span
                            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${listing.is_accepting
                                ? "left-6"
                                : "left-1"
                                }`}
                        />
                    </button>


                    <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={
                            onEdit
                        }
                        aria-label={`Edit ${listing.material_name}`}
                        className="rounded-full border-green-100 text-green-700 hover:bg-green-50"
                    >
                        <Edit3 className="h-4 w-4" />
                    </Button>


                    <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={
                            onDelete
                        }
                        aria-label={`Remove ${listing.material_name}`}
                        className="rounded-full border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </article>
    );
}


function NoListingsState({
    catalogCount,
    onAdd,
}: {
    catalogCount: number;
    onAdd: () => void;
}) {
    return (
        <div className="mt-6 flex flex-col items-center rounded-[26px] border border-dashed border-green-200 bg-green-50/60 px-6 py-14 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-green-600 shadow-sm">
                <PackageCheck className="h-7 w-7" />
            </div>


            <h3 className="mt-5 text-lg font-black text-zinc-900">
                No accepted materials yet
            </h3>


            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                {catalogCount >
                    0
                    ? "Add the first material your junkshop buys. Include your price, minimum weight, and required condition."
                    : "The central material catalog is currently empty. Add records to the materials table before creating junkshop listings."}
            </p>


            {catalogCount >
                0 && (
                    <Button
                        type="button"
                        onClick={
                            onAdd
                        }
                        className="mt-6 rounded-full bg-green-600 hover:bg-green-700"
                    >
                        <Plus className="mr-2 h-4 w-4" />

                        Add first material
                    </Button>
                )}
        </div>
    );
}


function FilteredEmptyState({
    onClear,
}: {
    onClear: () => void;
}) {
    return (
        <div className="mt-6 flex flex-col items-center rounded-[26px] border border-dashed border-zinc-200 px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                <Search className="h-6 w-6" />
            </div>


            <h3 className="mt-4 font-black text-zinc-900">
                No matching materials
            </h3>


            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                Try another search term or remove one of the active filters.
            </p>


            <Button
                type="button"
                variant="outline"
                onClick={
                    onClear
                }
                className="mt-5 rounded-full"
            >
                <X className="mr-2 h-4 w-4" />

                Clear filters
            </Button>
        </div>
    );
}


function MaterialPickerStep({
    editing,
    categories,
    filteredCatalog,
    search,
    category,
    selectedMaterialId,
    onSearchChange,
    onCategoryChange,
    onSelect,
}: {
    editing: boolean;
    categories: string[];
    filteredCatalog: Material[];
    search: string;
    category: string;
    selectedMaterialId: string;
    onSearchChange: (value: string) => void;
    onCategoryChange: (value: string) => void;
    onSelect: (materialId: string) => void;
}) {
    return (
        <div className="space-y-6 bg-white">
            <div>
                <h3 className="text-xl font-black text-zinc-900">
                    Choose the exact material
                </h3>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                    Select the specific material your junkshop buys.
                    Materials within the same category may have
                    different local prices.
                </p>
            </div>

            {!editing && (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                            <Input
                                value={search}
                                onChange={(event) =>
                                    onSearchChange(event.target.value)
                                }
                                placeholder="Search material or category"
                                className="h-12 w-full rounded-xl border-zinc-300 bg-white pl-11 pr-11 text-zinc-900 focus-visible:ring-green-500"
                            />

                            {search && (
                                <button
                                    type="button"
                                    aria-label="Clear material search"
                                    onClick={() => onSearchChange("")}
                                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <select
                            value={category}
                            onChange={(event) =>
                                onCategoryChange(event.target.value)
                            }
                            aria-label="Filter materials by category"
                            className="h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        >
                            <option value="all">
                                All categories
                            </option>

                            {categories.map((item) => (
                                <option
                                    key={item}
                                    value={item}
                                >
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {filteredCatalog.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm">
                        <Package className="h-7 w-7" />
                    </div>

                    <p className="mt-4 font-black text-zinc-900">
                        No available materials
                    </p>

                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                        Try another search or category. The material
                        may already be listed in your junkshop.
                    </p>

                    {(search || category !== "all") && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                onSearchChange("");
                                onCategoryChange("all");
                            }}
                            className="mt-5 rounded-full"
                        >
                            <X className="mr-2 h-4 w-4" />

                            Clear search
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {filteredCatalog.map((material) => {
                        const selected =
                            selectedMaterialId === material.id;

                        return (
                            <button
                                key={material.id}
                                type="button"
                                disabled={editing && !selected}
                                onClick={() => onSelect(material.id)}
                                className={`relative min-h-[170px] rounded-2xl border bg-white p-5 text-left transition ${selected
                                        ? "border-green-600 ring-2 ring-green-600/15 shadow-sm"
                                        : "border-zinc-200 hover:border-green-400 hover:shadow-sm"
                                    } ${editing && !selected
                                        ? "cursor-not-allowed opacity-40"
                                        : ""
                                    }`}
                            >
                                {selected && (
                                    <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white shadow-sm">
                                        <Check className="h-4 w-4" />
                                    </div>
                                )}

                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                                    <Package className="h-5 w-5" />
                                </div>

                                <p className="mt-4 pr-10 text-base font-black leading-5 text-zinc-900">
                                    {material.material_name}
                                </p>

                                <Badge
                                    variant="outline"
                                    className="mt-2 border-green-200 bg-green-50 text-green-700"
                                >
                                    {material.category}
                                </Badge>

                                <p className="mt-3 line-clamp-2 text-xs leading-5 text-zinc-500">
                                    {material.selling_information ||
                                        "Select this material to set your local price and acceptance requirements."}
                                </p>

                                {selected && (
                                    <p className="mt-3 text-xs font-bold text-green-700">
                                        Selected material
                                    </p>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


function MaterialDetailsStep({
    material,
    form,
    onChange,
}: {
    material: Material | null;
    form: MaterialForm;
    onChange: Dispatch<SetStateAction<MaterialForm>>;
}) {
    return (
        <div className="space-y-6 bg-white">
            <div>
                <h3 className="text-xl font-black text-zinc-900">
                    Set your local buying requirements
                </h3>

                <p className="mt-1 text-sm leading-6 text-zinc-500">
                    Enter the price and requirements residents should
                    know before visiting your junkshop.
                </p>
            </div>

            {/* SELECTED MATERIAL */}

            <div className="flex items-center gap-4 rounded-2xl border border-green-200 bg-green-50 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-green-700 shadow-sm">
                    <Package className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                        Selected material
                    </p>

                    <p className="mt-1 truncate font-black text-zinc-900">
                        {material?.material_name ||
                            "No material selected"}
                    </p>

                    <p className="mt-0.5 text-xs text-zinc-500">
                        {material?.category ||
                            "Material category"}
                    </p>
                </div>
            </div>

            {/* PRICE AND WEIGHT */}

            <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="price_per_kg">
                        Price per kilogram{" "}
                        <span className="text-red-500">*</span>
                    </Label>

                    <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-green-700">
                            ₱
                        </span>

                        <Input
                            id="price_per_kg"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.price_per_kg}
                            onChange={(event) =>
                                onChange((current) => ({
                                    ...current,
                                    price_per_kg:
                                        event.target.value,
                                }))
                            }
                            placeholder="20.00"
                            className="h-12 rounded-xl border-zinc-300 bg-white pl-9 text-zinc-900 focus-visible:ring-green-500"
                            required
                        />
                    </div>

                    <p className="text-xs text-zinc-500">
                        Amount your junkshop pays for one kilogram.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="minimum_weight_kg">
                        Minimum accepted weight
                    </Label>

                    <div className="relative">
                        <Input
                            id="minimum_weight_kg"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.minimum_weight_kg}
                            onChange={(event) =>
                                onChange((current) => ({
                                    ...current,
                                    minimum_weight_kg:
                                        event.target.value,
                                }))
                            }
                            placeholder="0"
                            className="h-12 rounded-xl border-zinc-300 bg-white pr-12 text-zinc-900 focus-visible:ring-green-500"
                        />

                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                            kg
                        </span>
                    </div>

                    <p className="text-xs text-zinc-500">
                        Enter zero when there is no minimum.
                    </p>
                </div>
            </div>

            {/* CONDITION */}

            <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="accepted_condition">
                        Required material condition
                    </Label>

                    <span className="text-xs text-zinc-400">
                        {form.accepted_condition.length}/250
                    </span>
                </div>

                <Textarea
                    id="accepted_condition"
                    maxLength={250}
                    value={form.accepted_condition}
                    onChange={(event) =>
                        onChange((current) => ({
                            ...current,
                            accepted_condition:
                                event.target.value,
                        }))
                    }
                    placeholder="Example: Clean, dry, sorted, and without remaining liquid."
                    rows={4}
                    className="min-h-28 resize-none rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
                />

                <p className="text-xs leading-5 text-zinc-500">
                    Explain the condition required before your
                    junkshop accepts the material.
                </p>
            </div>

            {/* PREPARATION */}

            <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="preparation_instructions">
                        Preparation instructions
                    </Label>

                    <span className="text-xs text-zinc-400">
                        {form.preparation_instructions.length}/300
                    </span>
                </div>

                <Textarea
                    id="preparation_instructions"
                    maxLength={300}
                    value={form.preparation_instructions}
                    onChange={(event) =>
                        onChange((current) => ({
                            ...current,
                            preparation_instructions:
                                event.target.value,
                        }))
                    }
                    placeholder="Example: Remove caps, rinse the bottles, and place them in a separate sack."
                    rows={4}
                    className="min-h-28 resize-none rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
                />

                <p className="text-xs leading-5 text-zinc-500">
                    Tell residents how to clean, sort, flatten, or
                    package the material.
                </p>
            </div>

            {/* AVAILABILITY */}

            <div className="flex items-center justify-between gap-5 rounded-2xl border border-green-200 bg-green-50 p-4 sm:p-5">
                <div>
                    <p className="font-black text-zinc-900">
                        Currently accepting
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                        Disable this when your junkshop temporarily
                        stops buying this material.
                    </p>
                </div>

                <button
                    type="button"
                    role="switch"
                    aria-checked={form.is_accepting}
                    aria-label="Toggle material availability"
                    onClick={() =>
                        onChange((current) => ({
                            ...current,
                            is_accepting:
                                !current.is_accepting,
                        }))
                    }
                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${form.is_accepting
                            ? "bg-green-600"
                            : "bg-zinc-300"
                        }`}
                >
                    <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${form.is_accepting
                                ? "left-6"
                                : "left-1"
                            }`}
                    />
                </button>
            </div>

            {/* MOBILE-ONLY SUMMARY */}

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 xl:hidden">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    Listing summary
                </p>

                <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                        <p className="text-xs text-zinc-500">
                            Buying price
                        </p>

                        <p className="mt-1 font-black text-green-700">
                            {form.price_per_kg
                                ? formatPeso(
                                    Number(form.price_per_kg)
                                )
                                : "₱0.00"}

                            <span className="ml-1 text-xs font-medium text-zinc-500">
                                /kg
                            </span>
                        </p>
                    </div>

                    <div className="rounded-xl bg-white p-3 shadow-sm">
                        <p className="text-xs text-zinc-500">
                            Minimum
                        </p>

                        <p className="mt-1 font-black text-zinc-900">
                            {form.minimum_weight_kg || "0"} kg
                        </p>
                    </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs">
                    <span
                        className={`h-2.5 w-2.5 rounded-full ${form.is_accepting
                                ? "bg-green-600"
                                : "bg-zinc-400"
                            }`}
                    />

                    <span className="font-semibold text-zinc-600">
                        {form.is_accepting
                            ? "Currently accepting"
                            : "Temporarily paused"}
                    </span>
                </div>
            </div>
        </div>
    );
}

function MaterialPreview({
    material,
    form,
}: {
    material: Material | null;
    form: MaterialForm;
}) {
    const price = Number(form.price_per_kg);

    const minimumWeight = Number(
        form.minimum_weight_kg
    );

    return (
        <aside className="hidden border-l border-green-100 bg-green-50 p-6 xl:sticky xl:top-0 xl:block xl:self-start">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Resident preview
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
                This is how the listing may appear when residents
                search for a recovery partner.
            </p>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-green-200 bg-white shadow-sm">
                <div className="relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-800 p-6 text-white">
                    <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />

                    <div className="relative">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                            <Package className="h-6 w-6" />
                        </div>

                        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-green-100">
                            {material?.category ||
                                "Material category"}
                        </p>

                        <h3 className="mt-1 break-words text-xl font-black leading-tight">
                            {material?.material_name ||
                                "Select a material"}
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                        Local buying price
                    </p>

                    <p className="mt-1 text-3xl font-black text-green-700">
                        {Number.isFinite(price) &&
                            form.price_per_kg !== ""
                            ? formatPeso(price)
                            : "₱0.00"}

                        <span className="ml-1 text-sm font-semibold text-zinc-500">
                            /kg
                        </span>
                    </p>

                    <div className="mt-5 space-y-4 border-t border-zinc-100 pt-5">
                        <PreviewInformation
                            icon={Scale}
                            label="Minimum weight"
                            value={`${Number.isFinite(minimumWeight)
                                    ? minimumWeight
                                    : 0
                                } kg`}
                        />

                        <PreviewInformation
                            icon={CheckCircle2}
                            label="Required condition"
                            value={
                                form.accepted_condition ||
                                "No condition provided."
                            }
                        />

                        <PreviewInformation
                            icon={Info}
                            label="Preparation"
                            value={
                                form.preparation_instructions ||
                                "No instructions provided."
                            }
                        />
                    </div>

                    <Badge
                        variant="outline"
                        className={
                            form.is_accepting
                                ? "mt-5 border-green-200 bg-green-50 text-green-700"
                                : "mt-5 border-zinc-200 bg-zinc-50 text-zinc-500"
                        }
                    >
                        {form.is_accepting
                            ? "Currently accepting"
                            : "Temporarily paused"}
                    </Badge>
                </div>
            </div>

            <div className="mt-4 rounded-2xl border border-green-100 bg-white p-4">
                <div className="flex gap-3">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />

                    <p className="text-xs leading-5 text-zinc-500">
                        The actual amount may still depend on the
                        measured weight, cleanliness, sorting, and
                        material quality.
                    </p>
                </div>
            </div>
        </aside>
    );
}

function MaterialsPageSkeleton() {
    return (
        <div className="space-y-7">
            <div className="flex justify-between gap-4">
                <div className="space-y-3">
                    <Skeleton className="h-4 w-36 bg-green-100" />

                    <Skeleton className="h-9 w-72 max-w-full bg-green-100" />

                    <Skeleton className="h-4 w-96 max-w-full bg-green-100" />
                </div>


                <Skeleton className="hidden h-10 w-32 rounded-full bg-green-100 sm:block" />
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
                            key={
                                index
                            }
                            className="h-32 rounded-[24px] bg-green-100"
                        />
                    )
                )}
            </div>


            <Skeleton className="h-28 rounded-[28px] bg-green-100" />


            <div className="rounded-[28px] border border-green-100 bg-white p-6">
                <Skeleton className="h-7 w-52 bg-green-100" />

                <Skeleton className="mt-2 h-4 w-72 max-w-full bg-green-100" />


                <div className="mt-6 space-y-4">
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
            </div>
        </div>
    );
}