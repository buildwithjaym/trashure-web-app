"use client";

import type {
  ChangeEvent,
  ComponentType,
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
  Camera,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Gift,
  ImagePlus,
  Lightbulb,
  Loader2,
  MapPinned,
  PackageCheck,
  Recycle,
  RefreshCcw,
  RotateCcw,
  ScanLine,
  School,
  ShieldAlert,
  Sparkles,
  Store,
  Trash2,
  Upload,
} from "lucide-react";

import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";


const RESIDENT_BASE_PATH =
  "/profiles/resident";

const ACTIONS_BASE_PATH =
  `${RESIDENT_BASE_PATH}/actions`;

const MAX_SOURCE_BYTES =
  10 * 1024 * 1024;

const MAX_PROCESSED_BYTES =
  1.8 * 1024 * 1024;


/* =========================================================
   TYPES
========================================================= */

type ActionType =
  | "recycle"
  | "sell"
  | "donate"
  | "reuse";


interface ResidentProfile {
  id: string;
  auth_id: string;
  full_name: string;
  role: string;
  barangay: string | null;
  city: string | null;
  province: string | null;
}


interface Material {
  id: string;
  material_name: string;
  category: string;
}


interface RecommendedActionAlternative {
  action: string;
  title: string;
  description: string;
}


interface RecommendedAction {
  primary_action: string;
  title: string;
  description: string;
  alternatives: RecommendedActionAlternative[];
  confirmation_question: string;
}


interface ScanResult {
  id: string;
  image_url: string | null;
  detected_object: string;
  object_description: string | null;
  material_id: string | null;
  material_type: string;
  material_category: string | null;
  condition: string | null;
  confidence_score:
    | number
    | string
    | null;
  primary_action: string | null;
  recommended_action:
    | RecommendedAction
    | string
    | null;
  preparation_steps:
    | string[]
    | string
    | null;
  hazardous: boolean;
  hazard_notes: string | null;
  needs_user_confirmation: boolean;
  user_confirmed: boolean;
  correction_material_id: string | null;
  model_name: string | null;
  analysis_status:
    | "processing"
    | "completed"
    | "needs_confirmation"
    | "failed";
  created_at: string;
}


interface ScanApiResponse {
  scan: ScanResult;
  matched_material: Material | null;
}


interface JunkshopMaterialRow {
  id: string;
  junkshop_id: string;
  material_id: string;
  price_per_kg:
    | number
    | string;
  minimum_weight_kg:
    | number
    | string;
  is_accepting: boolean;
}


interface JunkshopRow {
  id: string;
  verification_status: string;
  is_active: boolean;
}


interface SchoolDriveMaterialRow {
  drive_id: string;
  material_id: string;
}


interface SchoolDriveRow {
  id: string;
  school_partner_id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
}


interface SchoolPartnerRow {
  id: string;
  organization_name: string;
  verification_status: string;
  is_active: boolean;
}


interface RecoverySummary {
  acceptingJunkshops: number;
  buyingJunkshops: number;
  minimumPrice: number | null;
  maximumPrice: number | null;
  donationDrives: number;
  donationOrganizations: number;
  donationProjectNames: string[];
}


interface ActionChoice {
  type: ActionType;
  rank: number;
  title: string;
  eyebrow: string;
  description: string;
  detail: string;
  buttonLabel: string;
  icon:
    ComponentType<{
      className?: string;
    }>;
  disabled: boolean;
  disabledReason: string | null;
  recommended: boolean;
  aiReason: string | null;
}


/* =========================================================
   SMALL HELPERS
========================================================= */

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (
    error instanceof
    Error
  ) {
    return error.message;
  }

  if (
    typeof error ===
      "object" &&
    error !==
      null &&
    "message" in
      error &&
    typeof (
      error as {
        message?: unknown;
      }
    ).message ===
      "string"
  ) {
    return (
      error as {
        message: string;
      }
    ).message;
  }

  return fallback;
}


async function readApiError(
  response: Response,
  fallback: string,
) {
  try {
    const payload =
      await response.json();

    if (
      typeof payload?.error ===
      "string"
    ) {
      return payload.error;
    }
  } catch {
    // Preserve the fallback.
  }

  return fallback;
}


function formatPeso(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style:
        "currency",
      currency:
        "PHP",
      minimumFractionDigits:
        2,
      maximumFractionDigits:
        2,
    },
  ).format(
    value,
  );
}


function formatPriceRange(
  summary: RecoverySummary,
) {
  if (
    summary.minimumPrice ===
      null ||
    summary.maximumPrice ===
      null
  ) {
    return "No listed buying price";
  }

  if (
    summary.minimumPrice ===
    summary.maximumPrice
  ) {
    return `${formatPeso(
      summary.minimumPrice,
    )}/kg`;
  }

  return `${formatPeso(
    summary.minimumPrice,
  )} – ${formatPeso(
    summary.maximumPrice,
  )}/kg`;
}


function formatRelativeDate(
  value: string,
) {
  const difference =
    Math.max(
      0,
      Date.now() -
        new Date(
          value,
        ).getTime(),
    );

  const minutes =
    Math.floor(
      difference /
        60_000,
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
        60,
    );

  if (
    hours <
    24
  ) {
    return `${hours} hr${
      hours ===
      1
        ? ""
        : "s"
    } ago`;
  }

  const days =
    Math.floor(
      hours /
        24,
    );

  if (
    days <
    7
  ) {
    return `${days} day${
      days ===
      1
        ? ""
        : "s"
    } ago`;
  }

  return new Date(
    value,
  ).toLocaleDateString(
    "en-PH",
    {
      month:
        "short",
      day:
        "numeric",
      year:
        "numeric",
    },
  );
}


function formatConfidence(
  value:
    | number
    | string
    | null,
) {
  const parsed =
    Number(
      value ??
      0,
    );

  const normalized =
    parsed <=
    1
      ? parsed *
        100
      : parsed;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        normalized,
      ),
    ),
  );
}


function titleCase(
  value: string | null,
  fallback =
    "Unknown",
) {
  if (
    !value
  ) {
    return fallback;
  }

  return value
    .replaceAll(
      "_",
      " ",
    )
    .replace(
      /\b\w/g,
      (
        character,
      ) =>
        character.toUpperCase(),
    );
}


function normalizeActionType(
  value: string | null,
): ActionType | null {
  if (
    value ===
      "recycle" ||
    value ===
      "sell" ||
    value ===
      "donate" ||
    value ===
      "reuse"
  ) {
    return value;
  }

  return null;
}


function normalizeRecommendedAction(
  value:
    | RecommendedAction
    | string
    | null,
): RecommendedAction | null {
  if (!value) {
    return null;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    const parsed: unknown =
      JSON.parse(value);

    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "primary_action" in parsed &&
      "title" in parsed &&
      "description" in parsed
    ) {
      const candidate =
        parsed as Partial<RecommendedAction>;

      return {
        primary_action:
          typeof candidate.primary_action === "string"
            ? candidate.primary_action
            : "recycle",

        title:
          typeof candidate.title === "string"
            ? candidate.title
            : "Recommended action",

        description:
          typeof candidate.description === "string"
            ? candidate.description
            : "Review the recommended action for this item.",

        alternatives:
          Array.isArray(candidate.alternatives)
            ? candidate.alternatives
            : [],

        confirmation_question:
          typeof candidate.confirmation_question === "string"
            ? candidate.confirmation_question
            : "Does this material match the photographed item?",
      };
    }
  } catch {
    // The value is plain text rather than JSON.
  }

  return {
    primary_action:
      "recycle",

    title:
      value,

    description:
      value,

    alternatives:
      [],

    confirmation_question:
      "Does this material match the photographed item?",
  };
}


