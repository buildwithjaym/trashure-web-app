"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Gift,
  Navigation,
  Phone,
  RefreshCcw,
  School,
  Target,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface DriveMaterialRow {
  drive_id: string;
}

interface DriveRow {
  id: string;
  school_partner_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  target_weight_kg: number | string | null;
  collection_location: string;
  photo_url: string | null;
}

interface PartnerRow {
  id: string;
  organization_name: string;
  organization_type: string;
  description: string | null;
  project_description: string | null;
  photo_url: string | null;
  address_line: string;
  barangay: string | null;
  city: string | null;
  province: string | null;
  contact_person: string | null;
  contact_number: string | null;
  contact_email: string | null;
}

interface DonationOption {
  drive: DriveRow;
  partner: PartnerRow;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function currentDateString() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDate(value: string) {
  return new Date(
    value.includes("T") ? value : `${value}T00:00:00`,
  ).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function locationLabel(partner: PartnerRow) {
  return [
    partner.address_line,
    partner.barangay,
    partner.city,
    partner.province,
  ]
    .filter(Boolean)
    .join(", ");
}

function mapUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function DonateActionPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [scanId, setScanId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [scan, setScan] = useState<ScanRow | null>(null);
  const [material, setMaterial] = useState<Material | null>(null);
  const [options, setOptions] = useState<DonationOption[]>([]);
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

        const { data: mappingRows, error: mappingError } = await supabase
          .from("school_drive_materials")
          .select("drive_id")
          .eq("material_id", materialId);

        if (mappingError) throw mappingError;

        const driveIds = Array.from(
          new Set(
            ((mappingRows ?? []) as DriveMaterialRow[]).map(
              (row) => row.drive_id,
            ),
          ),
        );

        if (driveIds.length === 0) {
          setOptions([]);
          return;
        }

        const today = currentDateString();

        const { data: driveRows, error: driveError } = await supabase
          .from("school_drives")
          .select(`
            id,
            school_partner_id,
            title,
            description,
            start_date,
            end_date,
            target_weight_kg,
            collection_location,
            photo_url
          `)
          .in("id", driveIds)
          .eq("status", "active")
          .lte("start_date", today)
          .gte("end_date", today)
          .order("end_date", {
            ascending: true,
          });

        if (driveError) throw driveError;

        const drives = (driveRows ?? []) as DriveRow[];
        const partnerIds = Array.from(
          new Set(
            drives.map((drive) => drive.school_partner_id),
          ),
        );

        if (partnerIds.length === 0) {
          setOptions([]);
          return;
        }

        const { data: partnerRows, error: partnerError } = await supabase
          .from("school_partners")
          .select(`
            id,
            organization_name,
            organization_type,
            description,
            project_description,
            photo_url,
            address_line,
            barangay,
            city,
            province,
            contact_person,
            contact_number,
            contact_email
          `)
          .in("id", partnerIds)
          .eq("verification_status", "approved")
          .eq("is_active", true);

        if (partnerError) throw partnerError;

        const partnerMap = new Map(
          (partnerRows ?? []).map((row) => [
            (row as PartnerRow).id,
            row as PartnerRow,
          ]),
        );

        const nextOptions = drives
          .map((drive): DonationOption | null => {
            const partner = partnerMap.get(drive.school_partner_id);

            if (!partner) return null;

            return {
              drive,
              partner,
            };
          })
          .filter(
            (item): item is DonationOption => item !== null,
          );

        setOptions(nextOptions);
      } catch (pageError) {
        setError(
          getErrorMessage(
            pageError,
            "The donation projects could not be loaded.",
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
        message={error ?? "The donation page could not be loaded."}
        onBack={() => router.push(`${RESIDENT_BASE_PATH}/scan`)}
      />
    );
  }

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
              Material-matched projects
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
              Donate to a school project
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              These active projects explicitly accept{" "}
              <strong>{material.material_name}</strong>. Your contribution can
              help a school or organization move closer to its collection
              goal.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                {options.length} active project
                {options.length === 1 ? "" : "s"}
              </Badge>

              <Badge className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">
                Confirmed material match
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
              Refresh projects
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
                <Gift className="h-14 w-14 text-green-600" />
              </div>
            )}
          </div>
        </div>
      </section>

      {options.length === 0 ? (
        <section className="rounded-[26px] border border-green-100 bg-white p-8 text-center shadow-sm">
          <School className="mx-auto h-10 w-10 text-green-600" />
          <h2 className="mt-4 text-xl font-black text-zinc-900">
            No active matching project
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
            No approved school or organization currently has an active drive
            accepting this material.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {options.map(({ drive, partner }) => {
            const address = locationLabel(partner);

            return (
              <article
                key={drive.id}
                className="overflow-hidden rounded-[24px] border border-green-100 bg-white shadow-sm"
              >
                <div className="h-44 bg-green-50">
                  {drive.photo_url ? (
                    <img
                      src={drive.photo_url}
                      alt={drive.title}
                      className="h-full w-full object-cover"
                    />
                  ) : partner.photo_url ? (
                    <img
                      src={partner.photo_url}
                      alt={partner.organization_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <School className="h-10 w-10 text-green-600" />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-green-600">
                    {partner.organization_name}
                  </p>

                  <h2 className="mt-2 text-xl font-black text-zinc-900">
                    {drive.title}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    {drive.description ||
                      partner.project_description ||
                      partner.description ||
                      `This project is collecting ${material.material_name} for its current recovery campaign.`}
                  </p>

                  <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 p-4">
                    <p className="text-sm font-black text-zinc-900">
                      Why donate here?
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">
                      Your {material.material_name.toLowerCase()} can support
                      this project instead of becoming mixed waste.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <InfoBox
                      icon={CalendarDays}
                      label="Open until"
                      value={formatDate(drive.end_date)}
                    />

                    <InfoBox
                      icon={Target}
                      label="Target"
                      value={
                        drive.target_weight_kg
                          ? `${Number(drive.target_weight_kg).toFixed(2)} kg`
                          : "Not specified"
                      }
                    />
                  </div>

                  <div className="mt-4 rounded-2xl bg-zinc-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-zinc-400">
                      Drop-off location
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-zinc-700">
                      {drive.collection_location}
                    </p>
                    {address && (
                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        {address}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <a
                      href={mapUrl(
                        drive.collection_location ||
                          address ||
                          partner.organization_name,
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-10 items-center justify-center gap-2 rounded-full bg-green-600 px-5 text-sm font-bold text-white hover:bg-green-700"
                    >
                      <Navigation className="h-4 w-4" />
                      Open map
                    </a>

                    {partner.contact_number && (
                      <a
                        href={`tel:${partner.contact_number}`}
                        className="flex h-10 items-center justify-center gap-2 rounded-full border border-green-200 px-5 text-sm font-bold text-green-700 hover:bg-green-50"
                      >
                        <Phone className="h-4 w-4" />
                        Contact
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

function InfoBox({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-zinc-50 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
      <div>
        <p className="text-xs text-zinc-400">{label}</p>
        <p className="mt-1 text-sm font-black text-zinc-800">
          {value}
        </p>
      </div>
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
          Donation page unavailable
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
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[520px] rounded-[24px] bg-green-100" />
        <Skeleton className="h-[520px] rounded-[24px] bg-green-100" />
      </div>
    </div>
  );
}
