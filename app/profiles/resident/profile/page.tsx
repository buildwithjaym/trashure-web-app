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
    BadgeCheck,
    Camera,
    CheckCircle2,
    Clock3,
    History,
    ImagePlus,
    Loader2,
    LockKeyhole,
    LogOut,
    Mail,
    MapPin,
    MapPinned,
    RefreshCcw,
    Save,
    ScanLine,
    ShieldCheck,
    Trash2,
    UserRound,
} from "lucide-react";

import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";


const RESIDENT_BASE_PATH =
    "/resident";

const AVATAR_BUCKET =
    "avatars";

const MAX_UPLOAD_BYTES =
    8 * 1024 * 1024;

const MAX_AVATAR_BYTES =
    1.2 * 1024 * 1024;


/* =========================================================
   TYPES
========================================================= */

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


interface ResidentProfileForm {
    full_name: string;
    age: string;
    sex: string;
    barangay: string;
    city: string;
    province: string;
}


interface LatestScan {
    id: string;
    detected_object: string;
    material_type: string;
    created_at: string;
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


function emptyForm(): ResidentProfileForm {
    return {
        full_name:
            "",

        age:
            "",

        sex:
            "",

        barangay:
            "",

        city:
            "",

        province:
            "",
    };
}


function formFromProfile(
    profile: ResidentProfile
): ResidentProfileForm {
    return {
        full_name:
            profile.full_name ??
            "",

        age:
            profile.age ===
            null
                ? ""
                : String(
                      profile.age
                  ),

        sex:
            profile.sex ??
            "",

        barangay:
            profile.barangay ??
            "",

        city:
            profile.city ??
            "",

        province:
            profile.province ??
            "",
    };
}


function formatDate(
    value: string
) {
    return new Date(
        value
    ).toLocaleDateString(
        "en-PH",
        {
            month:
                "long",
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

    return formatDate(
        value
    );
}


function locationLabel(
    form: ResidentProfileForm
) {
    return [
        form.barangay,
        form.city,
        form.province,
    ]
        .map(
            (
                value
            ) =>
                value.trim()
        )
        .filter(
            Boolean
        )
        .join(
            ", "
        );
}


function isProfileReady(
    form: ResidentProfileForm
) {
    const parsedAge =
        Number(
            form.age
        );

    return Boolean(
        form.full_name.trim() &&
            Number.isFinite(
                parsedAge
            ) &&
            parsedAge >
                0 &&
            parsedAge <=
                120 &&
            form.sex.trim() &&
            form.barangay.trim() &&
            form.city.trim() &&
            form.province.trim()
    );
}


function profileCompletion(
    form: ResidentProfileForm,
    avatarAvailable: boolean
) {
    const checks = [
        Boolean(
            form.full_name.trim()
        ),
        Boolean(
            form.age.trim()
        ),
        Boolean(
            form.sex.trim()
        ),
        Boolean(
            form.barangay.trim()
        ),
        Boolean(
            form.city.trim()
        ),
        Boolean(
            form.province.trim()
        ),
        avatarAvailable,
    ];

    const completed =
        checks.filter(
            Boolean
        ).length;

    return Math.round(
        (
            completed /
            checks.length
        ) *
            100
    );
}


function getStoragePathFromPublicUrl(
    publicUrl: string | null,
    bucket: string
) {
    if (
        !publicUrl
    ) {
        return null;
    }

    const marker =
        `/storage/v1/object/public/${bucket}/`;

    const markerIndex =
        publicUrl.indexOf(
            marker
        );

    if (
        markerIndex ===
        -1
    ) {
        return null;
    }

    return decodeURIComponent(
        publicUrl.slice(
            markerIndex +
                marker.length
        )
    );
}


function canvasToBlob(
    canvas: HTMLCanvasElement,
    quality: number
) {
    return new Promise<Blob>(
        (
            resolve,
            reject
        ) => {
            canvas.toBlob(
                (
                    blob
                ) => {
                    if (
                        blob
                    ) {
                        resolve(
                            blob
                        );
                    } else {
                        reject(
                            new Error(
                                "The image could not be processed."
                            )
                        );
                    }
                },
                "image/webp",
                quality
            );
        }
    );
}


async function compressAvatar(
    file: File
) {
    const objectUrl =
        URL.createObjectURL(
            file
        );

    try {
        const image =
            await new Promise<HTMLImageElement>(
                (
                    resolve,
                    reject
                ) => {
                    const nextImage =
                        new Image();

                    nextImage.onload =
                        () =>
                            resolve(
                                nextImage
                            );

                    nextImage.onerror =
                        () =>
                            reject(
                                new Error(
                                    "The selected image could not be opened."
                                )
                            );

                    nextImage.src =
                        objectUrl;
                }
            );


        const maximumDimension =
            1024;

        const scale =
            Math.min(
                1,
                maximumDimension /
                    Math.max(
                        image.width,
                        image.height
                    )
            );

        const width =
            Math.max(
                1,
                Math.round(
                    image.width *
                        scale
                )
            );

        const height =
            Math.max(
                1,
                Math.round(
                    image.height *
                        scale
                )
            );

        const canvas =
            document.createElement(
                "canvas"
            );

        canvas.width =
            width;

        canvas.height =
            height;

        const context =
            canvas.getContext(
                "2d"
            );

        if (
            !context
        ) {
            throw new Error(
                "Image processing is not supported by this browser."
            );
        }

        context.drawImage(
            image,
            0,
            0,
            width,
            height
        );


        const qualities = [
            0.86,
            0.8,
            0.74,
            0.68,
            0.6,
        ];

        let blob =
            await canvasToBlob(
                canvas,
                qualities[0]
            );

        for (
            const quality of qualities.slice(
                1
            )
        ) {
            if (
                blob.size <=
                MAX_AVATAR_BYTES
            ) {
                break;
            }

            blob =
                await canvasToBlob(
                    canvas,
                    quality
                );
        }


        if (
            blob.size >
            MAX_AVATAR_BYTES
        ) {
            throw new Error(
                "The image remains too large after compression. Choose a smaller photo."
            );
        }


        return new File(
            [
                blob,
            ],
            "resident-avatar.webp",
            {
                type:
                    "image/webp",
            }
        );
    } finally {
        URL.revokeObjectURL(
            objectUrl
        );
    }
}


/* =========================================================
   PAGE
========================================================= */

export default function ResidentProfilePage() {
    const router =
        useRouter();

    const supabase =
        useMemo(
            () =>
                createClient(),
            []
        );

    const fileInputRef =
        useRef<HTMLInputElement | null>(
            null
        );


    const [
        profile,
        setProfile,
    ] =
        useState<ResidentProfile | null>(
            null
        );

    const [
        form,
        setForm,
    ] =
        useState<ResidentProfileForm>(
            emptyForm()
        );

    const [
        scanCount,
        setScanCount,
    ] =
        useState(
            0
        );

    const [
        latestScan,
        setLatestScan,
    ] =
        useState<LatestScan | null>(
            null
        );


    const [
        selectedAvatar,
        setSelectedAvatar,
    ] =
        useState<File | null>(
            null
        );

    const [
        avatarPreview,
        setAvatarPreview,
    ] =
        useState<string | null>(
            null
        );

    const [
        removeAvatar,
        setRemoveAvatar,
    ] =
        useState(
            false
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
        saving,
        setSaving,
    ] =
        useState(
            false
        );

    const [
        loggingOut,
        setLoggingOut,
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


    const loadProfile =
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
                            "This profile page is available only to resident accounts."
                        );
                    }

                    setProfile(
                        currentProfile
                    );

                    setForm(
                        formFromProfile(
                            currentProfile
                        )
                    );

                    setSelectedAvatar(
                        null
                    );

                    setRemoveAvatar(
                        false
                    );

                    setAvatarPreview(
                        null
                    );


                    const [
                        countResult,
                        latestResult,
                    ] =
                        await Promise.all([
                            supabase
                                .from(
                                    "scans"
                                )
                                .select(
                                    "id",
                                    {
                                        count:
                                            "exact",

                                        head:
                                            true,
                                    }
                                )
                                .eq(
                                    "user_id",
                                    currentProfile.id
                                ),

                            supabase
                                .from(
                                    "scans"
                                )
                                .select(`
                                    id,
                                    detected_object,
                                    material_type,
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
                                    1
                                )
                                .maybeSingle(),
                        ]);


                    if (
                        countResult.error
                    ) {
                        console.warn(
                            "Resident scan count unavailable:",
                            countResult.error
                        );
                    } else {
                        setScanCount(
                            countResult.count ??
                            0
                        );
                    }


                    if (
                        latestResult.error
                    ) {
                        console.warn(
                            "Latest resident scan unavailable:",
                            latestResult.error
                        );
                    } else {
                        setLatestScan(
                            (
                                latestResult.data as
                                    | LatestScan
                                    | null
                            ) ??
                            null
                        );
                    }
                } catch (
                    error
                ) {
                    const message =
                        getErrorMessage(
                            error,
                            "Unable to load the resident profile."
                        );

                    console.error(
                        "Resident profile loading failed:",
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
            void loadProfile();
        },
        [
            loadProfile,
        ]
    );


    useEffect(
        () => {
            return () => {
                if (
                    avatarPreview
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


    const currentAvatar =
        useMemo(
            () => {
                if (
                    removeAvatar
                ) {
                    return null;
                }

                return (
                    avatarPreview ??
                    profile?.avatar_url ??
                    null
                );
            },
            [
                avatarPreview,
                profile?.avatar_url,
                removeAvatar,
            ]
        );


    const completion =
        useMemo(
            () =>
                profileCompletion(
                    form,
                    Boolean(
                        currentAvatar
                    )
                ),
            [
                currentAvatar,
                form,
            ]
        );


    const formChanged =
        useMemo(
            () => {
                if (
                    !profile
                ) {
                    return false;
                }

                const original =
                    formFromProfile(
                        profile
                    );

                return (
                    JSON.stringify(
                        form
                    ) !==
                        JSON.stringify(
                            original
                        ) ||
                    Boolean(
                        selectedAvatar
                    ) ||
                    removeAvatar
                );
            },
            [
                form,
                profile,
                removeAvatar,
                selectedAvatar,
            ]
        );


    const handleAvatarChange =
        async (
            event:
                ChangeEvent<HTMLInputElement>
        ) => {
            const file =
                event.target.files?.[0];

            event.target.value =
                "";

            if (
                !file
            ) {
                return;
            }

            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {
                toast.error(
                    "Choose an image file."
                );

                return;
            }

            if (
                file.size >
                MAX_UPLOAD_BYTES
            ) {
                toast.error(
                    "The selected image must be smaller than 8 MB."
                );

                return;
            }

            try {
                const compressed =
                    await compressAvatar(
                        file
                    );

                if (
                    avatarPreview
                ) {
                    URL.revokeObjectURL(
                        avatarPreview
                    );
                }

                setSelectedAvatar(
                    compressed
                );

                setAvatarPreview(
                    URL.createObjectURL(
                        compressed
                    )
                );

                setRemoveAvatar(
                    false
                );

                toast.success(
                    "Profile photo prepared."
                );
            } catch (
                error
            ) {
                toast.error(
                    getErrorMessage(
                        error,
                        "Unable to prepare the selected image."
                    )
                );
            }
        };


    const handleRemoveAvatar =
        () => {
            if (
                avatarPreview
            ) {
                URL.revokeObjectURL(
                    avatarPreview
                );
            }

            setSelectedAvatar(
                null
            );

            setAvatarPreview(
                null
            );

            setRemoveAvatar(
                true
            );
        };


    const validateForm =
        () => {
            const age =
                Number(
                    form.age
                );

            if (
                !form.full_name.trim()
            ) {
                toast.error(
                    "Enter your full name."
                );

                return false;
            }

            if (
                !Number.isFinite(
                    age
                ) ||
                age <=
                    0 ||
                age >
                    120
            ) {
                toast.error(
                    "Enter a valid age from 1 to 120."
                );

                return false;
            }

            if (
                !form.sex
            ) {
                toast.error(
                    "Select a sex option."
                );

                return false;
            }

            if (
                !form.barangay.trim() ||
                !form.city.trim() ||
                !form.province.trim()
            ) {
                toast.error(
                    "Complete your barangay, city or municipality, and province."
                );

                return false;
            }

            return true;
        };


    const saveProfile =
        async (
            event:
                FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            if (
                !profile ||
                saving ||
                !validateForm()
            ) {
                return;
            }

            setSaving(
                true
            );

            let uploadedPath:
                string | null = null;

            const savePromise =
                (async () => {
                    let nextAvatarUrl =
                        removeAvatar
                            ? null
                            : profile.avatar_url;


                    if (
                        selectedAvatar
                    ) {
                        uploadedPath =
                            `${profile.auth_id}/${crypto.randomUUID()}.webp`;

                        const {
                            error:
                                uploadError,
                        } =
                            await supabase.storage
                                .from(
                                    AVATAR_BUCKET
                                )
                                .upload(
                                    uploadedPath,
                                    selectedAvatar,
                                    {
                                        cacheControl:
                                            "3600",

                                        contentType:
                                            "image/webp",

                                        upsert:
                                            false,
                                    }
                                );

                        if (
                            uploadError
                        ) {
                            throw uploadError;
                        }

                        const {
                            data:
                                publicUrlData,
                        } =
                            supabase.storage
                                .from(
                                    AVATAR_BUCKET
                                )
                                .getPublicUrl(
                                    uploadedPath
                                );

                        nextAvatarUrl =
                            publicUrlData.publicUrl;
                    }


                    const nextOnboardingCompleted =
                        isProfileReady(
                            form
                        );


                    const {
                        data:
                            updatedProfile,
                        error:
                            updateError,
                    } =
                        await supabase
                            .from(
                                "profiles"
                            )
                            .update({
                                full_name:
                                    form.full_name.trim(),

                                age:
                                    Number(
                                        form.age
                                    ),

                                sex:
                                    form.sex,

                                barangay:
                                    form.barangay.trim(),

                                city:
                                    form.city.trim(),

                                province:
                                    form.province.trim(),

                                avatar_url:
                                    nextAvatarUrl,

                                onboarding_completed:
                                    nextOnboardingCompleted,

                                updated_at:
                                    new Date().toISOString(),
                            })
                            .eq(
                                "id",
                                profile.id
                            )
                            .eq(
                                "auth_id",
                                profile.auth_id
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
                            .single();

                    if (
                        updateError ||
                        !updatedProfile
                    ) {
                        throw (
                            updateError ??
                            new Error(
                                "The resident profile was not updated."
                            )
                        );
                    }


                    const oldAvatarPath =
                        getStoragePathFromPublicUrl(
                            profile.avatar_url,
                            AVATAR_BUCKET
                        );


                    if (
                        oldAvatarPath &&
                        (
                            removeAvatar ||
                            selectedAvatar
                        ) &&
                        oldAvatarPath !==
                            uploadedPath
                    ) {
                        const {
                            error:
                                deleteError,
                        } =
                            await supabase.storage
                                .from(
                                    AVATAR_BUCKET
                                )
                                .remove([
                                    oldAvatarPath,
                                ]);

                        if (
                            deleteError
                        ) {
                            console.warn(
                                "Old resident avatar was not deleted:",
                                deleteError
                            );
                        }
                    }


                    setProfile(
                        updatedProfile as ResidentProfile
                    );

                    setForm(
                        formFromProfile(
                            updatedProfile as ResidentProfile
                        )
                    );

                    setSelectedAvatar(
                        null
                    );

                    setRemoveAvatar(
                        false
                    );

                    if (
                        avatarPreview
                    ) {
                        URL.revokeObjectURL(
                            avatarPreview
                        );
                    }

                    setAvatarPreview(
                        null
                    );
                })();


            toast.promise(
                savePromise,
                {
                    loading:
                        "Saving resident profile...",

                    success:
                        "Resident profile updated.",

                    error:
                        (
                            error
                        ) =>
                            getErrorMessage(
                                error,
                                "Unable to save the resident profile."
                            ),
                }
            );


            try {
                await savePromise;

                router.refresh();
            } catch {
                if (
                    uploadedPath
                ) {
                    await supabase.storage
                        .from(
                            AVATAR_BUCKET
                        )
                        .remove([
                            uploadedPath,
                        ]);
                }
            } finally {
                setSaving(
                    false
                );
            }
        };


    const resetForm =
        () => {
            if (
                !profile
            ) {
                return;
            }

            if (
                avatarPreview
            ) {
                URL.revokeObjectURL(
                    avatarPreview
                );
            }

            setForm(
                formFromProfile(
                    profile
                )
            );

            setSelectedAvatar(
                null
            );

            setAvatarPreview(
                null
            );

            setRemoveAvatar(
                false
            );
        };


    const handleLogout =
        async () => {
            if (
                loggingOut
            ) {
                return;
            }

            setLoggingOut(
                true
            );

            try {
                const {
                    error,
                } =
                    await supabase.auth.signOut();

                if (
                    error
                ) {
                    throw error;
                }

                toast.success(
                    "Signed out successfully."
                );

                router.replace(
                    "/login"
                );

                router.refresh();
            } catch (
                error
            ) {
                toast.error(
                    getErrorMessage(
                        error,
                        "Unable to sign out."
                    )
                );
            } finally {
                setLoggingOut(
                    false
                );
            }
        };


    if (
        loading
    ) {
        return (
            <ResidentProfileSkeleton />
        );
    }


    if (
        pageError ||
        !profile
    ) {
        return (
            <ResidentProfileError
                message={
                    pageError ??
                    "Resident account was not found."
                }
                onRetry={() =>
                    void loadProfile()
                }
            />
        );
    }


    return (
        <>
            <style jsx global>{`
                @keyframes residentProfileFadeUp {
                    from {
                        opacity: 0;
                        transform: translateY(9px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes residentProfileScaleIn {
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
                    .resident-profile-motion {
                        animation: none !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>


            <div className="space-y-7">
                {/* HEADER */}

                <section className="resident-profile-motion animate-[residentProfileFadeUp_.35s_ease-out_both]">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-sm font-bold text-green-600">
                                Personal account settings
                            </p>

                            <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
                                Resident Profile
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                                Keep your identity and location current so
                                Trashure can personalize recovery options and
                                nearby opportunities.
                            </p>
                        </div>


                        <Button
                            type="button"
                            variant="outline"
                            disabled={
                                refreshing ||
                                saving
                            }
                            onClick={() =>
                                void loadProfile(
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

                <section className="resident-profile-motion animate-[residentProfileScaleIn_.4s_ease-out_.04s_both] overflow-hidden rounded-[32px] border border-green-100 bg-white shadow-sm">
                    <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-emerald-800 p-6 text-white sm:p-8">
                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />

                        <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-white/5" />


                        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                                <div className="relative">
                                    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[30px] border-4 border-white bg-white shadow-xl">
                                        {currentAvatar ? (
                                            <img
                                                src={
                                                    currentAvatar
                                                }
                                                alt={
                                                    form.full_name ||
                                                    "Resident profile"
                                                }
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <img
                                                src="/logo.png"
                                                alt="Trashure logo"
                                                className="h-20 w-20 object-contain"
                                            />
                                        )}
                                    </div>


                                    <button
                                        type="button"
                                        aria-label="Choose profile photo"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        className="absolute -bottom-2 -right-2 flex h-11 w-11 items-center justify-center rounded-full border-4 border-emerald-700 bg-white text-green-700 shadow-lg transition-all duration-200 hover:scale-105 hover:bg-green-50"
                                    >
                                        <Camera className="h-5 w-5" />
                                    </button>
                                </div>


                                <div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge className="border-white/20 bg-white/15 text-white hover:bg-white/15">
                                            <UserRound className="mr-1.5 h-3.5 w-3.5" />

                                            Resident
                                        </Badge>

                                        {profile.onboarding_completed ? (
                                            <Badge className="border-white/20 bg-black/20 text-white hover:bg-black/20">
                                                <BadgeCheck className="mr-1.5 h-3.5 w-3.5" />

                                                Profile ready
                                            </Badge>
                                        ) : (
                                            <Badge className="border-white/20 bg-amber-500/20 text-white hover:bg-amber-500/20">
                                                <Clock3 className="mr-1.5 h-3.5 w-3.5" />

                                                Setup incomplete
                                            </Badge>
                                        )}
                                    </div>


                                    <h2 className="mt-4 text-2xl font-black sm:text-3xl">
                                        {form.full_name ||
                                            "Resident account"}
                                    </h2>

                                    <p className="mt-2 flex items-center gap-2 text-sm text-green-50/85">
                                        <MapPin className="h-4 w-4" />

                                        {locationLabel(
                                            form
                                        ) ||
                                            "Location not yet provided"}
                                    </p>
                                </div>
                            </div>


                            <div className="rounded-[24px] border border-white/20 bg-white/10 px-6 py-5 backdrop-blur-sm">
                                <div className="flex items-end justify-between gap-6">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-green-100">
                                            Profile completion
                                        </p>

                                        <p className="mt-2 text-4xl font-black">
                                            {
                                                completion
                                            }
                                            %
                                        </p>
                                    </div>

                                    <CheckCircle2 className="h-8 w-8 text-green-100" />
                                </div>

                                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/20">
                                    <div
                                        className="h-full rounded-full bg-white transition-all duration-700"
                                        style={{
                                            width:
                                                `${completion}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


                {/* MAIN CONTENT */}

                <form
                    onSubmit={
                        saveProfile
                    }
                    className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"
                >
                    <div className="space-y-5">
                        {/* PHOTO */}

                        <ProfileSection
                            title="Profile photo"
                            description="Use a clear photo so your account is easy to recognize."
                            icon={
                                ImagePlus
                            }
                            animationDelay="100ms"
                        >
                            <input
                                ref={
                                    fileInputRef
                                }
                                type="file"
                                accept="image/*"
                                onChange={
                                    handleAvatarChange
                                }
                                className="hidden"
                            />


                            <div className="flex flex-col gap-5 rounded-[24px] border border-green-100 bg-green-50/50 p-5 sm:flex-row sm:items-center">
                                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[26px] border-4 border-white bg-white shadow-sm">
                                    {currentAvatar ? (
                                        <img
                                            src={
                                                currentAvatar
                                            }
                                            alt={
                                                form.full_name ||
                                                "Resident avatar"
                                            }
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <UserRound className="h-9 w-9 text-green-600" />
                                    )}
                                </div>


                                <div className="flex-1">
                                    <p className="font-black text-zinc-900">
                                        Resident avatar
                                    </p>

                                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                                        JPG, PNG, or WebP up to 8 MB. The photo
                                        is converted to a compressed WebP file
                                        before upload.
                                    </p>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            className="rounded-full border-green-200 bg-white text-green-700 hover:bg-green-50"
                                        >
                                            <Camera className="mr-2 h-4 w-4" />

                                            {currentAvatar
                                                ? "Change photo"
                                                : "Add photo"}
                                        </Button>


                                        {currentAvatar && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={
                                                    handleRemoveAvatar
                                                }
                                                className="rounded-full border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />

                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </ProfileSection>


                        {/* PERSONAL */}

                        <ProfileSection
                            title="Personal information"
                            description="These details identify the resident account."
                            icon={
                                UserRound
                            }
                            animationDelay="150ms"
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <TextInput
                                    id="resident_full_name"
                                    label="Full name"
                                    required
                                    value={
                                        form.full_name
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        setForm(
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

                                <ReadOnlyField
                                    label="Email address"
                                    value={
                                        profile.email
                                    }
                                    icon={
                                        Mail
                                    }
                                />

                                <TextInput
                                    id="resident_age"
                                    label="Age"
                                    required
                                    type="number"
                                    inputMode="numeric"
                                    min="1"
                                    max="120"
                                    value={
                                        form.age
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        setForm(
                                            (
                                                current
                                            ) => ({
                                                ...current,

                                                age:
                                                    value,
                                            })
                                        )
                                    }
                                />


                                <div className="space-y-2">
                                    <Label htmlFor="resident_sex">
                                        Sex{" "}
                                        <span className="text-red-500">
                                            *
                                        </span>
                                    </Label>

                                    <select
                                        id="resident_sex"
                                        value={
                                            form.sex
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setForm(
                                                (
                                                    current
                                                ) => ({
                                                    ...current,

                                                    sex:
                                                        event.target.value,
                                                })
                                            )
                                        }
                                        className="h-12 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                                    >
                                        <option value="">
                                            Select an option
                                        </option>

                                        <option value="male">
                                            Male
                                        </option>

                                        <option value="female">
                                            Female
                                        </option>

                                        <option value="prefer_not_to_say">
                                            Prefer not to say
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </ProfileSection>


                        {/* LOCATION */}

                        <ProfileSection
                            title="Location"
                            description="Trashure uses this information to prioritize nearby junkshops and collection drives."
                            icon={
                                MapPinned
                            }
                            animationDelay="200ms"
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <TextInput
                                    id="resident_barangay"
                                    label="Barangay"
                                    required
                                    value={
                                        form.barangay
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        setForm(
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
                                    id="resident_city"
                                    label="City or municipality"
                                    required
                                    value={
                                        form.city
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        setForm(
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
                                    id="resident_province"
                                    label="Province"
                                    required
                                    value={
                                        form.province
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        setForm(
                                            (
                                                current
                                            ) => ({
                                                ...current,

                                                province:
                                                    value,
                                            })
                                        )
                                    }
                                    className="sm:col-span-2"
                                />
                            </div>


                            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 p-4">
                                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

                                <div>
                                    <p className="text-sm font-black text-zinc-900">
                                        Discovery location
                                    </p>

                                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                                        {locationLabel(
                                            form
                                        ) ||
                                            "Complete the location fields to improve nearby recovery matching."}
                                    </p>
                                </div>
                            </div>
                        </ProfileSection>


                        {/* SAVE BAR */}

                        <section className="resident-profile-motion animate-[residentProfileFadeUp_.4s_ease-out_.25s_both] sticky bottom-24 z-20 rounded-[24px] border border-green-200 bg-white/95 p-4 shadow-xl shadow-green-900/5 backdrop-blur-md md:bottom-4">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div>
                                    <p className="font-black text-zinc-900">
                                        {formChanged
                                            ? "You have unsaved changes"
                                            : "Profile information is current"}
                                    </p>

                                    <p className="mt-1 text-xs text-zinc-500">
                                        Required fields are marked with an
                                        asterisk.
                                    </p>
                                </div>


                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={
                                            saving ||
                                            !formChanged
                                        }
                                        onClick={
                                            resetForm
                                        }
                                        className="rounded-full border-zinc-200"
                                    >
                                        Reset
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={
                                            saving ||
                                            !formChanged
                                        }
                                        className="rounded-full bg-green-600 px-6 hover:bg-green-700"
                                    >
                                        {saving ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="mr-2 h-4 w-4" />
                                        )}

                                        {saving
                                            ? "Saving..."
                                            : "Save profile"}
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </div>


                    {/* SIDEBAR */}

                    <aside className="space-y-5">
                        <ProfileSidebarCard
                            title="Account status"
                            icon={
                                ShieldCheck
                            }
                        >
                            <div className="space-y-4">
                                <StatusRow
                                    label="Account type"
                                    value="Resident"
                                    positive
                                />

                                <StatusRow
                                    label="Profile setup"
                                    value={
                                        profile.onboarding_completed
                                            ? "Complete"
                                            : "Incomplete"
                                    }
                                    positive={
                                        profile.onboarding_completed
                                    }
                                />

                                <StatusRow
                                    label="Member since"
                                    value={
                                        formatDate(
                                            profile.created_at
                                        )
                                    }
                                    positive
                                />
                            </div>
                        </ProfileSidebarCard>


                        <ProfileSidebarCard
                            title="Scan activity"
                            icon={
                                ScanLine
                            }
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <MetricCard
                                    value={
                                        scanCount
                                    }
                                    label="Total scans"
                                />

                                <MetricCard
                                    value={
                                        latestScan
                                            ? formatRelativeDate(
                                                  latestScan.created_at
                                              )
                                            : "None"
                                    }
                                    label="Latest scan"
                                />
                            </div>


                            {latestScan && (
                                <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 p-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-green-600">
                                        Last identified item
                                    </p>

                                    <p className="mt-2 font-black text-zinc-900">
                                        {
                                            latestScan.detected_object
                                        }
                                    </p>

                                    <p className="mt-1 text-xs text-zinc-500">
                                        {
                                            latestScan.material_type
                                        }
                                    </p>
                                </div>
                            )}


                            <div className="mt-4 grid gap-2">
                                <Button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            `${RESIDENT_BASE_PATH}/scan`
                                        )
                                    }
                                    className="rounded-full bg-green-600 hover:bg-green-700"
                                >
                                    <ScanLine className="mr-2 h-4 w-4" />

                                    Scan an item
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        router.push(
                                            `${RESIDENT_BASE_PATH}/history`
                                        )
                                    }
                                    className="rounded-full border-green-200 text-green-700 hover:bg-green-50"
                                >
                                    <History className="mr-2 h-4 w-4" />

                                    View history
                                </Button>
                            </div>
                        </ProfileSidebarCard>


                        <ProfileSidebarCard
                            title="Account security"
                            icon={
                                LockKeyhole
                            }
                        >
                            <p className="text-sm leading-6 text-zinc-500">
                                Signing out removes the active session from
                                this browser.
                            </p>

                            <Button
                                type="button"
                                variant="outline"
                                disabled={
                                    loggingOut
                                }
                                onClick={() =>
                                    void handleLogout()
                                }
                                className="mt-4 w-full rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                                {loggingOut ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <LogOut className="mr-2 h-4 w-4" />
                                )}

                                {loggingOut
                                    ? "Signing out..."
                                    : "Sign out"}
                            </Button>
                        </ProfileSidebarCard>
                    </aside>
                </form>
            </div>
        </>
    );
}


/* =========================================================
   COMPONENTS
========================================================= */

function ProfileSection({
    title,
    description,
    icon: Icon,
    animationDelay,
    children,
}: {
    title: string;
    description: string;
    icon:
        ComponentType<{
            className?: string;
        }>;
    animationDelay: string;
    children: ReactNode;
}) {
    return (
        <section
            style={{
                animationDelay,
            }}
            className="resident-profile-motion animate-[residentProfileFadeUp_.4s_ease-out_both] rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-7"
        >
            <div className="flex items-start gap-4">
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

            <div className="mt-6">
                {children}
            </div>
        </section>
    );
}


function TextInput({
    id,
    label,
    value,
    onChange,
    required = false,
    type = "text",
    inputMode,
    min,
    max,
    className = "",
}: {
    id: string;
    label: string;
    value: string;
    onChange:
        (
            value: string
        ) => void;
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
    min?: string;
    max?: string;
    className?: string;
}) {
    return (
        <div className={`space-y-2 ${className}`}>
            <Label
                htmlFor={
                    id
                }
            >
                {label}

                {required && (
                    <span className="text-red-500">
                        {" "}*
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
                min={
                    min
                }
                max={
                    max
                }
                value={
                    value
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


function ReadOnlyField({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: string;
    icon:
        ComponentType<{
            className?: string;
        }>;
}) {
    return (
        <div className="space-y-2">
            <Label>
                {label}
            </Label>

            <div className="flex h-12 items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-600">
                <Icon className="h-4 w-4 shrink-0 text-green-600" />

                <span className="truncate">
                    {value}
                </span>
            </div>
        </div>
    );
}


function ProfileSidebarCard({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon:
        ComponentType<{
            className?: string;
        }>;
    children: ReactNode;
}) {
    return (
        <section className="resident-profile-motion animate-[residentProfileFadeUp_.4s_ease-out_.18s_both] rounded-[26px] border border-green-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                    <Icon className="h-5 w-5" />
                </div>

                <h2 className="font-black text-zinc-900">
                    {title}
                </h2>
            </div>

            <div className="mt-5">
                {children}
            </div>
        </section>
    );
}


function StatusRow({
    label,
    value,
    positive,
}: {
    label: string;
    value: string;
    positive: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-zinc-500">
                {label}
            </p>

            <div
                className={`flex items-center gap-1.5 text-sm font-bold ${
                    positive
                        ? "text-green-700"
                        : "text-amber-700"
                }`}
            >
                {positive ? (
                    <CheckCircle2 className="h-4 w-4" />
                ) : (
                    <Clock3 className="h-4 w-4" />
                )}

                {value}
            </div>
        </div>
    );
}


function MetricCard({
    value,
    label,
}: {
    value:
        | string
        | number;
    label: string;
}) {
    return (
        <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-center">
            <p className="text-xl font-black text-zinc-900">
                {value}
            </p>

            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                {label}
            </p>
        </div>
    );
}


function ResidentProfileError({
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
                    Resident profile unavailable
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


function ResidentProfileSkeleton() {
    return (
        <div className="space-y-7">
            <div className="space-y-3">
                <Skeleton className="h-4 w-48 bg-green-100" />

                <Skeleton className="h-9 w-72 max-w-full bg-green-100" />

                <Skeleton className="h-4 w-96 max-w-full bg-green-100" />
            </div>


            <Skeleton className="h-64 rounded-[32px] bg-green-100" />


            <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
                <div className="space-y-5">
                    <Skeleton className="h-64 rounded-[28px] bg-green-100" />

                    <Skeleton className="h-80 rounded-[28px] bg-green-100" />

                    <Skeleton className="h-80 rounded-[28px] bg-green-100" />
                </div>

                <div className="space-y-5">
                    <Skeleton className="h-64 rounded-[26px] bg-green-100" />

                    <Skeleton className="h-72 rounded-[26px] bg-green-100" />

                    <Skeleton className="h-52 rounded-[26px] bg-green-100" />
                </div>
            </div>
        </div>
    );
}
