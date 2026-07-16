"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Lightbulb,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Wrench,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const RESIDENT_BASE_PATH = "/profiles/resident";

interface ReuseIdea {
  title: string;
  description: string;
  materials_needed: string[];
  safety_note: string;
}

interface AiRawResult {
  reuse_ideas?: ReuseIdea[];
}

interface ScanRow {
  id: string;
  user_id: string;
  image_url: string | null;
  detected_object: string;
  object_description: string | null;
  material_id: string | null;
  material_type: string;
  material_category: string | null;
  condition: string | null;
  preparation_steps: string[] | string | null;
  hazardous: boolean;
  hazard_notes: string | null;
  user_confirmed: boolean;
  ai_raw_result: AiRawResult | string | null;
}

interface Material {
  id: string;
  material_name: string;
  category: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function readJsonObject<T>(value: T | string | null) {
  if (!value) return null;
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function readSteps(value: string[] | string | null) {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === "string",
    );
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string => typeof item === "string",
        );
      }
    } catch {
      return [value];
    }
  }

  return [];
}

function fallbackIdeas(
  scan: ScanRow,
  material: Material,
): ReuseIdea[] {
  const category = material.category.toLowerCase();
  const objectName = scan.detected_object.toLowerCase();

  if (category.includes("plastic")) {
    return [
      {
        title: "Small-item organizer",
        description: `Clean the ${objectName} and use it to organize lightweight household or classroom items.`,
        materials_needed: ["Soap and water", "Label"],
        safety_note:
          "Do not use it for food or drinking water unless it is food-safe and undamaged.",
      },
      {
        title: "Temporary seedling container",
        description:
          "When the shape allows, add safe drainage holes and use it as a temporary seedling container.",
        materials_needed: ["Soil", "Seedling", "Adult-supervised tool"],
        safety_note:
          "An adult should handle cutting or puncturing.",
      },
      {
        title: "Learning or craft material",
        description:
          "Use the cleaned item in a supervised sorting, measurement, or design activity.",
        materials_needed: ["Non-toxic markers", "Paper", "Safe adhesive"],
        safety_note:
          "Stop if the item has sharp edges, cracks, or contamination.",
      },
    ];
  }

  if (
    category.includes("paper") ||
    category.includes("cardboard")
  ) {
    return [
      {
        title: "Drawer or shelf divider",
        description:
          "Cut and fold the clean material into simple dividers for lightweight items.",
        materials_needed: ["Ruler", "Pencil", "Adult-supervised cutter"],
        safety_note:
          "Keep the material dry and avoid moldy or food-contaminated pieces.",
      },
      {
        title: "Flashcards or labels",
        description:
          "Use clean flat sections for classroom flashcards, labels, or household reminders.",
        materials_needed: ["Scissors", "Markers"],
        safety_note:
          "Use only clean, dry pieces without mold or chemical residue.",
      },
    ];
  }

  if (
    category.includes("glass") ||
    category.includes("metal")
  ) {
    return [
      {
        title: "Decorative non-food storage",
        description:
          "Use an intact and thoroughly cleaned container for decorative storage.",
        materials_needed: ["Soap and water", "Label or ribbon"],
        safety_note:
          "Do not reuse cracked glass, sharp metal, or chemical containers.",
      },
      {
        title: "Supervised craft display",
        description:
          "Use the intact item as part of a stationary display or learning project.",
        materials_needed: ["Non-toxic paint", "Protective gloves"],
        safety_note:
          "An adult should inspect all edges before use.",
      },
    ];
  }

  return [
    {
      title: "Organized non-food storage",
      description: `When safe and structurally sound, clean the ${objectName} and use it for lightweight non-food storage.`,
      materials_needed: ["Soap and water", "Label"],
      safety_note:
        "Do not reuse damaged, contaminated, sharp, or unstable items.",
    },
    {
      title: "Supervised learning project",
      description:
        "Use the item in a sorting, design, or environmental-awareness activity.",
      materials_needed: ["Paper", "Markers", "Safe adhesive"],
      safety_note:
        "An adult should supervise cutting, drilling, or shaping.",
    },
  ];
}