function normalizePreparationSteps(
  value:
    | string[]
    | string
    | null,
) {
  if (
    Array.isArray(
      value,
    )
  ) {
    return value
      .filter(
        (
          step,
        ): step is string =>
          typeof step ===
            "string",
      )
      .map(
        (
          step,
        ) =>
          step.trim(),
      )
      .filter(
        Boolean,
      );
  }

  if (
    typeof value ===
    "string"
  ) {
    try {
      const parsed =
        JSON.parse(
          value,
        );

      if (
        Array.isArray(
          parsed,
        )
      ) {
        return parsed
          .filter(
            (
              step,
            ): step is string =>
              typeof step ===
                "string",
          )
          .map(
            (
              step,
            ) =>
              step.trim(),
          )
          .filter(
            Boolean,
          );
      }
    } catch {
      return [
        value,
      ];
    }
  }

  return [];
}


function currentDateString() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() +
        1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      now.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
}


function actionIcon(
  action: ActionType,
) {
  if (
    action ===
    "sell"
  ) {
    return CircleDollarSign;
  }

  if (
    action ===
    "donate"
  ) {
    return Gift;
  }

  if (
    action ===
    "reuse"
  ) {
    return Lightbulb;
  }

  return Recycle;
}


function buildActionOrder(
  result: ScanResult,
  recommendation:
    RecommendedAction | null,
) {
  const candidates:
    ActionType[] = [];

  const primary =
    normalizeActionType(
      result.primary_action,
    );

  if (
    primary
  ) {
    candidates.push(
      primary,
    );
  }

  for (
    const alternative of recommendation?.alternatives ??
    []
  ) {
    const action =
      normalizeActionType(
        alternative.action,
      );

    if (
      action
    ) {
      candidates.push(
        action,
      );
    }
  }

  candidates.push(
    "recycle",
    "sell",
    "donate",
    "reuse",
  );

  return Array.from(
    new Set(
      candidates,
    ),
  ).slice(
    0,
    4,
  );
}


function getAlternativeReason(
  action: ActionType,
  recommendation:
    RecommendedAction | null,
) {
  const alternative =
    recommendation?.alternatives?.find(
      (
        item,
      ) =>
        normalizeActionType(
          item.action,
        ) ===
        action,
    );

  return alternative?.description ??
    null;
}


function buildActionPath({
  action,
  scanId,
  materialId,
}: {
  action: ActionType;
  scanId: string;
  materialId: string;
}) {
  const parameters =
    new URLSearchParams({
      scan:
        scanId,

      material:
        materialId,
    });

  return `${ACTIONS_BASE_PATH}/${action}?${parameters.toString()}`;
}


/* =========================================================
   IMAGE COMPRESSION
========================================================= */

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
) {
  return new Promise<Blob>(
    (
      resolve,
      reject,
    ) => {
      canvas.toBlob(
        (
          blob,
        ) => {
          if (
            blob
          ) {
            resolve(
              blob,
            );
          } else {
            reject(
              new Error(
                "The image could not be processed.",
              ),
            );
          }
        },
        "image/webp",
        quality,
      );
    },
  );
}


async function compressScanImage(
  file: File,
) {
  const objectUrl =
    URL.createObjectURL(
      file,
    );

  try {
    const image =
      await new Promise<HTMLImageElement>(
        (
          resolve,
          reject,
        ) => {
          const nextImage =
            new Image();

          nextImage.onload =
            () =>
              resolve(
                nextImage,
              );

          nextImage.onerror =
            () =>
              reject(
                new Error(
                  "The selected image could not be opened.",
                ),
              );

          nextImage.src =
            objectUrl;
        },
      );

    const scale =
      Math.min(
        1,
        1600 /
          Math.max(
            image.width,
            image.height,
          ),
      );

    const canvas =
      document.createElement(
        "canvas",
      );

    canvas.width =
      Math.max(
        1,
        Math.round(
          image.width *
            scale,
        ),
      );

    canvas.height =
      Math.max(
        1,
        Math.round(
          image.height *
            scale,
        ),
      );

    const context =
      canvas.getContext(
        "2d",
      );

    if (
      !context
    ) {
      throw new Error(
        "Image processing is not supported by this browser.",
      );
    }

    context.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    let blob =
      await canvasToBlob(
        canvas,
        0.86,
      );

    for (
      const quality of [
        0.8,
        0.74,
        0.68,
        0.6,
      ]
    ) {
      if (
        blob.size <=
        MAX_PROCESSED_BYTES
      ) {
        break;
      }

      blob =
        await canvasToBlob(
          canvas,
          quality,
        );
    }

    if (
      blob.size >
      MAX_PROCESSED_BYTES
    ) {
      throw new Error(
        "The processed image is still too large. Choose a smaller photo.",
      );
    }

    return new File(
      [
        blob,
      ],
      "trashure-scan.webp",
      {
        type:
          "image/webp",
      },
    );
  } finally {
    URL.revokeObjectURL(
      objectUrl,
    );
  }
}


/* =========================================================
   MAIN PAGE
========================================================= */

