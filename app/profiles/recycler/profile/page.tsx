"use client";

import type {
    ChangeEvent,
    ComponentType,
    FormEvent,
} from "react";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { useRouter } from "next/navigation";

import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    BadgeCheck,
    Building2,
    CalendarDays,
    Camera,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Edit3,
    ExternalLink,
    ImagePlus,
    Loader2,
    LockKeyhole,
    Mail,
    MapPin,
    PackageCheck,
    Phone,
    Plus,
    Power,
    RefreshCcw,
    ShieldCheck,
    Store,
    UploadCloud,
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


/* =========================================================
   TYPES
========================================================= */

interface Profile {
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
    latitude: number | null;
    longitude: number | null;
    contact_number: string | null;
    contact_email: string | null;
    operating_hours: OperatingHours | null;

    verification_status:
        | "pending"
        | "approved"
        | "rejected"
        | "suspended";

    is_active: boolean;
    created_at: string;
    updated_at: string;
}


interface MaterialRelation {
    id: string;
    material_name: string;
    category: string;
}


interface JunkshopMaterialRow {
    id: string;
    material_id: string;

    price_per_kg:
        | number
        | string;

    minimum_weight_kg:
        | number
        | string;

    accepted_condition: string | null;
    preparation_instructions: string | null;
    is_accepting: boolean;
    updated_at: string;

    materials:
        | MaterialRelation
        | MaterialRelation[]
        | null;
}


interface AcceptedMaterial {
    id: string;
    material_id: string;
    material_name: string;
    category: string;
    price_per_kg: number;
    minimum_weight_kg: number;
    accepted_condition: string | null;
    preparation_instructions: string | null;
    is_accepting: boolean;
    updated_at: string;
}


interface AccountForm {
    full_name: string;
    barangay: string;
    city: string;
    province: string;
    avatar_file: File | null;
}


interface JunkshopForm {
    junkshop_name: string;
    description: string;
    address_line: string;
    barangay: string;
    city: string;
    province: string;
    postal_code: string;
    contact_number: string;
    contact_email: string;
    open_days: string[];
    opening_time: string;
    closing_time: string;
    photo_file: File | null;
}


interface CompressionOptions {
    maximumDimension: number;
    targetBytes: number;
    filenamePrefix: string;
}


/* =========================================================
   CONSTANTS
========================================================= */

const weekDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];


const shopSteps = [
    {
        number: 1,
        title: "Shop identity",
        description:
            "Add the business name, photo, description, and contact details.",
    },
    {
        number: 2,
        title: "Location and hours",
        description:
            "Provide an address and operating schedule residents can follow.",
    },
    {
        number: 3,
        title: "Review",
        description:
            "Review the information before saving the public profile.",
    },
];


const SUPPORTED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];


const MAXIMUM_SOURCE_IMAGE_BYTES =
    15 * 1024 * 1024;


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


/* =========================================================
   GENERAL HELPERS
========================================================= */

function formatPeso(
    value: number
) {
    return pesoFormatter.format(
        Number.isFinite(value)
            ? value
            : 0
    );
}


function formatFileSize(
    bytes: number
) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (
        bytes <
        1024 * 1024
    ) {
        return `${Math.round(
            bytes / 1024
        )} KB`;
    }

    return `${(
        bytes /
        (1024 * 1024)
    ).toFixed(1)} MB`;
}


function formatMemberSince(
    createdAt: string
) {
    return new Date(
        createdAt
    ).toLocaleDateString(
        "en-PH",
        {
            month: "long",
            year: "numeric",
        }
    );
}


function getInitials(
    name: string
) {
    return name
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


function formatOperatingHours(
    operatingHours:
        | OperatingHours
        | null
) {
    if (
        !operatingHours?.days ||
        operatingHours.days.length === 0
    ) {
        return "Schedule not provided";
    }

    const timeRange =
        operatingHours.opens &&
        operatingHours.closes
            ? `${operatingHours.opens}–${operatingHours.closes}`
            : "Hours not provided";

    return `${operatingHours.days.length} open days · ${timeRange}`;
}


function getStoragePathFromPublicUrl(
    url: string | null,
    bucket: string
) {
    if (!url) {
        return null;
    }

    const marker =
        `/storage/v1/object/public/${bucket}/`;

    const markerIndex =
        url.indexOf(
            marker
        );

    if (
        markerIndex === -1
    ) {
        return null;
    }

    return decodeURIComponent(
        url.slice(
            markerIndex +
            marker.length
        )
    );
}


function emptyAccountForm(
    profile: Profile | null
): AccountForm {
    return {
        full_name:
            profile?.full_name ??
            "",

        barangay:
            profile?.barangay ??
            "",

        city:
            profile?.city ??
            "",

        province:
            profile?.province ??
            "",

        avatar_file:
            null,
    };
}


function emptyJunkshopForm(
    profile: Profile | null
): JunkshopForm {
    return {
        junkshop_name:
            "",

        description:
            "",

        address_line:
            "",

        barangay:
            profile?.barangay ??
            "",

        city:
            profile?.city ??
            "",

        province:
            profile?.province ??
            "",

        postal_code:
            "",

        contact_number:
            "",

        contact_email:
            profile?.email ??
            "",

        open_days: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ],

        opening_time:
            "08:00",

        closing_time:
            "17:00",

        photo_file:
            null,
    };
}


/* =========================================================
   IMAGE COMPRESSION
========================================================= */

function loadImageFile(
    file: File
): Promise<HTMLImageElement> {
    return new Promise(
        (
            resolve,
            reject
        ) => {
            const image =
                new Image();

            const objectUrl =
                URL.createObjectURL(
                    file
                );

            image.onload =
                () => {
                    URL.revokeObjectURL(
                        objectUrl
                    );

                    resolve(
                        image
                    );
                };

            image.onerror =
                () => {
                    URL.revokeObjectURL(
                        objectUrl
                    );

                    reject(
                        new Error(
                            "The selected image could not be processed."
                        )
                    );
                };

            image.src =
                objectUrl;
        }
    );
}


function canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string,
    quality: number
): Promise<Blob> {
    return new Promise(
        (
            resolve,
            reject
        ) => {
            canvas.toBlob(
                (
                    blob
                ) => {
                    if (!blob) {
                        reject(
                            new Error(
                                "The image could not be compressed."
                            )
                        );

                        return;
                    }

                    resolve(
                        blob
                    );
                },
                type,
                quality
            );
        }
    );
}


async function compressImageBeforeUpload(
    file: File,
    options: CompressionOptions
): Promise<File> {
    if (
        !SUPPORTED_IMAGE_TYPES.includes(
            file.type
        )
    ) {
        throw new Error(
            "Select a JPG, PNG, or WebP image."
        );
    }

    if (
        file.size >
        MAXIMUM_SOURCE_IMAGE_BYTES
    ) {
        throw new Error(
            "The original image must not exceed 15 MB."
        );
    }

    const image =
        await loadImageFile(
            file
        );

    const originalWidth =
        image.naturalWidth;

    const originalHeight =
        image.naturalHeight;

    if (
        !originalWidth ||
        !originalHeight
    ) {
        throw new Error(
            "The selected image has invalid dimensions."
        );
    }

    const initialScale =
        Math.min(
            1,
            options.maximumDimension /
                originalWidth,
            options.maximumDimension /
                originalHeight
        );

    let outputWidth =
        Math.max(
            1,
            Math.round(
                originalWidth *
                    initialScale
            )
        );

    let outputHeight =
        Math.max(
            1,
            Math.round(
                originalHeight *
                    initialScale
            )
        );

    let quality =
        0.84;

    let compressedBlob:
        | Blob
        | null = null;

    for (
        let attempt = 0;
        attempt < 8;
        attempt += 1
    ) {
        const canvas =
            document.createElement(
                "canvas"
            );

        canvas.width =
            outputWidth;

        canvas.height =
            outputHeight;

        const context =
            canvas.getContext(
                "2d"
            );

        if (!context) {
            throw new Error(
                "Your browser could not prepare the image."
            );
        }

        context.imageSmoothingEnabled =
            true;

        context.imageSmoothingQuality =
            "high";

        context.drawImage(
            image,
            0,
            0,
            outputWidth,
            outputHeight
        );

        compressedBlob =
            await canvasToBlob(
                canvas,
                "image/webp",
                quality
            );

        if (
            compressedBlob.size <=
            options.targetBytes
        ) {
            break;
        }

        if (
            quality >
            0.6
        ) {
            quality -=
                0.07;
        } else {
            outputWidth =
                Math.max(
                    480,
                    Math.round(
                        outputWidth *
                            0.86
                    )
                );

            outputHeight =
                Math.max(
                    480,
                    Math.round(
                        outputHeight *
                            0.86
                    )
                );
        }
    }

    if (!compressedBlob) {
        throw new Error(
            "Image compression failed."
        );
    }

    return new File(
        [
            compressedBlob,
        ],
        `${options.filenamePrefix}-${crypto.randomUUID()}.webp`,
        {
            type:
                "image/webp",

            lastModified:
                Date.now(),
        }
    );
}


/* =========================================================
   VERIFICATION HELPERS
========================================================= */