export default function ReuseActionPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [scanId, setScanId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [scan, setScan] = useState<ScanRow | null>(null);
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setScanId(query.get("scan") ?? "");
    setMaterialId(query.get("material") ?? "");
  }, []);

  const loadPage = useCallback(
    async (silent = false) => {
      if (!scanId || !materialId) return;

      silent ? setRefreshing(true) : setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id,role")
          .eq("auth_id", user.id)
          .single();

        if (
          profileError ||
          !profile ||
          profile.role !== "resident"
        ) {
          throw new Error("Resident account was not found.");
        }

        const { data: scanData, error: scanError } = await supabase
          .from("scans")
          .select(`
            id,
            user_id,
            image_url,
            detected_object,
            object_description,
            material_id,
            material_type,
            material_category,
            condition,
            preparation_steps,
            hazardous,
            hazard_notes,
            user_confirmed,
            ai_raw_result
          `)
          .eq("id", scanId)
          .eq("user_id", profile.id)
          .single();

        if (
          scanError ||
          !scanData ||
          !scanData.user_confirmed ||
          scanData.material_id !== materialId
        ) {
          throw new Error("The confirmed scan could not be verified.");
        }

        setScan(scanData as ScanRow);

        const { data: materialData, error: materialError } = await supabase
          .from("materials")
          .select("id,material_name,category")
          .eq("id", materialId)
          .single();

        if (materialError || !materialData) {
          throw new Error("The material was not found.");
        }

        setMaterial(materialData as Material);
      } catch (pageError) {
        setError(
          getErrorMessage(
            pageError,
            "The reuse ideas could not be loaded.",
          ),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [materialId, router, scanId, supabase],
  );

  useEffect(() => {
    if (scanId && materialId) void loadPage();
  }, [loadPage, materialId, scanId]);

  if (loading || !scanId || !materialId) {
    return <PageSkeleton />;
  }

  if (error || !scan || !material) {
    return (
      <ErrorState
        message={error ?? "The reuse page could not be loaded."}
        onBack={() => router.push(`${RESIDENT_BASE_PATH}/scan`)}
      />
    );
  }

  const aiRaw = readJsonObject<AiRawResult>(scan.ai_raw_result);
  const ideas =
    aiRaw?.reuse_ideas?.length
      ? aiRaw.reuse_ideas
      : fallbackIdeas(scan, material);

  const preparation = readSteps(scan.preparation_steps);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-green-100 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[1fr_280px]">
          <div className="p-5 sm:p-7">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(`${RESIDENT_BASE_PATH}/scan`)}
              className="rounded-full text-green-700 hover:bg-green-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to scan
            </Button>

            <p className="mt-6 text-sm font-bold text-green-600">
              Safe second-life ideas
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
              What can you do with it?
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Reuse ideas are based on the detected object, confirmed material,
              and visible condition. Safety still comes first.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                {ideas.length} idea{ideas.length === 1 ? "" : "s"}
              </Badge>

              <Badge className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">
                {material.material_name}
              </Badge>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={refreshing}
              onClick={() => void loadPage(true)}
              className="mt-5 rounded-full border-green-200 text-green-700 hover:bg-green-50"
            >
              <RefreshCcw
                className={`mr-2 h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>
          </div>

          <div className="min-h-56 bg-green-50">
            {scan.image_url ? (
              <img
                src={scan.image_url}
                alt={scan.detected_object}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-56 items-center justify-center">
                <Lightbulb className="h-14 w-14 text-green-600" />
              </div>
            )}
          </div>
        </div>
      </section>

      {scan.hazardous ? (
        <section className="rounded-[26px] border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
            <div>
              <h2 className="text-xl font-black text-red-800">
                Reuse is not recommended
              </h2>
              <p className="mt-2 text-sm leading-6 text-red-700">
                {scan.hazard_notes ||
                  "This item was flagged for special handling. Do not open, dismantle, puncture, or repurpose it."}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          {preparation.length > 0 && (
            <section className="rounded-[26px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-zinc-900">
                    Before reusing
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Clean and inspect the item first.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {preparation.map((step, index) => (
                  <div
                    key={`${step}-${index}`}
                    className="flex gap-3 rounded-2xl bg-green-50 p-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-black text-white">
                      {index + 1}
                    </div>
                    <p className="pt-1 text-sm leading-6 text-zinc-700">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ideas.map((idea, index) => (
              <article
                key={`${idea.title}-${index}`}
                className="rounded-[24px] border border-green-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                    <Sparkles className="h-5 w-5" />
                  </div>

                  <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                    Idea {index + 1}
                  </Badge>
                </div>

                <h2 className="mt-4 text-lg font-black text-zinc-900">
                  {idea.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {idea.description}
                </p>

                {idea.materials_needed.length > 0 && (
                  <div className="mt-4 rounded-2xl bg-zinc-50 p-4">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-black text-zinc-900">
                        You may need
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {idea.materials_needed.map((item) => (
                        <Badge
                          key={item}
                          className="border-zinc-200 bg-white text-zinc-600 hover:bg-white"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-amber-700">
                    Safety note
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    {idea.safety_note}
                  </p>
                </div>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

function ErrorState({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-lg items-center">
      <div className="w-full rounded-[26px] border border-red-100 bg-white p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto h-10 w-10 text-red-600" />
        <h1 className="mt-4 text-xl font-black text-zinc-900">
          Reuse page unavailable
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {message}
        </p>
        <Button
          type="button"
          onClick={onBack}
          className="mt-6 rounded-full bg-green-600 hover:bg-green-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to scan
        </Button>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-72 rounded-[28px] bg-green-100" />
      <Skeleton className="h-52 rounded-[26px] bg-green-100" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-80 rounded-[24px] bg-green-100" />
        <Skeleton className="h-80 rounded-[24px] bg-green-100" />
        <Skeleton className="h-80 rounded-[24px] bg-green-100" />
      </div>
    </div>
  );
}