export default function ResidentScanPage() {
  const router =
    useRouter();

  const supabase =
    useMemo(
      () =>
        createClient(),
      [],
    );

  const cameraInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const uploadInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );


  const [
    profile,
    setProfile,
  ] =
    useState<ResidentProfile | null>(
      null,
    );

  const [
    materials,
    setMaterials,
  ] =
    useState<Material[]>(
      [],
    );

  const [
    recentScans,
    setRecentScans,
  ] =
    useState<ScanResult[]>(
      [],
    );


  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState<File | null>(
      null,
    );

  const [
    previewUrl,
    setPreviewUrl,
  ] =
    useState<string | null>(
      null,
    );

  const [
    userHint,
    setUserHint,
  ] =
    useState(
      "",
    );

  const [
    result,
    setResult,
  ] =
    useState<ScanResult | null>(
      null,
    );

  const [
    correctedMaterialId,
    setCorrectedMaterialId,
  ] =
    useState(
      "",
    );


  const [
    recoverySummary,
    setRecoverySummary,
  ] =
    useState<RecoverySummary | null>(
      null,
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false,
    );

  const [
    preparingImage,
    setPreparingImage,
  ] =
    useState(
      false,
    );

  const [
    analyzing,
    setAnalyzing,
  ] =
    useState(
      false,
    );

  const [
    confirming,
    setConfirming,
  ] =
    useState(
      false,
    );

  const [
    deleting,
    setDeleting,
  ] =
    useState(
      false,
    );

  const [
    loadingRecovery,
    setLoadingRecovery,
  ] =
    useState(
      false,
    );

  const [
    recoveryError,
    setRecoveryError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    pageError,
    setPageError,
  ] =
    useState<string | null>(
      null,
    );


  const loadPageData =
    useCallback(
      async (
        silent =
          false,
      ) => {
        if (
          silent
        ) {
          setRefreshing(
            true,
          );
        } else {
          setLoading(
            true,
          );
        }

        setPageError(
          null,
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
              "/login",
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
                "profiles",
              )
              .select(`
                id,
                auth_id,
                full_name,
                role,
                barangay,
                city,
                province
              `)
              .eq(
                "auth_id",
                user.id,
              )
              .single();

          if (
            profileError ||
            !profileData
          ) {
            throw (
              profileError ??
              new Error(
                "Resident account was not found.",
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
              "This scanner is available only to resident accounts.",
            );
          }

          setProfile(
            currentProfile,
          );

          const [
            materialResult,
            scanResult,
          ] =
            await Promise.all([
              supabase
                .from(
                  "materials",
                )
                .select(`
                  id,
                  material_name,
                  category
                `)
                .order(
                  "category",
                  {
                    ascending:
                      true,
                  },
                )
                .order(
                  "material_name",
                  {
                    ascending:
                      true,
                  },
                ),

              supabase
                .from(
                  "scans",
                )
                .select(`
                  id,
                  image_url,
                  detected_object,
                  object_description,
                  material_id,
                  material_type,
                  material_category,
                  condition,
                  confidence_score,
                  primary_action,
                  recommended_action,
                  preparation_steps,
                  hazardous,
                  hazard_notes,
                  needs_user_confirmation,
                  user_confirmed,
                  correction_material_id,
                  model_name,
                  analysis_status,
                  created_at
                `)
                .eq(
                  "user_id",
                  currentProfile.id,
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  },
                )
                .limit(
                  5,
                ),
            ]);

          if (
            materialResult.error
          ) {
            throw materialResult.error;
          }

          if (
            scanResult.error
          ) {
            throw scanResult.error;
          }

          setMaterials(
            (
              materialResult.data ??
              []
            ) as Material[],
          );

          setRecentScans(
            (
              scanResult.data ??
              []
            ) as ScanResult[],
          );
        } catch (
          error
        ) {
          const message =
            getErrorMessage(
              error,
              "Unable to load the resident scanner.",
            );

          setPageError(
            message,
          );

          if (
            silent
          ) {
            toast.error(
              message,
            );
          }
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [
        router,
        supabase,
      ],
    );


  const loadRecoverySummary =
    useCallback(
      async (
        materialId: string,
      ) => {
        setLoadingRecovery(
          true,
        );

        setRecoveryError(
          null,
        );

        setRecoverySummary(
          null,
        );

        try {
          const [
            junkshopMaterialResult,
            driveMaterialResult,
          ] =
            await Promise.all([
              supabase
                .from(
                  "junkshop_materials",
                )
                .select(`
                  id,
                  junkshop_id,
                  material_id,
                  price_per_kg,
                  minimum_weight_kg,
                  is_accepting
                `)
                .eq(
                  "material_id",
                  materialId,
                )
                .eq(
                  "is_accepting",
                  true,
                ),

              supabase
                .from(
                  "school_drive_materials",
                )
                .select(`
                  drive_id,
                  material_id
                `)
                .eq(
                  "material_id",
                  materialId,
                ),
            ]);

          if (
            junkshopMaterialResult.error
          ) {
            throw junkshopMaterialResult.error;
          }

          if (
            driveMaterialResult.error
          ) {
            throw driveMaterialResult.error;
          }

          const junkshopMaterialRows =
            (
              junkshopMaterialResult.data ??
              []
            ) as JunkshopMaterialRow[];

          const junkshopIds =
            Array.from(
              new Set(
                junkshopMaterialRows.map(
                  (
                    row,
                  ) =>
                    row.junkshop_id,
                ),
              ),
            );

          let activeJunkshopIds =
            new Set<string>();

          if (
            junkshopIds.length >
            0
          ) {
            const {
              data:
                junkshopRows,
              error:
                junkshopError,
            } =
              await supabase
                .from(
                  "junkshops",
                )
                .select(`
                  id,
                  verification_status,
                  is_active
                `)
                .in(
                  "id",
                  junkshopIds,
                )
                .eq(
                  "verification_status",
                  "approved",
                )
                .eq(
                  "is_active",
                  true,
                );

            if (
              junkshopError
            ) {
              throw junkshopError;
            }

            activeJunkshopIds =
              new Set(
                (
                  junkshopRows ??
                  []
                )
                  .map(
                    (
                      row,
                    ) =>
                      (
                        row as JunkshopRow
                      ).id,
                  ),
              );
          }

          const validJunkshopMaterials =
            junkshopMaterialRows.filter(
              (
                row,
              ) =>
                activeJunkshopIds.has(
                  row.junkshop_id,
                ),
            );

          const buyingRows =
            validJunkshopMaterials.filter(
              (
                row,
              ) =>
                Number(
                  row.price_per_kg,
                ) >
                0,
            );

          const prices =
            buyingRows
              .map(
                (
                  row,
                ) =>
                  Number(
                    row.price_per_kg,
                  ),
              )
              .filter(
                (
                  price,
                ) =>
                  Number.isFinite(
                    price,
                  ) &&
                  price >
                    0,
              )
              .sort(
                (
                  first,
                  second,
                ) =>
                  first -
                  second,
              );

          const driveMaterialRows =
            (
              driveMaterialResult.data ??
              []
            ) as SchoolDriveMaterialRow[];

          const driveIds =
            Array.from(
              new Set(
                driveMaterialRows.map(
                  (
                    row,
                  ) =>
                    row.drive_id,
                ),
              ),
            );

          let validDriveRows:
            SchoolDriveRow[] = [];

          if (
            driveIds.length >
            0
          ) {
            const today =
              currentDateString();

            const {
              data:
                driveRows,
              error:
                driveError,
            } =
              await supabase
                .from(
                  "school_drives",
                )
                .select(`
                  id,
                  school_partner_id,
                  title,
                  start_date,
                  end_date,
                  status
                `)
                .in(
                  "id",
                  driveIds,
                )
                .eq(
                  "status",
                  "active",
                )
                .lte(
                  "start_date",
                  today,
                )
                .gte(
                  "end_date",
                  today,
                );

            if (
              driveError
            ) {
              throw driveError;
            }

            validDriveRows =
              (
                driveRows ??
                []
              ) as SchoolDriveRow[];
          }

          const partnerIds =
            Array.from(
              new Set(
                validDriveRows.map(
                  (
                    drive,
                  ) =>
                    drive.school_partner_id,
                ),
              ),
            );

          let partnerRows:
            SchoolPartnerRow[] = [];

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
                  "school_partners",
                )
                .select(`
                  id,
                  organization_name,
                  verification_status,
                  is_active
                `)
                .in(
                  "id",
                  partnerIds,
                )
                .eq(
                  "verification_status",
                  "approved",
                )
                .eq(
                  "is_active",
                  true,
                );

            if (
              error
            ) {
              throw error;
            }

            partnerRows =
              (
                data ??
                []
              ) as SchoolPartnerRow[];
          }

          const partnerMap =
            new Map(
              partnerRows.map(
                (
                  partner,
                ) => [
                  partner.id,
                  partner,
                ],
              ),
            );

          const approvedDrives =
            validDriveRows.filter(
              (
                drive,
              ) =>
                partnerMap.has(
                  drive.school_partner_id,
                ),
            );

          const approvedOrganizationIds =
            new Set(
              approvedDrives.map(
                (
                  drive,
                ) =>
                  drive.school_partner_id,
              ),
            );

          const projectNames =
            approvedDrives
              .map(
                (
                  drive,
                ) =>
                  drive.title,
              )
              .slice(
                0,
                3,
              );

          setRecoverySummary({
            acceptingJunkshops:
              validJunkshopMaterials.length,

            buyingJunkshops:
              buyingRows.length,

            minimumPrice:
              prices.length >
              0
                ? prices[0]
                : null,

            maximumPrice:
              prices.length >
              0
                ? prices[
                    prices.length -
                      1
                  ]
                : null,

            donationDrives:
              approvedDrives.length,

            donationOrganizations:
              approvedOrganizationIds.size,

            donationProjectNames:
              projectNames,
          });
        } catch (
          error
        ) {
          const message =
            getErrorMessage(
              error,
              "Recovery recommendations could not be loaded.",
            );

          setRecoveryError(
            message,
          );

          toast.error(
            message,
          );
        } finally {
          setLoadingRecovery(
            false,
          );
        }
      },
      [
        supabase,
      ],
    );


  useEffect(
    () => {
      void loadPageData();
    },
    [
      loadPageData,
    ],
  );


  useEffect(
    () => {
      return () => {
        if (
          previewUrl
        ) {
          URL.revokeObjectURL(
            previewUrl,
          );
        }
      };
    },
    [
      previewUrl,
    ],
  );


  const handleImageSelection =
    async (
      event:
        ChangeEvent<HTMLInputElement>,
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
          "image/",
        )
      ) {
        toast.error(
          "Choose an image file.",
        );

        return;
      }

      if (
        file.size >
        MAX_SOURCE_BYTES
      ) {
        toast.error(
          "The original photo must be smaller than 10 MB.",
        );

        return;
      }

      setPreparingImage(
        true,
      );

      try {
        const compressed =
          await compressScanImage(
            file,
          );

        if (
          previewUrl
        ) {
          URL.revokeObjectURL(
            previewUrl,
          );
        }

        setSelectedFile(
          compressed,
        );

        setPreviewUrl(
          URL.createObjectURL(
            compressed,
          ),
        );

        setResult(
          null,
        );

        setCorrectedMaterialId(
          "",
        );

        setRecoverySummary(
          null,
        );

        setRecoveryError(
          null,
        );

        toast.success(
          "Photo prepared for analysis.",
        );
      } catch (
        error
      ) {
        toast.error(
          getErrorMessage(
            error,
            "Unable to prepare the photo.",
          ),
        );
      } finally {
        setPreparingImage(
          false,
        );
      }
    };


  const analyzeImage =
    async () => {
      if (
        !selectedFile ||
        analyzing
      ) {
        return;
      }

      setAnalyzing(
        true,
      );

      setRecoverySummary(
        null,
      );

      setRecoveryError(
        null,
      );

      try {
        const formData =
          new FormData();

        formData.append(
          "image",
          selectedFile,
        );

        formData.append(
          "user_hint",
          userHint.trim(),
        );

        const response =
          await fetch(
            "/api/resident/scan",
            {
              method:
                "POST",

              body:
                formData,
            },
          );

        if (
          !response.ok
        ) {
          throw new Error(
            await readApiError(
              response,
              "The image could not be analyzed.",
            ),
          );
        }

        const payload =
          (
            await response.json()
          ) as ScanApiResponse;

        setResult(
          payload.scan,
        );

        setCorrectedMaterialId(
          payload.scan.material_id ??
          "",
        );

        setRecentScans(
          (
            current,
          ) => [
            payload.scan,
            ...current.filter(
              (
                scan,
              ) =>
                scan.id !==
                payload.scan.id,
            ),
          ].slice(
            0,
            5,
          ),
        );

        toast.success(
          "Item identified. Confirm the material to see your choices.",
        );
      } catch (
        error
      ) {
        toast.error(
          getErrorMessage(
            error,
            "The image could not be analyzed.",
          ),
        );
      } finally {
        setAnalyzing(
          false,
        );
      }
    };


  const confirmResult =
    async () => {
      if (
        !result ||
        confirming
      ) {
        return;
      }

      if (
        !correctedMaterialId
      ) {
        toast.error(
          "Select the material that best matches the item.",
        );

        return;
      }

      setConfirming(
        true,
      );

      try {
        const response =
          await fetch(
            `/api/resident/scan/${result.id}`,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  material_id:
                    correctedMaterialId,
                }),
            },
          );

        if (
          !response.ok
        ) {
          throw new Error(
            await readApiError(
              response,
              "The material could not be confirmed.",
            ),
          );
        }

        const payload =
          (
            await response.json()
          ) as {
            scan:
              ScanResult;

            material:
              Material;
          };

        setResult(
          payload.scan,
        );

        setCorrectedMaterialId(
          payload.scan.material_id ??
          "",
        );

        setRecentScans(
          (
            current,
          ) =>
            current.map(
              (
                scan,
              ) =>
                scan.id ===
                payload.scan.id
                  ? payload.scan
                  : scan,
            ),
        );

        if (
          payload.scan.material_id
        ) {
          await loadRecoverySummary(
            payload.scan.material_id,
          );
        }

        toast.success(
          "Material confirmed. Your recommended choices are ready.",
        );
      } catch (
        error
      ) {
        toast.error(
          getErrorMessage(
            error,
            "The material could not be confirmed.",
          ),
        );
      } finally {
        setConfirming(
          false,
        );
      }
    };


  const selectRecentScan =
    async (
      scan: ScanResult,
    ) => {
      setResult(
        scan,
      );

      setCorrectedMaterialId(
        scan.material_id ??
        "",
      );

      setSelectedFile(
        null,
      );

      if (
        previewUrl
      ) {
        URL.revokeObjectURL(
          previewUrl,
        );

        setPreviewUrl(
          null,
        );
      }

      if (
        scan.user_confirmed &&
        scan.material_id
      ) {
        await loadRecoverySummary(
          scan.material_id,
        );
      } else {
        setRecoverySummary(
          null,
        );
      }

      window.scrollTo({
        top:
          0,

        behavior:
          "smooth",
      });
    };


  const resetScanner =
    () => {
      if (
        previewUrl
      ) {
        URL.revokeObjectURL(
          previewUrl,
        );
      }

      setSelectedFile(
        null,
      );

      setPreviewUrl(
        null,
      );

      setUserHint(
        "",
      );

      setResult(
        null,
      );

      setCorrectedMaterialId(
        "",
      );

      setRecoverySummary(
        null,
      );

      setRecoveryError(
        null,
      );
    };


  const deleteCurrentScan =
    async () => {
      if (
        !result ||
        deleting
      ) {
        return;
      }

      setDeleting(
        true,
      );

      try {
        const response =
          await fetch(
            `/api/resident/scan/${result.id}`,
            {
              method:
                "DELETE",
            },
          );

        if (
          !response.ok
        ) {
          throw new Error(
            await readApiError(
              response,
              "The scan could not be deleted.",
            ),
          );
        }

        setRecentScans(
          (
            current,
          ) =>
            current.filter(
              (
                scan,
              ) =>
                scan.id !==
                result.id,
            ),
        );

        resetScanner();

        toast.success(
          "Scan deleted.",
        );
      } catch (
        error
      ) {
        toast.error(
          getErrorMessage(
            error,
            "The scan could not be deleted.",
          ),
        );
      } finally {
        setDeleting(
          false,
        );
      }
    };


  const recommendation =
    useMemo(
      () =>
        normalizeRecommendedAction(
          result?.recommended_action ??
          null,
        ),
      [
        result?.recommended_action,
      ],
    );


  const preparationSteps =
    useMemo(
      () =>
        normalizePreparationSteps(
          result?.preparation_steps ??
          null,
        ),
      [
        result?.preparation_steps,
      ],
    );


  const actionChoices =
    useMemo<ActionChoice[]>(
      () => {
        if (
          !result ||
          !result.material_id ||
          !result.user_confirmed
        ) {
          return [];
        }

        const summary =
          recoverySummary ?? {
            acceptingJunkshops:
              0,

            buyingJunkshops:
              0,

            minimumPrice:
              null,

            maximumPrice:
              null,

            donationDrives:
              0,

            donationOrganizations:
              0,

            donationProjectNames:
              [],
          };

        const order =
          buildActionOrder(
            result,
            recommendation,
          );

        const primary =
          normalizeActionType(
            result.primary_action,
          );

        return order.map(
          (
            action,
            index,
          ): ActionChoice => {
            const recommended =
              action ===
              primary;

            const alternativeReason =
              getAlternativeReason(
                action,
                recommendation,
              );

            const rank =
              index +
              1;

            if (
              action ===
              "sell"
            ) {
              const disabled =
                summary.buyingJunkshops ===
                0;

              return {
                type:
                  action,

                rank,

                title:
                  "Sell it",

                eyebrow:
                  disabled
                    ? "No buyer listed"
                    : `${summary.buyingJunkshops} buyer${
                        summary.buyingJunkshops ===
                        1
                          ? ""
                          : "s"
                      } found`,

                description:
                  disabled
                    ? "No approved junkshop currently lists a buying price for this material."
                    : `See offers sorted from the lowest to highest price. Current range: ${formatPriceRange(
                        summary,
                      )}.`,

                detail:
                  disabled
                    ? "You can still check recycling or donation options."
                    : "Prices come directly from junkshop_materials and may change when junkshops update their listings.",

                buttonLabel:
                  "See what you can earn",

                icon:
                  actionIcon(
                    action,
                  ),

                disabled,

                disabledReason:
                  disabled
                    ? "No active buying offer"
                    : null,

                recommended,

                aiReason:
                  recommended
                    ? recommendation?.description ??
                      null
                    : alternativeReason,
              };
            }

            if (
              action ===
              "donate"
            ) {
              const disabled =
                summary.donationDrives ===
                0;

              const projectPreview =
                summary.donationProjectNames.length >
                0
                  ? summary.donationProjectNames.join(
                      ", ",
                    )
                  : "No current project";

              return {
                type:
                  action,

                rank,

                title:
                  "Donate it",

                eyebrow:
                  disabled
                    ? "No active school drive"
                    : `${summary.donationDrives} active project${
                        summary.donationDrives ===
                        1
                          ? ""
                          : "s"
                      }`,

                description:
                  disabled
                    ? "No approved school or organization currently has an active drive for this material."
                    : `${summary.donationOrganizations} approved school or organization${
                        summary.donationOrganizations ===
                        1
                          ? " is"
                          : "s are"
                      } collecting it.`,

                detail:
                  disabled
                    ? "Donation results appear only when school_drive_materials contains the confirmed material."
                    : `Projects include: ${projectPreview}. Your contribution can help them move closer to their collection target.`,

                buttonLabel:
                  "View school projects",

                icon:
                  actionIcon(
                    action,
                  ),

                disabled,

                disabledReason:
                  disabled
                    ? "No matching active drive"
                    : null,

                recommended,

                aiReason:
                  recommended
                    ? recommendation?.description ??
                      null
                    : alternativeReason,
              };
            }

            if (
              action ===
              "reuse"
            ) {
              const disabled =
                result.hazardous;

              return {
                type:
                  action,

                rank,

                title:
                  "Reuse it",

                eyebrow:
                  disabled
                    ? "Unsafe for normal reuse"
                    : "Practical ideas",

                description:
                  disabled
                    ? "This item was flagged for special handling, so normal reuse ideas are hidden."
                    : `Explore useful ideas based on the detected object, its material, and its visible condition.`,

                detail:
                  disabled
                    ? "Follow the safety guidance instead of dismantling or repurposing it."
                    : "The reuse page can combine verified material guidance with AI-generated ideas tailored to the photographed item.",

                buttonLabel:
                  "Explore reuse ideas",

                icon:
                  actionIcon(
                    action,
                  ),

                disabled,

                disabledReason:
                  disabled
                    ? "Hazardous item"
                    : null,

                recommended,

                aiReason:
                  recommended
                    ? recommendation?.description ??
                      null
                    : alternativeReason,
              };
            }

            return {
              type:
                action,

              rank,

              title:
                "Recycle it",

              eyebrow:
                summary.acceptingJunkshops >
                0
                  ? `${summary.acceptingJunkshops} accepting junkshop${
                      summary.acceptingJunkshops ===
                      1
                        ? ""
                        : "s"
                    }`
                  : "Learn the correct process",

              description:
                preparationSteps.length >
                0
                  ? `Start with: ${preparationSteps[0]}`
                  : "Learn how to prepare, separate, clean, and deliver this material correctly.",

              detail:
                summary.acceptingJunkshops >
                0
                  ? "The recycle guide can also show approved junkshops that currently accept this material."
                  : "Even when no nearby facility is listed, the guide explains safe preparation and handling.",

              buttonLabel:
                "Learn how to recycle",

              icon:
                actionIcon(
                  action,
                ),

              disabled:
                false,

              disabledReason:
                null,

              recommended,

              aiReason:
                recommended
                  ? recommendation?.description ??
                    null
                  : alternativeReason,
            };
          },
        );
      },
      [
        preparationSteps,
        recommendation,
        recoverySummary,
        result,
      ],
    );


  if (
    loading
  ) {
    return (
      <ScanPageSkeleton />
    );
  }


  if (
    pageError ||
    !profile
  ) {
    return (
      <ScanPageError
        message={
          pageError ??
          "Resident account was not found."
        }
        onRetry={() =>
          void loadPageData()
        }
      />
    );
  }


  const confidence =
    result
      ? formatConfidence(
          result.confidence_score,
        )
      : 0;

  const confirmedMaterial =
    materials.find(
      (
        material,
      ) =>
        material.id ===
        result?.material_id,
    ) ??
    null;


  return (
    <>
      <style jsx global>{`
        @keyframes scanFadeUp {
          from {
            opacity: 0;
            transform: translateY(9px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scanPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.72;
          }

          50% {
            transform: scale(1.04);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .scan-motion {
            animation: none !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>


      <div className="min-w-0 space-y-7 overflow-x-hidden">
        {/* PAGE HEADER */}

        <section className="scan-motion animate-[scanFadeUp_.35s_ease-out_both]">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold text-green-600">
                One scan, four clear choices
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
                Scan an Item
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                Gemini identifies the item. You confirm the material.
                Trashure then ranks Recycle, Sell, Donate, and Reuse while
                keeping prices and school projects database-driven.
              </p>
            </div>


            <Button
              type="button"
              variant="outline"
              disabled={
                refreshing
              }
              onClick={() =>
                void loadPageData(
                  true,
                )
              }
              className="w-fit rounded-full border-green-200 bg-white hover:bg-green-50 hover:text-green-700"
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


        {/* SIMPLE PROCESS BAR */}

        <section className="scan-motion animate-[scanFadeUp_.4s_ease-out_.04s_both] rounded-[28px] border border-green-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <ProcessStep
              number="1"
              title="Scan"
              description="Capture one clear item"
              active={
                !result
              }
              complete={
                Boolean(
                  result,
                )
              }
            />

            <ProcessStep
              number="2"
              title="Confirm"
              description="Verify the material"
              active={
                Boolean(
                  result &&
                  !result.user_confirmed,
                )
              }
              complete={
                Boolean(
                  result?.user_confirmed,
                )
              }
            />

            <ProcessStep
              number="3"
              title="Choose"
              description="Open the best action"
              active={
                Boolean(
                  result?.user_confirmed,
                )
              }
              complete={
                false
              }
            />
          </div>
        </section>


        {/* CAPTURE + RESULT */}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
          <section className="scan-motion animate-[scanFadeUp_.4s_ease-out_.08s_both] rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
            <SectionHeader
              icon={
                Camera
              }
              title="Capture one item"
              description="Use a clear background and avoid showing people, documents, or house numbers."
            />


            <input
              ref={
                cameraInputRef
              }
              type="file"
              accept="image/*"
              capture="environment"
              onChange={
                handleImageSelection
              }
              className="hidden"
            />

            <input
              ref={
                uploadInputRef
              }
              type="file"
              accept="image/*"
              onChange={
                handleImageSelection
              }
              className="hidden"
            />


            <div className="mt-6">
              {previewUrl ? (
                <div className="relative overflow-hidden rounded-[26px] border border-green-200 bg-zinc-100">
                  <img
                    src={
                      previewUrl
                    }
                    alt="Selected item preview"
                    className="aspect-[4/3] w-full object-contain"
                  />

                  <div className="absolute bottom-3 left-3 rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-bold text-white">
                    Ready for analysis
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={
                    preparingImage
                  }
                  onClick={() =>
                    cameraInputRef.current?.click()
                  }
                  className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-green-200 bg-green-50 px-6 text-center transition hover:border-green-400"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-green-600 shadow-sm">
                    {preparingImage ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                      <ScanLine className="h-8 w-8" />
                    )}
                  </div>

                  <h3 className="mt-5 text-lg font-black text-zinc-900">
                    {preparingImage
                      ? "Preparing photo..."
                      : "Capture one discarded item"}
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                    The browser compresses the photo before sending it to
                    Gemini.
                  </p>
                </button>
              )}
            </div>


            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                disabled={
                  preparingImage ||
                  analyzing
                }
                onClick={() =>
                  cameraInputRef.current?.click()
                }
                className="rounded-full border-green-200 text-green-700 hover:bg-green-50"
              >
                <Camera className="mr-2 h-4 w-4" />

                Use camera
              </Button>


              <Button
                type="button"
                variant="outline"
                disabled={
                  preparingImage ||
                  analyzing
                }
                onClick={() =>
                  uploadInputRef.current?.click()
                }
                className="rounded-full border-green-200 text-green-700 hover:bg-green-50"
              >
                <Upload className="mr-2 h-4 w-4" />

                Upload photo
              </Button>
            </div>


            <div className="mt-6">
              <label
                htmlFor="scan_hint"
                className="text-sm font-bold text-zinc-700"
              >
                Optional item hint
              </label>

              <textarea
                id="scan_hint"
                rows={3}
                maxLength={300}
                value={
                  userHint
                }
                onChange={(
                  event,
                ) =>
                  setUserHint(
                    event.target.value,
                  )
                }
                placeholder="Example: plastic drink bottle, food container, old charger, or broken appliance."
                className="mt-2 w-full resize-none rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              />

              <p className="mt-2 text-right text-xs text-zinc-400">
                {userHint.length}
                /300
              </p>
            </div>


            <Button
              type="button"
              disabled={
                !selectedFile ||
                analyzing ||
                preparingImage
              }
              onClick={() =>
                void analyzeImage()
              }
              className="mt-5 h-12 w-full rounded-full bg-green-600 text-base font-black hover:bg-green-700"
            >
              {analyzing ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}

              {analyzing
                ? "Analyzing item..."
                : "Analyze with Gemini"}
            </Button>


            {analyzing && (
              <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="scan-motion animate-[scanPulse_1.5s_ease-in-out_infinite]">
                    <ScanLine className="h-6 w-6 text-green-600" />
                  </div>

                  <div>
                    <p className="text-sm font-black text-zinc-900">
                      Matching the image with the material catalog
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      The action choices appear only after you confirm the
                      result.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>


          <section className="scan-motion animate-[scanFadeUp_.4s_ease-out_.12s_both] rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
            <SectionHeader
              icon={
                PackageCheck
              }
              title="Confirm the material"
              description="This confirmation connects the item to real junkshop prices and school projects."
            />


            {!result ? (
              <div className="mt-6 flex min-h-[520px] flex-col items-center justify-center rounded-[24px] border border-dashed border-green-200 bg-green-50 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-green-600 shadow-sm">
                  <ImagePlus className="h-7 w-7" />
                </div>

                <h3 className="mt-5 font-black text-zinc-900">
                  No result yet
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                  Add a clear photo and run the analysis.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {result.hazardous && (
                  <div className="rounded-[22px] border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />

                      <div>
                        <p className="font-black text-red-800">
                          Special handling may be required
                        </p>

                        <p className="mt-1 text-sm leading-6 text-red-700">
                          {result.hazard_notes ||
                            "Do not open, dismantle, puncture, or burn this item."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}


                <div className="overflow-hidden rounded-[24px] border border-green-100">
                  {result.image_url && (
                    <img
                      src={
                        result.image_url
                      }
                      alt={
                        result.detected_object
                      }
                      className="h-48 w-full object-cover"
                    />
                  )}


                  <div className="bg-white p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                        {
                          result.material_type
                        }
                      </Badge>

                      <Badge
                        className={
                          confidence >=
                          80
                            ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-50"
                            : confidence >=
                                60
                              ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50"
                              : "border-red-200 bg-red-50 text-red-700 hover:bg-red-50"
                        }
                      >
                        {confidence}
                        % confidence
                      </Badge>

                      {result.user_confirmed && (
                        <Badge className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">
                          <BadgeCheck className="mr-1 h-3.5 w-3.5" />

                          Confirmed
                        </Badge>
                      )}
                    </div>


                    <h3 className="mt-3 text-2xl font-black text-zinc-900">
                      {
                        result.detected_object
                      }
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      {
                        result.object_description
                      }
                    </p>


                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <ResultMetric
                        label="Category"
                        value={
                          result.material_category ??
                          "Other"
                        }
                      />

                      <ResultMetric
                        label="Condition"
                        value={titleCase(
                          result.condition,
                        )}
                      />
                    </div>
                  </div>
                </div>


                <div className="rounded-[22px] border border-green-100 bg-green-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-green-600">
                    AI recommendation
                  </p>

                  <h4 className="mt-2 font-black text-zinc-900">
                    {recommendation?.title ??
                      "Review the suggested action"}
                  </h4>

                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    {recommendation?.description ??
                      "Confirm the material before opening the recommended choices."}
                  </p>
                </div>


                {!result.user_confirmed ? (
                  <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                      <div className="flex-1">
                        <p className="font-black text-zinc-900">
                          Is this the correct material?
                        </p>

                        <p className="mt-1 text-sm leading-6 text-zinc-600">
                          {recommendation?.confirmation_question ??
                            "Select the material that best matches the item."}
                        </p>


                        <select
                          value={
                            correctedMaterialId
                          }
                          onChange={(
                            event,
                          ) =>
                            setCorrectedMaterialId(
                              event.target.value,
                            )
                          }
                          className="mt-4 h-12 w-full rounded-xl border border-amber-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        >
                          <option value="">
                            Select the correct material
                          </option>

                          {materials.map(
                            (
                              material,
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
                                }{" "}
                                ·{" "}
                                {
                                  material.category
                                }
                              </option>
                            ),
                          )}
                        </select>


                        <Button
                          type="button"
                          disabled={
                            confirming ||
                            !correctedMaterialId
                          }
                          onClick={() =>
                            void confirmResult()
                          }
                          className="mt-3 w-full rounded-full bg-green-600 hover:bg-green-700"
                        >
                          {confirming ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="mr-2 h-4 w-4" />
                          )}

                          {confirming
                            ? "Confirming..."
                            : "Confirm material"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[22px] border border-green-200 bg-green-50 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

                      <div>
                        <p className="font-black text-zinc-900">
                          Confirmed as{" "}
                          {confirmedMaterial?.material_name ??
                            result.material_type}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-zinc-600">
                          The same material ID now powers all four choices.
                        </p>
                      </div>
                    </div>
                  </div>
                )}


                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={
                      resetScanner
                    }
                    className="rounded-full border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />

                    Scan another
                  </Button>


                  <Button
                    type="button"
                    variant="ghost"
                    disabled={
                      deleting
                    }
                    onClick={() =>
                      void deleteCurrentScan()
                    }
                    className="rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    {deleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}

                    Delete scan
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>


        {/* ACTION CHOICES */}

        {result?.user_confirmed && (
          <section className="scan-motion animate-[scanFadeUp_.4s_ease-out_.18s_both] rounded-[30px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <p className="text-sm font-bold text-green-600">
                  Ranked for this item
                </p>

                <h2 className="mt-1 text-2xl font-black text-zinc-900">
                  What would you like to do?
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                  The order comes from the AI recommendation. Availability,
                  prices, and donation projects come from the database.
                </p>
              </div>


              <Button
                type="button"
                variant="outline"
                disabled={
                  loadingRecovery ||
                  !result.material_id
                }
                onClick={() => {
                  if (
                    result.material_id
                  ) {
                    void loadRecoverySummary(
                      result.material_id,
                    );
                  }
                }}
                className="w-fit rounded-full border-green-200 text-green-700 hover:bg-green-50"
              >
                <RefreshCcw
                  className={`mr-2 h-4 w-4 ${
                    loadingRecovery
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Refresh choices
              </Button>
            </div>


            {loadingRecovery ? (
              <ActionChoicesSkeleton />
            ) : recoveryError ? (
              <div className="mt-6 rounded-[24px] border border-red-200 bg-red-50 p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                  <div>
                    <p className="font-black text-red-800">
                      Database choices unavailable
                    </p>

                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {
                        recoveryError
                      }
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {actionChoices.map(
                  (
                    choice,
                  ) => (
                    <ActionChoiceCard
                      key={
                        choice.type
                      }
                      choice={
                        choice
                      }
                      onOpen={() => {
                        if (
                          !result.material_id ||
                          choice.disabled
                        ) {
                          return;
                        }

                        router.push(
                          buildActionPath({
                            action:
                              choice.type,

                            scanId:
                              result.id,

                            materialId:
                              result.material_id,
                          }),
                        );
                      }}
                    />
                  ),
                )}
              </div>
            )}


            {!loadingRecovery &&
              !recoveryError &&
              recoverySummary && (
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <ChoiceSummary
                    icon={
                      Store
                    }
                    label="Accepting junkshops"
                    value={
                      recoverySummary.acceptingJunkshops
                    }
                  />

                  <ChoiceSummary
                    icon={
                      CircleDollarSign
                    }
                    label="Current price range"
                    value={formatPriceRange(
                      recoverySummary,
                    )}
                  />

                  <ChoiceSummary
                    icon={
                      School
                    }
                    label="School projects"
                    value={
                      recoverySummary.donationDrives
                    }
                  />
                </div>
              )}
          </section>
        )}


        {/* RECENT SCANS */}

        <section className="scan-motion min-w-0 overflow-hidden rounded-[28px] border border-green-100 bg-white p-4 shadow-sm animate-[scanFadeUp_.4s_ease-out_.24s_both] sm:p-7">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-black text-zinc-900">
                Recent scans
              </h2>

              <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-500">
                Select a scan to review its material and current choices.
              </p>
            </div>


            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push(
                  `${RESIDENT_BASE_PATH}/history`,
                )
              }
              className="w-full shrink-0 justify-center rounded-full border-green-200 text-green-700 hover:bg-green-50 sm:w-fit"
            >
              View history

              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>


          {recentScans.length ===
          0 ? (
            <div className="mt-5 flex min-w-0 flex-col items-center rounded-[24px] border border-dashed border-green-200 bg-green-50 px-4 py-10 text-center sm:px-6">
              <ScanLine className="h-8 w-8 text-green-600" />

              <h3 className="mt-4 font-black text-zinc-900">
                No scans saved yet
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Your first completed analysis will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {recentScans.map(
                (
                  scan,
                ) => (
                  <RecentScanCard
                    key={
                      scan.id
                    }
                    scan={
                      scan
                    }
                    selected={
                      result?.id ===
                      scan.id
                    }
                    onSelect={() =>
                      void selectRecentScan(
                        scan,
                      )
                    }
                  />
                ),
              )}
            </div>
          )}
        </section>


        {/* SAFETY NOTE */}

        <section className="scan-motion animate-[scanFadeUp_.4s_ease-out_.28s_both] rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="grid gap-5 lg:grid-cols-3">
            <GuidanceCard
              icon={
                Camera
              }
              title="One clear item"
              description="A simple image improves material matching and reduces unnecessary confirmation."
            />

            <GuidanceCard
              icon={
                ShieldAlert
              }
              title="Safety before recovery"
              description="Hazardous items should not be opened, punctured, burned, or repurposed."
            />

            <GuidanceCard
              icon={
                BadgeCheck
              }
              title="Database over guesswork"
              description="Gemini ranks the choices. Real prices and school projects still come from verified records."
            />
          </div>
        </section>
      </div>
    </>
  );
}


