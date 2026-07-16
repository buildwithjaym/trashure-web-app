"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Navigation,
  Phone,
  Recycle,
  RefreshCcw,
  Store,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const RESIDENT_BASE_PATH = "/profiles/resident";

interface Profile {
  id: string;
  role: string;
  barangay: string | null;
  city: string | null;
  province: string | null;
}

interface ScanRow {
  id: string;
  user_id: string;
  image_url: string | null;
  detected_object: string;
  object_description: string | null;
  material_id: string | null;
  material_type: string;
  preparation_steps: string[] | string | null;
  hazardous: boolean;
  hazard_notes: string | null;
  user_confirmed: boolean;
}

interface Material {
  id: string;
  material_name: string;
  category: string;
}

interface JunctionRow {
  id: string;
  junkshop_id: string;
  price_per_kg: number | string;
  minimum_weight_kg: number | string;
  accepted_condition: string | null;
  preparation_instructions: string | null;
}

interface JunkshopRow {
  id: string;
  junkshop_name: string;
  photo_url: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  contact_number: string | null;
}

interface LocationCard extends JunkshopRow {
  junction_id: string;
  price_per_kg: number;
  minimum_weight_kg: number;
  accepted_condition: string | null;
  preparation_instructions: string | null;
  score: number;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function readSteps(value: string[] | string | null) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [value];
  } catch {
    return [value];
  }
}

