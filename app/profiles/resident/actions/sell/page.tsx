"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Calculator,
  CircleDollarSign,
  MapPin,
  Navigation,
  Phone,
  RefreshCcw,
  Store,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const RESIDENT_BASE_PATH = "/profiles/resident";

interface ScanRow {
  id: string;
  user_id: string;
  image_url: string | null;
  detected_object: string;
  material_id: string | null;
  material_type: string;
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
  updated_at: string;
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

interface Offer extends JunkshopRow {
  junction_id: string;
  price_per_kg: number;
  minimum_weight_kg: number;
  accepted_condition: string | null;
  preparation_instructions: string | null;
  updated_at: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function peso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

function locationLabel(value: Offer) {
  return [value.barangay, value.city, value.province]
    .filter(Boolean)
    .join(", ");
}

function mapUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SellActionPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [scanId, setScanId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [scan, setScan] = useState<ScanRow | null>(null);
  const [material, setMaterial] = useState<Material | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [kilograms, setKilograms] = useState("1");
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
            material_id,
            material_type,
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

        const { data: junctionRows, error: offerError } = await supabase
          .from("junkshop_materials")
          .select(`
            id,
            junkshop_id,
            price_per_kg,
            minimum_weight_kg,
            accepted_condition,
            preparation_instructions,
            updated_at
          `)
          .eq("material_id", materialId)
          .eq("is_accepting", true)
          .gt("price_per_kg", 0)
          .order("price_per_kg", {
            ascending: true,
          });

        if (offerError) throw offerError;

        const rows = (junctionRows ?? []) as JunctionRow[];
        const ids = Array.from(new Set(rows.map((row) => row.junkshop_id)));

        if (ids.length === 0) {
          setOffers([]);
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

        const nextOffers = rows
          .map((row): Offer | null => {
            const junkshop = junkshopMap.get(row.junkshop_id);
            if (!junkshop) return null;

            return {
              ...junkshop,
              junction_id: row.id,
              price_per_kg: Number(row.price_per_kg),
              minimum_weight_kg: Number(row.minimum_weight_kg),
              accepted_condition: row.accepted_condition,
              preparation_instructions: row.preparation_instructions,
              updated_at: row.updated_at,
            };
          })
          .filter((item): item is Offer => item !== null)
          .sort(
            (first, second) =>
              first.price_per_kg - second.price_per_kg ||
              first.junkshop_name.localeCompare(second.junkshop_name),
          );

        setOffers(nextOffers);
      } catch (pageError) {
        setError(
          getErrorMessage(
            pageError,
            "The selling offers could not be loaded.",
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
        message={error ?? "The selling page could not be loaded."}
        onBack={() => router.push(`${RESIDENT_BASE_PATH}/scan`)}
      />
    );
  }

  const weight = Math.max(0, Number(kilograms) || 0);
  const prices = offers.map((offer) => offer.price_per_kg);
  const minimumPrice = prices.length ? Math.min(...prices) : 0;
  const maximumPrice = prices.length ? Math.max(...prices) : 0;

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
              Current junkshop offers
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
              How much can you earn?
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Offers for <strong>{material.material_name}</strong> are sorted
              from the smallest listed price to the highest.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                {offers.length} offer{offers.length === 1 ? "" : "s"}
              </Badge>

              {offers.length > 0 && (
                <Badge className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">
                  {peso(minimumPrice)} – {peso(maximumPrice)}/kg
                </Badge>
              )}
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
              Refresh prices
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
                <CircleDollarSign className="h-14 w-14 text-green-600" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[26px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900">
              Estimate your earnings
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Enter the approximate weight of your material.
            </p>
          </div>
        </div>

        <div className="mt-5 max-w-sm">
          <label
            htmlFor="weight"
            className="text-sm font-bold text-zinc-700"
          >
            Weight in kilograms
          </label>

          <Input
            id="weight"
            type="number"
            min="0"
            step="0.1"
            value={kilograms}
            onChange={(event) => setKilograms(event.target.value)}
            className="mt-2 h-12 rounded-xl border-zinc-300 focus-visible:ring-green-500"
          />
        </div>
      </section>

      <section className="rounded-[26px] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-black text-zinc-900">
          Offers from low to high
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Final payment depends on inspection, accepted condition, and minimum
          weight.
        </p>

        {offers.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-green-200 bg-green-50 p-8 text-center">
            <Store className="mx-auto h-8 w-8 text-green-600" />
            <h3 className="mt-3 font-black text-zinc-900">
              No buying offer is listed
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              Try Recycle or Donate instead.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {offers.map((offer, index) => {
              const address = locationLabel(offer);
              const eligible = weight >= offer.minimum_weight_kg;

              return (
                <article
                  key={offer.junction_id}
                  className="overflow-hidden rounded-[22px] border border-green-100 bg-white"
                >
                  <div className="relative flex h-32 items-center justify-center bg-green-50">
                    {offer.photo_url ? (
                      <img
                        src={offer.photo_url}
                        alt={offer.junkshop_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Store className="h-9 w-9 text-green-600" />
                    )}

                    <Badge className="absolute left-3 top-3 border-white bg-white text-green-700 hover:bg-white">
                      #{index + 1}
                    </Badge>
                  </div>

                  <div className="p-4">
                    <p className="text-2xl font-black text-zinc-900">
                      {peso(offer.price_per_kg)}
                      <span className="ml-1 text-sm text-zinc-400">
                        /kg
                      </span>
                    </p>

                    <h3 className="mt-3 font-black text-zinc-900">
                      {offer.junkshop_name}
                    </h3>

                    <p className="mt-2 flex gap-2 text-sm leading-6 text-zinc-500">
                      <MapPin className="mt-1 h-4 w-4 shrink-0 text-green-600" />
                      {address || "Location not provided"}
                    </p>

                    <div className="mt-4 rounded-2xl bg-green-50 p-3">
                      <p className="text-xs text-zinc-500">
                        Estimated earnings
                      </p>
                      <p className="mt-1 text-xl font-black text-green-700">
                        {peso(weight * offer.price_per_kg)}
                      </p>
                      {!eligible && (
                        <p className="mt-1 text-xs text-amber-700">
                          Minimum: {offer.minimum_weight_kg.toFixed(2)} kg
                        </p>
                      )}
                    </div>

                    {offer.accepted_condition && (
                      <p className="mt-3 rounded-xl bg-zinc-50 p-3 text-xs leading-5 text-zinc-600">
                        <strong>Accepted:</strong> {offer.accepted_condition}
                      </p>
                    )}

                    {offer.preparation_instructions && (
                      <p className="mt-2 text-xs leading-5 text-zinc-500">
                        {offer.preparation_instructions}
                      </p>
                    )}

                    <p className="mt-3 text-xs text-zinc-400">
                      Updated {dateLabel(offer.updated_at)}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {offer.contact_number ? (
                        <a
                          href={`tel:${offer.contact_number}`}
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
                        href={mapUrl(address || offer.junkshop_name)}
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
          Selling page unavailable
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
      <Skeleton className="h-44 rounded-[26px] bg-green-100" />
      <Skeleton className="h-[520px] rounded-[26px] bg-green-100" />
    </div>
  );
}