/* =========================================================
   COMPONENTS
========================================================= */

function ProcessStep({
  number,
  title,
  description,
  active,
  complete,
}: {
  number: string;
  title: string;
  description: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        active
          ? "border-green-300 bg-green-50"
          : complete
            ? "border-green-100 bg-white"
            : "border-zinc-100 bg-zinc-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
            active
              ? "bg-green-600 text-white"
              : complete
                ? "bg-green-100 text-green-700"
                : "bg-white text-zinc-400"
          }`}
        >
          {complete ? (
            <Check className="h-4 w-4" />
          ) : (
            number
          )}
        </div>

        <div>
          <p className="font-black text-zinc-900">
            {title}
          </p>

          <p className="mt-0.5 text-xs text-zinc-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}


function SectionHeader({
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
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
        <Icon className="h-6 w-6" />
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
  );
}


function ResultMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-zinc-800">
        {value}
      </p>
    </div>
  );
}


function ActionChoiceCard({
  choice,
  onOpen,
}: {
  choice: ActionChoice;
  onOpen: () => void;
}) {
  const Icon =
    choice.icon;

  return (
    <article
      className={`relative overflow-hidden rounded-[26px] border p-5 transition ${
        choice.recommended
          ? "border-green-400 bg-green-50 shadow-sm"
          : choice.disabled
            ? "border-zinc-200 bg-zinc-50"
            : "border-green-100 bg-white hover:-translate-y-0.5 hover:border-green-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              choice.recommended
                ? "bg-green-600 text-white"
                : choice.disabled
                  ? "bg-zinc-200 text-zinc-500"
                  : "bg-green-50 text-green-600"
            }`}
          >
            <Icon className="h-6 w-6" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={
                  choice.recommended
                    ? "border-green-600 bg-green-600 text-white hover:bg-green-600"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-white"
                }
              >
                #{choice.rank}
              </Badge>

              {choice.recommended && (
                <Badge className="border-green-200 bg-white text-green-700 hover:bg-white">
                  Best recommendation
                </Badge>
              )}
            </div>

            <h3 className="mt-3 text-xl font-black text-zinc-900">
              {choice.title}
            </h3>

            <p className="mt-1 text-sm font-bold text-green-700">
              {choice.eyebrow}
            </p>
          </div>
        </div>
      </div>


      <p className="mt-4 text-sm leading-6 text-zinc-600">
        {choice.description}
      </p>

      <p className="mt-3 text-xs leading-5 text-zinc-500">
        {choice.detail}
      </p>


      {choice.aiReason && (
        <div className="mt-4 rounded-2xl border border-green-100 bg-white p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-green-600">
            Why Trashure placed it here
          </p>

          <p className="mt-1 text-sm leading-6 text-zinc-600">
            {
              choice.aiReason
            }
          </p>
        </div>
      )}


      <Button
        type="button"
        disabled={
          choice.disabled
        }
        onClick={
          onOpen
        }
        className={`mt-5 w-full rounded-full ${
          choice.recommended
            ? "bg-green-600 hover:bg-green-700"
            : ""
        }`}
        variant={
          choice.recommended
            ? "default"
            : "outline"
        }
      >
        {choice.disabled
          ? choice.disabledReason
          : choice.buttonLabel}

        {!choice.disabled && (
          <ArrowRight className="ml-2 h-4 w-4" />
        )}
      </Button>
    </article>
  );
}


function ChoiceSummary({
  icon: Icon,
  label,
  value,
}: {
  icon:
    ComponentType<{
      className?: string;
    }>;
  label: string;
  value:
    | string
    | number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-green-600 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          {label}
        </p>

        <p className="mt-0.5 font-black text-zinc-900">
          {value}
        </p>
      </div>
    </div>
  );
}


function RecentScanCard({
  scan,
  selected,
  onSelect,
}: {
  scan: ScanResult;
  selected: boolean;
  onSelect: () => void;
}) {
  const [imageFailed, setImageFailed] =
    useState(
      false,
    );


  useEffect(
    () => {
      setImageFailed(
        false,
      );
    },
    [
      scan.image_url,
    ],
  );


  return (
    <button
      type="button"
      aria-pressed={
        selected
      }
      onClick={
        onSelect
      }
      className={`grid min-w-0 max-w-full grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-[20px] border p-2.5 text-left transition-all duration-300 sm:grid-cols-[3.5rem_minmax(0,1fr)_auto] sm:p-3 ${
        selected
          ? "border-green-400 bg-green-50 ring-2 ring-green-100"
          : "border-zinc-200 bg-white hover:border-green-300 hover:bg-green-50"
      }`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-green-50 text-green-600 sm:h-14 sm:w-14 sm:rounded-2xl">
        {scan.image_url &&
        !imageFailed ? (
          <img
            src={
              scan.image_url
            }
            alt={
              scan.detected_object
            }
            onError={() =>
              setImageFailed(
                true,
              )
            }
            className="h-full w-full object-cover"
          />
        ) : (
          <PackageCheck className="h-5 w-5" />
        )}
      </div>


      <div className="min-w-0 overflow-hidden">
        <p className="truncate text-sm font-black leading-5 text-zinc-900 sm:text-base">
          {
            scan.detected_object
          }
        </p>

        <p className="mt-0.5 truncate text-[11px] leading-5 text-zinc-500 sm:mt-1 sm:text-xs">
          {
            scan.material_type
          }{" "}
          ·{" "}
          {formatRelativeDate(
            scan.created_at,
          )}
        </p>
      </div>


      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          scan.user_confirmed
            ? "bg-green-50 text-green-600"
            : "bg-amber-50 text-amber-600"
        }`}
      >
        {scan.user_confirmed ? (
          <BadgeCheck className="h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
          <Clock3 className="h-4 w-4 sm:h-5 sm:w-5" />
        )}
      </div>
    </button>
  );
}


