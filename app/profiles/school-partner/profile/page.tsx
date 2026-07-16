"use client";

import type {
    ChangeEvent,
    ComponentType,
    FormEvent,
    ReactNode,
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
    ClipboardList,
    Clock3,
    Edit3,
    ImagePlus,
    Loader2,
    LockKeyhole,
    Mail,
    MapPin,
    Phone,
    Plus,
    Power,
    RefreshCcw,
    School,
    ShieldCheck,
    Truck,
    UploadCloud,
    UserRound,
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

type OrganizationType =
    | "school"
    | "community"
    | "nonprofit"
    | "other";


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
    organization_type: OrganizationType;

    description: string | null;
    project_description: string | null;
    photo_url: string | null;

    address_line: string;
    barangay: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;

    latitude: number | null;
    longitude: number | null;

    contact_person: string | null;
    contact_number: string | null;
    contact_email: string | null;

    verification_status: VerificationStatus;
    is_active: boolean;

    created_at: string;
    updated_at: string;
}


interface AccountForm {
    full_name: string;
    barangay: string;
    city: string;
    province: string;
    avatar_file: File | null;
}


interface PartnerForm {
    organization_name: string;
    organization_type: OrganizationType;

    description: string;
    project_description: string;

    address_line: string;
    barangay: string;
    city: string;
    province: string;
    postal_code: string;

    contact_person: string;
    contact_number: string;
    contact_email: string;

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

const organizationTypes: Array<{
    value: OrganizationType;
    label: string;
    description: string;
}> = [
    {
        value: "school",
        label: "School",
        description:
            "Elementary, secondary, integrated, private, or higher education institution.",
    },
    {
        value: "community",
        label: "Community organization",
        description:
            "Barangay, youth group, neighborhood, or civic organization.",
    },
    {
        value: "nonprofit",
        label: "Nonprofit organization",
        description:
            "Foundation, association, advocacy group, or charitable institution.",
    },
    {
        value: "other",
        label: "Other partner",
        description:
            "Another organization participating in resource recovery.",
    },
];


const setupSteps = [
    {
        number: 1,
        title: "Organization",
        description:
            "Add the organization identity, photo, type, and description.",
    },
    {
        number: 2,
        title: "Contact and location",
        description:
            "Provide the contact person, address, and communication details.",
    },
    {
        number: 3,
        title: "Review",
        description:
            "Review the partner information before saving.",
    },
];


const SUPPORTED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];


const MAXIMUM_SOURCE_IMAGE_BYTES =
    15 * 1024 * 1024;


/* =========================================================
   FORM HELPERS
========================================================= */

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


function emptyPartnerForm(
    profile: Profile | null
): PartnerForm {
    return {
        organization_name:
            "",

        organization_type:
            "school",

        description:
            "",

        project_description:
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

        contact_person:
            profile?.full_name ??
            "",

        contact_number:
            "",

        contact_email:
            profile?.email ??
            "",

        photo_file:
            null,
    };
}


/* =========================================================
   GENERAL HELPERS
========================================================= */

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


function formatMemberSince(
    value: string
) {
    return new Date(
        value
    ).toLocaleDateString(
        "en-PH",
        {
            month: "long",
            year: "numeric",
        }
    );
}