function verificationDetails(
    status:
        Junkshop["verification_status"]
) {
    switch (status) {
        case "approved":
            return {
                label:
                    "Verified partner",

                title:
                    "Your junkshop is visible to residents",

                description:
                    "Residents can discover the shop when its accepted materials match their needs.",

                icon:
                    BadgeCheck,

                badgeClass:
                    "border-green-200 bg-green-50 text-green-700",

                panelClass:
                    "border-green-200 bg-green-50",

                iconClass:
                    "bg-green-100 text-green-700",
            };

        case "rejected":
            return {
                label:
                    "Needs correction",

                title:
                    "Your verification was not approved",

                description:
                    "Review the business details and correct any incomplete or inaccurate information.",

                icon:
                    AlertCircle,

                badgeClass:
                    "border-red-200 bg-red-50 text-red-700",

                panelClass:
                    "border-red-200 bg-red-50",

                iconClass:
                    "bg-red-100 text-red-700",
            };

        case "suspended":
            return {
                label:
                    "Suspended",

                title:
                    "Your public listing is suspended",

                description:
                    "The junkshop is temporarily unavailable to residents. Contact the administrator for assistance.",

                icon:
                    AlertCircle,

                badgeClass:
                    "border-orange-200 bg-orange-50 text-orange-700",

                panelClass:
                    "border-orange-200 bg-orange-50",

                iconClass:
                    "bg-orange-100 text-orange-700",
            };

        default:
            return {
                label:
                    "Pending verification",

                title:
                    "Your junkshop is being reviewed",

                description:
                    "You may complete the profile and add materials while waiting for approval.",

                icon:
                    Clock3,

                badgeClass:
                    "border-amber-200 bg-amber-50 text-amber-700",

                panelClass:
                    "border-amber-200 bg-amber-50",

                iconClass:
                    "bg-amber-100 text-amber-700",
            };
    }
}


/* =========================================================
   PAGE
========================================================= */