function GuidanceCard({
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
    <div className="flex gap-4 rounded-[22px] border border-green-100 bg-green-50 p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-green-600 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="font-black text-zinc-900">
          {title}
        </p>

        <p className="mt-1 text-sm leading-6 text-zinc-500">
          {description}
        </p>
      </div>
    </div>
  );
}


function ScanPageError({
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
          Resident scanner unavailable
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


function ScanPageSkeleton() {
  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <Skeleton className="h-4 w-52 bg-green-100" />

        <Skeleton className="h-9 w-72 max-w-full bg-green-100" />

        <Skeleton className="h-4 w-[520px] max-w-full bg-green-100" />
      </div>

      <Skeleton className="h-28 rounded-[28px] bg-green-100" />

      <div className="grid gap-5 xl:grid-cols-2">
        <Skeleton className="h-[760px] rounded-[28px] bg-green-100" />

        <Skeleton className="h-[760px] rounded-[28px] bg-green-100" />
      </div>

      <Skeleton className="h-[560px] rounded-[30px] bg-green-100" />

      <Skeleton className="h-64 rounded-[28px] bg-green-100" />
    </div>
  );
}


function ActionChoicesSkeleton() {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      {Array.from({
        length:
          4,
      }).map(
        (
          _,
          index,
        ) => (
          <Skeleton
            key={
              index
            }
            className="h-72 rounded-[26px] bg-green-100"
          />
        ),
      )}
    </div>
  );
}