function formatFileSize(
    bytes: number
) {
    if (
        bytes <
        1024
    ) {
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


function formatOrganizationType(
    value: OrganizationType
) {
    return (
        organizationTypes.find(
            (
                item
            ) =>
                item.value ===
                value
        )?.label ??
        "Partner organization"
    );
}


function formatPartnerLocation(
    partner: SchoolPartner | null,
    profile: Profile
) {
    return [
        partner?.barangay ??
            profile.barangay,

        partner?.city ??
            profile.city,

        partner?.province ??
            profile.province,
    ]
        .filter(
            Boolean
        )
        .join(
            ", "
        );
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
    status: VerificationStatus
) {
    switch (status) {
        case "approved":
            return {
                label:
                    "Verified partner",

                title:
                    "Your organization is verified",

                description:
                    "The organization may participate in Trashure collection and recovery activities.",

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
                    "The partner profile needs correction",

                description:
                    "Review the organization identity, contact information, address, and project description.",

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
                    "The organization is temporarily suspended",

                description:
                    "Collection drives and pickup requests may be unavailable until access is restored.",

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
                    "The organization profile is being reviewed",

                description:
                    "You may complete the profile and prepare collection activities while waiting for approval.",

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

export default function SchoolPartnerProfilePage() {
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


    /* Organization dialog */

    const [
        partnerDialogOpen,
        setPartnerDialogOpen,
    ] =
        useState(
            false
        );

    const [
        currentStep,
        setCurrentStep,
    ] =
        useState(
            1
        );

    const [
        partnerForm,
        setPartnerForm,
    ] =
        useState<PartnerForm>(
            emptyPartnerForm(
                null
            )
        );

    const [
        partnerPhotoPreview,
        setPartnerPhotoPreview,
    ] =
        useState<string | null>(
            null
        );

    const [
        compressingPartnerPhoto,
        setCompressingPartnerPhoto,
    ] =
        useState(
            false
        );

    const [
        savingPartner,
        setSavingPartner,
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
                                "School partner profile was not found."
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
                                postal_code,
                                latitude,
                                longitude,
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

                    setPartner(
                        (
                            partnerData as
                                | SchoolPartner
                                | null
                        ) ?? null
                    );
                } catch (error) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : "Unable to load the school partner profile.";

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
                    partnerPhotoPreview?.startsWith(
                        "blob:"
                    )
                ) {
                    URL.revokeObjectURL(
                        partnerPhotoPreview
                    );
                }
            };
        },
        [
            partnerPhotoPreview,
        ]
    );


    /* =====================================================
       STORAGE
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

            if (!selectedFile) {
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
                                450 * 1024,

                            filenamePrefix:
                                "partner-avatar",
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

                setAvatarPreview(
                    URL.createObjectURL(
                        compressedFile
                    )
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

                toast.success(
                    `Avatar optimized to ${formatFileSize(
                        compressedFile.size
                    )}.`
                );
            } catch (error) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Unable to prepare the account image."
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
       ORGANIZATION ACTIONS
    ===================================================== */

    const openPartnerDialog =
        () => {
            setCurrentStep(
                1
            );

            setPartnerForm({
                organization_name:
                    partner?.organization_name ??
                    "",

                organization_type:
                    partner?.organization_type ??
                    "school",

                description:
                    partner?.description ??
                    "",

                project_description:
                    partner?.project_description ??
                    "",

                address_line:
                    partner?.address_line ??
                    "",

                barangay:
                    partner?.barangay ??
                    profile?.barangay ??
                    "",

                city:
                    partner?.city ??
                    profile?.city ??
                    "",

                province:
                    partner?.province ??
                    profile?.province ??
                    "",

                postal_code:
                    partner?.postal_code ??
                    "",

                contact_person:
                    partner?.contact_person ??
                    profile?.full_name ??
                    "",

                contact_number:
                    partner?.contact_number ??
                    "",

                contact_email:
                    partner?.contact_email ??
                    profile?.email ??
                    "",

                photo_file:
                    null,
            });

            setPartnerPhotoPreview(
                partner?.photo_url ??
                null
            );

            setPartnerDialogOpen(
                true
            );
        };


    const handlePartnerPhotoChange =
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

            if (!selectedFile) {
                return;
            }

            setCompressingPartnerPhoto(
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
                                "school-partner",
                        }
                    );

                if (
                    partnerPhotoPreview?.startsWith(
                        "blob:"
                    )
                ) {
                    URL.revokeObjectURL(
                        partnerPhotoPreview
                    );
                }

                setPartnerPhotoPreview(
                    URL.createObjectURL(
                        compressedFile
                    )
                );

                setPartnerForm(
                    (
                        current
                    ) => ({
                        ...current,

                        photo_file:
                            compressedFile,
                    })
                );

                toast.success(
                    `Organization image optimized to ${formatFileSize(
                        compressedFile.size
                    )}.`
                );
            } catch (error) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Unable to prepare the organization image."
                );
            } finally {
                setCompressingPartnerPhoto(
                    false
                );
            }
        };


    const validatePartnerStep =
        (
            step: number
        ) => {
            if (
                step === 1
            ) {
                if (
                    !partnerForm.organization_name.trim()
                ) {
                    toast.error(
                        "Enter the organization name."
                    );

                    return false;
                }

                if (
                    !partnerPhotoPreview
                ) {
                    toast.error(
                        "Add a clear organization or campus photo."
                    );

                    return false;
                }

                if (
                    !partnerForm.description.trim()
                ) {
                    toast.error(
                        "Add a short organization description."
                    );

                    return false;
                }
            }


            if (
                step === 2
            ) {
                if (
                    !partnerForm.address_line.trim() ||
                    !partnerForm.barangay.trim() ||
                    !partnerForm.city.trim() ||
                    !partnerForm.province.trim()
                ) {
                    toast.error(
                        "Complete all required address fields."
                    );

                    return false;
                }

                if (
                    !partnerForm.contact_person.trim()
                ) {
                    toast.error(
                        "Enter the contact person's name."
                    );

                    return false;
                }

                if (
                    !partnerForm.contact_number.trim()
                ) {
                    toast.error(
                        "Enter the contact number."
                    );

                    return false;
                }

                if (
                    partnerForm.contact_email.trim() &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                        partnerForm.contact_email.trim()
                    )
                ) {
                    toast.error(
                        "Enter a valid contact email."
                    );

                    return false;
                }
            }

            return true;
        };


    const goToNextStep =
        () => {
            if (
                !validatePartnerStep(
                    currentStep
                )
            ) {
                return;
            }

            setCurrentStep(
                (
                    current
                ) =>
                    Math.min(
                        current + 1,
                        setupSteps.length
                    )
            );
        };


    const goToPreviousStep =
        () => {
            setCurrentStep(
                (
                    current
                ) =>
                    Math.max(
                        current - 1,
                        1
                    )
            );
        };


    const savePartner =
        async (
            event:
                FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            if (
                !profile ||
                savingPartner ||
                compressingPartnerPhoto ||
                !validatePartnerStep(
                    2
                )
            ) {
                return;
            }

            setSavingPartner(
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
                        partner?.photo_url ??
                        null;

                    if (
                        partnerForm.photo_file
                    ) {
                        const uploaded =
                            await uploadPublicImage({
                                bucket:
                                    "partner-images",

                                folder:
                                    `school-partners/${user.id}`,

                                file:
                                    partnerForm.photo_file,
                            });

                        uploadedPath =
                            uploaded.path;

                        photoUrl =
                            uploaded.publicUrl;
                    }


                    const payload = {
                        profile_id:
                            profile.id,

                        organization_name:
                            partnerForm.organization_name.trim(),

                        organization_type:
                            partnerForm.organization_type,

                        description:
                            partnerForm.description.trim() ||
                            null,

                        project_description:
                            partnerForm.project_description.trim() ||
                            null,

                        photo_url:
                            photoUrl,

                        address_line:
                            partnerForm.address_line.trim(),

                        barangay:
                            partnerForm.barangay.trim() ||
                            null,

                        city:
                            partnerForm.city.trim() ||
                            null,

                        province:
                            partnerForm.province.trim() ||
                            null,

                        postal_code:
                            partnerForm.postal_code.trim() ||
                            null,

                        contact_person:
                            partnerForm.contact_person.trim() ||
                            null,

                        contact_number:
                            partnerForm.contact_number.trim() ||
                            null,

                        contact_email:
                            partnerForm.contact_email.trim() ||
                            null,

                        updated_at:
                            new Date().toISOString(),
                    };


                    if (partner) {
                        const {
                            error:
                                updateError,
                        } =
                            await supabase
                                .from(
                                    "school_partners"
                                )
                                .update(
                                    payload
                                )
                                .eq(
                                    "id",
                                    partner.id
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
                                    "school_partners"
                                )
                                .insert({
                                    ...payload,

                                    verification_status:
                                        "approved",

                                    is_active:
                                        true,
                                });

                        if (
                            insertError
                        ) {
                            throw insertError;
                        }
                    }


                    const {
                        error:
                            profileUpdateError,
                    } =
                        await supabase
                            .from(
                                "profiles"
                            )
                            .update({
                                onboarding_completed:
                                    true,

                                updated_at:
                                    new Date().toISOString(),
                            })
                            .eq(
                                "id",
                                profile.id
                            );

                    if (
                        profileUpdateError
                    ) {
                        throw profileUpdateError;
                    }


                    if (
                        partnerForm.photo_file &&
                        partner?.photo_url
                    ) {
                        const oldPath =
                            getStoragePathFromPublicUrl(
                                partner.photo_url,
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
                        partner
                            ? "Updating organization profile..."
                            : "Creating organization profile...",

                    success:
                        partner
                            ? "Organization profile updated."
                            : "Organization profile created.",

                    error:
                        (
                            error
                        ) =>
                            error instanceof Error
                                ? error.message
                                : "Unable to save the organization profile.",
                }
            );


            try {
                await savePromise;

                setPartnerDialogOpen(
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
                setSavingPartner(
                    false
                );
            }
        };


    const togglePartnerVisibility =
        async () => {
            if (
                !partner ||
                changingVisibility
            ) {
                return;
            }

            const nextValue =
                !partner.is_active;

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
                                "school_partners"
                            )
                            .update({
                                is_active:
                                    nextValue,

                                updated_at:
                                    new Date().toISOString(),
                            })
                            .eq(
                                "id",
                                partner.id
                            )
                            .eq(
                                "profile_id",
                                partner.profile_id
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
                            ? "Activating organization..."
                            : "Pausing organization...",

                    success:
                        nextValue
                            ? "Organization profile activated."
                            : "Organization profile paused.",

                    error:
                        (
                            error
                        ) =>
                            error instanceof Error
                                ? error.message
                                : "Unable to update visibility.",
                }
            );


            try {
                await visibilityPromise;

                setPartner(
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
                // Sonner displays the error.
            } finally {
                setChangingVisibility(
                    false
                );
            }
        };


    /* =====================================================
       COMPLETION
    ===================================================== */

    const completionItems =
        useMemo(
            () => [
                {
                    label:
                        "Account owner",

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
                        "Organization name",

                    complete:
                        Boolean(
                            partner?.organization_name
                        ),
                },
                {
                    label:
                        "Organization photo",

                    complete:
                        Boolean(
                            partner?.photo_url
                        ),
                },
                {
                    label:
                        "Description",

                    complete:
                        Boolean(
                            partner?.description
                        ),
                },
                {
                    label:
                        "Contact person",

                    complete:
                        Boolean(
                            partner?.contact_person
                        ),
                },
                {
                    label:
                        "Contact number",

                    complete:
                        Boolean(
                            partner?.contact_number
                        ),
                },
                {
                    label:
                        "Complete address",

                    complete:
                        Boolean(
                            partner?.address_line &&
                            partner?.barangay &&
                            partner?.city &&
                            partner?.province
                        ),
                },
                {
                    label:
                        "Project description",

                    complete:
                        Boolean(
                            partner?.project_description
                        ),
                },
            ],
            [
                partner,
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

    if (loading) {
        return (
            <SchoolPartnerProfileSkeleton />
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
                    "School partner account was not found."
                }
                onRetry={() =>
                    void loadProfilePage()
                }
            />
        );
    }


    const verification =
        partner
            ? verificationDetails(
                  partner.verification_status
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
                @keyframes partnerProfileFadeUp {
                    from {
                        opacity: 0;
                        transform: translateY(9px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes partnerProfileScale {
                    from {
                        opacity: 0;
                        transform: scale(0.985);
                    }

                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes partnerProfileStep {
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
                    .partner-profile-motion {
                        animation: none !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>


            <div className="space-y-7">
                {/* PAGE HEADING */}

                <section className="partner-profile-motion animate-[partnerProfileFadeUp_.35s_ease-out_both]">
                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                                "/profiles/school-partner"
                            )
                        }
                        className="group mb-4 inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-green-700"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />

                        School partner dashboard
                    </button>


                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-sm font-bold text-green-600">
                                Account and organization
                            </p>

                            <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
                                Partner Profile
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                                Manage the coordinator account, organization
                                identity, project information, verification,
                                and public activity status.
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


                {/* HERO */}

                <section className="partner-profile-motion animate-[partnerProfileScale_.4s_ease-out_.05s_both] overflow-hidden rounded-[32px] border border-green-100 bg-white shadow-sm">
                    <div className="relative min-h-60 overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-emerald-800 p-6 text-white sm:p-8">
                        {partner?.photo_url && (
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


                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />

                        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-white/5" />


                        <div className="relative flex min-h-44 flex-col justify-between gap-8 sm:flex-row sm:items-end">
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

                                        {partner && (
                                            <Badge className="border-white/20 bg-black/20 text-white hover:bg-black/20">
                                                <Building2 className="mr-1.5 h-3.5 w-3.5" />

                                                {formatOrganizationType(
                                                    partner.organization_type
                                                )}
                                            </Badge>
                                        )}

                                        {verification &&
                                            VerificationIcon && (
                                                <Badge className="border-white/20 bg-black/20 text-white hover:bg-black/20">
                                                    <VerificationIcon className="mr-1.5 h-3.5 w-3.5" />

                                                    {
                                                        verification.label
                                                    }
                                                </Badge>
                                            )}

                                        {partner && (
                                            <Badge className="border-white/20 bg-black/20 text-white hover:bg-black/20">
                                                <Power className="mr-1.5 h-3.5 w-3.5" />

                                                {partner.is_active
                                                    ? "Active"
                                                    : "Paused"}
                                            </Badge>
                                        )}
                                    </div>


                                    <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                                        {partner?.organization_name ??
                                            "Set up your organization"}
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

                                        {formatPartnerLocation(
                                            partner,
                                            profile
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
                                        openPartnerDialog
                                    }
                                    className="rounded-full border border-white/30 bg-white/15 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/25"
                                >
                                    <Building2 className="mr-2 h-4 w-4" />

                                    {partner
                                        ? "Edit organization"
                                        : "Set up organization"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>


                {/* VERIFICATION */}

                {verification &&
                    VerificationIcon && (
                        <section
                            className={`partner-profile-motion animate-[partnerProfileFadeUp_.4s_ease-out_.1s_both] flex flex-col gap-4 rounded-[24px] border p-5 sm:flex-row sm:items-center ${verification.panelClass}`}
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

                            {partner?.verification_status ===
                                "rejected" && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={
                                        openPartnerDialog
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
                    <div className="partner-profile-motion animate-[partnerProfileFadeUp_.4s_ease-out_.15s_both] rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-zinc-900">
                                    Account information
                                </h2>

                                <p className="mt-1 text-sm text-zinc-500">
                                    Personal information for the partner
                                    account owner.
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label="Edit account"
                                onClick={
                                    openAccountDialog
                                }
                                className="rounded-full border-green-200 text-green-700 hover:bg-green-50"
                            >
                                <Edit3 className="h-4 w-4" />
                            </Button>
                        </div>


                        <div className="mt-6 flex flex-col gap-5 sm:flex-row">
                            <Avatar className="h-24 w-24 border-4 border-green-50 shadow-sm">
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

                                <AvatarFallback className="bg-green-100 text-xl font-black text-green-700">
                                    {getInitials(
                                        profile.full_name
                                    )}
                                </AvatarFallback>
                            </Avatar>


                            <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
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
                        </div>


                        <div className="mt-5 flex gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

                            <div>
                                <p className="text-sm font-bold text-zinc-800">
                                    Login email is read-only
                                </p>

                                <p className="mt-1 text-xs leading-5 text-zinc-500">
                                    The login email is kept separate from
                                    editable public profile information.
                                </p>
                            </div>
                        </div>
                    </div>


                    <div className="partner-profile-motion animate-[partnerProfileFadeUp_.4s_ease-out_.2s_both] rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-zinc-900">
                                    Profile completion
                                </h2>

                                <p className="mt-1 text-sm text-zinc-500">
                                    Complete the organization profile before
                                    publishing activities.
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

                                        <p className="text-sm font-semibold text-zinc-700">
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


                {!partner ? (
                    <PartnerSetupState
                        onSetup={
                            openPartnerDialog
                        }
                    />
                ) : (
                    <>
                        {/* ORGANIZATION INFORMATION */}

                        <section className="partner-profile-motion animate-[partnerProfileFadeUp_.4s_ease-out_.25s_both] grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
                            <div className="group overflow-hidden rounded-[28px] border border-green-100 bg-white shadow-sm">
                                <div className="relative h-72 overflow-hidden bg-green-100">
                                    {partner.photo_url ? (
                                        <img
                                            src={
                                                partner.photo_url
                                            }
                                            alt={
                                                partner.organization_name
                                            }
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                                        />
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 text-green-600">
                                            <ImagePlus className="h-12 w-12" />

                                            <p className="mt-3 text-sm font-bold">
                                                No organization photo
                                            </p>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                    <div className="absolute bottom-4 left-4 right-4">
                                        <Badge className="border-white/20 bg-black/30 text-white backdrop-blur-sm hover:bg-black/30">
                                            <Building2 className="mr-1.5 h-3.5 w-3.5" />

                                            Public organization photo
                                        </Badge>
                                    </div>
                                </div>


                                <div className="p-5">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={
                                            openPartnerDialog
                                        }
                                        className="w-full rounded-full border-green-200 text-green-700 hover:bg-green-50"
                                    >
                                        <Camera className="mr-2 h-4 w-4" />

                                        Change organization details
                                    </Button>
                                </div>
                            </div>


                            <div className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                    <div>
                                        <Badge
                                            variant="secondary"
                                            className="bg-green-50 text-green-700"
                                        >
                                            {formatOrganizationType(
                                                partner.organization_type
                                            )}
                                        </Badge>

                                        <h2 className="mt-3 text-2xl font-black text-zinc-900">
                                            {
                                                partner.organization_name
                                            }
                                        </h2>

                                        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                                            {partner.description ||
                                                "No organization description has been added."}
                                        </p>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={
                                            openPartnerDialog
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
                                        label="Organization address"
                                        value={
                                            [
                                                partner.address_line,
                                                partner.barangay,
                                                partner.city,
                                                partner.province,
                                                partner.postal_code,
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
                                            UserRound
                                        }
                                        label="Contact person"
                                        value={
                                            partner.contact_person ||
                                            "Not provided"
                                        }
                                    />

                                    <InformationCard
                                        icon={
                                            Phone
                                        }
                                        label="Contact number"
                                        value={
                                            partner.contact_number ||
                                            "Not provided"
                                        }
                                    />

                                    <InformationCard
                                        icon={
                                            Mail
                                        }
                                        label="Contact email"
                                        value={
                                            partner.contact_email ||
                                            "Not provided"
                                        }
                                    />
                                </div>
                            </div>
                        </section>


                        {/* PROJECT AND VISIBILITY */}

                        <section className="partner-profile-motion animate-[partnerProfileFadeUp_.4s_ease-out_.3s_both] grid gap-5 lg:grid-cols-2">
                            <div className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-black text-zinc-900">
                                            Project information
                                        </h2>

                                        <p className="mt-1 text-sm text-zinc-500">
                                            The organization’s planned
                                            environmental contribution.
                                        </p>
                                    </div>

                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                                        <ClipboardList className="h-5 w-5" />
                                    </div>
                                </div>


                                <div className="mt-6 rounded-2xl border border-green-100 bg-green-50/60 p-5">
                                    <p className="text-xs font-black uppercase tracking-[0.14em] text-green-600">
                                        Project description
                                    </p>

                                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-600">
                                        {partner.project_description ||
                                            "No project description has been added yet."}
                                    </p>
                                </div>


                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={
                                        openPartnerDialog
                                    }
                                    className="mt-5 rounded-full border-green-200 text-green-700 hover:bg-green-50"
                                >
                                    <Edit3 className="mr-2 h-4 w-4" />

                                    Update project
                                </Button>
                            </div>


                            <div className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
                                <h2 className="text-xl font-black text-zinc-900">
                                    Organization visibility
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-zinc-500">
                                    Pause or activate participation in
                                    Trashure partner activities.
                                </p>


                                <div className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center">
                                    <div className="flex gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-green-700 shadow-sm">
                                            <Power className="h-5 w-5" />
                                        </div>

                                        <div>
                                            <p className="font-black text-zinc-900">
                                                {partner.is_active
                                                    ? "Organization active"
                                                    : "Organization paused"}
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                                                {partner.is_active
                                                    ? "The organization may create and manage recovery activities."
                                                    : "The organization is temporarily paused."}
                                            </p>
                                        </div>
                                    </div>


                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={
                                            partner.is_active
                                        }
                                        disabled={
                                            changingVisibility
                                        }
                                        onClick={() =>
                                            void togglePartnerVisibility()
                                        }
                                        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-300 disabled:cursor-wait disabled:opacity-60 ${
                                            partner.is_active
                                                ? "bg-green-600"
                                                : "bg-zinc-300"
                                        }`}
                                    >
                                        <span
                                            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300 ${
                                                partner.is_active
                                                    ? "translate-x-7"
                                                    : "translate-x-1"
                                            }`}
                                        />

                                        {changingVisibility && (
                                            <Loader2 className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin text-green-900" />
                                        )}
                                    </button>
                                </div>


                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    <QuickLink
                                        icon={
                                            ClipboardList
                                        }
                                        title="Collection drives"
                                        description="Create and manage material campaigns."
                                        onClick={() =>
                                            router.push(
                                                "/profiles/school-partner/drives"
                                            )
                                        }
                                    />

                                    <QuickLink
                                        icon={
                                            Truck
                                        }
                                        title="Pickup requests"
                                        description="Prepare materials for recycler collection."
                                        onClick={() =>
                                            router.push(
                                                "/profiles/school-partner/pickups"
                                            )
                                        }
                                    />
                                </div>
                            </div>
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
                <DialogContent className="max-h-[94dvh] !w-[calc(100vw-1rem)] !max-w-none gap-0 overflow-hidden rounded-[26px] border border-green-200 !bg-white p-0 text-zinc-900 shadow-[0_28px_100px_rgba(0,0,0,0.35)] sm:!w-[min(92vw,680px)]">
                    <DialogHeader className="sr-only">
                        <DialogTitle>
                            Edit school partner account
                        </DialogTitle>

                        <DialogDescription>
                            Update the account owner's public information.
                        </DialogDescription>
                    </DialogHeader>


                    <form
                        onSubmit={
                            saveAccount
                        }
                        className="grid max-h-[94dvh] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-white"
                    >
                        <DialogGreenHeader
                            eyebrow="Account details"
                            title="Edit account information"
                            description="Update the account photo, owner name, and personal location."
                            icon={
                                UserRound
                            }
                        />


                        <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
                            <div className="space-y-6">
                                <ImagePicker
                                    preview={
                                        avatarPreview
                                    }
                                    label="Account photo"
                                    description="JPG, PNG, or WebP up to 15 MB. The image is compressed before upload."
                                    compressing={
                                        compressingAvatar
                                    }
                                    circular
                                    onChange={
                                        handleAvatarChange
                                    }
                                />


                                <TextInput
                                    id="account_full_name"
                                    label="Account owner"
                                    required
                                    value={
                                        accountForm.full_name
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        setAccountForm(
                                            (
                                                current
                                            ) => ({
                                                ...current,

                                                full_name:
                                                    value,
                                            })
                                        )
                                    }
                                />


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
                                </div>


                                <div className="grid gap-4 sm:grid-cols-2">
                                    <TextInput
                                        id="account_barangay"
                                        label="Barangay"
                                        value={
                                            accountForm.barangay
                                        }
                                        onChange={(
                                            value
                                        ) =>
                                            setAccountForm(
                                                (
                                                    current
                                                ) => ({
                                                    ...current,

                                                    barangay:
                                                        value,
                                                })
                                            )
                                        }
                                    />

                                    <TextInput
                                        id="account_city"
                                        label="City or municipality"
                                        value={
                                            accountForm.city
                                        }
                                        onChange={(
                                            value
                                        ) =>
                                            setAccountForm(
                                                (
                                                    current
                                                ) => ({
                                                    ...current,

                                                    city:
                                                        value,
                                                })
                                            )
                                        }
                                    />

                                    <div className="sm:col-span-2">
                                        <TextInput
                                            id="account_province"
                                            label="Province"
                                            value={
                                                accountForm.province
                                            }
                                            onChange={(
                                                value
                                            ) =>
                                                setAccountForm(
                                                    (
                                                        current
                                                    ) => ({
                                                        ...current,

                                                        province:
                                                            value,
                                                    })
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>


                        <DialogFooterActions
                            saving={
                                savingAccount
                            }
                            compressing={
                                compressingAvatar
                            }
                            saveLabel="Save account"
                            onCancel={() =>
                                setAccountDialogOpen(
                                    false
                                )
                            }
                        />
                    </form>
                </DialogContent>
            </Dialog>


            {/* =================================================
                ORGANIZATION DIALOG
            ================================================= */}

            <Dialog
                open={
                    partnerDialogOpen
                }
                onOpenChange={(
                    open
                ) => {
                    if (
                        savingPartner ||
                        compressingPartnerPhoto
                    ) {
                        return;
                    }

                    setPartnerDialogOpen(
                        open
                    );
                }}
            >
                <DialogContent className="max-h-[96dvh] !w-[calc(100vw-1rem)] !max-w-none gap-0 overflow-hidden rounded-[26px] border border-green-200 !bg-white p-0 text-zinc-900 shadow-[0_28px_100px_rgba(0,0,0,0.35)] sm:!w-[94vw] lg:!w-[1080px] lg:rounded-[30px]">
                    <DialogHeader className="sr-only">
                        <DialogTitle>
                            {partner
                                ? "Edit organization"
                                : "Create organization"}
                        </DialogTitle>

                        <DialogDescription>
                            Complete the school partner organization
                            information.
                        </DialogDescription>
                    </DialogHeader>


                    <form
                        onSubmit={
                            savePartner
                        }
                        className="grid max-h-[96dvh] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-white"
                    >
                        {/* DIALOG HEADER */}

                        <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-700 px-5 py-5 text-white sm:px-7">
                            <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10" />

                            <div className="relative flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm">
                                    <img
                                        src="/logo.png"
                                        alt="Trashure logo"
                                        className="h-full w-full object-contain"
                                    />
                                </div>

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-100">
                                        Step{" "}
                                        {
                                            currentStep
                                        }{" "}
                                        of{" "}
                                        {
                                            setupSteps.length
                                        }
                                    </p>

                                    <h2 className="mt-1 text-xl font-black sm:text-2xl">
                                        {partner
                                            ? "Edit organization profile"
                                            : "Create organization profile"}
                                    </h2>

                                    <p className="mt-1 text-sm text-green-50/85">
                                        {
                                            setupSteps[
                                                currentStep -
                                                    1
                                            ]
                                                .description
                                        }
                                    </p>
                                </div>
                            </div>


                            <div className="relative mt-5 grid grid-cols-3 gap-2">
                                {setupSteps.map(
                                    (
                                        step
                                    ) => {
                                        const active =
                                            currentStep ===
                                            step.number;

                                        const complete =
                                            currentStep >
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


                        {/* DIALOG BODY */}

                        <div className="grid min-h-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_360px]">
                            <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
                                <div
                                    key={
                                        currentStep
                                    }
                                    className="partner-profile-motion animate-[partnerProfileStep_.24s_ease-out_both]"
                                >
                                    {currentStep ===
                                        1 && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-xl font-black text-zinc-900">
                                                    Organization identity
                                                </h3>

                                                <p className="mt-1 text-sm leading-6 text-zinc-500">
                                                    Add a recognizable photo,
                                                    name, type, and public
                                                    description.
                                                </p>
                                            </div>


                                            <ImagePicker
                                                preview={
                                                    partnerPhotoPreview
                                                }
                                                label="Organization photo"
                                                description="JPG, PNG, or WebP up to 15 MB. Images are resized and compressed automatically."
                                                compressing={
                                                    compressingPartnerPhoto
                                                }
                                                onChange={
                                                    handlePartnerPhotoChange
                                                }
                                            />


                                            <TextInput
                                                id="organization_name"
                                                label="Organization name"
                                                required
                                                value={
                                                    partnerForm.organization_name
                                                }
                                                placeholder="Example: Manara Integrated School"
                                                onChange={(
                                                    value
                                                ) =>
                                                    setPartnerForm(
                                                        (
                                                            current
                                                        ) => ({
                                                            ...current,

                                                            organization_name:
                                                                value,
                                                        })
                                                    )
                                                }
                                            />


                                            <div className="space-y-3">
                                                <Label>
                                                    Organization type{" "}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </Label>

                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    {organizationTypes.map(
                                                        (
                                                            item
                                                        ) => {
                                                            const selected =
                                                                partnerForm.organization_type ===
                                                                item.value;

                                                            return (
                                                                <button
                                                                    key={
                                                                        item.value
                                                                    }
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setPartnerForm(
                                                                            (
                                                                                current
                                                                            ) => ({
                                                                                ...current,

                                                                                organization_type:
                                                                                    item.value,
                                                                            })
                                                                        )
                                                                    }
                                                                    className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                                                                        selected
                                                                            ? "border-green-600 bg-green-50 ring-1 ring-green-600"
                                                                            : "border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-green-300 hover:bg-green-50/50"
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <p className="font-black text-zinc-900">
                                                                            {
                                                                                item.label
                                                                            }
                                                                        </p>

                                                                        <div
                                                                            className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                                                                selected
                                                                                    ? "bg-green-600 text-white"
                                                                                    : "bg-zinc-100 text-zinc-400"
                                                                            }`}
                                                                        >
                                                                            {selected && (
                                                                                <Check className="h-4 w-4" />
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                                                                        {
                                                                            item.description
                                                                        }
                                                                    </p>
                                                                </button>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            </div>


                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between gap-3">
                                                    <Label htmlFor="organization_description">
                                                        Organization
                                                        description{" "}
                                                        <span className="text-red-500">
                                                            *
                                                        </span>
                                                    </Label>

                                                    <span className="text-xs text-zinc-400">
                                                        {
                                                            partnerForm
                                                                .description
                                                                .length
                                                        }
                                                        /400
                                                    </span>
                                                </div>

                                                <Textarea
                                                    id="organization_description"
                                                    rows={
                                                        5
                                                    }
                                                    maxLength={
                                                        400
                                                    }
                                                    value={
                                                        partnerForm.description
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setPartnerForm(
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
                                                    placeholder="Describe the organization, learners or community served, and sustainability activities."
                                                    className="resize-none rounded-xl border-zinc-300 bg-white focus-visible:ring-green-500"
                                                />
                                            </div>


                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between gap-3">
                                                    <Label htmlFor="project_description">
                                                        Project description
                                                    </Label>

                                                    <span className="text-xs text-zinc-400">
                                                        {
                                                            partnerForm
                                                                .project_description
                                                                .length
                                                        }
                                                        /600
                                                    </span>
                                                </div>

                                                <Textarea
                                                    id="project_description"
                                                    rows={
                                                        6
                                                    }
                                                    maxLength={
                                                        600
                                                    }
                                                    value={
                                                        partnerForm.project_description
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setPartnerForm(
                                                            (
                                                                current
                                                            ) => ({
                                                                ...current,

                                                                project_description:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                    placeholder="Describe your collection program, target materials, participants, and intended environmental impact."
                                                    className="resize-none rounded-xl border-zinc-300 bg-white focus-visible:ring-green-500"
                                                />
                                            </div>
                                        </div>
                                    )}


                                    {currentStep ===
                                        2 && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-xl font-black text-zinc-900">
                                                    Contact and location
                                                </h3>

                                                <p className="mt-1 text-sm leading-6 text-zinc-500">
                                                    Enter contact information
                                                    and an address recyclers
                                                    can recognize.
                                                </p>
                                            </div>


                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <TextInput
                                                    id="contact_person"
                                                    label="Contact person"
                                                    required
                                                    value={
                                                        partnerForm.contact_person
                                                    }
                                                    onChange={(
                                                        value
                                                    ) =>
                                                        setPartnerForm(
                                                            (
                                                                current
                                                            ) => ({
                                                                ...current,

                                                                contact_person:
                                                                    value,
                                                            })
                                                        )
                                                    }
                                                />

                                                <TextInput
                                                    id="contact_number"
                                                    label="Contact number"
                                                    required
                                                    inputMode="tel"
                                                    value={
                                                        partnerForm.contact_number
                                                    }
                                                    placeholder="09XX XXX XXXX"
                                                    onChange={(
                                                        value
                                                    ) =>
                                                        setPartnerForm(
                                                            (
                                                                current
                                                            ) => ({
                                                                ...current,

                                                                contact_number:
                                                                    value,
                                                            })
                                                        )
                                                    }
                                                />
                                            </div>


                                            <TextInput
                                                id="contact_email"
                                                label="Contact email"
                                                type="email"
                                                value={
                                                    partnerForm.contact_email
                                                }
                                                placeholder="organization@example.com"
                                                onChange={(
                                                    value
                                                ) =>
                                                    setPartnerForm(
                                                        (
                                                            current
                                                        ) => ({
                                                            ...current,

                                                            contact_email:
                                                                value,
                                                        })
                                                    )
                                                }
                                            />


                                            <TextInput
                                                id="address_line"
                                                label="Street address or landmark"
                                                required
                                                value={
                                                    partnerForm.address_line
                                                }
                                                placeholder="Street, building, campus, sitio, or nearby landmark"
                                                onChange={(
                                                    value
                                                ) =>
                                                    setPartnerForm(
                                                        (
                                                            current
                                                        ) => ({
                                                            ...current,

                                                            address_line:
                                                                value,
                                                        })
                                                    )
                                                }
                                            />


                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <TextInput
                                                    id="partner_barangay"
                                                    label="Barangay"
                                                    required
                                                    value={
                                                        partnerForm.barangay
                                                    }
                                                    onChange={(
                                                        value
                                                    ) =>
                                                        setPartnerForm(
                                                            (
                                                                current
                                                            ) => ({
                                                                ...current,

                                                                barangay:
                                                                    value,
                                                            })
                                                        )
                                                    }
                                                />

                                                <TextInput
                                                    id="partner_city"
                                                    label="City or municipality"
                                                    required
                                                    value={
                                                        partnerForm.city
                                                    }
                                                    onChange={(
                                                        value
                                                    ) =>
                                                        setPartnerForm(
                                                            (
                                                                current
                                                            ) => ({
                                                                ...current,

                                                                city:
                                                                    value,
                                                            })
                                                        )
                                                    }
                                                />

                                                <TextInput
                                                    id="partner_province"
                                                    label="Province"
                                                    required
                                                    value={
                                                        partnerForm.province
                                                    }
                                                    onChange={(
                                                        value
                                                    ) =>
                                                        setPartnerForm(
                                                            (
                                                                current
                                                            ) => ({
                                                                ...current,

                                                                province:
                                                                    value,
                                                            })
                                                        )
                                                    }
                                                />

                                                <TextInput
                                                    id="partner_postal_code"
                                                    label="Postal code"
                                                    value={
                                                        partnerForm.postal_code
                                                    }
                                                    onChange={(
                                                        value
                                                    ) =>
                                                        setPartnerForm(
                                                            (
                                                                current
                                                            ) => ({
                                                                ...current,

                                                                postal_code:
                                                                    value,
                                                            })
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )}


                                    {currentStep ===
                                        3 && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-xl font-black text-zinc-900">
                                                    Review organization
                                                </h3>

                                                <p className="mt-1 text-sm leading-6 text-zinc-500">
                                                    Check the public
                                                    information before saving.
                                                </p>
                                            </div>


                                            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                                                <div className="relative h-52 bg-green-100">
                                                    {partnerPhotoPreview ? (
                                                        <img
                                                            src={
                                                                partnerPhotoPreview
                                                            }
                                                            alt="Organization review"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-green-600">
                                                            <Building2 className="h-12 w-12" />
                                                        </div>
                                                    )}

                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                                    <div className="absolute bottom-4 left-4 right-4">
                                                        <Badge className="border-white/20 bg-black/30 text-white hover:bg-black/30">
                                                            {formatOrganizationType(
                                                                partnerForm.organization_type
                                                            )}
                                                        </Badge>

                                                        <p className="mt-2 text-xl font-black text-white">
                                                            {partnerForm.organization_name ||
                                                                "Organization name"}
                                                        </p>

                                                        <p className="mt-1 text-sm text-white/85">
                                                            {[
                                                                partnerForm.barangay,
                                                                partnerForm.city,
                                                                partnerForm.province,
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
                                                            UserRound
                                                        }
                                                        label="Contact person"
                                                        value={
                                                            partnerForm.contact_person ||
                                                            "Not provided"
                                                        }
                                                    />

                                                    <ReviewRow
                                                        icon={
                                                            Phone
                                                        }
                                                        label="Contact number"
                                                        value={
                                                            partnerForm.contact_number ||
                                                            "Not provided"
                                                        }
                                                    />

                                                    <ReviewRow
                                                        icon={
                                                            MapPin
                                                        }
                                                        label="Complete address"
                                                        value={
                                                            [
                                                                partnerForm.address_line,
                                                                partnerForm.barangay,
                                                                partnerForm.city,
                                                                partnerForm.province,
                                                                partnerForm.postal_code,
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

                                                    <ReviewRow
                                                        icon={
                                                            ClipboardList
                                                        }
                                                        label="Project"
                                                        value={
                                                            partnerForm.project_description ||
                                                            "No project description"
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
                                                            New partner
                                                            organizations
                                                            begin with pending
                                                            verification. You
                                                            may prepare
                                                            collection
                                                            activities while
                                                            waiting for
                                                            approval.
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
                                    Partner preview
                                </p>


                                <div className="mt-4 overflow-hidden rounded-[24px] border border-green-100 bg-white shadow-sm">
                                    <div className="relative h-40 bg-gradient-to-br from-green-100 to-emerald-200">
                                        {partnerPhotoPreview ? (
                                            <img
                                                src={
                                                    partnerPhotoPreview
                                                }
                                                alt="Partner preview"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-green-600">
                                                <Building2 className="h-11 w-11" />
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />

                                        <Badge className="absolute bottom-3 left-3 border-white/20 bg-black/30 text-white hover:bg-black/30">
                                            {formatOrganizationType(
                                                partnerForm.organization_type
                                            )}
                                        </Badge>
                                    </div>


                                    <div className="p-5">
                                        <h3 className="line-clamp-1 text-lg font-black text-zinc-900">
                                            {partnerForm.organization_name.trim() ||
                                                "Organization name"}
                                        </h3>

                                        <p className="mt-2 line-clamp-3 min-h-[60px] text-sm leading-5 text-zinc-500">
                                            {partnerForm.description.trim() ||
                                                "The organization description will appear here."}
                                        </p>


                                        <div className="mt-5 space-y-3 border-t border-zinc-100 pt-4">
                                            <PreviewRow
                                                icon={
                                                    MapPin
                                                }
                                                value={
                                                    [
                                                        partnerForm.address_line,
                                                        partnerForm.barangay,
                                                        partnerForm.city,
                                                        partnerForm.province,
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
                                                    UserRound
                                                }
                                                value={
                                                    partnerForm.contact_person ||
                                                    "Contact person"
                                                }
                                            />

                                            <PreviewRow
                                                icon={
                                                    Phone
                                                }
                                                value={
                                                    partnerForm.contact_number ||
                                                    partnerForm.contact_email ||
                                                    "Contact details"
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
                                        Recyclers and program participants use
                                        these details to recognize and contact
                                        the organization.
                                    </p>
                                </div>
                            </aside>
                        </div>


                        {/* DIALOG FOOTER */}

                        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-green-200 bg-white px-5 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] sm:px-7">
                            {currentStep >
                            1 ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={
                                        savingPartner
                                    }
                                    onClick={
                                        goToPreviousStep
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
                                        savingPartner ||
                                        compressingPartnerPhoto
                                    }
                                    onClick={() =>
                                        setPartnerDialogOpen(
                                            false
                                        )
                                    }
                                    className="rounded-full"
                                >
                                    Cancel
                                </Button>
                            )}


                            {currentStep <
                            setupSteps.length ? (
                                <Button
                                    type="button"
                                    disabled={
                                        compressingPartnerPhoto
                                    }
                                    onClick={
                                        goToNextStep
                                    }
                                    className="rounded-full bg-green-600 px-6 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 disabled:translate-y-0"
                                >
                                    {compressingPartnerPhoto ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}

                                    {compressingPartnerPhoto
                                        ? "Optimizing..."
                                        : "Continue"}

                                    {!compressingPartnerPhoto && (
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={
                                        savingPartner ||
                                        compressingPartnerPhoto
                                    }
                                    className="rounded-full bg-green-600 px-6 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 disabled:translate-y-0"
                                >
                                    {savingPartner ||
                                    compressingPartnerPhoto ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="mr-2 h-4 w-4" />
                                    )}

                                    {compressingPartnerPhoto
                                        ? "Optimizing..."
                                        : savingPartner
                                          ? "Saving..."
                                          : partner
                                            ? "Save changes"
                                            : "Create organization"}
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

    onChange: (
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


function TextInput({
    id,
    label,
    value,
    onChange,
    placeholder,
    required = false,
    type = "text",
    inputMode,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (
        value: string
    ) => void;
    placeholder?: string;
    required?: boolean;
    type?: string;
    inputMode?:
        | "text"
        | "email"
        | "tel"
        | "numeric"
        | "decimal"
        | "search"
        | "url";
}) {
    return (
        <div className="space-y-2">
            <Label
                htmlFor={
                    id
                }
            >
                {label}{" "}

                {required && (
                    <span className="text-red-500">
                        *
                    </span>
                )}
            </Label>

            <Input
                id={
                    id
                }
                type={
                    type
                }
                inputMode={
                    inputMode
                }
                value={
                    value
                }
                placeholder={
                    placeholder
                }
                onChange={(
                    event
                ) =>
                    onChange(
                        event.target.value
                    )
                }
                className="h-12 rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
            />
        </div>
    );
}


function DialogGreenHeader({
    eyebrow,
    title,
    description,
    icon: Icon,
}: {
    eyebrow: string;
    title: string;
    description: string;

    icon:
        ComponentType<{
            className?: string;
        }>;
}) {
    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-700 px-5 py-5 text-white sm:px-7">
            <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10" />

            <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                    <Icon className="h-6 w-6" />
                </div>

                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-100">
                        {eyebrow}
                    </p>

                    <h2 className="mt-1 text-xl font-black sm:text-2xl">
                        {title}
                    </h2>

                    <p className="mt-1 text-sm text-green-50/85">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
}


function DialogFooterActions({
    saving,
    compressing,
    saveLabel,
    onCancel,
}: {
    saving: boolean;
    compressing: boolean;
    saveLabel: string;
    onCancel: () => void;
}) {
    return (
        <div className="flex items-center justify-between gap-3 border-t border-green-200 bg-white px-5 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] sm:px-7">
            <Button
                type="button"
                variant="ghost"
                disabled={
                    saving ||
                    compressing
                }
                onClick={
                    onCancel
                }
                className="rounded-full"
            >
                Cancel
            </Button>

            <Button
                type="submit"
                disabled={
                    saving ||
                    compressing
                }
                className="rounded-full bg-green-600 px-6 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 disabled:translate-y-0"
            >
                {saving ||
                compressing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Check className="mr-2 h-4 w-4" />
                )}

                {compressing
                    ? "Optimizing..."
                    : saving
                      ? "Saving..."
                      : saveLabel}
            </Button>
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


function QuickLink({
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
            className="group flex w-full items-center gap-3 rounded-2xl border border-zinc-100 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50"
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
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

            <ArrowRight className="h-4 w-4 text-green-600 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
    );
}


function PartnerSetupState({
    onSetup,
}: {
    onSetup: () => void;
}) {
    return (
        <section className="partner-profile-motion animate-[partnerProfileFadeUp_.4s_ease-out_.25s_both] overflow-hidden rounded-[30px] border border-green-100 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
                <div className="relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-800 p-7 text-white sm:p-9">
                    <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/10" />

                    <div className="relative">
                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white p-2 shadow-lg">
                            <img
                                src="/logo.png"
                                alt="Trashure logo"
                                className="h-full w-full object-contain"
                            />
                        </div>

                        <h2 className="mt-5 text-2xl font-black">
                            Create the organization profile
                        </h2>

                        <p className="mt-3 max-w-xl text-sm leading-7 text-green-50">
                            Add the organization identity, photo, contact
                            details, address, and environmental project
                            information.
                        </p>

                        <Button
                            type="button"
                            onClick={
                                onSetup
                            }
                            className="mt-6 rounded-full bg-white px-6 text-green-700 hover:bg-green-50"
                        >
                            <Building2 className="mr-2 h-4 w-4" />

                            Set up organization

                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>


                <div className="p-7 sm:p-9">
                    <p className="text-sm font-bold uppercase tracking-wide text-green-600">
                        Profile contents
                    </p>

                    <div className="mt-5 space-y-4">
                        <FeatureRow
                            icon={
                                Building2
                            }
                            title="Organization identity"
                            description="Name, type, photo, and description."
                        />

                        <FeatureRow
                            icon={
                                MapPin
                            }
                            title="Organization location"
                            description="Address, barangay, city, and province."
                        />

                        <FeatureRow
                            icon={
                                UserRound
                            }
                            title="Contact person"
                            description="The person responsible for partner activities."
                        />

                        <FeatureRow
                            icon={
                                ClipboardList
                            }
                            title="Project description"
                            description="The planned collection and environmental program."
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}


function FeatureRow({
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
                    Partner profile unavailable
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


function SchoolPartnerProfileSkeleton() {
    return (
        <div className="space-y-7">
            <div className="space-y-3">
                <Skeleton className="h-4 w-44 bg-green-100" />

                <Skeleton className="h-9 w-72 max-w-full bg-green-100" />

                <Skeleton className="h-4 w-96 max-w-full bg-green-100" />
            </div>


            <Skeleton className="h-60 rounded-[32px] bg-green-100" />


            <div className="grid gap-5 lg:grid-cols-2">
                <Skeleton className="h-80 rounded-[28px] bg-green-100" />

                <Skeleton className="h-80 rounded-[28px] bg-green-100" />
            </div>


            <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
                <Skeleton className="h-96 rounded-[28px] bg-green-100" />

                <Skeleton className="h-96 rounded-[28px] bg-green-100" />
            </div>


            <div className="grid gap-5 lg:grid-cols-2">
                <Skeleton className="h-80 rounded-[28px] bg-green-100" />

                <Skeleton className="h-80 rounded-[28px] bg-green-100" />
            </div>
        </div>
    );
}