export default function RecyclerProfilePage() {
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
        junkshop,
        setJunkshop,
    ] =
        useState<Junkshop | null>(
            null
        );

    const [
        acceptedMaterials,
        setAcceptedMaterials,
    ] =
        useState<AcceptedMaterial[]>(
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


    /* Account dialog */

    const [
        accountDialogOpen,
        setAccountDialogOpen,
    ] =
        useState(
            false
        );

    const [
        accountForm,
        setAccountForm,
    ] =
        useState<AccountForm>(
            emptyAccountForm(
                null
            )
        );

    const [
        avatarPreview,
        setAvatarPreview,
    ] =
        useState<string | null>(
            null
        );

    const [
        compressingAvatar,
        setCompressingAvatar,
    ] =
        useState(
            false
        );

    const [
        savingAccount,
        setSavingAccount,
    ] =
        useState(
            false
        );


    /* Junkshop dialog */

    const [
        shopDialogOpen,
        setShopDialogOpen,
    ] =
        useState(
            false
        );

    const [
        currentShopStep,
        setCurrentShopStep,
    ] =
        useState(
            1
        );

    const [
        shopForm,
        setShopForm,
    ] =
        useState<JunkshopForm>(
            emptyJunkshopForm(
                null
            )
        );

    const [
        shopPhotoPreview,
        setShopPhotoPreview,
    ] =
        useState<string | null>(
            null
        );

    const [
        compressingShopPhoto,
        setCompressingShopPhoto,
    ] =
        useState(
            false
        );

    const [
        savingShop,
        setSavingShop,
    ] =
        useState(
            false
        );

    const [
        changingVisibility,
        setChangingVisibility,
    ] =
        useState(
            false
        );


    /* =====================================================
       LOAD DATA
    ===================================================== */

    const loadProfilePage =
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
                            "This page is only available to recycler partners."
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
                                latitude,
                                longitude,
                                contact_number,
                                contact_email,
                                operating_hours,
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
                        setAcceptedMaterials(
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
                                id,
                                material_id,
                                price_per_kg,
                                minimum_weight_kg,
                                accepted_condition,
                                preparation_instructions,
                                is_accepting,
                                updated_at,
                                materials (
                                    id,
                                    material_name,
                                    category
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
                        materialError
                    ) {
                        throw materialError;
                    }

                    const normalized =
                        (
                            (
                                materialRows ??
                                []
                            ) as JunkshopMaterialRow[]
                        ).map(
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

                                    material_id:
                                        row.material_id,

                                    material_name:
                                        material?.material_name ??
                                        "Unnamed material",

                                    category:
                                        material?.category ??
                                        "Other",

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

                                    updated_at:
                                        row.updated_at,
                                };
                            }
                        );

                    setAcceptedMaterials(
                        normalized
                    );
                } catch (error) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : "Unable to load the recycler profile.";

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


    useEffect(
        () => {
            void loadProfilePage();
        },
        [
            loadProfilePage,
        ]
    );


    useEffect(
        () => {
            return () => {
                if (
                    avatarPreview?.startsWith(
                        "blob:"
                    )
                ) {
                    URL.revokeObjectURL(
                        avatarPreview
                    );
                }
            };
        },
        [
            avatarPreview,
        ]
    );


    useEffect(
        () => {
            return () => {
                if (
                    shopPhotoPreview?.startsWith(
                        "blob:"
                    )
                ) {
                    URL.revokeObjectURL(
                        shopPhotoPreview
                    );
                }
            };
        },
        [
            shopPhotoPreview,
        ]
    );


    /* =====================================================
       IMAGE UPLOAD
    ===================================================== */

    const uploadPublicImage =
        async ({
            bucket,
            folder,
            file,
        }: {
            bucket: string;
            folder: string;
            file: File;
        }) => {
            const path =
                `${folder}/${crypto.randomUUID()}.webp`;

            const {
                error,
            } =
                await supabase.storage
                    .from(
                        bucket
                    )
                    .upload(
                        path,
                        file,
                        {
                            cacheControl:
                                "31536000",

                            contentType:
                                "image/webp",

                            upsert:
                                false,
                        }
                    );

            if (error) {
                throw error;
            }

            const {
                data,
            } =
                supabase.storage
                    .from(
                        bucket
                    )
                    .getPublicUrl(
                        path
                    );

            return {
                path,
                publicUrl:
                    data.publicUrl,
            };
        };


    /* =====================================================
       ACCOUNT ACTIONS
    ===================================================== */

    const openAccountDialog =
        () => {
            if (!profile) {
                return;
            }

            setAccountForm(
                emptyAccountForm(
                    profile
                )
            );

            setAvatarPreview(
                profile.avatar_url
            );

            setAccountDialogOpen(
                true
            );
        };


    const handleAvatarChange =
        async (
            event:
                ChangeEvent<HTMLInputElement>
        ) => {
            const input =
                event.currentTarget;

            const selectedFile =
                input.files?.[0];

            input.value =
                "";

            if (
                !selectedFile
            ) {
                return;
            }

            setCompressingAvatar(
                true
            );

            try {
                const compressedFile =
                    await compressImageBeforeUpload(
                        selectedFile,
                        {
                            maximumDimension:
                                720,

                            targetBytes:
                                450 *
                                1024,

                            filenamePrefix:
                                "profile",
                        }
                    );

                if (
                    avatarPreview?.startsWith(
                        "blob:"
                    )
                ) {
                    URL.revokeObjectURL(
                        avatarPreview
                    );
                }

                const previewUrl =
                    URL.createObjectURL(
                        compressedFile
                    );

                setAccountForm(
                    (
                        current
                    ) => ({
                        ...current,
                        avatar_file:
                            compressedFile,
                    })
                );

                setAvatarPreview(
                    previewUrl
                );

                toast.success(
                    `Avatar optimized to ${formatFileSize(
                        compressedFile.size
                    )}.`
                );
            } catch (error) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Unable to prepare the avatar."
                );
            } finally {
                setCompressingAvatar(
                    false
                );
            }
        };


    const saveAccount =
        async (
            event:
                FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            if (
                !profile ||
                savingAccount ||
                compressingAvatar
            ) {
                return;
            }

            if (
                !accountForm.full_name.trim()
            ) {
                toast.error(
                    "Enter the account owner's name."
                );

                return;
            }

            setSavingAccount(
                true
            );

            let uploadedPath:
                | string
                | null = null;

            const savePromise =
                (async () => {
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
                        throw new Error(
                            "Your session has expired."
                        );
                    }

                    let avatarUrl =
                        profile.avatar_url;

                    if (
                        accountForm.avatar_file
                    ) {
                        const uploaded =
                            await uploadPublicImage({
                                bucket:
                                    "avatars",

                                folder:
                                    user.id,

                                file:
                                    accountForm.avatar_file,
                            });

                        uploadedPath =
                            uploaded.path;

                        avatarUrl =
                            uploaded.publicUrl;
                    }

                    const {
                        error:
                            updateError,
                    } =
                        await supabase
                            .from(
                                "profiles"
                            )
                            .update({
                                full_name:
                                    accountForm.full_name.trim(),

                                avatar_url:
                                    avatarUrl,

                                barangay:
                                    accountForm.barangay.trim() ||
                                    null,

                                city:
                                    accountForm.city.trim() ||
                                    null,

                                province:
                                    accountForm.province.trim() ||
                                    null,

                                updated_at:
                                    new Date().toISOString(),
                            })
                            .eq(
                                "id",
                                profile.id
                            )
                            .eq(
                                "auth_id",
                                user.id
                            );

                    if (
                        updateError
                    ) {
                        throw updateError;
                    }

                    if (
                        accountForm.avatar_file &&
                        profile.avatar_url
                    ) {
                        const oldPath =
                            getStoragePathFromPublicUrl(
                                profile.avatar_url,
                                "avatars"
                            );

                        if (
                            oldPath &&
                            oldPath !==
                            uploadedPath
                        ) {
                            await supabase.storage
                                .from(
                                    "avatars"
                                )
                                .remove([
                                    oldPath,
                                ]);
                        }
                    }
                })();

            toast.promise(
                savePromise,
                {
                    loading:
                        "Updating account...",

                    success:
                        "Account information updated.",

                    error:
                        (
                            error
                        ) =>
                            error instanceof Error
                                ? error.message
                                : "Unable to update the account.",
                }
            );

            try {
                await savePromise;

                setAccountDialogOpen(
                    false
                );

                await loadProfilePage(
                    true
                );
            } catch {
                if (
                    uploadedPath
                ) {
                    await supabase.storage
                        .from(
                            "avatars"
                        )
                        .remove([
                            uploadedPath,
                        ]);
                }
            } finally {
                setSavingAccount(
                    false
                );
            }
        };


    /* =====================================================
       JUNKSHOP ACTIONS
    ===================================================== */

    const openShopDialog =
        () => {
            const operatingHours =
                junkshop?.operating_hours;

            setCurrentShopStep(
                1
            );

            setShopForm({
                junkshop_name:
                    junkshop?.junkshop_name ??
                    "",

                description:
                    junkshop?.description ??
                    "",

                address_line:
                    junkshop?.address_line ??
                    "",

                barangay:
                    junkshop?.barangay ??
                    profile?.barangay ??
                    "",

                city:
                    junkshop?.city ??
                    profile?.city ??
                    "",

                province:
                    junkshop?.province ??
                    profile?.province ??
                    "",

                postal_code:
                    junkshop?.postal_code ??
                    "",

                contact_number:
                    junkshop?.contact_number ??
                    "",

                contact_email:
                    junkshop?.contact_email ??
                    profile?.email ??
                    "",

                open_days:
                    operatingHours?.days ??
                    [
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                    ],

                opening_time:
                    operatingHours?.opens ??
                    "08:00",

                closing_time:
                    operatingHours?.closes ??
                    "17:00",

                photo_file:
                    null,
            });

            setShopPhotoPreview(
                junkshop?.photo_url ??
                null
            );

            setShopDialogOpen(
                true
            );
        };


    const validateShopStep =
        (
            step: number
        ) => {
            if (
                step === 1
            ) {
                if (
                    !shopForm.junkshop_name.trim()
                ) {
                    toast.error(
                        "Enter the junkshop name."
                    );

                    return false;
                }

                if (
                    !shopForm.contact_number.trim()
                ) {
                    toast.error(
                        "Enter the junkshop contact number."
                    );

                    return false;
                }

                if (
                    !shopPhotoPreview
                ) {
                    toast.error(
                        "Add a clear junkshop photo."
                    );

                    return false;
                }
            }

            if (
                step === 2
            ) {
                if (
                    !shopForm.address_line.trim() ||
                    !shopForm.barangay.trim() ||
                    !shopForm.city.trim() ||
                    !shopForm.province.trim()
                ) {
                    toast.error(
                        "Complete all required address fields."
                    );

                    return false;
                }

                if (
                    shopForm.open_days.length ===
                    0
                ) {
                    toast.error(
                        "Select at least one operating day."
                    );

                    return false;
                }

                if (
                    !shopForm.opening_time ||
                    !shopForm.closing_time
                ) {
                    toast.error(
                        "Enter the opening and closing times."
                    );

                    return false;
                }
            }

            if (
                step === 3 &&
                shopForm.contact_email.trim() &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    shopForm.contact_email.trim()
                )
            ) {
                toast.error(
                    "Enter a valid contact email."
                );

                return false;
            }

            return true;
        };


    const goToNextShopStep =
        () => {
            if (
                !validateShopStep(
                    currentShopStep
                )
            ) {
                return;
            }

            setCurrentShopStep(
                (
                    current
                ) =>
                    Math.min(
                        current + 1,
                        shopSteps.length
                    )
            );
        };


    const goToPreviousShopStep =
        () => {
            setCurrentShopStep(
                (
                    current
                ) =>
                    Math.max(
                        current - 1,
                        1
                    )
            );
        };


    const toggleOpenDay =
        (
            day: string
        ) => {
            setShopForm(
                (
                    current
                ) => {
                    const selected =
                        current.open_days.includes(
                            day
                        );

                    return {
                        ...current,

                        open_days:
                            selected
                                ? current.open_days.filter(
                                      (
                                          value
                                      ) =>
                                          value !==
                                          day
                                  )
                                : [
                                      ...current.open_days,
                                      day,
                                  ],
                    };
                }
            );
        };


    const handleShopPhotoChange =
        async (
            event:
                ChangeEvent<HTMLInputElement>
        ) => {
            const input =
                event.currentTarget;

            const selectedFile =
                input.files?.[0];

            input.value =
                "";

            if (
                !selectedFile
            ) {
                return;
            }

            setCompressingShopPhoto(
                true
            );

            try {
                const compressedFile =
                    await compressImageBeforeUpload(
                        selectedFile,
                        {
                            maximumDimension:
                                1600,

                            targetBytes:
                                Math.round(
                                    1.2 *
                                    1024 *
                                    1024
                                ),

                            filenamePrefix:
                                "junkshop",
                        }
                    );

                if (
                    shopPhotoPreview?.startsWith(
                        "blob:"
                    )
                ) {
                    URL.revokeObjectURL(
                        shopPhotoPreview
                    );
                }

                const previewUrl =
                    URL.createObjectURL(
                        compressedFile
                    );

                setShopForm(
                    (
                        current
                    ) => ({
                        ...current,

                        photo_file:
                            compressedFile,
                    })
                );

                setShopPhotoPreview(
                    previewUrl
                );

                toast.success(
                    `Shop image optimized to ${formatFileSize(
                        compressedFile.size
                    )}.`
                );
            } catch (error) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Unable to prepare the shop image."
                );
            } finally {
                setCompressingShopPhoto(
                    false
                );
            }
        };


    const saveJunkshop =
        async (
            event:
                FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            if (
                !profile ||
                savingShop ||
                compressingShopPhoto ||
                !validateShopStep(
                    3
                )
            ) {
                return;
            }

            setSavingShop(
                true
            );

            let uploadedPath:
                | string
                | null = null;

            const savePromise =
                (async () => {
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
                        throw new Error(
                            "Your session has expired."
                        );
                    }

                    let photoUrl =
                        junkshop?.photo_url ??
                        null;

                    if (
                        shopForm.photo_file
                    ) {
                        const uploaded =
                            await uploadPublicImage({
                                bucket:
                                    "partner-images",

                                folder:
                                    `junkshops/${user.id}`,

                                file:
                                    shopForm.photo_file,
                            });

                        uploadedPath =
                            uploaded.path;

                        photoUrl =
                            uploaded.publicUrl;
                    }

                    const payload = {
                        profile_id:
                            profile.id,

                        junkshop_name:
                            shopForm.junkshop_name.trim(),

                        description:
                            shopForm.description.trim() ||
                            null,

                        photo_url:
                            photoUrl,

                        address_line:
                            shopForm.address_line.trim(),

                        barangay:
                            shopForm.barangay.trim(),

                        city:
                            shopForm.city.trim(),

                        province:
                            shopForm.province.trim(),

                        postal_code:
                            shopForm.postal_code.trim() ||
                            null,

                        contact_number:
                            shopForm.contact_number.trim() ||
                            null,

                        contact_email:
                            shopForm.contact_email.trim() ||
                            null,

                        operating_hours: {
                            days:
                                shopForm.open_days,

                            opens:
                                shopForm.opening_time,

                            closes:
                                shopForm.closing_time,
                        },

                        updated_at:
                            new Date().toISOString(),
                    };

                    if (
                        junkshop
                    ) {
                        const {
                            error:
                                updateError,
                        } =
                            await supabase
                                .from(
                                    "junkshops"
                                )
                                .update(
                                    payload
                                )
                                .eq(
                                    "id",
                                    junkshop.id
                                )
                                .eq(
                                    "profile_id",
                                    profile.id
                                );

                        if (
                            updateError
                        ) {
                            throw updateError;
                        }
                    } else {
                        const {
                            error:
                                insertError,
                        } =
                            await supabase
                                .from(
                                    "junkshops"
                                )
                                .insert({
                                    ...payload,

                                    verification_status:
                                        "pending",

                                    is_active:
                                        true,
                                });

                        if (
                            insertError
                        ) {
                            throw insertError;
                        }
                    }

                    if (
                        shopForm.photo_file &&
                        junkshop?.photo_url
                    ) {
                        const oldPath =
                            getStoragePathFromPublicUrl(
                                junkshop.photo_url,
                                "partner-images"
                            );

                        if (
                            oldPath &&
                            oldPath !==
                            uploadedPath
                        ) {
                            await supabase.storage
                                .from(
                                    "partner-images"
                                )
                                .remove([
                                    oldPath,
                                ]);
                        }
                    }
                })();

            toast.promise(
                savePromise,
                {
                    loading:
                        junkshop
                            ? "Updating junkshop..."
                            : "Creating junkshop...",

                    success:
                        junkshop
                            ? "Junkshop information updated."
                            : "Junkshop profile created.",

                    error:
                        (
                            error
                        ) =>
                            error instanceof Error
                                ? error.message
                                : "Unable to save the junkshop.",
                }
            );

            try {
                await savePromise;

                setShopDialogOpen(
                    false
                );

                await loadProfilePage(
                    true
                );
            } catch {
                if (
                    uploadedPath
                ) {
                    await supabase.storage
                        .from(
                            "partner-images"
                        )
                        .remove([
                            uploadedPath,
                        ]);
                }
            } finally {
                setSavingShop(
                    false
                );
            }
        };


    const toggleShopVisibility =
        async () => {
            if (
                !junkshop ||
                changingVisibility
            ) {
                return;
            }

            const nextValue =
                !junkshop.is_active;

            setChangingVisibility(
                true
            );

            const visibilityPromise =
                (async () => {
                    const {
                        error,
                    } =
                        await supabase
                            .from(
                                "junkshops"
                            )
                            .update({
                                is_active:
                                    nextValue,

                                updated_at:
                                    new Date().toISOString(),
                            })
                            .eq(
                                "id",
                                junkshop.id
                            )
                            .eq(
                                "profile_id",
                                junkshop.profile_id
                            );

                    if (
                        error
                    ) {
                        throw error;
                    }
                })();

            toast.promise(
                visibilityPromise,
                {
                    loading:
                        nextValue
                            ? "Activating shop..."
                            : "Pausing shop...",

                    success:
                        nextValue
                            ? "Shop visibility activated."
                            : "Shop visibility paused.",

                    error:
                        (
                            error
                        ) =>
                            error instanceof Error
                                ? error.message
                                : "Unable to change shop visibility.",
                }
            );

            try {
                await visibilityPromise;

                setJunkshop(
                    (
                        current
                    ) =>
                        current
                            ? {
                                  ...current,
                                  is_active:
                                      nextValue,
                              }
                            : current
                );
            } catch {
                // Sonner handles the error.
            } finally {
                setChangingVisibility(
                    false
                );
            }
        };


    /* =====================================================
       DERIVED VALUES
    ===================================================== */

    const activeMaterialCount =
        useMemo(
            () =>
                acceptedMaterials.filter(
                    (
                        material
                    ) =>
                        material.is_accepting
                ).length,
            [
                acceptedMaterials,
            ]
        );


    const averagePrice =
        useMemo(
            () => {
                if (
                    acceptedMaterials.length ===
                    0
                ) {
                    return 0;
                }

                const total =
                    acceptedMaterials.reduce(
                        (
                            sum,
                            material
                        ) =>
                            sum +
                            material.price_per_kg,
                        0
                    );

                return (
                    total /
                    acceptedMaterials.length
                );
            },
            [
                acceptedMaterials,
            ]
        );


    const completionItems =
        useMemo(
            () => [
                {
                    label:
                        "Owner name",

                    complete:
                        Boolean(
                            profile?.full_name
                        ),
                },
                {
                    label:
                        "Account photo",

                    complete:
                        Boolean(
                            profile?.avatar_url
                        ),
                },
                {
                    label:
                        "Junkshop name",

                    complete:
                        Boolean(
                            junkshop?.junkshop_name
                        ),
                },
                {
                    label:
                        "Shop photo",

                    complete:
                        Boolean(
                            junkshop?.photo_url
                        ),
                },
                {
                    label:
                        "Contact number",

                    complete:
                        Boolean(
                            junkshop?.contact_number
                        ),
                },
                {
                    label:
                        "Complete address",

                    complete:
                        Boolean(
                            junkshop?.address_line &&
                            junkshop?.barangay &&
                            junkshop?.city &&
                            junkshop?.province
                        ),
                },
                {
                    label:
                        "Operating hours",

                    complete:
                        Boolean(
                            junkshop?.operating_hours
                                ?.days?.length
                        ),
                },
                {
                    label:
                        "Accepted materials",

                    complete:
                        acceptedMaterials.length >
                        0,
                },
            ],
            [
                acceptedMaterials.length,
                junkshop,
                profile,
            ]
        );


    const profileCompleteness =
        useMemo(
            () => {
                const completed =
                    completionItems.filter(
                        (
                            item
                        ) =>
                            item.complete
                    ).length;

                return Math.round(
                    (
                        completed /
                        completionItems.length
                    ) *
                    100
                );
            },
            [
                completionItems,
            ]
        );


    /* =====================================================
       PAGE STATES
    ===================================================== */

    if (
        loading
    ) {
        return (
            <RecyclerProfileSkeleton />
        );
    }


    if (
        pageError ||
        !profile
    ) {
        return (
            <ProfileErrorState
                message={
                    pageError ??
                    "Recycler profile was not found."
                }
                onRetry={() =>
                    void loadProfilePage()
                }
            />
        );
    }


    const verification =
        junkshop
            ? verificationDetails(
                  junkshop.verification_status
              )
            : null;

    const VerificationIcon =
        verification?.icon;


    /* =====================================================
       PAGE UI
    ===================================================== */

    return (
        <>
            <style jsx global>{`
                @keyframes trashureFadeUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
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

                @keyframes trashureStepIn {
                    from {
                        opacity: 0;
                        transform: translateX(8px);
                    }

                    to {
                        opacity: 1;
                        transform: translateX(0);
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
                {/* PAGE HEADER */}

                <section className="trashure-motion animate-[trashureFadeUp_.35s_ease-out_both]">
                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                                "/profiles/recycler"
                            )
                        }
                        className="group mb-4 inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-green-700"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />

                        Recycler dashboard
                    </button>


                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-sm font-bold text-green-600">
                                Account and profile
                            </p>

                            <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
                                Junkshop Profile
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                                Manage the account owner, public business
                                details, shop visibility, accepted materials,
                                and verification information.
                            </p>
                        </div>


                        <Button
                            type="button"
                            variant="outline"
                            disabled={
                                refreshing
                            }
                            onClick={() =>
                                void loadProfilePage(
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


                {/* MAIN PROFILE HERO */}

                <section className="trashure-motion animate-[trashureSoftScale_.4s_ease-out_.05s_both] overflow-hidden rounded-[32px] border border-green-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
                    <div className="relative min-h-52 overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-emerald-800 p-6 text-white sm:min-h-60 sm:p-8">
                        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />

                        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-white/5" />

                        {junkshop?.photo_url && (
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

                                <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 via-emerald-800/75 to-emerald-700/60" />
                            </>
                        )}


                        <div className="relative flex min-h-40 flex-col justify-between gap-7 sm:flex-row sm:items-end">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                                <Avatar className="h-24 w-24 border-4 border-white bg-white shadow-xl sm:h-28 sm:w-28">
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

                                    <AvatarFallback className="bg-green-100 text-2xl font-black text-green-700">
                                        {getInitials(
                                            profile.full_name
                                        )}
                                    </AvatarFallback>
                                </Avatar>


                                <div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge className="border-white/20 bg-white/15 text-white hover:bg-white/15">
                                            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />

                                            Recycler partner
                                        </Badge>

                                        {verification &&
                                            VerificationIcon && (
                                                <Badge className="border-white/20 bg-black/20 text-white hover:bg-black/20">
                                                    <VerificationIcon className="mr-1.5 h-3.5 w-3.5" />

                                                    {
                                                        verification.label
                                                    }
                                                </Badge>
                                            )}

                                        {junkshop && (
                                            <Badge className="border-white/20 bg-black/20 text-white hover:bg-black/20">
                                                <Power className="mr-1.5 h-3.5 w-3.5" />

                                                {junkshop.is_active
                                                    ? "Active"
                                                    : "Paused"}
                                            </Badge>
                                        )}
                                    </div>


                                    <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                                        {junkshop?.junkshop_name ??
                                            "Set up your junkshop"}
                                    </h2>

                                    <p className="mt-1 text-sm text-green-50/90">
                                        Managed by{" "}
                                        <span className="font-bold text-white">
                                            {
                                                profile.full_name
                                            }
                                        </span>
                                    </p>

                                    <p className="mt-2 flex items-center gap-2 text-sm text-green-50/80">
                                        <MapPin className="h-4 w-4" />

                                        {[
                                            junkshop?.barangay ??
                                                profile.barangay,

                                            junkshop?.city ??
                                                profile.city,

                                            junkshop?.province ??
                                                profile.province,
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
                                <Button
                                    type="button"
                                    onClick={
                                        openAccountDialog
                                    }
                                    className="rounded-full bg-white text-green-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-50"
                                >
                                    <UserRound className="mr-2 h-4 w-4" />

                                    Edit account
                                </Button>

                                <Button
                                    type="button"
                                    onClick={
                                        openShopDialog
                                    }
                                    className="rounded-full border border-white/30 bg-white/15 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/25"
                                >
                                    <Store className="mr-2 h-4 w-4" />

                                    {junkshop
                                        ? "Edit shop"
                                        : "Set up shop"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>


                {/* VERIFICATION */}

                {verification &&
                    VerificationIcon && (
                        <section
                            className={`trashure-motion animate-[trashureFadeUp_.4s_ease-out_.1s_both] flex flex-col gap-4 rounded-[24px] border p-5 sm:flex-row sm:items-center ${verification.panelClass}`}
                        >
                            <div
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${verification.iconClass}`}
                            >
                                <VerificationIcon className="h-6 w-6" />
                            </div>

                            <div className="flex-1">
                                <h3 className="font-black text-zinc-900">
                                    {
                                        verification.title
                                    }
                                </h3>

                                <p className="mt-1 text-sm leading-6 text-zinc-600">
                                    {
                                        verification.description
                                    }
                                </p>
                            </div>

                            {junkshop?.verification_status ===
                                "rejected" && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={
                                        openShopDialog
                                    }
                                    className="w-fit rounded-full bg-white"
                                >
                                    Review details
                                </Button>
                            )}
                        </section>
                    )}


                {/* ACCOUNT AND COMPLETION */}

                <section className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                    <div className="trashure-motion animate-[trashureFadeUp_.4s_ease-out_.15s_both] rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-zinc-900">
                                    Account information
                                </h2>

                                <p className="mt-1 text-sm text-zinc-500">
                                    Personal information for the junkshop
                                    owner.
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label="Edit account information"
                                onClick={
                                    openAccountDialog
                                }
                                className="rounded-full border-green-200 text-green-700 hover:bg-green-50"
                            >
                                <Edit3 className="h-4 w-4" />
                            </Button>
                        </div>


                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <InformationCard
                                icon={
                                    UserRound
                                }
                                label="Account owner"
                                value={
                                    profile.full_name
                                }
                            />

                            <InformationCard
                                icon={
                                    Mail
                                }
                                label="Login email"
                                value={
                                    profile.email
                                }
                            />

                            <InformationCard
                                icon={
                                    MapPin
                                }
                                label="Account location"
                                value={
                                    [
                                        profile.barangay,
                                        profile.city,
                                        profile.province,
                                    ]
                                        .filter(
                                            Boolean
                                        )
                                        .join(
                                            ", "
                                        ) ||
                                    "Not provided"
                                }
                            />

                            <InformationCard
                                icon={
                                    CalendarDays
                                }
                                label="Member since"
                                value={formatMemberSince(
                                    profile.created_at
                                )}
                            />
                        </div>


                        <div className="mt-5 flex gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

                            <div>
                                <p className="text-sm font-bold text-zinc-800">
                                    Login email is protected
                                </p>

                                <p className="mt-1 text-xs leading-5 text-zinc-500">
                                    This page updates public profile details.
                                    The login email is displayed as read-only
                                    to avoid account access problems.
                                </p>
                            </div>
                        </div>
                    </div>


                    <div className="trashure-motion animate-[trashureFadeUp_.4s_ease-out_.2s_both] rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-zinc-900">
                                    Profile completion
                                </h2>

                                <p className="mt-1 text-sm text-zinc-500">
                                    Complete these items to improve trust.
                                </p>
                            </div>

                            <p className="text-2xl font-black text-green-700">
                                {
                                    profileCompleteness
                                }
                                %
                            </p>
                        </div>


                        <div className="mt-5 h-3 overflow-hidden rounded-full bg-green-50">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-700 transition-all duration-700"
                                style={{
                                    width:
                                        `${profileCompleteness}%`,
                                }}
                            />
                        </div>


                        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            {completionItems.map(
                                (
                                    item
                                ) => (
                                    <div
                                        key={
                                            item.label
                                        }
                                        className="flex items-center gap-3 rounded-xl border border-zinc-100 px-3 py-2.5"
                                    >
                                        <div
                                            className={`flex h-7 w-7 items-center justify-center rounded-full ${
                                                item.complete
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-zinc-100 text-zinc-400"
                                            }`}
                                        >
                                            {item.complete ? (
                                                <Check className="h-4 w-4" />
                                            ) : (
                                                <Plus className="h-4 w-4" />
                                            )}
                                        </div>

                                        <p
                                            className={`text-sm font-semibold ${
                                                item.complete
                                                    ? "text-zinc-700"
                                                    : "text-zinc-500"
                                            }`}
                                        >
                                            {
                                                item.label
                                            }
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </section>


                {/* SHOP INFORMATION */}

                {!junkshop ? (
                    <section className="trashure-motion animate-[trashureFadeUp_.4s_ease-out_.25s_both] overflow-hidden rounded-[30px] border border-green-100 bg-white shadow-sm">
                        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
                            <div className="relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-800 p-7 text-white sm:p-9">
                                <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/10" />

                                <div className="relative">
                                    <Store className="h-12 w-12" />

                                    <h2 className="mt-5 text-2xl font-black">
                                        Create your junkshop profile
                                    </h2>

                                    <p className="mt-3 max-w-xl text-sm leading-7 text-green-50">
                                        Add a recognizable shop name, photo,
                                        contact information, address, and
                                        operating hours.
                                    </p>

                                    <Button
                                        type="button"
                                        onClick={
                                            openShopDialog
                                        }
                                        className="mt-6 rounded-full bg-white px-6 text-green-700 hover:bg-green-50"
                                    >
                                        <Store className="mr-2 h-4 w-4" />

                                        Set up junkshop

                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>


                            <div className="p-7 sm:p-9">
                                <p className="text-sm font-bold uppercase tracking-wide text-green-600">
                                    Residents will see
                                </p>

                                <div className="mt-5 space-y-4">
                                    <SimpleFeature
                                        icon={
                                            Building2
                                        }
                                        title="Business identity"
                                        description="Shop name, photo, and description."
                                    />

                                    <SimpleFeature
                                        icon={
                                            MapPin
                                        }
                                        title="Location"
                                        description="Address, barangay, city, and province."
                                    />

                                    <SimpleFeature
                                        icon={
                                            Clock3
                                        }
                                        title="Operating hours"
                                        description="The days and times residents may visit."
                                    />

                                    <SimpleFeature
                                        icon={
                                            Phone
                                        }
                                        title="Contact details"
                                        description="A practical way to confirm before visiting."
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                ) : (
                    <>
                        <section className="trashure-motion animate-[trashureFadeUp_.4s_ease-out_.25s_both] grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
                            <div className="group overflow-hidden rounded-[28px] border border-green-100 bg-white shadow-sm">
                                <div className="relative h-64 overflow-hidden bg-green-100">
                                    {junkshop.photo_url ? (
                                        <img
                                            src={
                                                junkshop.photo_url
                                            }
                                            alt={
                                                junkshop.junkshop_name
                                            }
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                                        />
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 text-green-600">
                                            <ImagePlus className="h-12 w-12" />

                                            <p className="mt-3 text-sm font-bold">
                                                No shop photo
                                            </p>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                                    <div className="absolute bottom-4 left-4 right-4">
                                        <Badge className="border-white/20 bg-black/30 text-white backdrop-blur-sm hover:bg-black/30">
                                            <Store className="mr-1.5 h-3.5 w-3.5" />

                                            Public shop photo
                                        </Badge>
                                    </div>
                                </div>


                                <div className="p-5">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={
                                            openShopDialog
                                        }
                                        className="w-full rounded-full border-green-200 text-green-700 hover:bg-green-50"
                                    >
                                        <Camera className="mr-2 h-4 w-4" />

                                        Change shop details
                                    </Button>
                                </div>
                            </div>


                            <div className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                    <div>
                                        <h2 className="text-2xl font-black text-zinc-900">
                                            {
                                                junkshop.junkshop_name
                                            }
                                        </h2>

                                        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                                            {junkshop.description ||
                                                "No shop description has been added yet."}
                                        </p>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={
                                            openShopDialog
                                        }
                                        className="w-fit rounded-full border-green-200 hover:bg-green-50 hover:text-green-700"
                                    >
                                        <Edit3 className="mr-2 h-4 w-4" />

                                        Edit
                                    </Button>
                                </div>


                                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                    <InformationCard
                                        icon={
                                            MapPin
                                        }
                                        label="Business address"
                                        value={
                                            [
                                                junkshop.address_line,
                                                junkshop.barangay,
                                                junkshop.city,
                                                junkshop.province,
                                                junkshop.postal_code,
                                            ]
                                                .filter(
                                                    Boolean
                                                )
                                                .join(
                                                    ", "
                                                )
                                        }
                                    />

                                    <InformationCard
                                        icon={
                                            Clock3
                                        }
                                        label="Operating hours"
                                        value={formatOperatingHours(
                                            junkshop.operating_hours
                                        )}
                                    />

                                    <InformationCard
                                        icon={
                                            Phone
                                        }
                                        label="Contact number"
                                        value={
                                            junkshop.contact_number ||
                                            "Not provided"
                                        }
                                    />

                                    <InformationCard
                                        icon={
                                            Mail
                                        }
                                        label="Contact email"
                                        value={
                                            junkshop.contact_email ||
                                            "Not provided"
                                        }
                                    />
                                </div>


                                <div className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center">
                                    <div className="flex gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-green-700 shadow-sm">
                                            <Power className="h-5 w-5" />
                                        </div>

                                        <div>
                                            <p className="font-black text-zinc-900">
                                                Shop visibility
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                                                {junkshop.is_active
                                                    ? "The shop is active and may receive matching opportunities."
                                                    : "The shop is paused and hidden from normal resident discovery."}
                                            </p>
                                        </div>
                                    </div>


                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={
                                            junkshop.is_active
                                        }
                                        disabled={
                                            changingVisibility
                                        }
                                        onClick={() =>
                                            void toggleShopVisibility()
                                        }
                                        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-300 disabled:cursor-wait disabled:opacity-60 ${
                                            junkshop.is_active
                                                ? "bg-green-600"
                                                : "bg-zinc-300"
                                        }`}
                                    >
                                        <span
                                            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300 ${
                                                junkshop.is_active
                                                    ? "translate-x-7"
                                                    : "translate-x-1"
                                            }`}
                                        />

                                        {changingVisibility && (
                                            <Loader2 className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin text-green-900" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </section>


                        {/* MATERIAL SUMMARY */}

                        <section className="trashure-motion animate-[trashureFadeUp_.4s_ease-out_.3s_both] grid gap-4 sm:grid-cols-3">
                            <SummaryCard
                                title="Listed materials"
                                value={
                                    acceptedMaterials.length
                                }
                                description="Materials added to the junkshop"
                                icon={
                                    PackageCheck
                                }
                            />

                            <SummaryCard
                                title="Actively accepting"
                                value={
                                    activeMaterialCount
                                }
                                description="Currently available to residents"
                                icon={
                                    CheckCircle2
                                }
                            />

                            <SummaryCard
                                title="Average price"
                                value={formatPeso(
                                    averagePrice
                                )}
                                description="Average listed price per kilogram"
                                icon={
                                    WalletCards
                                }
                            />
                        </section>


                        {/* ACCEPTED MATERIALS */}

                        <section className="trashure-motion animate-[trashureFadeUp_.4s_ease-out_.35s_both] rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                <div>
                                    <h2 className="text-xl font-black text-zinc-900">
                                        Accepted materials
                                    </h2>

                                    <p className="mt-1 text-sm text-zinc-500">
                                        A preview of materials connected to
                                        this junkshop account.
                                    </p>
                                </div>


                                <Button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            "/profiles/recycler/materials?action=add"
                                        )
                                    }
                                    className="w-fit rounded-full bg-green-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700"
                                >
                                    <Plus className="mr-2 h-4 w-4" />

                                    Add material
                                </Button>
                            </div>


                            {acceptedMaterials.length ===
                            0 ? (
                                <div className="mt-6 flex flex-col items-center rounded-[24px] border border-dashed border-green-200 bg-green-50 px-6 py-12 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-green-600 shadow-sm">
                                        <PackageCheck className="h-8 w-8" />
                                    </div>

                                    <h3 className="mt-5 text-lg font-black text-zinc-900">
                                        No accepted materials yet
                                    </h3>

                                    <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                                        Add materials, buying prices,
                                        minimum weights, and accepted
                                        conditions.
                                    </p>

                                    <Button
                                        type="button"
                                        onClick={() =>
                                            router.push(
                                                "/profiles/recycler/materials?action=add"
                                            )
                                        }
                                        className="mt-6 rounded-full bg-green-600 hover:bg-green-700"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />

                                        Add first material
                                    </Button>
                                </div>
                            ) : (
                                <div className="mt-6 space-y-3">
                                    {acceptedMaterials
                                        .slice(
                                            0,
                                            4
                                        )
                                        .map(
                                            (
                                                material
                                            ) => (
                                                <div
                                                    key={
                                                        material.id
                                                    }
                                                    className="group flex flex-col gap-4 rounded-2xl border border-zinc-100 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50/50 sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="font-black text-zinc-900">
                                                                {
                                                                    material.material_name
                                                                }
                                                            </h3>

                                                            <Badge
                                                                variant="secondary"
                                                                className="bg-zinc-100 text-zinc-600"
                                                            >
                                                                {
                                                                    material.category
                                                                }
                                                            </Badge>

                                                            <Badge
                                                                variant="outline"
                                                                className={
                                                                    material.is_accepting
                                                                        ? "border-green-200 bg-green-50 text-green-700"
                                                                        : "border-zinc-200 bg-zinc-50 text-zinc-500"
                                                                }
                                                            >
                                                                {material.is_accepting
                                                                    ? "Accepting"
                                                                    : "Paused"}
                                                            </Badge>
                                                        </div>


                                                        <p className="mt-2 text-sm text-zinc-500">
                                                            <span className="font-black text-green-700">
                                                                {formatPeso(
                                                                    material.price_per_kg
                                                                )}
                                                            </span>{" "}
                                                            per kg

                                                            <span className="mx-2 text-zinc-300">
                                                                •
                                                            </span>

                                                            Minimum{" "}
                                                            {
                                                                material.minimum_weight_kg
                                                            }{" "}
                                                            kg
                                                        </p>

                                                        {material.accepted_condition && (
                                                            <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                                                                Condition:{" "}
                                                                {
                                                                    material.accepted_condition
                                                                }
                                                            </p>
                                                        )}
                                                    </div>


                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label={`Manage ${material.material_name}`}
                                                        onClick={() =>
                                                            router.push(
                                                                "/profiles/recycler/materials"
                                                            )
                                                        }
                                                        className="self-end rounded-full text-green-700 transition-transform duration-200 group-hover:translate-x-1 hover:bg-green-100 sm:self-auto"
                                                    >
                                                        <ChevronRight className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            )
                                        )}


                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() =>
                                            router.push(
                                                "/profiles/recycler/materials"
                                            )
                                        }
                                        className="mt-2 w-full rounded-2xl text-green-700 hover:bg-green-50 hover:text-green-800"
                                    >
                                        View and manage all materials

                                        <ExternalLink className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>


            {/* =================================================
                ACCOUNT DIALOG
            ================================================= */}

            <Dialog
                open={
                    accountDialogOpen
                }
                onOpenChange={(
                    open
                ) => {
                    if (
                        savingAccount ||
                        compressingAvatar
                    ) {
                        return;
                    }

                    setAccountDialogOpen(
                        open
                    );
                }}
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
                        sm:!w-[min(92vw,680px)]
                    "
                >
                    <DialogHeader className="sr-only">
                        <DialogTitle>
                            Edit recycler account
                        </DialogTitle>

                        <DialogDescription>
                            Update the recycler owner's profile
                            information.
                        </DialogDescription>
                    </DialogHeader>


                    <form
                        onSubmit={
                            saveAccount
                        }
                        className="grid max-h-[94dvh] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-white"
                    >
                        <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-700 px-5 py-5 text-white sm:px-7">
                            <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10" />

                            <div className="relative flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                                    <UserRound className="h-6 w-6" />
                                </div>

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-100">
                                        Account details
                                    </p>

                                    <h2 className="mt-1 text-xl font-black sm:text-2xl">
                                        Edit owner profile
                                    </h2>

                                    <p className="mt-1 text-sm text-green-50/85">
                                        Update the account photo, owner
                                        name, and personal location.
                                    </p>
                                </div>
                            </div>
                        </div>


                        <div className="min-h-0 overflow-y-auto bg-white p-5 sm:p-7">
                            <div className="space-y-6">
                                <ImagePicker
                                    preview={
                                        avatarPreview
                                    }
                                    label="Account photo"
                                    description="JPG, PNG, or WebP up to 15 MB. The image is compressed automatically."
                                    compressing={
                                        compressingAvatar
                                    }
                                    circular
                                    onChange={
                                        handleAvatarChange
                                    }
                                />


                                <div className="space-y-2">
                                    <Label htmlFor="account_full_name">
                                        Owner name{" "}
                                        <span className="text-red-500">
                                            *
                                        </span>
                                    </Label>

                                    <Input
                                        id="account_full_name"
                                        value={
                                            accountForm.full_name
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setAccountForm(
                                                (
                                                    current
                                                ) => ({
                                                    ...current,

                                                    full_name:
                                                        event.target.value,
                                                })
                                            )
                                        }
                                        placeholder="Full name"
                                        className="h-12 rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
                                    />
                                </div>


                                <div className="space-y-2">
                                    <Label htmlFor="account_email">
                                        Login email
                                    </Label>

                                    <Input
                                        id="account_email"
                                        value={
                                            profile.email
                                        }
                                        readOnly
                                        className="h-12 cursor-not-allowed rounded-xl border-zinc-200 bg-zinc-100 text-zinc-500"
                                    />

                                    <p className="text-xs text-zinc-500">
                                        The login email cannot be changed
                                        from this profile page.
                                    </p>
                                </div>


                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="account_barangay">
                                            Barangay
                                        </Label>

                                        <Input
                                            id="account_barangay"
                                            value={
                                                accountForm.barangay
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setAccountForm(
                                                    (
                                                        current
                                                    ) => ({
                                                        ...current,

                                                        barangay:
                                                            event.target.value,
                                                    })
                                                )
                                            }
                                            className="h-12 rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
                                        />
                                    </div>


                                    <div className="space-y-2">
                                        <Label htmlFor="account_city">
                                            City or municipality
                                        </Label>

                                        <Input
                                            id="account_city"
                                            value={
                                                accountForm.city
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setAccountForm(
                                                    (
                                                        current
                                                    ) => ({
                                                        ...current,

                                                        city:
                                                            event.target.value,
                                                    })
                                                )
                                            }
                                            className="h-12 rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
                                        />
                                    </div>


                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="account_province">
                                            Province
                                        </Label>

                                        <Input
                                            id="account_province"
                                            value={
                                                accountForm.province
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setAccountForm(
                                                    (
                                                        current
                                                    ) => ({
                                                        ...current,

                                                        province:
                                                            event.target.value,
                                                    })
                                                )
                                            }
                                            className="h-12 rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>


                        <div className="flex items-center justify-between gap-3 border-t border-green-200 bg-white px-5 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] sm:px-7">
                            <Button
                                type="button"
                                variant="ghost"
                                disabled={
                                    savingAccount ||
                                    compressingAvatar
                                }
                                onClick={() =>
                                    setAccountDialogOpen(
                                        false
                                    )
                                }
                                className="rounded-full"
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                disabled={
                                    savingAccount ||
                                    compressingAvatar
                                }
                                className="rounded-full bg-green-600 px-6 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 disabled:translate-y-0"
                            >
                                {savingAccount ||
                                compressingAvatar ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="mr-2 h-4 w-4" />
                                )}

                                {compressingAvatar
                                    ? "Optimizing..."
                                    : savingAccount
                                      ? "Saving..."
                                      : "Save account"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>


            {/* =================================================
                SHOP DIALOG
            ================================================= */}

            <Dialog
                open={
                    shopDialogOpen
                }
                onOpenChange={(
                    open
                ) => {
                    if (
                        savingShop ||
                        compressingShopPhoto
                    ) {
                        return;
                    }

                    setShopDialogOpen(
                        open
                    );
                }}
            >
                <DialogContent
                    className="
                        max-h-[96dvh]
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
                        lg:!w-[1080px]
                        lg:rounded-[30px]
                    "
                >
                    <DialogHeader className="sr-only">
                        <DialogTitle>
                            {junkshop
                                ? "Edit junkshop"
                                : "Create junkshop"}
                        </DialogTitle>

                        <DialogDescription>
                            Complete the public junkshop information.
                        </DialogDescription>
                    </DialogHeader>


                    <form
                        onSubmit={
                            saveJunkshop
                        }
                        className="grid max-h-[96dvh] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-white"
                    >
                        {/* HEADER */}

                        <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-700 px-5 py-5 text-white sm:px-7">
                            <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10" />

                            <div className="relative flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                                    <Store className="h-6 w-6" />
                                </div>

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-100">
                                        Step{" "}
                                        {
                                            currentShopStep
                                        }{" "}
                                        of{" "}
                                        {
                                            shopSteps.length
                                        }
                                    </p>

                                    <h2 className="mt-1 text-xl font-black sm:text-2xl">
                                        {junkshop
                                            ? "Edit junkshop profile"
                                            : "Create junkshop profile"}
                                    </h2>

                                    <p className="mt-1 text-sm text-green-50/85">
                                        {
                                            shopSteps[
                                                currentShopStep -
                                                1
                                            ].description
                                        }
                                    </p>
                                </div>
                            </div>


                            <div className="relative mt-5 grid grid-cols-3 gap-2">
                                {shopSteps.map(
                                    (
                                        step
                                    ) => {
                                        const active =
                                            currentShopStep ===
                                            step.number;

                                        const complete =
                                            currentShopStep >
                                            step.number;

                                        return (
                                            <div
                                                key={
                                                    step.number
                                                }
                                                className="min-w-0"
                                            >
                                                <div
                                                    className={`h-1.5 rounded-full transition-colors duration-300 ${
                                                        active ||
                                                        complete
                                                            ? "bg-white"
                                                            : "bg-white/25"
                                                    }`}
                                                />

                                                <p
                                                    className={`mt-2 hidden truncate text-xs font-semibold sm:block ${
                                                        active ||
                                                        complete
                                                            ? "text-white"
                                                            : "text-green-100/60"
                                                    }`}
                                                >
                                                    {
                                                        step.title
                                                    }
                                                </p>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        </div>


                        {/* BODY */}

                        <div className="grid min-h-0 overflow-hidden bg-white lg:grid-cols-[minmax(0,1fr)_360px]">
                            <div className="min-h-0 overflow-y-auto bg-white p-5 sm:p-7">
                                <div
                                    key={
                                        currentShopStep
                                    }
                                    className="trashure-motion animate-[trashureStepIn_.24s_ease-out_both]"
                                >
                                    {currentShopStep ===
                                        1 && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-xl font-black text-zinc-900">
                                                    Shop identity
                                                </h3>

                                                <p className="mt-1 text-sm leading-6 text-zinc-500">
                                                    Add a recognizable photo,
                                                    business name, and contact
                                                    information.
                                                </p>
                                            </div>


                                            <ImagePicker
                                                preview={
                                                    shopPhotoPreview
                                                }
                                                label="Junkshop photo"
                                                description="JPG, PNG, or WebP up to 15 MB. The image is compressed automatically before upload."
                                                compressing={
                                                    compressingShopPhoto
                                                }
                                                onChange={
                                                    handleShopPhotoChange
                                                }
                                            />


                                            <div className="grid gap-5 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="shop_name">
                                                        Junkshop name{" "}
                                                        <span className="text-red-500">
                                                            *
                                                        </span>
                                                    </Label>

                                                    <Input
                                                        id="shop_name"
                                                        value={
                                                            shopForm.junkshop_name
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setShopForm(
                                                                (
                                                                    current
                                                                ) => ({
                                                                    ...current,

                                                                    junkshop_name:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        placeholder="Example: GreenCycle Junkshop"
                                                        className="h-12 rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
                                                    />
                                                </div>


                                                <div className="space-y-2">
                                                    <Label htmlFor="shop_phone">
                                                        Contact number{" "}
                                                        <span className="text-red-500">
                                                            *
                                                        </span>
                                                    </Label>

                                                    <Input
                                                        id="shop_phone"
                                                        inputMode="tel"
                                                        value={
                                                            shopForm.contact_number
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setShopForm(
                                                                (
                                                                    current
                                                                ) => ({
                                                                    ...current,

                                                                    contact_number:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        placeholder="09XX XXX XXXX"
                                                        className="h-12 rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
                                                    />
                                                </div>
                                            </div>


                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between gap-3">
                                                    <Label htmlFor="shop_description">
                                                        Shop description
                                                    </Label>

                                                    <span className="text-xs text-zinc-400">
                                                        {
                                                            shopForm
                                                                .description
                                                                .length
                                                        }
                                                        /300
                                                    </span>
                                                </div>

                                                <Textarea
                                                    id="shop_description"
                                                    maxLength={
                                                        300
                                                    }
                                                    value={
                                                        shopForm.description
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setShopForm(
                                                            (
                                                                current
                                                            ) => ({
                                                                ...current,

                                                                description:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                    placeholder="Describe the junkshop, service area, and materials commonly accepted."
                                                    rows={
                                                        5
                                                    }
                                                    className="resize-none rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
                                                />
                                            </div>


                                            <div className="space-y-2">
                                                <Label htmlFor="shop_email">
                                                    Contact email
                                                </Label>

                                                <Input
                                                    id="shop_email"
                                                    type="email"
                                                    value={
                                                        shopForm.contact_email
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setShopForm(
                                                            (
                                                                current
                                                            ) => ({
                                                                ...current,

                                                                contact_email:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                    placeholder="shop@example.com"
                                                    className="h-12 rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
                                                />
                                            </div>
                                        </div>
                                    )}


                                    {currentShopStep ===
                                        2 && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-xl font-black text-zinc-900">
                                                    Location and hours
                                                </h3>

                                                <p className="mt-1 text-sm leading-6 text-zinc-500">
                                                    Enter an address residents
                                                    can recognize and a clear
                                                    operating schedule.
                                                </p>
                                            </div>


                                            <div className="space-y-2">
                                                <Label htmlFor="shop_address">
                                                    Street address or landmark{" "}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </Label>

                                                <Input
                                                    id="shop_address"
                                                    value={
                                                        shopForm.address_line
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setShopForm(
                                                            (
                                                                current
                                                            ) => ({
                                                                ...current,

                                                                address_line:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                    placeholder="Street, building, sitio, or nearby landmark"
                                                    className="h-12 rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
                                                />
                                            </div>


                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="shop_barangay">
                                                        Barangay{" "}
                                                        <span className="text-red-500">
                                                            *
                                                        </span>
                                                    </Label>

                                                    <Input
                                                        id="shop_barangay"
                                                        value={
                                                            shopForm.barangay
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setShopForm(
                                                                (
                                                                    current
                                                                ) => ({
                                                                    ...current,

                                                                    barangay:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        className="h-12 rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
                                                    />
                                                </div>


                                                <div className="space-y-2">
                                                    <Label htmlFor="shop_city">
                                                        City or municipality{" "}
                                                        <span className="text-red-500">
                                                            *
                                                        </span>
                                                    </Label>

                                                    <Input
                                                        id="shop_city"
                                                        value={
                                                            shopForm.city
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setShopForm(
                                                                (
                                                                    current
                                                                ) => ({
                                                                    ...current,

                                                                    city:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        className="h-12 rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
                                                    />
                                                </div>


                                                <div className="space-y-2">
                                                    <Label htmlFor="shop_province">
                                                        Province{" "}
                                                        <span className="text-red-500">
                                                            *
                                                        </span>
                                                    </Label>

                                                    <Input
                                                        id="shop_province"
                                                        value={
                                                            shopForm.province
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setShopForm(
                                                                (
                                                                    current
                                                                ) => ({
                                                                    ...current,

                                                                    province:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        className="h-12 rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
                                                    />
                                                </div>


                                                <div className="space-y-2">
                                                    <Label htmlFor="shop_postal_code">
                                                        Postal code
                                                    </Label>

                                                    <Input
                                                        id="shop_postal_code"
                                                        value={
                                                            shopForm.postal_code
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setShopForm(
                                                                (
                                                                    current
                                                                ) => ({
                                                                    ...current,

                                                                    postal_code:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        className="h-12 rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
                                                    />
                                                </div>
                                            </div>


                                            <div className="space-y-3">
                                                <Label>
                                                    Operating days
                                                </Label>

                                                <div className="flex flex-wrap gap-2">
                                                    {weekDays.map(
                                                        (
                                                            day
                                                        ) => {
                                                            const selected =
                                                                shopForm.open_days.includes(
                                                                    day
                                                                );

                                                            return (
                                                                <button
                                                                    key={
                                                                        day
                                                                    }
                                                                    type="button"
                                                                    onClick={() =>
                                                                        toggleOpenDay(
                                                                            day
                                                                        )
                                                                    }
                                                                    className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                                                                        selected
                                                                            ? "border-green-600 bg-green-600 text-white shadow-sm"
                                                                            : "border-zinc-200 bg-white text-zinc-600 hover:-translate-y-0.5 hover:border-green-300 hover:bg-green-50"
                                                                    }`}
                                                                >
                                                                    {day.slice(
                                                                        0,
                                                                        3
                                                                    )}
                                                                </button>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            </div>


                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="shop_opening">
                                                        Opening time
                                                    </Label>

                                                    <Input
                                                        id="shop_opening"
                                                        type="time"
                                                        value={
                                                            shopForm.opening_time
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setShopForm(
                                                                (
                                                                    current
                                                                ) => ({
                                                                    ...current,

                                                                    opening_time:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        className="h-12 rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
                                                    />
                                                </div>


                                                <div className="space-y-2">
                                                    <Label htmlFor="shop_closing">
                                                        Closing time
                                                    </Label>

                                                    <Input
                                                        id="shop_closing"
                                                        type="time"
                                                        value={
                                                            shopForm.closing_time
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setShopForm(
                                                                (
                                                                    current
                                                                ) => ({
                                                                    ...current,

                                                                    closing_time:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        className="h-12 rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}


                                    {currentShopStep ===
                                        3 && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-xl font-black text-zinc-900">
                                                    Review junkshop profile
                                                </h3>

                                                <p className="mt-1 text-sm leading-6 text-zinc-500">
                                                    Check the public
                                                    information before saving.
                                                </p>
                                            </div>


                                            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                                                <div className="relative h-52 bg-green-100">
                                                    {shopPhotoPreview ? (
                                                        <img
                                                            src={
                                                                shopPhotoPreview
                                                            }
                                                            alt="Junkshop review"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-green-600">
                                                            <Building2 className="h-12 w-12" />
                                                        </div>
                                                    )}

                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                                                    <div className="absolute bottom-4 left-4 right-4">
                                                        <p className="text-xl font-black text-white">
                                                            {shopForm.junkshop_name ||
                                                                "Junkshop name"}
                                                        </p>

                                                        <p className="mt-1 text-sm text-white/85">
                                                            {[
                                                                shopForm.barangay,
                                                                shopForm.city,
                                                            ]
                                                                .filter(
                                                                    Boolean
                                                                )
                                                                .join(
                                                                    ", "
                                                                ) ||
                                                                "Location"}
                                                        </p>
                                                    </div>
                                                </div>


                                                <div className="space-y-4 p-5">
                                                    <ReviewRow
                                                        icon={
                                                            Phone
                                                        }
                                                        label="Contact number"
                                                        value={
                                                            shopForm.contact_number ||
                                                            "No contact number"
                                                        }
                                                    />

                                                    <ReviewRow
                                                        icon={
                                                            MapPin
                                                        }
                                                        label="Complete address"
                                                        value={
                                                            [
                                                                shopForm.address_line,
                                                                shopForm.barangay,
                                                                shopForm.city,
                                                                shopForm.province,
                                                                shopForm.postal_code,
                                                            ]
                                                                .filter(
                                                                    Boolean
                                                                )
                                                                .join(
                                                                    ", "
                                                                ) ||
                                                            "No address provided"
                                                        }
                                                    />

                                                    <ReviewRow
                                                        icon={
                                                            Clock3
                                                        }
                                                        label="Operating hours"
                                                        value={`${shopForm.open_days.length} open days · ${shopForm.opening_time}–${shopForm.closing_time}`}
                                                    />

                                                    <ReviewRow
                                                        icon={
                                                            Mail
                                                        }
                                                        label="Contact email"
                                                        value={
                                                            shopForm.contact_email ||
                                                            "No contact email"
                                                        }
                                                    />
                                                </div>
                                            </div>


                                            <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                                                <div className="flex gap-3">
                                                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />

                                                    <div>
                                                        <p className="text-sm font-bold text-zinc-900">
                                                            Verification
                                                            notice
                                                        </p>

                                                        <p className="mt-1 text-xs leading-5 text-zinc-600">
                                                            New junkshop
                                                            profiles begin
                                                            with pending
                                                            verification.
                                                            Accepted materials
                                                            may be added
                                                            immediately.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>


                            {/* DESKTOP PREVIEW */}

                            <aside className="hidden min-h-0 overflow-y-auto border-l border-green-100 bg-green-50 p-6 lg:block">
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
                                    Resident preview
                                </p>


                                <div className="mt-4 overflow-hidden rounded-[24px] border border-green-100 bg-white shadow-sm">
                                    <div className="relative h-40 bg-gradient-to-br from-green-100 to-emerald-200">
                                        {shopPhotoPreview ? (
                                            <img
                                                src={
                                                    shopPhotoPreview
                                                }
                                                alt="Junkshop listing preview"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-green-600">
                                                <Building2 className="h-11 w-11" />
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />

                                        <Badge className="absolute bottom-3 left-3 border-white/20 bg-black/30 text-white backdrop-blur-sm hover:bg-black/30">
                                            <Store className="mr-1 h-3.5 w-3.5" />

                                            Junkshop
                                        </Badge>
                                    </div>


                                    <div className="p-5">
                                        <h3 className="line-clamp-1 text-lg font-black text-zinc-900">
                                            {shopForm.junkshop_name.trim() ||
                                                "Your junkshop name"}
                                        </h3>

                                        <p className="mt-2 line-clamp-3 min-h-[60px] text-sm leading-5 text-zinc-500">
                                            {shopForm.description.trim() ||
                                                "Your junkshop description will appear here."}
                                        </p>

                                        <div className="mt-5 space-y-3 border-t border-zinc-100 pt-4">
                                            <PreviewRow
                                                icon={
                                                    MapPin
                                                }
                                                value={
                                                    [
                                                        shopForm.address_line,
                                                        shopForm.barangay,
                                                        shopForm.city,
                                                        shopForm.province,
                                                    ]
                                                        .filter(
                                                            (
                                                                value
                                                            ) =>
                                                                value.trim()
                                                        )
                                                        .join(
                                                            ", "
                                                        ) ||
                                                    "Address will appear here"
                                                }
                                            />

                                            <PreviewRow
                                                icon={
                                                    Clock3
                                                }
                                                value={`${shopForm.open_days.length} open days · ${shopForm.opening_time}–${shopForm.closing_time}`}
                                            />

                                            <PreviewRow
                                                icon={
                                                    Phone
                                                }
                                                value={
                                                    shopForm.contact_number ||
                                                    shopForm.contact_email ||
                                                    "Contact details will appear here"
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>


                                <div className="mt-4 rounded-2xl bg-white p-4 text-xs leading-5 text-zinc-500 ring-1 ring-green-100">
                                    <p className="font-bold text-zinc-700">
                                        Public information
                                    </p>

                                    <p className="mt-1">
                                        Residents use this information to
                                        decide whether the shop accepts their
                                        material and when they may visit.
                                    </p>
                                </div>
                            </aside>
                        </div>


                        {/* FOOTER */}

                        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-green-200 bg-white px-5 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] sm:px-7">
                            {currentShopStep >
                            1 ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={
                                        savingShop
                                    }
                                    onClick={
                                        goToPreviousShopStep
                                    }
                                    className="rounded-full"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />

                                    Back
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={
                                        savingShop ||
                                        compressingShopPhoto
                                    }
                                    onClick={() =>
                                        setShopDialogOpen(
                                            false
                                        )
                                    }
                                    className="rounded-full"
                                >
                                    Cancel
                                </Button>
                            )}


                            {currentShopStep <
                            shopSteps.length ? (
                                <Button
                                    type="button"
                                    disabled={
                                        compressingShopPhoto
                                    }
                                    onClick={
                                        goToNextShopStep
                                    }
                                    className="rounded-full bg-green-600 px-6 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 disabled:translate-y-0"
                                >
                                    {compressingShopPhoto ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}

                                    {compressingShopPhoto
                                        ? "Optimizing..."
                                        : "Continue"}

                                    {!compressingShopPhoto && (
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={
                                        savingShop ||
                                        compressingShopPhoto
                                    }
                                    className="rounded-full bg-green-600 px-6 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 disabled:translate-y-0"
                                >
                                    {savingShop ||
                                    compressingShopPhoto ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="mr-2 h-4 w-4" />
                                    )}

                                    {compressingShopPhoto
                                        ? "Optimizing..."
                                        : savingShop
                                          ? "Saving..."
                                          : junkshop
                                            ? "Save changes"
                                            : "Create junkshop"}
                                </Button>
                            )}
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}


/* =========================================================
   REUSABLE COMPONENTS
========================================================= */

function ImagePicker({
    preview,
    label,
    description,
    compressing,
    circular = false,
    onChange,
}: {
    preview: string | null;
    label: string;
    description: string;
    compressing: boolean;
    circular?: boolean;
    onChange:
        (
            event:
                ChangeEvent<HTMLInputElement>
        ) => void;
}) {
    const inputRef =
        useRef<HTMLInputElement | null>(
            null
        );

    return (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <Label>
                {label}
            </Label>

            <input
                ref={
                    inputRef
                }
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                    onChange
                }
                className="hidden"
            />

            <button
                type="button"
                disabled={
                    compressing
                }
                onClick={() =>
                    inputRef.current?.click()
                }
                className={`group relative mt-3 flex overflow-hidden border-2 border-dashed border-green-300 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-green-500 hover:shadow-md disabled:cursor-wait disabled:opacity-80 ${
                    circular
                        ? "mx-auto h-44 w-44 rounded-full"
                        : "h-52 w-full rounded-2xl"
                }`}
            >
                {preview ? (
                    <>
                        <img
                            src={
                                preview
                            }
                            alt={`${label} preview`}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                        />

                        <div className="absolute inset-0 bg-black/20 transition-colors duration-300 group-hover:bg-black/40" />

                        <div className="relative z-10 m-auto flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-green-700 shadow-lg">
                            <Camera className="h-4 w-4" />

                            Change photo
                        </div>
                    </>
                ) : (
                    <div className="m-auto flex flex-col items-center px-5 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600 transition-transform duration-300 group-hover:scale-105">
                            <UploadCloud className="h-7 w-7" />
                        </div>

                        <p className="mt-4 font-black text-zinc-900">
                            Upload photo
                        </p>
                    </div>
                )}

                {compressing && (
                    <div
                        className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 ${
                            circular
                                ? "rounded-full"
                                : ""
                        }`}
                    >
                        <Loader2 className="h-8 w-8 animate-spin text-green-600" />

                        <p className="mt-3 text-sm font-bold text-zinc-900">
                            Optimizing image
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                            Preparing a smaller WebP file
                        </p>
                    </div>
                )}
            </button>


            <div className="mt-3 flex items-start gap-2 rounded-xl border border-green-100 bg-green-50 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />

                <p className="text-xs leading-5 text-zinc-600">
                    {
                        description
                    }
                </p>
            </div>
        </div>
    );
}


function InformationCard({
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
        <div className="flex gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-green-600 shadow-sm">
                <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    {label}
                </p>

                <p className="mt-1 break-words text-sm font-semibold leading-5 text-zinc-700">
                    {value}
                </p>
            </div>
        </div>
    );
}


function SummaryCard({
    title,
    value,
    description,
    icon: Icon,
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
}) {
    return (
        <div className="group rounded-[24px] border border-green-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-500">
                        {title}
                    </p>

                    <p className="mt-2 truncate text-2xl font-black text-zinc-900">
                        {value}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                        {description}
                    </p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600 transition-transform duration-300 group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}


function SimpleFeature({
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
                <p className="font-bold text-zinc-900">
                    {title}
                </p>

                <p className="mt-1 text-sm leading-5 text-zinc-500">
                    {description}
                </p>
            </div>
        </div>
    );
}


function ReviewRow({
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    {label}
                </p>

                <p className="mt-1 break-words text-sm font-semibold leading-5 text-zinc-700">
                    {value}
                </p>
            </div>
        </div>
    );
}


function PreviewRow({
    icon: Icon,
    value,
}: {
    icon:
        ComponentType<{
            className?: string;
        }>;

    value: string;
}) {
    return (
        <div className="flex items-start gap-2.5">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />

            <p className="break-words text-xs leading-5 text-zinc-600">
                {value}
            </p>
        </div>
    );
}


function ProfileErrorState({
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
                    Profile unavailable
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


function RecyclerProfileSkeleton() {
    return (
        <div className="space-y-7">
            <div className="space-y-3">
                <Skeleton className="h-4 w-40 bg-green-100" />

                <Skeleton className="h-9 w-72 max-w-full bg-green-100" />

                <Skeleton className="h-4 w-96 max-w-full bg-green-100" />
            </div>


            <Skeleton className="h-60 rounded-[32px] bg-green-100" />


            <div className="grid gap-5 lg:grid-cols-2">
                <Skeleton className="h-80 rounded-[28px] bg-green-100" />

                <Skeleton className="h-80 rounded-[28px] bg-green-100" />
            </div>


            <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
                <Skeleton className="h-80 rounded-[28px] bg-green-100" />

                <Skeleton className="h-80 rounded-[28px] bg-green-100" />
            </div>


            <div className="grid gap-4 sm:grid-cols-3">
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
                            className="h-32 rounded-[24px] bg-green-100"
                        />
                    )
                )}
            </div>


            <Skeleton className="h-72 rounded-[28px] bg-green-100" />
        </div>
    );
}