function normalize(value: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function scoreLocation(profile: Profile, junkshop: JunkshopRow) {
  if (
    normalize(profile.barangay) &&
    normalize(profile.barangay) === normalize(junkshop.barangay)
  ) return 3;

  if (
    normalize(profile.city) &&
    normalize(profile.city) === normalize(junkshop.city)
  ) return 2;

  if (
    normalize(profile.province) &&
    normalize(profile.province) === normalize(junkshop.province)
  ) return 1;

  return 0;
}

function locationLabel(value: {
  barangay: string | null;
  city: string | null;
  province: string | null;
}) {
  return [value.barangay, value.city, value.province]
    .filter(Boolean)
    .join(", ");
}

function mapUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function peso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

export default function RecycleActionPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [scanId, setScanId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [scan, setScan] = useState<ScanRow | null>(null);
  const [material, setMaterial] = useState<Material | null>(null);
  const [locations, setLocations] = useState<LocationCard[]>([]);
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

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id,role,barangay,city,province")
          .eq("auth_id", user.id)
          .single();

        if (profileError || !profileData || profileData.role !== "resident") {
          throw new Error("Resident account was not found.");
        }

        const profile = profileData as Profile;

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
            preparation_steps,
            hazardous,
            hazard_notes,
            user_confirmed
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

        const { data: junctionRows, error: junctionError } = await supabase
          .from("junkshop_materials")
          .select(`
            id,
            junkshop_id,
            price_per_kg,
            minimum_weight_kg,
            accepted_condition,
            preparation_instructions
          `)
          .eq("material_id", materialId)
          .eq("is_accepting", true);

        if (junctionError) throw junctionError;

        const rows = (junctionRows ?? []) as JunctionRow[];
        const ids = Array.from(new Set(rows.map((row) => row.junkshop_id)));

        if (ids.length === 0) {
          setLocations([]);
          return;
        }

        const { data: junkshopRows, error: junkshopError } = await supabase
          .from("junkshops")
          .select(`
            id,
            junkshop_name,
            photo_url,
            barangay,
            city,
            province,
            contact_number
          `)
          .in("id", ids)
          .eq("verification_status", "approved")
          .eq("is_active", true);

        if (junkshopError) throw junkshopError;

        const junkshopMap = new Map(
          (junkshopRows ?? []).map((row) => [
            (row as JunkshopRow).id,
            row as JunkshopRow,
          ]),
        );

        const nextLocations = rows
          .map((row): LocationCard | null => {
            const junkshop = junkshopMap.get(row.junkshop_id);
            if (!junkshop) return null;

            return {
              ...junkshop,
              junction_id: row.id,
              price_per_kg: Number(row.price_per_kg),
              minimum_weight_kg: Number(row.minimum_weight_kg),
              accepted_condition: row.accepted_condition,
              preparation_instructions: row.preparation_instructions,
              score: scoreLocation(profile, junkshop),
            };
          })
          .filter((item): item is LocationCard => item !== null)
          .sort(
            (first, second) =>
              second.score - first.score ||
              first.junkshop_name.localeCompare(second.junkshop_name),
          );

        setLocations(nextLocations);
      } catch (pageError) {
        setError(
          getErrorMessage(
            pageError,
            "The recycling guide could not be loaded.",
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
        message={error ?? "The recycling guide could not be loaded."}
        onBack={() => router.push(`${RESIDENT_BASE_PATH}/scan`)}
      />
    );
  }

  const steps = readSteps(scan.preparation_steps);
  const displaySteps =
    steps.length > 0
      ? steps
      : [
          "Remove remaining contents when it is safe.",
          "Separate removable parts made from different materials.",
          "Clean and dry the item before storage.",
          "Follow the junkshop's accepted-condition instructions.",
        ];

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
              Recycle correctly
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
              How to recycle {scan.detected_object}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Prepare it as <strong>{material.material_name}</strong>, then
              choose an approved junkshop that accepts the material.
            </p>

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
                <Recycle className="h-14 w-14 text-green-600" />
              </div>
            )}
          </div>
        </div>
      </section>

      {scan.hazardous && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="font-black text-red-800">
                Special handling required
              </p>
              <p className="mt-1 text-sm leading-6 text-red-700">
                {scan.hazard_notes ||
                  "Do not open, burn, puncture, or dismantle this item."}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-[26px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900">
              Prepare the material
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Complete these steps before drop-off.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {displaySteps.map((step, index) => (
            <div
              key={`${step}-${index}`}
              className="flex gap-3 rounded-2xl border border-green-100 bg-green-50 p-4"
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

      <section className="rounded-[26px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-black text-zinc-900">
          Where to bring it
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {locations.length} approved junkshop
          {locations.length === 1 ? "" : "s"} currently accept this material.
        </p>

        {locations.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-green-200 bg-green-50 p-8 text-center">
            <Store className="mx-auto h-8 w-8 text-green-600" />
            <h3 className="mt-3 font-black text-zinc-900">
              No accepting junkshop is listed
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              Keep the item prepared and check the Nearby Recovery directory
              later.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {locations.map((location) => {
              const address = locationLabel(location);

              return (
                <article
                  key={location.junction_id}
                  className="overflow-hidden rounded-[22px] border border-green-100 bg-white"
                >
                  <div className="flex h-32 items-center justify-center bg-green-50">
                    {location.photo_url ? (
                      <img
                        src={location.photo_url}
                        alt={location.junkshop_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Store className="h-9 w-9 text-green-600" />
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                        Accepting
                      </Badge>

                      {location.price_per_kg > 0 && (
                        <Badge className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">
                          {peso(location.price_per_kg)}/kg
                        </Badge>
                      )}
                    </div>

                    <h3 className="mt-3 font-black text-zinc-900">
                      {location.junkshop_name}
                    </h3>

                    <p className="mt-2 flex gap-2 text-sm leading-6 text-zinc-500">
                      <MapPin className="mt-1 h-4 w-4 shrink-0 text-green-600" />
                      {address || "Location not provided"}
                    </p>

                    {location.preparation_instructions && (
                      <p className="mt-3 rounded-xl bg-zinc-50 p-3 text-xs leading-5 text-zinc-600">
                        {location.preparation_instructions}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {location.contact_number ? (
                        <a
                          href={`tel:${location.contact_number}`}
                          className="flex h-10 items-center justify-center gap-2 rounded-full bg-green-600 text-sm font-bold text-white hover:bg-green-700"
                        >
                          <Phone className="h-4 w-4" />
                          Call
                        </a>
                      ) : (
                        <Button type="button" disabled className="rounded-full">
                          No contact
                        </Button>
                      )}

                      <a
                        href={mapUrl(address || location.junkshop_name)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-10 items-center justify-center gap-2 rounded-full border border-green-200 text-sm font-bold text-green-700 hover:bg-green-50"
                      >
                        <Navigation className="h-4 w-4" />
                        Map
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
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
          Recycling page unavailable
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
      <Skeleton className="h-80 rounded-[26px] bg-green-100" />
      <Skeleton className="h-96 rounded-[26px] bg-green-100" />
    </div>
  );
}
