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
    ArrowRight,
    BadgeCheck,
    CalendarDays,
    Camera,
    Check,
    CheckCircle2,
    CircleSlash2,
    ClipboardList,
    Clock3,
    Edit3,
    Flag,
    History,
    ImagePlus,
    Loader2,
    MapPin,
    PackageCheck,
    PlayCircle,
    Plus,
    RefreshCcw,
    School,
    Search,
    Target,
    UploadCloud,
    Weight,
} from "lucide-react";

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

/* =========================================================
   TYPES
========================================================= */

type DriveStatus = "draft" | "active" | "completed" | "cancelled";
type StatusFilter = "all" | DriveStatus;

type VerificationStatus =
    | "pending"
    | "approved"
    | "rejected"
    | "suspended";

interface Profile {
    id: string;
    auth_id: string;
    full_name: string;
    role: string;
}

interface SchoolPartner {
    id: string;
    profile_id: string;
    organization_name: string;
    organization_type: "school" | "community" | "nonprofit" | "other";
    photo_url: string | null;
    verification_status: VerificationStatus;
    is_active: boolean;
}

interface Material {
    id: string;
    material_name: string;
    category: string;
}

interface SchoolDriveRow {
    id: string;
    school_partner_id: string;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string;
    target_weight_kg: number | string | null;
    collection_location: string;
    photo_url: string | null;
    status: DriveStatus;
    created_at: string;
    updated_at: string;
}

interface DriveMaterialRow {
    id: string;
    drive_id: string;
    material_id: string;
    created_at: string;
}

interface CollectionEntryRow {
    id: string;
    drive_id: string;
    material_id: string;
    source_name: string;
    weight_kg: number | string;
    notes: string | null;
    photo_url: string | null;
    collected_at: string;
    created_at: string;
    updated_at: string;
}

interface CollectionEntry {
    id: string;
    drive_id: string;
    material_id: string;
    source_name: string;
    weight_kg: number;
    notes: string | null;
    photo_url: string | null;
    collected_at: string;
    created_at: string;
    updated_at: string;
}

interface DriveView extends Omit<SchoolDriveRow, "target_weight_kg"> {
    target_weight_kg: number | null;
    materials: Material[];
    entries: CollectionEntry[];
    collected_weight_kg: number;
    progress_percentage: number;
}

interface DriveForm {
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    target_weight_kg: string;
    collection_location: string;
    selected_material_ids: string[];
    photo_file: File | null;
}

interface CollectionForm {
    drive_id: string;
    material_id: string;
    source_name: string;
    weight_kg: string;
    notes: string;
    collected_at: string;
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

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
    { value: "all", label: "All drives" },
    { value: "active", label: "Active" },
    { value: "draft", label: "Draft" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
];

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAXIMUM_SOURCE_IMAGE_BYTES = 15 * 1024 * 1024;

/* =========================================================
   HELPERS
========================================================= */

function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
}

function getFutureDate(numberOfDays: number) {
    const date = new Date();
    date.setDate(date.getDate() + numberOfDays);
    return date.toISOString().slice(0, 10);
}

function toLocalDateTimeInput(date = new Date()) {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000)
        .toISOString()
        .slice(0, 16);
}

function emptyDriveForm(): DriveForm {
    return {
        title: "",
        description: "",
        start_date: getTodayDate(),
        end_date: getFutureDate(14),
        target_weight_kg: "",
        collection_location: "",
        selected_material_ids: [],
        photo_file: null,
    };
}

function emptyCollectionForm(driveId = ""): CollectionForm {
    return {
        drive_id: driveId,
        material_id: "",
        source_name: "",
        weight_kg: "",
        notes: "",
        collected_at: toLocalDateTimeInput(),
        photo_file: null,
    };
}

function formatWeight(value: number) {
    return new Intl.NumberFormat("en-PH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
}

function formatDate(value: string) {
    return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatDateTime(value: string) {
    return new Date(value).toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatRelativeDate(value: string) {
    const difference = Math.max(0, Date.now() - new Date(value).getTime());
    const minutes = Math.floor(difference / 60_000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

    return formatDateTime(value);
}

function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStoragePathFromPublicUrl(url: string | null, bucket: string) {
    if (!url) return null;

    const marker = `/storage/v1/object/public/${bucket}/`;
    const markerIndex = url.indexOf(marker);

    if (markerIndex === -1) return null;

    return decodeURIComponent(url.slice(markerIndex + marker.length));
}

function getStatusDetails(status: DriveStatus) {
    switch (status) {
        case "active":
            return {
                label: "Active",
                className: "border-green-200 bg-green-50 text-green-700",
                icon: PlayCircle,
            };
        case "completed":
            return {
                label: "Completed",
                className: "border-blue-200 bg-blue-50 text-blue-700",
                icon: CheckCircle2,
            };
        case "cancelled":
            return {
                label: "Cancelled",
                className: "border-red-200 bg-red-50 text-red-700",
                icon: CircleSlash2,
            };
        default:
            return {
                label: "Draft",
                className: "border-amber-200 bg-amber-50 text-amber-700",
                icon: Clock3,
            };
    }
}

function getPartnerNotice(partner: SchoolPartner) {
    if (partner.verification_status === "suspended") {
        return {
            title: "Partner access is suspended",
            description:
                "You cannot start new drives or record collections while the organization is suspended.",
            className: "border-orange-200 bg-orange-50",
            iconClass: "bg-orange-100 text-orange-700",
        };
    }

    if (!partner.is_active) {
        return {
            title: "Organization is paused",
            description:
                "Reactivate the organization profile before starting or recording collection activities.",
            className: "border-zinc-200 bg-zinc-50",
            iconClass: "bg-zinc-200 text-zinc-700",
        };
    }

    if (partner.verification_status === "rejected") {
        return {
            title: "Verification needs correction",
            description:
                "You may prepare drafts, but the organization must be approved before a drive can be started.",
            className: "border-red-200 bg-red-50",
            iconClass: "bg-red-100 text-red-700",
        };
    }

    if (partner.verification_status === "pending") {
        return {
            title: "Verification is pending",
            description:
                "You may create draft drives now. Starting a drive will become available after approval.",
            className: "border-amber-200 bg-amber-50",
            iconClass: "bg-amber-100 text-amber-700",
        };
    }

    return null;
}

/* =========================================================
   IMAGE COMPRESSION
========================================================= */

function loadImageFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);

        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(image);
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("The selected image could not be processed."));
        };

        image.src = objectUrl;
    });
}

function canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string,
    quality: number
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error("The image could not be compressed."));
                    return;
                }
                resolve(blob);
            },
            type,
            quality
        );
    });
}

async function compressImageBeforeUpload(
    file: File,
    options: CompressionOptions
): Promise<File> {
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        throw new Error("Select a JPG, PNG, or WebP image.");
    }

    if (file.size > MAXIMUM_SOURCE_IMAGE_BYTES) {
        throw new Error("The original image must not exceed 15 MB.");
    }

    const image = await loadImageFile(file);
    const originalWidth = image.naturalWidth;
    const originalHeight = image.naturalHeight;

    if (!originalWidth || !originalHeight) {
        throw new Error("The selected image has invalid dimensions.");
    }

    const initialScale = Math.min(
        1,
        options.maximumDimension / originalWidth,
        options.maximumDimension / originalHeight
    );

    let outputWidth = Math.max(1, Math.round(originalWidth * initialScale));
    let outputHeight = Math.max(1, Math.round(originalHeight * initialScale));
    let quality = 0.84;
    let compressedBlob: Blob | null = null;

    for (let attempt = 0; attempt < 8; attempt += 1) {
        const canvas = document.createElement("canvas");
        canvas.width = outputWidth;
        canvas.height = outputHeight;

        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Your browser could not prepare the image.");
        }

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(image, 0, 0, outputWidth, outputHeight);

        compressedBlob = await canvasToBlob(canvas, "image/webp", quality);

        if (compressedBlob.size <= options.targetBytes) break;

        if (quality > 0.6) {
            quality -= 0.07;
        } else {
            outputWidth = Math.max(480, Math.round(outputWidth * 0.86));
            outputHeight = Math.max(480, Math.round(outputHeight * 0.86));
        }
    }

    if (!compressedBlob) {
        throw new Error("Image compression failed.");
    }

    return new File(
        [compressedBlob],
        `${options.filenamePrefix}-${crypto.randomUUID()}.webp`,
        {
            type: "image/webp",
            lastModified: Date.now(),
        }
    );
}

/* =========================================================
   PAGE
========================================================= */

export default function SchoolPartnerDrivesPage() {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);

    const [profile, setProfile] = useState<Profile | null>(null);
    const [partner, setPartner] = useState<SchoolPartner | null>(null);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [drives, setDrives] = useState<DriveView[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pageError, setPageError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    const [driveDialogOpen, setDriveDialogOpen] = useState(false);
    const [editingDrive, setEditingDrive] = useState<DriveView | null>(null);
    const [driveForm, setDriveForm] = useState<DriveForm>(emptyDriveForm());
    const [drivePhotoPreview, setDrivePhotoPreview] = useState<string | null>(
        null
    );
    const [compressingDrivePhoto, setCompressingDrivePhoto] = useState(false);
    const [savingDrive, setSavingDrive] = useState(false);

    const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
    const [collectionDrive, setCollectionDrive] = useState<DriveView | null>(
        null
    );
    const [collectionForm, setCollectionForm] =
        useState<CollectionForm>(emptyCollectionForm());
    const [collectionPhotoPreview, setCollectionPhotoPreview] = useState<
        string | null
    >(null);
    const [compressingCollectionPhoto, setCompressingCollectionPhoto] =
        useState(false);
    const [savingCollection, setSavingCollection] = useState(false);

    const [changingDriveStatusId, setChangingDriveStatusId] = useState<
        string | null
    >(null);

    const processedActionRef = useRef(false);

    const loadDrivesPage = useCallback(
        async (silent = false) => {
            if (silent) setRefreshing(true);
            else setLoading(true);

            setPageError(null);

            try {
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError || !user) {
                    router.replace("/login");
                    return;
                }

                const { data: profileData, error: profileError } =
                    await supabase
                        .from("profiles")
                        .select("id, auth_id, full_name, role")
                        .eq("auth_id", user.id)
                        .single();

                if (profileError || !profileData) {
                    throw (
                        profileError ??
                        new Error("School partner account was not found.")
                    );
                }

                const currentProfile = profileData as Profile;

                if (currentProfile.role !== "school_partner") {
                    throw new Error(
                        "This page is available only to school partners."
                    );
                }

                setProfile(currentProfile);

                const { data: partnerData, error: partnerError } =
                    await supabase
                        .from("school_partners")
                        .select(
                            "id, profile_id, organization_name, organization_type, photo_url, verification_status, is_active"
                        )
                        .eq("profile_id", currentProfile.id)
                        .maybeSingle();

                if (partnerError) throw partnerError;

                const currentPartner =
                    (partnerData as SchoolPartner | null) ?? null;

                setPartner(currentPartner);

                const { data: materialRows, error: materialError } =
                    await supabase
                        .from("materials")
                        .select("id, material_name, category")
                        .order("category", { ascending: true })
                        .order("material_name", { ascending: true });

                if (materialError) throw materialError;

                const currentMaterials = (materialRows ?? []) as Material[];
                setMaterials(currentMaterials);

                if (!currentPartner) {
                    setDrives([]);
                    return;
                }

                const { data: driveRows, error: driveError } = await supabase
                    .from("school_drives")
                    .select(
                        "id, school_partner_id, title, description, start_date, end_date, target_weight_kg, collection_location, photo_url, status, created_at, updated_at"
                    )
                    .eq("school_partner_id", currentPartner.id)
                    .order("created_at", { ascending: false });

                if (driveError) throw driveError;

                const currentDriveRows = (driveRows ?? []) as SchoolDriveRow[];
                const driveIds = currentDriveRows.map((drive) => drive.id);

                let driveMaterialRows: DriveMaterialRow[] = [];
                let collectionRows: CollectionEntryRow[] = [];

                if (driveIds.length > 0) {
                    const [driveMaterialResult, collectionResult] =
                        await Promise.all([
                            supabase
                                .from("school_drive_materials")
                                .select("id, drive_id, material_id, created_at")
                                .in("drive_id", driveIds),
                            supabase
                                .from("school_collection_entries")
                                .select(
                                    "id, drive_id, material_id, source_name, weight_kg, notes, photo_url, collected_at, created_at, updated_at"
                                )
                                .in("drive_id", driveIds)
                                .order("collected_at", { ascending: false }),
                        ]);

                    if (driveMaterialResult.error) {
                        throw driveMaterialResult.error;
                    }

                    if (collectionResult.error) {
                        throw collectionResult.error;
                    }

                    driveMaterialRows = (driveMaterialResult.data ??
                        []) as DriveMaterialRow[];
                    collectionRows = (collectionResult.data ??
                        []) as CollectionEntryRow[];
                }

                const materialMap = new Map(
                    currentMaterials.map((material) => [material.id, material])
                );

                const normalizedEntries = collectionRows.map(
                    (entry): CollectionEntry => ({
                        id: entry.id,
                        drive_id: entry.drive_id,
                        material_id: entry.material_id,
                        source_name: entry.source_name,
                        weight_kg: Number(entry.weight_kg ?? 0),
                        notes: entry.notes,
                        photo_url: entry.photo_url,
                        collected_at: entry.collected_at,
                        created_at: entry.created_at,
                        updated_at: entry.updated_at,
                    })
                );

                const normalizedDrives = currentDriveRows.map(
                    (drive): DriveView => {
                        const driveMaterials = driveMaterialRows
                            .filter((row) => row.drive_id === drive.id)
                            .map((row) => materialMap.get(row.material_id))
                            .filter(
                                (material): material is Material =>
                                    Boolean(material)
                            );

                        const driveEntries = normalizedEntries.filter(
                            (entry) => entry.drive_id === drive.id
                        );

                        const collectedWeight = driveEntries.reduce(
                            (total, entry) => total + entry.weight_kg,
                            0
                        );

                        const targetWeight =
                            drive.target_weight_kg === null
                                ? null
                                : Number(drive.target_weight_kg);

                        const progress =
                            targetWeight && targetWeight > 0
                                ? Math.min(
                                      100,
                                      Math.round(
                                          (collectedWeight / targetWeight) * 100
                                      )
                                  )
                                : 0;

                        return {
                            ...drive,
                            target_weight_kg: targetWeight,
                            materials: driveMaterials,
                            entries: driveEntries,
                            collected_weight_kg: collectedWeight,
                            progress_percentage: progress,
                        };
                    }
                );

                setDrives(normalizedDrives);
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Unable to load collection drives.";

                setPageError(message);
                if (silent) toast.error(message);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [router, supabase]
    );

    useEffect(() => {
        void loadDrivesPage();
    }, [loadDrivesPage]);

    useEffect(() => {
        return () => {
            if (drivePhotoPreview?.startsWith("blob:")) {
                URL.revokeObjectURL(drivePhotoPreview);
            }
        };
    }, [drivePhotoPreview]);

    useEffect(() => {
        return () => {
            if (collectionPhotoPreview?.startsWith("blob:")) {
                URL.revokeObjectURL(collectionPhotoPreview);
            }
        };
    }, [collectionPhotoPreview]);

    const uploadPublicImage = async ({
        folder,
        file,
    }: {
        folder: string;
        file: File;
    }) => {
        const path = `${folder}/${crypto.randomUUID()}.webp`;

        const { error } = await supabase.storage
            .from("partner-images")
            .upload(path, file, {
                cacheControl: "31536000",
                contentType: "image/webp",
                upsert: false,
            });

        if (error) throw error;

        const { data } = supabase.storage
            .from("partner-images")
            .getPublicUrl(path);

        return { path, publicUrl: data.publicUrl };
    };

    const canPrepareDrive =
        Boolean(partner?.is_active) &&
        partner?.verification_status !== "suspended";

    const canStartDrive =
        Boolean(partner?.is_active) &&
        partner?.verification_status === "approved";

    const openCreateDrive = useCallback(() => {
        if (!partner) {
            toast.error(
                "Complete your organization profile before creating a drive."
            );
            router.push("/profiles/school-partner/profile");
            return;
        }

        if (!canPrepareDrive) {
            toast.error(
                "Reactivate or restore the organization before creating a drive."
            );
            return;
        }

        setEditingDrive(null);
        setDriveForm(emptyDriveForm());
        setDrivePhotoPreview(null);
        setDriveDialogOpen(true);
    }, [canPrepareDrive, partner, router]);

    const openEditDrive = (drive: DriveView) => {
        if (!canPrepareDrive) {
            toast.error("The organization cannot edit drives right now.");
            return;
        }

        if (drive.status === "completed" || drive.status === "cancelled") {
            toast.info("Completed or cancelled drives are kept read-only.");
            return;
        }

        setEditingDrive(drive);
        setDriveForm({
            title: drive.title,
            description: drive.description ?? "",
            start_date: drive.start_date,
            end_date: drive.end_date,
            target_weight_kg:
                drive.target_weight_kg === null
                    ? ""
                    : String(drive.target_weight_kg),
            collection_location: drive.collection_location,
            selected_material_ids: drive.materials.map(
                (material) => material.id
            ),
            photo_file: null,
        });
        setDrivePhotoPreview(drive.photo_url);
        setDriveDialogOpen(true);
    };

    const toggleDriveMaterial = (materialId: string) => {
        if (
            editingDrive?.entries.some(
                (entry) => entry.material_id === materialId
            ) &&
            driveForm.selected_material_ids.includes(materialId)
        ) {
            toast.info(
                "This material already has collection records and cannot be removed."
            );
            return;
        }

        setDriveForm((current) => {
            const selected = current.selected_material_ids.includes(materialId);
            return {
                ...current,
                selected_material_ids: selected
                    ? current.selected_material_ids.filter(
                          (id) => id !== materialId
                      )
                    : [...current.selected_material_ids, materialId],
            };
        });
    };

    const handleDrivePhotoChange = async (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const input = event.currentTarget;
        const selectedFile = input.files?.[0];
        input.value = "";

        if (!selectedFile) return;

        setCompressingDrivePhoto(true);

        try {
            const compressedFile = await compressImageBeforeUpload(
                selectedFile,
                {
                    maximumDimension: 1600,
                    targetBytes: Math.round(1.2 * 1024 * 1024),
                    filenamePrefix: "school-drive",
                }
            );

            if (drivePhotoPreview?.startsWith("blob:")) {
                URL.revokeObjectURL(drivePhotoPreview);
            }

            setDrivePhotoPreview(URL.createObjectURL(compressedFile));
            setDriveForm((current) => ({
                ...current,
                photo_file: compressedFile,
            }));

            toast.success(
                `Drive image optimized to ${formatFileSize(
                    compressedFile.size
                )}.`
            );
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to prepare the drive image."
            );
        } finally {
            setCompressingDrivePhoto(false);
        }
    };

    const validateDriveForm = () => {
        if (!driveForm.title.trim()) {
            toast.error("Enter the collection drive title.");
            return false;
        }

        if (!driveForm.start_date || !driveForm.end_date) {
            toast.error("Enter the drive start and end dates.");
            return false;
        }

        if (driveForm.end_date < driveForm.start_date) {
            toast.error("The end date cannot be earlier than the start date.");
            return false;
        }

        if (!driveForm.collection_location.trim()) {
            toast.error("Enter the material collection location.");
            return false;
        }

        if (driveForm.selected_material_ids.length === 0) {
            toast.error("Select at least one material.");
            return false;
        }

        if (
            driveForm.target_weight_kg &&
            Number(driveForm.target_weight_kg) <= 0
        ) {
            toast.error("The target weight must be greater than zero.");
            return false;
        }

        return true;
    };

    const saveDrive = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (
            !profile ||
            !partner ||
            savingDrive ||
            compressingDrivePhoto ||
            !validateDriveForm()
        ) {
            return;
        }

        setSavingDrive(true);
        let uploadedPath: string | null = null;

        const savePromise = (async () => {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                throw new Error("Your session has expired.");
            }

            let photoUrl = editingDrive?.photo_url ?? null;

            if (driveForm.photo_file) {
                const uploaded = await uploadPublicImage({
                    folder: `school-drives/${user.id}`,
                    file: driveForm.photo_file,
                });

                uploadedPath = uploaded.path;
                photoUrl = uploaded.publicUrl;
            }

            const payload = {
                school_partner_id: partner.id,
                title: driveForm.title.trim(),
                description: driveForm.description.trim() || null,
                start_date: driveForm.start_date,
                end_date: driveForm.end_date,
                target_weight_kg: driveForm.target_weight_kg
                    ? Number(driveForm.target_weight_kg)
                    : null,
                collection_location: driveForm.collection_location.trim(),
                photo_url: photoUrl,
                updated_at: new Date().toISOString(),
            };

            let driveId = editingDrive?.id ?? null;
            const previousMaterialIds = new Set(
                editingDrive?.materials.map((material) => material.id) ?? []
            );
            const nextMaterialIds = new Set(driveForm.selected_material_ids);

            if (editingDrive) {
                const { error: updateError } = await supabase
                    .from("school_drives")
                    .update(payload)
                    .eq("id", editingDrive.id)
                    .eq("school_partner_id", partner.id);

                if (updateError) throw updateError;
            } else {
                const { data: insertedDrive, error: insertError } =
                    await supabase
                        .from("school_drives")
                        .insert({
                            ...payload,
                            status: "active",
                        })
                        .select("id")
                        .single();

                if (insertError || !insertedDrive) {
                    throw (
                        insertError ??
                        new Error("The collection drive was not created.")
                    );
                }

                driveId = insertedDrive.id;
            }

            if (!driveId) {
                throw new Error("The collection drive ID is missing.");
            }

            const materialsToAdd = driveForm.selected_material_ids.filter(
                (materialId) => !previousMaterialIds.has(materialId)
            );

            const materialsToRemove = [...previousMaterialIds].filter(
                (materialId) => !nextMaterialIds.has(materialId)
            );

            if (materialsToAdd.length > 0) {
                const { error: addMaterialError } = await supabase
                    .from("school_drive_materials")
                    .upsert(
                        materialsToAdd.map((materialId) => ({
                            drive_id: driveId,
                            material_id: materialId,
                        })),
                        {
                            onConflict: "drive_id,material_id",
                            ignoreDuplicates: true,
                        }
                    );

                if (addMaterialError) throw addMaterialError;
            }

            if (materialsToRemove.length > 0) {
                const { error: removeMaterialError } = await supabase
                    .from("school_drive_materials")
                    .delete()
                    .eq("drive_id", driveId)
                    .in("material_id", materialsToRemove);

                if (removeMaterialError) throw removeMaterialError;
            }

            if (driveForm.photo_file && editingDrive?.photo_url) {
                const oldPath = getStoragePathFromPublicUrl(
                    editingDrive.photo_url,
                    "partner-images"
                );

                if (oldPath && oldPath !== uploadedPath) {
                    await supabase.storage
                        .from("partner-images")
                        .remove([oldPath]);
                }
            }
        })();

        toast.promise(savePromise, {
            loading: editingDrive
                ? "Updating collection drive..."
                : "Creating collection drive...",
            success: editingDrive
                ? "Collection drive updated."
                : "Collection drive created as a draft.",
            error: (error) =>
                error instanceof Error
                    ? error.message
                    : "Unable to save the collection drive.",
        });

        try {
            await savePromise;
            setDriveDialogOpen(false);
            setEditingDrive(null);
            await loadDrivesPage(true);
        } catch {
            if (uploadedPath) {
                await supabase.storage
                    .from("partner-images")
                    .remove([uploadedPath]);
            }
        } finally {
            setSavingDrive(false);
        }
    };

    const updateDriveStatus = async (
        drive: DriveView,
        nextStatus: DriveStatus
    ) => {
        if (changingDriveStatusId) return;

        if (nextStatus === "active" && !canStartDrive) {
            toast.error(
                "The organization must be active and verified before starting a drive."
            );
            return;
        }

        if (nextStatus === "completed" && drive.collected_weight_kg <= 0) {
            toast.error(
                "Record at least one collection before completing the drive."
            );
            return;
        }

        if (
            (nextStatus === "completed" || nextStatus === "cancelled") &&
            !window.confirm(
                nextStatus === "completed"
                    ? "Mark this drive as completed?"
                    : "Cancel this drive?"
            )
        ) {
            return;
        }

        setChangingDriveStatusId(drive.id);

        const statusPromise = (async () => {
            const { error } = await supabase
                .from("school_drives")
                .update({
                    status: nextStatus,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", drive.id)
                .eq("school_partner_id", drive.school_partner_id);

            if (error) throw error;
        })();

        const statusLabel = getStatusDetails(nextStatus).label;

        toast.promise(statusPromise, {
            loading: `Updating drive to ${statusLabel.toLowerCase()}...`,
            success: `Drive status changed to ${statusLabel.toLowerCase()}.`,
            error: (error) =>
                error instanceof Error
                    ? error.message
                    : "Unable to update the drive status.",
        });

        try {
            await statusPromise;
            await loadDrivesPage(true);
        } finally {
            setChangingDriveStatusId(null);
        }
    };

    const openCollectionDialog = useCallback((drive: DriveView) => {
        if (drive.status !== "active") {
            toast.error("Collections can only be recorded for active drives.");
            return;
        }

        setCollectionDrive(drive);
        setCollectionForm({
            ...emptyCollectionForm(drive.id),
            material_id: drive.materials[0]?.id ?? "",
        });
        setCollectionPhotoPreview(null);
        setCollectionDialogOpen(true);
    }, []);

    const handleCollectionPhotoChange = async (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const input = event.currentTarget;
        const selectedFile = input.files?.[0];
        input.value = "";

        if (!selectedFile) return;

        setCompressingCollectionPhoto(true);

        try {
            const compressedFile = await compressImageBeforeUpload(
                selectedFile,
                {
                    maximumDimension: 1400,
                    targetBytes: 900 * 1024,
                    filenamePrefix: "school-collection",
                }
            );

            if (collectionPhotoPreview?.startsWith("blob:")) {
                URL.revokeObjectURL(collectionPhotoPreview);
            }

            setCollectionPhotoPreview(URL.createObjectURL(compressedFile));
            setCollectionForm((current) => ({
                ...current,
                photo_file: compressedFile,
            }));

            toast.success(
                `Collection image optimized to ${formatFileSize(
                    compressedFile.size
                )}.`
            );
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to prepare the collection image."
            );
        } finally {
            setCompressingCollectionPhoto(false);
        }
    };

    const validateCollectionForm = () => {
        if (!collectionDrive) {
            toast.error("Select a collection drive.");
            return false;
        }

        if (!collectionForm.material_id) {
            toast.error("Select the collected material.");
            return false;
        }

        if (!collectionForm.source_name.trim()) {
            toast.error(
                "Enter the class, department, club, or collection source."
            );
            return false;
        }

        if (!collectionForm.weight_kg || Number(collectionForm.weight_kg) <= 0) {
            toast.error("Enter a valid collected weight.");
            return false;
        }

        if (!collectionForm.collected_at) {
            toast.error("Enter the collection date and time.");
            return false;
        }

        return true;
    };

    const saveCollection = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (
            !profile ||
            !collectionDrive ||
            savingCollection ||
            compressingCollectionPhoto ||
            !validateCollectionForm()
        ) {
            return;
        }

        setSavingCollection(true);
        let uploadedPath: string | null = null;

        const savePromise = (async () => {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                throw new Error("Your session has expired.");
            }

            let photoUrl: string | null = null;

            if (collectionForm.photo_file) {
                const uploaded = await uploadPublicImage({
                    folder: `school-collections/${user.id}`,
                    file: collectionForm.photo_file,
                });

                uploadedPath = uploaded.path;
                photoUrl = uploaded.publicUrl;
            }

            const { error } = await supabase
                .from("school_collection_entries")
                .insert({
                    drive_id: collectionDrive.id,
                    material_id: collectionForm.material_id,
                    source_name: collectionForm.source_name.trim(),
                    weight_kg: Number(collectionForm.weight_kg),
                    notes: collectionForm.notes.trim() || null,
                    photo_url: photoUrl,
                    collected_at: new Date(
                        collectionForm.collected_at
                    ).toISOString(),
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;
        })();

        toast.promise(savePromise, {
            loading: "Recording collected material...",
            success: "Collection recorded successfully.",
            error: (error) =>
                error instanceof Error
                    ? error.message
                    : "Unable to record the collection.",
        });

        try {
            await savePromise;
            setCollectionDialogOpen(false);
            setCollectionDrive(null);
            await loadDrivesPage(true);
        } catch {
            if (uploadedPath) {
                await supabase.storage
                    .from("partner-images")
                    .remove([uploadedPath]);
            }
        } finally {
            setSavingCollection(false);
        }
    };

    useEffect(() => {
        if (loading || processedActionRef.current) return;

        processedActionRef.current = true;

        const parameters = new URLSearchParams(window.location.search);
        const action = parameters.get("action");

        if (action === "create") {
            openCreateDrive();
        }

        if (action === "record") {
            const activeDrive = drives.find((drive) => drive.status === "active");

            if (activeDrive) {
                openCollectionDialog(activeDrive);
            } else {
                toast.info(
                    "Start a collection drive before recording materials."
                );
            }
        }

        if (action) {
            router.replace("/profiles/school-partner/drives");
        }
    }, [drives, loading, openCollectionDialog, openCreateDrive, router]);

    const activeDrives = useMemo(
        () => drives.filter((drive) => drive.status === "active"),
        [drives]
    );

    const completedDrives = useMemo(
        () => drives.filter((drive) => drive.status === "completed"),
        [drives]
    );

    const totalCollectedWeight = useMemo(
        () =>
            drives.reduce(
                (total, drive) => total + drive.collected_weight_kg,
                0
            ),
        [drives]
    );

    const activeTargetWeight = useMemo(
        () =>
            activeDrives.reduce(
                (total, drive) => total + (drive.target_weight_kg ?? 0),
                0
            ),
        [activeDrives]
    );

    const activeCollectedWeight = useMemo(
        () =>
            activeDrives.reduce(
                (total, drive) => total + drive.collected_weight_kg,
                0
            ),
        [activeDrives]
    );

    const activeTargetProgress = useMemo(
        () =>
            activeTargetWeight > 0
                ? Math.min(
                      100,
                      Math.round(
                          (activeCollectedWeight / activeTargetWeight) * 100
                      )
                  )
                : 0,
        [activeCollectedWeight, activeTargetWeight]
    );

    const featuredDrive = activeDrives[0] ?? null;

    const filteredDrives = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        return drives.filter((drive) => {
            const matchesStatus =
                statusFilter === "all" || drive.status === statusFilter;

            const searchableText = [
                drive.title,
                drive.description ?? "",
                drive.collection_location,
                ...drive.materials.map((material) => material.material_name),
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !normalizedSearch || searchableText.includes(normalizedSearch);

            return matchesStatus && matchesSearch;
        });
    }, [drives, searchQuery, statusFilter]);

    const recentEntries = useMemo(
        () =>
            drives
                .flatMap((drive) =>
                    drive.entries.map((entry) => ({
                        ...entry,
                        drive_title: drive.title,
                    }))
                )
                .sort(
                    (first, second) =>
                        new Date(second.collected_at).getTime() -
                        new Date(first.collected_at).getTime()
                )
                .slice(0, 6),
        [drives]
    );

    const materialMap = useMemo(
        () => new Map(materials.map((material) => [material.id, material])),
        [materials]
    );

    if (loading) return <DrivesPageSkeleton />;

    if (pageError || !profile) {
        return (
            <DrivesErrorState
                message={pageError ?? "School partner account was not found."}
                onRetry={() => void loadDrivesPage()}
            />
        );
    }

    if (!partner) {
        return (
            <MissingPartnerState
                onSetup={() =>
                    router.push("/profiles/school-partner/profile")
                }
            />
        );
    }

    const partnerNotice = getPartnerNotice(partner);

    return (
        <>
            <style jsx global>{`
                @keyframes driveFadeUp {
                    from {
                        opacity: 0;
                        transform: translateY(9px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes driveSoftScale {
                    from {
                        opacity: 0;
                        transform: scale(0.985);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes driveDialogIn {
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
                    .drive-motion {
                        animation: none !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>

            <div className="space-y-7">
                <section className="drive-motion animate-[driveFadeUp_.35s_ease-out_both]">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-sm font-bold text-green-600">
                                Material collection program
                            </p>
                            <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
                                Collection Drives
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                                Create recycling campaigns, record collected
                                materials, and monitor progress toward your
                                organization&apos;s recovery targets.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={refreshing}
                                onClick={() => void loadDrivesPage(true)}
                                className="rounded-full border-green-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-50 hover:text-green-700"
                            >
                                <RefreshCcw
                                    className={`mr-2 h-4 w-4 ${
                                        refreshing ? "animate-spin" : ""
                                    }`}
                                />
                                Refresh
                            </Button>

                            <Button
                                type="button"
                                onClick={openCreateDrive}
                                disabled={!canPrepareDrive}
                                className="rounded-full bg-green-600 px-6 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create drive
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="drive-motion animate-[driveSoftScale_.4s_ease-out_.04s_both] overflow-hidden rounded-[30px] border border-green-100 bg-white shadow-sm">
                    <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-emerald-800 p-6 text-white sm:p-8">
                        {partner.photo_url && (
                            <>
                                <img
                                    src={partner.photo_url}
                                    alt={partner.organization_name}
                                    className="absolute inset-0 h-full w-full object-cover opacity-20"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-green-950/90 via-emerald-800/80 to-emerald-700/60" />
                            </>
                        )}

                        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10" />

                        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                            <div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge className="border-white/20 bg-white/15 text-white hover:bg-white/15">
                                        <School className="mr-1.5 h-3.5 w-3.5" />
                                        {partner.organization_name}
                                    </Badge>

                                    <Badge className="border-white/20 bg-black/20 text-white hover:bg-black/20">
                                        {partner.is_active
                                            ? "Active partner"
                                            : "Partner paused"}
                                    </Badge>

                                    {partner.verification_status ===
                                        "approved" && (
                                        <Badge className="border-white/20 bg-black/20 text-white hover:bg-black/20">
                                            <BadgeCheck className="mr-1.5 h-3.5 w-3.5" />
                                            Verified
                                        </Badge>
                                    )}
                                </div>

                                <h2 className="mt-4 text-2xl font-black sm:text-3xl">
                                    Build a measurable recovery campaign
                                </h2>
                                <p className="mt-2 max-w-2xl text-sm leading-7 text-green-50/85">
                                    Select materials, set a target, record
                                    contributions, and prepare the collected
                                    batch for recycler pickup.
                                </p>
                            </div>

                            <Button
                                type="button"
                                onClick={openCreateDrive}
                                disabled={!canPrepareDrive}
                                className="w-fit rounded-full bg-white text-green-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-50"
                            >
                                <Flag className="mr-2 h-4 w-4" />
                                Start a campaign
                            </Button>
                        </div>
                    </div>
                </section>

                {partnerNotice && (
                    <section
                        className={`drive-motion animate-[driveFadeUp_.38s_ease-out_.08s_both] flex flex-col gap-4 rounded-[24px] border p-5 sm:flex-row sm:items-center ${partnerNotice.className}`}
                    >
                        <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${partnerNotice.iconClass}`}
                        >
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <h2 className="font-black text-zinc-900">
                                {partnerNotice.title}
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-zinc-600">
                                {partnerNotice.description}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                router.push(
                                    "/profiles/school-partner/profile"
                                )
                            }
                            className="w-fit rounded-full bg-white"
                        >
                            Review profile
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </section>
                )}

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        title="Active drives"
                        value={activeDrives.length}
                        description="Campaigns currently collecting"
                        icon={PlayCircle}
                        delay={0}
                    />
                    <SummaryCard
                        title="Total collected"
                        value={`${formatWeight(totalCollectedWeight)} kg`}
                        description="Recorded across all drives"
                        icon={Weight}
                        delay={50}
                    />
                    <SummaryCard
                        title="Active target"
                        value={`${activeTargetProgress}%`}
                        description={
                            activeTargetWeight > 0
                                ? `${formatWeight(
                                      activeCollectedWeight
                                  )} of ${formatWeight(activeTargetWeight)} kg`
                                : "No active target set"
                        }
                        icon={Target}
                        delay={100}
                    />
                    <SummaryCard
                        title="Completed"
                        value={completedDrives.length}
                        description="Finished recovery campaigns"
                        icon={CheckCircle2}
                        delay={150}
                    />
                </section>

                {featuredDrive && (
                    <FeaturedDrive
                        drive={featuredDrive}
                        changingStatus={
                            changingDriveStatusId === featuredDrive.id
                        }
                        onRecord={() =>
                            openCollectionDialog(featuredDrive)
                        }
                        onEdit={() => openEditDrive(featuredDrive)}
                        onComplete={() =>
                            void updateDriveStatus(featuredDrive, "completed")
                        }
                    />
                )}

                <section className="drive-motion animate-[driveFadeUp_.4s_ease-out_.2s_both] rounded-[26px] border border-green-100 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="relative w-full xl:max-w-md">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                            <Input
                                value={searchQuery}
                                onChange={(event) =>
                                    setSearchQuery(event.target.value)
                                }
                                placeholder="Search drives, locations, or materials"
                                className="h-12 rounded-full border-zinc-200 bg-zinc-50 pl-11 focus-visible:ring-green-500"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {statusFilters.map((filter) => (
                                <button
                                    key={filter.value}
                                    type="button"
                                    onClick={() =>
                                        setStatusFilter(filter.value)
                                    }
                                    className={`rounded-full border px-4 py-2 text-xs font-bold transition-all duration-200 ${
                                        statusFilter === filter.value
                                            ? "border-green-600 bg-green-600 text-white shadow-sm"
                                            : "border-zinc-200 bg-white text-zinc-500 hover:-translate-y-0.5 hover:border-green-300 hover:bg-green-50 hover:text-green-700"
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="drive-motion animate-[driveFadeUp_.4s_ease-out_.25s_both]">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-black text-zinc-900">
                                Your collection drives
                            </h2>
                            <p className="mt-1 text-sm text-zinc-500">
                                {filteredDrives.length} drive
                                {filteredDrives.length === 1 ? "" : "s"} shown
                            </p>
                        </div>
                    </div>

                    {filteredDrives.length === 0 ? (
                        <div className="mt-5">
                            <EmptyDriveState
                                hasAnyDrives={drives.length > 0}
                                onCreate={openCreateDrive}
                            />
                        </div>
                    ) : (
                        <div className="mt-5 grid gap-5 xl:grid-cols-2">
                            {filteredDrives.map((drive, index) => (
                                <DriveCard
                                    key={drive.id}
                                    drive={drive}
                                    animationDelay={`${Math.min(
                                        index * 45,
                                        270
                                    )}ms`}
                                    changingStatus={
                                        changingDriveStatusId === drive.id
                                    }
                                    canStart={canStartDrive}
                                    onEdit={() => openEditDrive(drive)}
                                    onRecord={() =>
                                        openCollectionDialog(drive)
                                    }
                                    onStart={() =>
                                        void updateDriveStatus(drive, "active")
                                    }
                                    onComplete={() =>
                                        void updateDriveStatus(
                                            drive,
                                            "completed"
                                        )
                                    }
                                    onCancel={() =>
                                        void updateDriveStatus(
                                            drive,
                                            "cancelled"
                                        )
                                    }
                                />
                            ))}
                        </div>
                    )}
                </section>

                <section className="drive-motion animate-[driveFadeUp_.4s_ease-out_.35s_both] rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-black text-zinc-900">
                                Recent collections
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-zinc-500">
                                Latest material contributions recorded across
                                your collection drives.
                            </p>
                        </div>
                        <History className="h-6 w-6 text-green-600" />
                    </div>

                    {recentEntries.length === 0 ? (
                        <div className="mt-6 flex flex-col items-center rounded-[24px] border border-dashed border-green-200 bg-green-50/60 px-6 py-10 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-green-600 shadow-sm">
                                <Weight className="h-6 w-6" />
                            </div>
                            <h3 className="mt-4 font-black text-zinc-900">
                                No collections recorded
                            </h3>
                            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                                Start a drive and record contributions from
                                classes, departments, clubs, or community
                                groups.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-6 divide-y divide-zinc-100">
                            {recentEntries.map((entry) => {
                                const material = materialMap.get(
                                    entry.material_id
                                );

                                return (
                                    <div
                                        key={entry.id}
                                        className="group flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                                    >
                                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-green-100">
                                            {entry.photo_url ? (
                                                <img
                                                    src={entry.photo_url}
                                                    alt={
                                                        material?.material_name ??
                                                        "Collected material"
                                                    }
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 text-green-600">
                                                    <PackageCheck className="h-6 w-6" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-black text-zinc-900">
                                                    {material?.material_name ??
                                                        "Collected material"}
                                                </h3>
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-zinc-100 text-zinc-600"
                                                >
                                                    {entry.drive_title}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 text-sm text-zinc-500">
                                                {entry.source_name}
                                            </p>
                                            <p className="mt-1 text-xs text-zinc-400">
                                                {formatRelativeDate(
                                                    entry.collected_at
                                                )}
                                            </p>
                                        </div>

                                        <div className="rounded-full bg-green-50 px-4 py-2 text-sm font-black text-green-700">
                                            {formatWeight(entry.weight_kg)} kg
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            <Dialog
                open={driveDialogOpen}
                onOpenChange={(open) => {
                    if (savingDrive || compressingDrivePhoto) return;
                    setDriveDialogOpen(open);
                }}
            >
                <DialogContent className="max-h-[96dvh] !w-[calc(100vw-1rem)] !max-w-none gap-0 overflow-hidden rounded-[26px] border border-green-200 !bg-white p-0 text-zinc-900 shadow-[0_28px_100px_rgba(0,0,0,0.35)] sm:!w-[94vw] lg:!w-[1060px]">
                    <DialogHeader className="sr-only">
                        <DialogTitle>
                            {editingDrive
                                ? "Edit collection drive"
                                : "Create collection drive"}
                        </DialogTitle>
                        <DialogDescription>
                            Add the campaign information, target, dates, and
                            accepted materials.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={saveDrive}
                        className="grid max-h-[96dvh] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-white"
                    >
                        <DialogHeaderPanel
                            eyebrow={
                                editingDrive ? "Edit campaign" : "New campaign"
                            }
                            title={
                                editingDrive
                                    ? "Update collection drive"
                                    : "Create collection drive"
                            }
                            description="Organize a measurable material recovery campaign for your school or organization."
                            icon={ClipboardList}
                        />

                        <div className="grid min-h-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_350px]">
                            <div className="drive-motion min-h-0 animate-[driveDialogIn_.24s_ease-out_both] overflow-y-auto p-5 sm:p-7">
                                <div className="space-y-6">
                                    <ImagePicker
                                        preview={drivePhotoPreview}
                                        label="Drive cover photo"
                                        description="Optional. JPG, PNG, or WebP up to 15 MB. The image is compressed automatically."
                                        compressing={compressingDrivePhoto}
                                        onChange={handleDrivePhotoChange}
                                    />

                                    <TextInput
                                        id="drive_title"
                                        label="Drive title"
                                        required
                                        value={driveForm.title}
                                        placeholder="Example: Plastic-Free Campus Drive"
                                        onChange={(value) =>
                                            setDriveForm((current) => ({
                                                ...current,
                                                title: value,
                                            }))
                                        }
                                    />

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <Label htmlFor="drive_description">
                                                Description
                                            </Label>
                                            <span className="text-xs text-zinc-400">
                                                {driveForm.description.length}
                                                /500
                                            </span>
                                        </div>
                                        <Textarea
                                            id="drive_description"
                                            value={driveForm.description}
                                            onChange={(event) =>
                                                setDriveForm((current) => ({
                                                    ...current,
                                                    description:
                                                        event.target.value,
                                                }))
                                            }
                                            maxLength={500}
                                            rows={5}
                                            placeholder="Describe the participants, collection goals, and purpose of the campaign."
                                            className="resize-none rounded-xl border-zinc-300 bg-white focus-visible:ring-green-500"
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <TextInput
                                            id="drive_start_date"
                                            label="Start date"
                                            required
                                            type="date"
                                            value={driveForm.start_date}
                                            onChange={(value) =>
                                                setDriveForm((current) => ({
                                                    ...current,
                                                    start_date: value,
                                                }))
                                            }
                                        />

                                        <TextInput
                                            id="drive_end_date"
                                            label="End date"
                                            required
                                            type="date"
                                            value={driveForm.end_date}
                                            onChange={(value) =>
                                                setDriveForm((current) => ({
                                                    ...current,
                                                    end_date: value,
                                                }))
                                            }
                                        />

                                        <TextInput
                                            id="target_weight"
                                            label="Target weight in kg"
                                            type="number"
                                            inputMode="decimal"
                                            value={driveForm.target_weight_kg}
                                            placeholder="Example: 100"
                                            onChange={(value) =>
                                                setDriveForm((current) => ({
                                                    ...current,
                                                    target_weight_kg: value,
                                                }))
                                            }
                                        />

                                        <TextInput
                                            id="collection_location"
                                            label="Collection location"
                                            required
                                            value={
                                                driveForm.collection_location
                                            }
                                            placeholder="Example: School covered court"
                                            onChange={(value) =>
                                                setDriveForm((current) => ({
                                                    ...current,
                                                    collection_location: value,
                                                }))
                                            }
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <Label>
                                                Accepted materials{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </Label>
                                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                                                Materials with existing
                                                collection records cannot be
                                                removed from an edited drive.
                                            </p>
                                        </div>

                                        {materials.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
                                                No materials are available.
                                                Check the materials table and
                                                its SELECT policy.
                                            </div>
                                        ) : (
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {materials.map((material) => {
                                                    const selected =
                                                        driveForm.selected_material_ids.includes(
                                                            material.id
                                                        );
                                                    const locked = Boolean(
                                                        editingDrive?.entries.some(
                                                            (entry) =>
                                                                entry.material_id ===
                                                                material.id
                                                        )
                                                    );

                                                    return (
                                                        <button
                                                            key={material.id}
                                                            type="button"
                                                            onClick={() =>
                                                                toggleDriveMaterial(
                                                                    material.id
                                                                )
                                                            }
                                                            className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                                                                selected
                                                                    ? "border-green-600 bg-green-50 ring-1 ring-green-600"
                                                                    : "border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-green-300 hover:bg-green-50/50"
                                                            }`}
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <p className="font-black text-zinc-900">
                                                                        {
                                                                            material.material_name
                                                                        }
                                                                    </p>
                                                                    <p className="mt-1 text-xs text-zinc-500">
                                                                        {
                                                                            material.category
                                                                        }
                                                                    </p>
                                                                </div>
                                                                <div
                                                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
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
                                                            {locked && (
                                                                <p className="mt-3 text-[11px] font-bold text-green-700">
                                                                    Locked by
                                                                    collection
                                                                    history
                                                                </p>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <DrivePreviewPanel
                                form={driveForm}
                                preview={drivePhotoPreview}
                                materials={materials}
                            />
                        </div>

                        <DialogFooterActions
                            saving={savingDrive}
                            compressing={compressingDrivePhoto}
                            saveLabel={
                                editingDrive ? "Save changes" : "Create draft"
                            }
                            onCancel={() => setDriveDialogOpen(false)}
                        />
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={collectionDialogOpen}
                onOpenChange={(open) => {
                    if (savingCollection || compressingCollectionPhoto) return;
                    setCollectionDialogOpen(open);
                }}
            >
                <DialogContent className="max-h-[94dvh] !w-[calc(100vw-1rem)] !max-w-none gap-0 overflow-hidden rounded-[26px] border border-green-200 !bg-white p-0 text-zinc-900 shadow-[0_28px_100px_rgba(0,0,0,0.35)] sm:!w-[min(94vw,760px)]">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Record collected material</DialogTitle>
                        <DialogDescription>
                            Add a material contribution to the active drive.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={saveCollection}
                        className="grid max-h-[94dvh] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-white"
                    >
                        <DialogHeaderPanel
                            eyebrow="Collection entry"
                            title="Record collected material"
                            description={
                                collectionDrive
                                    ? `Add a contribution to ${collectionDrive.title}.`
                                    : "Add a contribution to an active collection drive."
                            }
                            icon={Weight}
                        />

                        <div className="drive-motion min-h-0 animate-[driveDialogIn_.24s_ease-out_both] overflow-y-auto p-5 sm:p-7">
                            <div className="space-y-6">
                                <ImagePicker
                                    preview={collectionPhotoPreview}
                                    label="Collection photo"
                                    description="Optional. Images are compressed before upload."
                                    compressing={compressingCollectionPhoto}
                                    onChange={handleCollectionPhotoChange}
                                />

                                <div className="space-y-2">
                                    <Label htmlFor="collection_material">
                                        Material{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        id="collection_material"
                                        value={collectionForm.material_id}
                                        onChange={(event) =>
                                            setCollectionForm((current) => ({
                                                ...current,
                                                material_id:
                                                    event.target.value,
                                            }))
                                        }
                                        className="h-12 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                                    >
                                        <option value="">
                                            Select a material
                                        </option>
                                        {collectionDrive?.materials.map(
                                            (material) => (
                                                <option
                                                    key={material.id}
                                                    value={material.id}
                                                >
                                                    {material.material_name}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <TextInput
                                        id="collection_source"
                                        label="Collection source"
                                        required
                                        value={collectionForm.source_name}
                                        placeholder="Example: Grade 8 Diamond"
                                        onChange={(value) =>
                                            setCollectionForm((current) => ({
                                                ...current,
                                                source_name: value,
                                            }))
                                        }
                                    />

                                    <TextInput
                                        id="collection_weight"
                                        label="Weight in kg"
                                        required
                                        type="number"
                                        inputMode="decimal"
                                        value={collectionForm.weight_kg}
                                        placeholder="Example: 12.5"
                                        onChange={(value) =>
                                            setCollectionForm((current) => ({
                                                ...current,
                                                weight_kg: value,
                                            }))
                                        }
                                    />

                                    <div className="sm:col-span-2">
                                        <TextInput
                                            id="collected_at"
                                            label="Collected at"
                                            required
                                            type="datetime-local"
                                            value={collectionForm.collected_at}
                                            onChange={(value) =>
                                                setCollectionForm(
                                                    (current) => ({
                                                        ...current,
                                                        collected_at: value,
                                                    })
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="collection_notes">
                                        Notes
                                    </Label>
                                    <Textarea
                                        id="collection_notes"
                                        rows={4}
                                        maxLength={300}
                                        value={collectionForm.notes}
                                        onChange={(event) =>
                                            setCollectionForm((current) => ({
                                                ...current,
                                                notes: event.target.value,
                                            }))
                                        }
                                        placeholder="Optional preparation, condition, or contributor notes."
                                        className="resize-none rounded-xl border-zinc-300 bg-white focus-visible:ring-green-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooterActions
                            saving={savingCollection}
                            compressing={compressingCollectionPhoto}
                            saveLabel="Record collection"
                            onCancel={() => setCollectionDialogOpen(false)}
                        />
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

/* =========================================================
   COMPONENTS
========================================================= */

function SummaryCard({
    title,
    value,
    description,
    icon: Icon,
    delay,
}: {
    title: string;
    value: string | number;
    description: string;
    icon: ComponentType<{ className?: string }>;
    delay: number;
}) {
    return (
        <div
            style={{ animationDelay: `${delay}ms` }}
            className="drive-motion group animate-[driveFadeUp_.38s_ease-out_both] rounded-[24px] border border-green-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-300 hover:shadow-md"
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
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600 transition-transform duration-300 group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function FeaturedDrive({
    drive,
    changingStatus,
    onRecord,
    onEdit,
    onComplete,
}: {
    drive: DriveView;
    changingStatus: boolean;
    onRecord: () => void;
    onEdit: () => void;
    onComplete: () => void;
}) {
    return (
        <section className="drive-motion animate-[driveFadeUp_.4s_ease-out_.18s_both] overflow-hidden rounded-[30px] border border-green-100 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[360px_minmax(0,1fr)]">
                <div className="relative min-h-72 overflow-hidden bg-green-100">
                    {drive.photo_url ? (
                        <img
                            src={drive.photo_url}
                            alt={drive.title}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-[1.025]"
                        />
                    ) : (
                        <div className="flex h-full min-h-72 items-center justify-center bg-gradient-to-br from-green-100 to-emerald-200 text-green-700">
                            <Flag className="h-14 w-14" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5">
                        <Badge className="border-white/20 bg-black/30 text-white hover:bg-black/30">
                            Featured active drive
                        </Badge>
                        <h2 className="mt-3 text-2xl font-black text-white">
                            {drive.title}
                        </h2>
                    </div>
                </div>

                <div className="p-5 sm:p-7">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div>
                            <p className="text-sm font-bold text-green-600">
                                Current campaign
                            </p>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                                {drive.description ||
                                    "No campaign description was added."}
                            </p>
                        </div>
                        <Badge
                            variant="outline"
                            className="w-fit border-green-200 bg-green-50 text-green-700"
                        >
                            <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
                            Active
                        </Badge>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <MetricItem
                            icon={Weight}
                            label="Collected"
                            value={`${formatWeight(
                                drive.collected_weight_kg
                            )} kg`}
                        />
                        <MetricItem
                            icon={Target}
                            label="Target"
                            value={
                                drive.target_weight_kg
                                    ? `${formatWeight(
                                          drive.target_weight_kg
                                      )} kg`
                                    : "No target"
                            }
                        />
                        <MetricItem
                            icon={CalendarDays}
                            label="Schedule"
                            value={`${formatDate(
                                drive.start_date
                            )} to ${formatDate(drive.end_date)}`}
                        />
                    </div>

                    <div className="mt-6">
                        <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                            <span>Target progress</span>
                            <span className="text-green-700">
                                {drive.progress_percentage}%
                            </span>
                        </div>
                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-green-50">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-700 transition-all duration-700"
                                style={{
                                    width: `${drive.progress_percentage}%`,
                                }}
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                        <Button
                            type="button"
                            onClick={onRecord}
                            className="rounded-full bg-green-600 hover:bg-green-700"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Record collection
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onEdit}
                            className="rounded-full border-green-200 text-green-700 hover:bg-green-50"
                        >
                            <Edit3 className="mr-2 h-4 w-4" />
                            Edit drive
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={changingStatus}
                            onClick={onComplete}
                            className="rounded-full border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                            {changingStatus ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            Complete
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}

function DriveCard({
    drive,
    animationDelay,
    changingStatus,
    canStart,
    onEdit,
    onRecord,
    onStart,
    onComplete,
    onCancel,
}: {
    drive: DriveView;
    animationDelay: string;
    changingStatus: boolean;
    canStart: boolean;
    onEdit: () => void;
    onRecord: () => void;
    onStart: () => void;
    onComplete: () => void;
    onCancel: () => void;
}) {
    const status = getStatusDetails(drive.status);
    const StatusIcon = status.icon;

    return (
        <article
            style={{ animationDelay }}
            className="drive-motion group animate-[driveFadeUp_.38s_ease-out_both] overflow-hidden rounded-[28px] border border-green-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-300 hover:shadow-md"
        >
            <div className="relative h-48 overflow-hidden bg-green-100">
                {drive.photo_url ? (
                    <img
                        src={drive.photo_url}
                        alt={drive.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 text-green-600">
                        <ClipboardList className="h-12 w-12" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <Badge
                    variant="outline"
                    className={`absolute left-4 top-4 ${status.className}`}
                >
                    <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
                    {status.label}
                </Badge>
                <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="line-clamp-2 text-xl font-black text-white">
                        {drive.title}
                    </h3>
                </div>
            </div>

            <div className="p-5">
                <div className="flex flex-wrap gap-2">
                    {drive.materials.slice(0, 3).map((material) => (
                        <Badge
                            key={material.id}
                            variant="secondary"
                            className="bg-green-50 text-green-700"
                        >
                            {material.material_name}
                        </Badge>
                    ))}
                    {drive.materials.length > 3 && (
                        <Badge variant="secondary">
                            +{drive.materials.length - 3} more
                        </Badge>
                    )}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <SmallInfo
                        icon={CalendarDays}
                        label={`${formatDate(drive.start_date)} to ${formatDate(
                            drive.end_date
                        )}`}
                    />
                    <SmallInfo
                        icon={MapPin}
                        label={drive.collection_location}
                    />
                    <SmallInfo
                        icon={Weight}
                        label={`${formatWeight(
                            drive.collected_weight_kg
                        )} kg collected`}
                    />
                    <SmallInfo
                        icon={Target}
                        label={
                            drive.target_weight_kg
                                ? `${formatWeight(
                                      drive.target_weight_kg
                                  )} kg target`
                                : "No target set"
                        }
                    />
                </div>

                <div className="mt-5">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                        <span>Progress</span>
                        <span className="text-green-700">
                            {drive.progress_percentage}%
                        </span>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-green-50">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-700 transition-all duration-700"
                            style={{ width: `${drive.progress_percentage}%` }}
                        />
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
                    {drive.status === "draft" && (
                        <>
                            <Button
                                type="button"
                                size="sm"
                                onClick={onStart}
                                disabled={changingStatus || !canStart}
                                className="rounded-full bg-green-600 hover:bg-green-700"
                            >
                                {changingStatus ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <PlayCircle className="mr-2 h-4 w-4" />
                                )}
                                Start
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={onEdit}
                                className="rounded-full border-green-200 text-green-700 hover:bg-green-50"
                            >
                                <Edit3 className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={changingStatus}
                                onClick={onCancel}
                                className="rounded-full border-red-200 text-red-700 hover:bg-red-50"
                            >
                                Cancel
                            </Button>
                        </>
                    )}

                    {drive.status === "active" && (
                        <>
                            <Button
                                type="button"
                                size="sm"
                                onClick={onRecord}
                                className="rounded-full bg-green-600 hover:bg-green-700"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Record
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={onEdit}
                                className="rounded-full border-green-200 text-green-700 hover:bg-green-50"
                            >
                                <Edit3 className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={changingStatus}
                                onClick={onComplete}
                                className="rounded-full border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                                Complete
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={changingStatus}
                                onClick={onCancel}
                                className="rounded-full border-red-200 text-red-700 hover:bg-red-50"
                            >
                                Cancel
                            </Button>
                        </>
                    )}

                    {(drive.status === "completed" ||
                        drive.status === "cancelled") && (
                        <p className="text-xs font-semibold text-zinc-500">
                            This drive is read-only.
                        </p>
                    )}
                </div>
            </div>
        </article>
    );
}

function MetricItem({
    icon: Icon,
    label,
    value,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-zinc-400">
                <Icon className="h-4 w-4 text-green-600" />
                {label}
            </div>
            <p className="mt-2 text-sm font-black text-zinc-800">{value}</p>
        </div>
    );
}

function SmallInfo({
    icon: Icon,
    label,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
}) {
    return (
        <div className="flex min-w-0 items-start gap-2 text-xs leading-5 text-zinc-500">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            <span className="line-clamp-2">{label}</span>
        </div>
    );
}

function ImagePicker({
    preview,
    label,
    description,
    compressing,
    onChange,
}: {
    preview: string | null;
    label: string;
    description: string;
    compressing: boolean;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    return (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <Label>{label}</Label>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onChange}
                className="hidden"
            />

            <button
                type="button"
                disabled={compressing}
                onClick={() => inputRef.current?.click()}
                className="group relative mt-3 flex h-52 w-full overflow-hidden rounded-2xl border-2 border-dashed border-green-300 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-green-500 hover:shadow-md disabled:cursor-wait disabled:opacity-80"
            >
                {preview ? (
                    <>
                        <img
                            src={preview}
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
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95">
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
                    {description}
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
    onChange: (value: string) => void;
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
            <Label htmlFor={id}>
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
                id={id}
                type={type}
                inputMode={inputMode}
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                className="h-12 rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
            />
        </div>
    );
}

function DialogHeaderPanel({
    eyebrow,
    title,
    description,
    icon: Icon,
}: {
    eyebrow: string;
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
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
                disabled={saving || compressing}
                onClick={onCancel}
                className="rounded-full"
            >
                Cancel
            </Button>

            <Button
                type="submit"
                disabled={saving || compressing}
                className="rounded-full bg-green-600 px-6 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 disabled:translate-y-0"
            >
                {saving || compressing ? (
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

function DrivePreviewPanel({
    form,
    preview,
    materials,
}: {
    form: DriveForm;
    preview: string | null;
    materials: Material[];
}) {
    const selectedMaterials = materials.filter((material) =>
        form.selected_material_ids.includes(material.id)
    );

    return (
        <aside className="hidden min-h-0 overflow-y-auto border-l border-green-100 bg-green-50 p-6 lg:block">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
                Drive preview
            </p>

            <div className="mt-4 overflow-hidden rounded-[24px] border border-green-100 bg-white shadow-sm">
                <div className="relative h-40 bg-gradient-to-br from-green-100 to-emerald-200">
                    {preview ? (
                        <img
                            src={preview}
                            alt="Drive preview"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-green-600">
                            <ImagePlus className="h-11 w-11" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                    <Badge className="absolute bottom-3 left-3 border-white/20 bg-black/30 text-white hover:bg-black/30">
                        Collection drive
                    </Badge>
                </div>

                <div className="p-5">
                    <h3 className="line-clamp-2 text-lg font-black text-zinc-900">
                        {form.title.trim() || "Collection drive title"}
                    </h3>
                    <p className="mt-2 line-clamp-3 min-h-[60px] text-sm leading-5 text-zinc-500">
                        {form.description.trim() ||
                            "The campaign description will appear here."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {selectedMaterials.length > 0 ? (
                            selectedMaterials.slice(0, 4).map((material) => (
                                <Badge
                                    key={material.id}
                                    variant="secondary"
                                    className="bg-green-50 text-green-700"
                                >
                                    {material.material_name}
                                </Badge>
                            ))
                        ) : (
                            <p className="text-xs text-zinc-400">
                                No materials selected
                            </p>
                        )}
                    </div>

                    <div className="mt-5 space-y-3 border-t border-zinc-100 pt-4">
                        <SmallInfo
                            icon={CalendarDays}
                            label={
                                form.start_date && form.end_date
                                    ? `${formatDate(
                                          form.start_date
                                      )} to ${formatDate(form.end_date)}`
                                    : "Drive schedule"
                            }
                        />
                        <SmallInfo
                            icon={MapPin}
                            label={
                                form.collection_location ||
                                "Collection location"
                            }
                        />
                        <SmallInfo
                            icon={Target}
                            label={
                                form.target_weight_kg
                                    ? `${form.target_weight_kg} kg target`
                                    : "No target set"
                            }
                        />
                    </div>
                </div>
            </div>
        </aside>
    );
}

function EmptyDriveState({
    hasAnyDrives,
    onCreate,
}: {
    hasAnyDrives: boolean;
    onCreate: () => void;
}) {
    return (
        <div className="flex flex-col items-center rounded-[28px] border border-dashed border-green-200 bg-green-50/60 px-6 py-14 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-green-600 shadow-sm">
                <ClipboardList className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-lg font-black text-zinc-900">
                {hasAnyDrives
                    ? "No drives match your filters"
                    : "No collection drives yet"}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                {hasAnyDrives
                    ? "Adjust the search text or choose another status."
                    : "Create a recycling campaign, choose materials, and set a collection target."}
            </p>
            {!hasAnyDrives && (
                <Button
                    type="button"
                    onClick={onCreate}
                    className="mt-6 rounded-full bg-green-600 hover:bg-green-700"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Create first drive
                </Button>
            )}
        </div>
    );
}

function MissingPartnerState({ onSetup }: { onSetup: () => void }) {
    return (
        <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center">
            <div className="w-full overflow-hidden rounded-[30px] border border-green-100 bg-white shadow-sm">
                <div className="bg-gradient-to-br from-green-600 to-emerald-800 p-8 text-white sm:p-10">
                    <School className="h-12 w-12" />
                    <h1 className="mt-5 text-2xl font-black">
                        Complete the organization profile first
                    </h1>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-green-50/90">
                        Collection drives need an organization record before
                        they can be created and managed.
                    </p>
                    <Button
                        type="button"
                        onClick={onSetup}
                        className="mt-6 rounded-full bg-white text-green-700 hover:bg-green-50"
                    >
                        Open partner profile
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function DrivesErrorState({
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
                    Collection drives unavailable
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

function DrivesPageSkeleton() {
    return (
        <div className="space-y-7">
            <div className="space-y-3">
                <Skeleton className="h-4 w-48 bg-green-100" />
                <Skeleton className="h-9 w-80 max-w-full bg-green-100" />
                <Skeleton className="h-4 w-96 max-w-full bg-green-100" />
            </div>
            <Skeleton className="h-64 rounded-[30px] bg-green-100" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton
                        key={index}
                        className="h-36 rounded-[24px] bg-green-100"
                    />
                ))}
            </div>
            <Skeleton className="h-80 rounded-[30px] bg-green-100" />
            <Skeleton className="h-20 rounded-[26px] bg-green-100" />
            <div className="grid gap-5 xl:grid-cols-2">
                <Skeleton className="h-[520px] rounded-[28px] bg-green-100" />
                <Skeleton className="h-[520px] rounded-[28px] bg-green-100" />
            </div>
        </div>
    );
}
