"use client";

import type { ComponentType, Dispatch, FormEvent, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, ArrowRight, BadgeCheck, CalendarDays, Check, CheckCircle2,
  Clock3, Handshake, Inbox, Loader2, MapPin, Phone, RefreshCcw, School,
  Search, Send, Store, Truck, UserRound, Weight, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type PickupStatus = "pending" | "accepted" | "completed" | "cancelled";
type ResponseStatus = "interested" | "accepted" | "declined" | "withdrawn";
type PickupFilter = "all" | PickupStatus;

interface Profile { id: string; auth_id: string; full_name: string; role: string; }
interface SchoolPartner {
  id: string; profile_id: string; organization_name: string; photo_url: string | null;
  address_line: string; barangay: string | null; city: string | null; province: string | null;
  postal_code: string | null; contact_person: string | null; contact_number: string | null;
  verification_status: "pending" | "approved" | "rejected" | "suspended";
  is_active: boolean;
}
interface Material { id: string; material_name: string; category: string; }
interface DriveRow {
  id: string; school_partner_id: string; title: string;
  status: "draft" | "active" | "completed" | "cancelled";
  collection_location: string; created_at: string;
}
interface CollectionEntryRow {
  id: string; drive_id: string; material_id: string; weight_kg: number | string; collected_at: string;
}
interface DriveMaterialSummary {
  material_id: string; material_name: string; category: string; weight_kg: number;
}
interface DriveView extends DriveRow { collected_weight_kg: number; materials: DriveMaterialSummary[]; }
interface PickupRequestRow {
  id: string; school_partner_id: string; drive_id: string; preferred_pickup_date: string;
  preferred_time_start: string | null; preferred_time_end: string | null;
  address_line: string; barangay: string; city: string; province: string | null;
  postal_code: string | null; contact_person: string; contact_number: string;
  notes: string | null; status: PickupStatus; selected_junkshop_id: string | null;
  created_at: string; updated_at: string;
}
interface PickupItemRow {
  id: string; pickup_request_id: string; material_id: string;
  estimated_weight_kg: number | string; created_at: string;
}
interface PickupResponseRow {
  id: string; pickup_request_id: string; junkshop_id: string;
  proposed_pickup_date: string | null; pickup_available: boolean; message: string | null;
  status: ResponseStatus; created_at: string; updated_at: string;
}
interface Junkshop {
  id: string; junkshop_name: string; photo_url: string | null;
  barangay: string | null; city: string | null; province: string | null;
  contact_number: string | null; verification_status: "pending" | "approved" | "rejected" | "suspended";
  is_active: boolean;
}
interface PickupItemView {
  id: string; material_id: string; material_name: string; category: string; estimated_weight_kg: number;
}
interface PickupResponseView extends PickupResponseRow { junkshop: Junkshop | null; }
interface PickupRequestView extends PickupRequestRow {
  drive: DriveView | null; items: PickupItemView[]; responses: PickupResponseView[];
  selected_junkshop: Junkshop | null; total_weight_kg: number;
}
interface PickupForm {
  drive_id: string; preferred_pickup_date: string; preferred_time_start: string;
  preferred_time_end: string; address_line: string; barangay: string; city: string;
  province: string; postal_code: string; contact_person: string; contact_number: string; notes: string;
}

const pickupFilters: Array<{ value: PickupFilter; label: string }> = [
  { value: "all", label: "All requests" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function toLocalDateInput(date: Date) {
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000
  );

  return localDate.toISOString().slice(0, 10);
}

function dateAfter(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toLocalDateInput(date);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
}
function emptyPickupForm(partner: SchoolPartner | null): PickupForm {
  return {
    drive_id: "", preferred_pickup_date: dateAfter(2), preferred_time_start: "08:00",
    preferred_time_end: "12:00", address_line: partner?.address_line ?? "",
    barangay: partner?.barangay ?? "", city: partner?.city ?? "",
    province: partner?.province ?? "", postal_code: partner?.postal_code ?? "",
    contact_person: partner?.contact_person ?? "", contact_number: partner?.contact_number ?? "", notes: "",
  };
}
function formatWeight(value: number) {
  return new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 }).format(value);
}
function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
  });
}
function relativeDate(value: string) {
  const minutes = Math.floor(Math.max(0, Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(value).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
function timeRange(start: string | null, end: string | null) {
  if (!start && !end) return "Flexible time";
  if (start && end) return `${start.slice(0, 5)}–${end.slice(0, 5)}`;
  return start?.slice(0, 5) ?? end?.slice(0, 5) ?? "Flexible time";
}
function statusDetails(status: PickupStatus) {
  if (status === "accepted") return { label: "Accepted", icon: Handshake, className: "border-blue-200 bg-blue-50 text-blue-700" };
  if (status === "completed") return { label: "Completed", icon: CheckCircle2, className: "border-green-200 bg-green-50 text-green-700" };
  if (status === "cancelled") return { label: "Cancelled", icon: XCircle, className: "border-red-200 bg-red-50 text-red-700" };
  return { label: "Pending", icon: Clock3, className: "border-amber-200 bg-amber-50 text-amber-700" };
}

export default function SchoolPartnerPickupsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<SchoolPartner | null>(null);
  const [drives, setDrives] = useState<DriveView[]>([]);
  const [requests, setRequests] = useState<PickupRequestView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [responseWarning, setResponseWarning] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PickupFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<PickupForm>(emptyPickupForm(null));
  const [saving, setSaving] = useState(false);
  const [responsesOpen, setResponsesOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PickupRequestView | null>(null);
  const [changingId, setChangingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    kind: "cancel" | "complete";
    request: PickupRequestView;
  } | null>(null);
  const actionHandled = useRef(false);

  const loadPage = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    setPageError(null);
    setResponseWarning(null);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { router.replace("/login"); return; }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles").select("id,auth_id,full_name,role").eq("auth_id", user.id).single();
      if (profileError || !profileData) throw profileError ?? new Error("School partner account was not found.");
      const currentProfile = profileData as Profile;
      if (currentProfile.role !== "school_partner") throw new Error("This page is available only to school partners.");
      setProfile(currentProfile);

      const { data: partnerData, error: partnerError } = await supabase
        .from("school_partners")
        .select("id,profile_id,organization_name,photo_url,address_line,barangay,city,province,postal_code,contact_person,contact_number,verification_status,is_active")
        .eq("profile_id", currentProfile.id).maybeSingle();
      if (partnerError) throw partnerError;
      const currentPartner = (partnerData as SchoolPartner | null) ?? null;
      setPartner(currentPartner);

      const { data: materialRows, error: materialError } = await supabase
        .from("materials").select("id,material_name,category");
      if (materialError) throw materialError;
      const materials = (materialRows ?? []) as Material[];
      const materialMap = new Map(materials.map((m) => [m.id, m]));

      if (!currentPartner) { setDrives([]); setRequests([]); return; }

      const { data: driveRows, error: driveError } = await supabase
        .from("school_drives")
        .select("id,school_partner_id,title,status,collection_location,created_at")
        .eq("school_partner_id", currentPartner.id)
        .in("status", ["active", "completed"])
        .order("created_at", { ascending: false });
      if (driveError) throw driveError;
      const rawDrives = (driveRows ?? []) as DriveRow[];
      const driveIds = rawDrives.map((d) => d.id);

      let entryRows: CollectionEntryRow[] = [];
      if (driveIds.length) {
        const { data, error } = await supabase
          .from("school_collection_entries")
          .select("id,drive_id,material_id,weight_kg,collected_at")
          .in("drive_id", driveIds);
        if (error) throw error;
        entryRows = (data ?? []) as CollectionEntryRow[];
      }

      const normalizedDrives: DriveView[] = rawDrives.map((drive) => {
        const grouped = new Map<string, number>();
        entryRows.filter((e) => e.drive_id === drive.id).forEach((e) => {
          grouped.set(e.material_id, (grouped.get(e.material_id) ?? 0) + Number(e.weight_kg ?? 0));
        });
        const driveMaterials = Array.from(grouped.entries()).map(([materialId, weight]) => {
          const material = materialMap.get(materialId);
          return {
            material_id: materialId,
            material_name: material?.material_name ?? "Unnamed material",
            category: material?.category ?? "Other",
            weight_kg: weight,
          };
        });
        return {
          ...drive,
          collected_weight_kg: driveMaterials.reduce((sum, item) => sum + item.weight_kg, 0),
          materials: driveMaterials,
        };
      });
      setDrives(normalizedDrives);

      const { data: requestRows, error: requestError } = await supabase
        .from("school_pickup_requests")
        .select("id,school_partner_id,drive_id,preferred_pickup_date,preferred_time_start,preferred_time_end,address_line,barangay,city,province,postal_code,contact_person,contact_number,notes,status,selected_junkshop_id,created_at,updated_at")
        .eq("school_partner_id", currentPartner.id)
        .order("created_at", { ascending: false });
      if (requestError) throw requestError;
      const rawRequests = (requestRows ?? []) as PickupRequestRow[];
      const requestIds = rawRequests.map((r) => r.id);

      let itemRows: PickupItemRow[] = [];
      let responseRows: PickupResponseRow[] = [];
      if (requestIds.length) {
        const [itemsResult, responsesResult] = await Promise.all([
          supabase.from("school_pickup_items")
            .select("id,pickup_request_id,material_id,estimated_weight_kg,created_at")
            .in("pickup_request_id", requestIds),
          supabase.from("school_pickup_responses")
            .select("id,pickup_request_id,junkshop_id,proposed_pickup_date,pickup_available,message,status,created_at,updated_at")
            .in("pickup_request_id", requestIds)
            .order("created_at", { ascending: false }),
        ]);
        if (itemsResult.error) {
          throw itemsResult.error;
        }

        itemRows = (itemsResult.data ?? []) as PickupItemRow[];

        if (responsesResult.error) {
          console.warn("Pickup responses could not be loaded:", responsesResult.error);
          setResponseWarning(
            getErrorMessage(
              responsesResult.error,
              "Recycler responses are temporarily unavailable."
            )
          );
        } else {
          responseRows = (responsesResult.data ?? []) as PickupResponseRow[];
        }
      }

      const junkshopIds = Array.from(new Set([
        ...rawRequests.map((r) => r.selected_junkshop_id).filter((id): id is string => Boolean(id)),
        ...responseRows.map((r) => r.junkshop_id),
      ]));
      let junkshops: Junkshop[] = [];
      if (junkshopIds.length) {
        const { data, error } = await supabase.from("junkshops")
          .select("id,junkshop_name,photo_url,barangay,city,province,contact_number,verification_status,is_active")
          .in("id", junkshopIds);
        if (error) {
          console.warn("Recycler profiles could not be loaded:", error);
          setResponseWarning(
            getErrorMessage(
              error,
              "Recycler profile details are temporarily unavailable."
            )
          );
        } else {
          junkshops = (data ?? []) as Junkshop[];
        }
      }

      const driveMap = new Map(normalizedDrives.map((d) => [d.id, d]));
      const junkshopMap = new Map(junkshops.map((j) => [j.id, j]));
      const normalizedRequests: PickupRequestView[] = rawRequests.map((request) => {
        const items = itemRows.filter((i) => i.pickup_request_id === request.id).map((item) => {
          const material = materialMap.get(item.material_id);
          return {
            id: item.id,
            material_id: item.material_id,
            material_name: material?.material_name ?? "Unnamed material",
            category: material?.category ?? "Other",
            estimated_weight_kg: Number(item.estimated_weight_kg ?? 0),
          };
        });
        const responses = responseRows.filter((r) => r.pickup_request_id === request.id).map((response) => ({
          ...response,
          junkshop: junkshopMap.get(response.junkshop_id) ?? null,
        }));
        return {
          ...request,
          drive: driveMap.get(request.drive_id) ?? null,
          items,
          responses,
          selected_junkshop: request.selected_junkshop_id ? junkshopMap.get(request.selected_junkshop_id) ?? null : null,
          total_weight_kg: items.reduce((sum, item) => sum + item.estimated_weight_kg, 0),
        };
      });
      setRequests(normalizedRequests);
    } catch (error) {
      const message = getErrorMessage(error, "Unable to load pickup requests.");
      console.error("Pickup page loading failed:", error);
      setPageError(message);
      if (silent) toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router, supabase]);

  useEffect(() => { void loadPage(); }, [loadPage]);

  const unavailableDriveIds = useMemo(() => new Set(
    requests.filter((r) => r.status === "pending" || r.status === "accepted").map((r) => r.drive_id)
  ), [requests]);

  const eligibleDrives = useMemo(() => drives.filter(
    (drive) => drive.collected_weight_kg > 0 && !unavailableDriveIds.has(drive.id)
  ), [drives, unavailableDriveIds]);

  const selectedDrive = useMemo(() => eligibleDrives.find((d) => d.id === form.drive_id) ?? null,
    [eligibleDrives, form.drive_id]);

  const openCreateDialog = useCallback(() => {
    if (!partner) {
      toast.error("Complete your organization profile first.");
      router.push("/profiles/school-partner/profile");
      return;
    }
    if (!partner.is_active) {
      toast.error("Activate the organization profile before requesting a pickup.");
      return;
    }
    if (!eligibleDrives.length) {
      toast.info("Record collected materials before requesting a pickup.");
      router.push("/profiles/school-partner/drives");
      return;
    }
    setForm({ ...emptyPickupForm(partner), drive_id: eligibleDrives[0]?.id ?? "" });
    setCreateOpen(true);
  }, [eligibleDrives, partner, router]);

  useEffect(() => {
    if (
      loading ||
      actionHandled.current ||
      typeof window === "undefined"
    ) {
      return;
    }

    actionHandled.current = true;

    const parameters = new URLSearchParams(window.location.search);
    const action = parameters.get("action");

    if (action === "create") {
      openCreateDialog();
      router.replace("/profiles/school-partner/pickups");
    }
  }, [loading, openCreateDialog, router]);

  const validateForm = () => {
    if (!selectedDrive) { toast.error("Select a collection drive."); return false; }
    if (!form.preferred_pickup_date) { toast.error("Select the preferred pickup date."); return false; }
    if (form.preferred_pickup_date < toLocalDateInput(new Date())) {
      toast.error("The preferred pickup date cannot be in the past."); return false;
    }
    if (form.preferred_time_start && form.preferred_time_end && form.preferred_time_end <= form.preferred_time_start) {
      toast.error("The end time must be later than the start time."); return false;
    }
    if (!form.address_line.trim() || !form.barangay.trim() || !form.city.trim()) {
      toast.error("Complete the pickup address."); return false;
    }
    if (!form.contact_person.trim() || !form.contact_number.trim()) {
      toast.error("Enter the pickup contact person and number."); return false;
    }
    if (!selectedDrive.materials.length) { toast.error("The selected drive has no collected materials."); return false; }
    return true;
  };

  const savePickup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!partner || !selectedDrive || saving || !validateForm()) return;
    setSaving(true);

    const promise = (async () => {
      const { data: inserted, error: requestError } = await supabase
        .from("school_pickup_requests")
        .insert({
          school_partner_id: partner.id,
          drive_id: selectedDrive.id,
          preferred_pickup_date: form.preferred_pickup_date,
          preferred_time_start: form.preferred_time_start || null,
          preferred_time_end: form.preferred_time_end || null,
          address_line: form.address_line.trim(),
          barangay: form.barangay.trim(),
          city: form.city.trim(),
          province: form.province.trim() || null,
          postal_code: form.postal_code.trim() || null,
          contact_person: form.contact_person.trim(),
          contact_number: form.contact_number.trim(),
          notes: form.notes.trim() || null,
          status: "pending",
          selected_junkshop_id: null,
        })
        .select("id")
        .single();
      if (requestError || !inserted) throw requestError ?? new Error("The pickup request was not created.");

      const { error: itemError } = await supabase.from("school_pickup_items").insert(
        selectedDrive.materials.map((material) => ({
          pickup_request_id: inserted.id,
          material_id: material.material_id,
          estimated_weight_kg: material.weight_kg,
        }))
      );
      if (itemError) {
        await supabase.from("school_pickup_requests").update({ status: "cancelled" }).eq("id", inserted.id);
        throw itemError;
      }
    })();

    toast.promise(promise, {
      loading: "Publishing pickup request...",
      success: "Pickup request published.",
      error: (error) => getErrorMessage(error, "Unable to create the pickup request."),
    });

    try {
      await promise;
      setCreateOpen(false);
      await loadPage(true);
    } finally {
      setSaving(false);
    }
  };

  const openResponses = (request: PickupRequestView) => {
    setSelectedRequest(request);
    setResponsesOpen(true);
  };

  const acceptResponse = async (request: PickupRequestView, response: PickupResponseView) => {
    if (changingId) return;
    setChangingId(request.id);
    const promise = (async () => {
      const { error: requestError } = await supabase.from("school_pickup_requests")
        .update({ status: "accepted", selected_junkshop_id: response.junkshop_id, updated_at: new Date().toISOString() })
        .eq("id", request.id).eq("status", "pending");
      if (requestError) throw requestError;

      const { error: acceptedError } = await supabase.from("school_pickup_responses")
        .update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", response.id);
      if (acceptedError) throw acceptedError;

      const { error: declinedError } = await supabase.from("school_pickup_responses")
        .update({ status: "declined", updated_at: new Date().toISOString() })
        .eq("pickup_request_id", request.id).neq("id", response.id).eq("status", "interested");
      if (declinedError) throw declinedError;
    })();

    toast.promise(promise, {
      loading: "Selecting recycler...",
      success: "Recycler selected for pickup.",
      error: (error) => getErrorMessage(error, "Unable to accept the response."),
    });

    try {
      await promise;
      setResponsesOpen(false);
      setSelectedRequest(null);
      await loadPage(true);
    } finally {
      setChangingId(null);
    }
  };

  const cancelRequest = async (request: PickupRequestView) => {
    if (changingId) return;
    setChangingId(request.id);
    const promise = (async () => {
      const { error: requestError } = await supabase.from("school_pickup_requests")
        .update({ status: "cancelled", selected_junkshop_id: null, updated_at: new Date().toISOString() })
        .eq("id", request.id).eq("status", "pending");
      if (requestError) throw requestError;

      const { error: responseError } = await supabase.from("school_pickup_responses")
        .update({ status: "declined", updated_at: new Date().toISOString() })
        .eq("pickup_request_id", request.id).eq("status", "interested");
      if (responseError) throw responseError;
    })();

    toast.promise(promise, {
      loading: "Cancelling pickup request...",
      success: "Pickup request cancelled.",
      error: (error) => getErrorMessage(error, "Unable to cancel the request."),
    });

    try { await promise; await loadPage(true); }
    finally { setChangingId(null); }
  };

  const completeRequest = async (request: PickupRequestView) => {
    if (changingId) return;
    setChangingId(request.id);
    const promise = (async () => {
      const { error } = await supabase.from("school_pickup_requests")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", request.id).eq("status", "accepted");
      if (error) throw error;
    })();

    toast.promise(promise, {
      loading: "Confirming completed pickup...",
      success: "Pickup marked completed.",
      error: (error) => getErrorMessage(error, "Unable to complete the pickup."),
    });

    try { await promise; await loadPage(true); }
    finally { setChangingId(null); }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const acceptedCount = requests.filter((r) => r.status === "accepted").length;
  const completedCount = requests.filter((r) => r.status === "completed").length;
  const responseCount = requests.reduce((sum, request) =>
    sum + request.responses.filter((response) => response.status === "interested").length, 0);

  const filteredRequests = useMemo(() => {
    const text = query.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus = filter === "all" || request.status === filter;
      const haystack = [
        request.drive?.title ?? "", request.address_line, request.barangay, request.city,
        request.province ?? "", request.selected_junkshop?.junkshop_name ?? "",
        ...request.items.map((item) => item.material_name),
      ].join(" ").toLowerCase();
      return matchesStatus && (!text || haystack.includes(text));
    });
  }, [filter, query, requests]);

  if (loading) return <PickupPageSkeleton />;
  if (pageError || !profile) return <PickupErrorState message={pageError ?? "School partner account was not found."} onRetry={() => void loadPage()} />;
  if (!partner) return <MissingPartnerState onSetup={() => router.push("/profiles/school-partner/profile")} />;

  return (
    <>
      <style jsx global>{`
        @keyframes pickupFadeUp {
          from { opacity: 0; transform: translateY(9px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pickupScaleIn {
          from { opacity: 0; transform: scale(0.985); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pickup-motion { animation: none !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <div className="space-y-7">
        <section className="pickup-motion animate-[pickupFadeUp_.35s_ease-out_both]">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold text-green-600">Recycler coordination</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">Pickup Requests</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Publish collected material batches, review recycler responses, and confirm completed pickups.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={refreshing}
                onClick={() => void loadPage(true)}
                className="rounded-full border-green-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-50 hover:text-green-700"
              >
                <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              <Button
                type="button"
                onClick={openCreateDialog}
                className="rounded-full bg-green-600 px-6 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700"
              >
                <Send className="mr-2 h-4 w-4" />
                Request pickup
              </Button>
            </div>
          </div>
        </section>

        <section className="pickup-motion animate-[pickupScaleIn_.4s_ease-out_.04s_both] overflow-hidden rounded-[30px] border border-green-100 bg-white shadow-sm">
          <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-emerald-800 p-6 text-white sm:p-8">
            {partner.photo_url && (
              <>
                <img src={partner.photo_url} alt={partner.organization_name} className="absolute inset-0 h-full w-full object-cover opacity-20" />
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
                    <Truck className="mr-1.5 h-3.5 w-3.5" /> Pickup workspace
                  </Badge>
                  {partner.verification_status === "approved" && (
                    <Badge className="border-white/20 bg-black/20 text-white hover:bg-black/20">
                      <BadgeCheck className="mr-1.5 h-3.5 w-3.5" /> Verified
                    </Badge>
                  )}
                </div>
                <h2 className="mt-4 text-2xl font-black sm:text-3xl">Move collected materials to recovery</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-green-50/85">
                  Create one pickup request per ready collection drive. Matching recycler partners can respond with a proposed schedule.
                </p>
              </div>

              <Button type="button" onClick={openCreateDialog} className="w-fit rounded-full bg-white text-green-700 hover:bg-green-50">
                <Truck className="mr-2 h-4 w-4" /> Prepare pickup
              </Button>
            </div>
          </div>
        </section>

        {(!partner.is_active || partner.verification_status !== "approved") && (
          <section className="pickup-motion animate-[pickupFadeUp_.38s_ease-out_.08s_both] flex flex-col gap-4 rounded-[24px] border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-black text-zinc-900">Partner profile requires attention</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                {partner.is_active
                  ? "The organization is not yet verified. Pickup visibility may be limited until approval."
                  : "The organization is paused. Activate it from the profile page before publishing requests."}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/profiles/school-partner/profile")}
              className="w-fit rounded-full border-amber-200 bg-white text-amber-700 hover:bg-amber-100"
            >
              Review profile <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </section>
        )}

        {responseWarning && (
          <section className="pickup-motion animate-[pickupFadeUp_.38s_ease-out_.12s_both] flex flex-col gap-4 rounded-[24px] border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Inbox className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-black text-zinc-900">Recycler response data is limited</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600">{responseWarning}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadPage(true)}
              className="w-fit rounded-full border-amber-200 bg-white text-amber-700 hover:bg-amber-100"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard title="Pending" value={pendingCount} description="Requests waiting for recyclers" icon={Clock3} delay={0} />
          <SummaryCard title="Responses" value={responseCount} description="Recycler offers awaiting review" icon={Inbox} delay={50} />
          <SummaryCard title="Accepted" value={acceptedCount} description="Scheduled or confirmed pickups" icon={Handshake} delay={100} />
          <SummaryCard title="Completed" value={completedCount} description="Successful recovery handoffs" icon={CheckCircle2} delay={150} />
        </section>

        {eligibleDrives.length > 0 && (
          <section className="pickup-motion animate-[pickupFadeUp_.4s_ease-out_.18s_both] flex flex-col gap-4 rounded-[24px] border border-green-200 bg-green-50 p-5 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-green-700 shadow-sm">
              <Weight className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-black text-zinc-900">
                {eligibleDrives.length} collected batch{eligibleDrives.length === 1 ? "" : "es"} ready
              </h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                {eligibleDrives[0]?.title} has {formatWeight(eligibleDrives[0]?.collected_weight_kg ?? 0)} kg available for pickup coordination.
              </p>
            </div>
            <Button
              type="button"
              onClick={openCreateDialog}
              className="w-fit rounded-full bg-green-600 hover:bg-green-700"
            >
              <Send className="mr-2 h-4 w-4" />
              Create request
            </Button>
          </section>
        )}

        <section className="pickup-motion animate-[pickupFadeUp_.4s_ease-out_.2s_both] rounded-[26px] border border-green-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search drives, materials, locations, or junkshops"
                className="h-12 rounded-full border-zinc-200 bg-zinc-50 pl-11 focus-visible:ring-green-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {pickupFilters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`rounded-full border px-4 py-2 text-xs font-bold transition-all duration-200 ${
                    filter === item.value
                      ? "border-green-600 bg-green-600 text-white shadow-sm"
                      : "border-zinc-200 bg-white text-zinc-500 hover:-translate-y-0.5 hover:border-green-300 hover:bg-green-50 hover:text-green-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="pickup-motion animate-[pickupFadeUp_.4s_ease-out_.25s_both]">
          <div>
            <h2 className="text-xl font-black text-zinc-900">Pickup request history</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {filteredRequests.length} request{filteredRequests.length === 1 ? "" : "s"} shown
            </p>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="mt-5">
              <EmptyPickupState hasRequests={requests.length > 0} onCreate={openCreateDialog} />
            </div>
          ) : (
            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              {filteredRequests.map((request, index) => (
                <PickupRequestCard
                  key={request.id}
                  request={request}
                  animationDelay={`${Math.min(index * 45, 270)}ms`}
                  changing={changingId === request.id}
                  onResponses={() => openResponses(request)}
                  onCancel={() => setConfirmAction({ kind: "cancel", request })}
                  onComplete={() => setConfirmAction({ kind: "complete", request })}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <CreatePickupDialog
        open={createOpen}
        saving={saving}
        form={form}
        setForm={setForm}
        drives={eligibleDrives}
        selectedDrive={selectedDrive}
        onOpenChange={setCreateOpen}
        onSubmit={savePickup}
      />

      <ResponsesDialog
        open={responsesOpen}
        request={selectedRequest}
        changing={Boolean(changingId)}
        onOpenChange={(open) => {
          setResponsesOpen(open);
          if (!open) setSelectedRequest(null);
        }}
        onAccept={(response) => {
          if (selectedRequest) void acceptResponse(selectedRequest, response);
        }}
      />

      <ActionConfirmationDialog
        action={confirmAction}
        changing={Boolean(changingId)}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (!confirmAction) return;

          const pendingAction = confirmAction;
          setConfirmAction(null);

          if (pendingAction.kind === "cancel") {
            void cancelRequest(pendingAction.request);
          } else {
            void completeRequest(pendingAction.request);
          }
        }}
      />
    </>
  );
}

function CreatePickupDialog({
  open, saving, form, setForm, drives, selectedDrive, onOpenChange, onSubmit,
}: {
  open: boolean;
  saving: boolean;
  form: PickupForm;
  setForm: Dispatch<SetStateAction<PickupForm>>;
  drives: DriveView[];
  selectedDrive: DriveView | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!saving) onOpenChange(next); }}>
      <DialogContent className="max-h-[96dvh] !w-[calc(100vw-1rem)] !max-w-none gap-0 overflow-hidden rounded-[26px] border border-green-200 !bg-white p-0 text-zinc-900 shadow-[0_28px_100px_rgba(0,0,0,0.35)] sm:!w-[94vw] lg:!w-[1040px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Create pickup request</DialogTitle>
          <DialogDescription>Select a ready collection drive and provide pickup details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid max-h-[96dvh] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-white">
          <DialogHeaderPanel
            eyebrow="New pickup request"
            title="Prepare materials for recycler pickup"
            description="Select a collected drive, confirm the material summary, and provide a preferred schedule."
            icon={Truck}
          />

          <div className="grid min-h-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="pickup_drive">Collection drive <span className="text-red-500">*</span></Label>
                  <select
                    id="pickup_drive"
                    value={form.drive_id}
                    onChange={(event) => setForm((current) => ({ ...current, drive_id: event.target.value }))}
                    className="h-12 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  >
                    {drives.map((drive) => (
                      <option key={drive.id} value={drive.id}>
                        {drive.title} · {formatWeight(drive.collected_weight_kg)} kg
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDrive && (
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-black text-zinc-900">{selectedDrive.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {selectedDrive.materials.length} material type{selectedDrive.materials.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="rounded-full bg-white px-4 py-2 text-sm font-black text-green-700 shadow-sm">
                        {formatWeight(selectedDrive.collected_weight_kg)} kg
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {selectedDrive.materials.map((material) => (
                        <div key={material.material_id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5">
                          <div>
                            <p className="text-sm font-bold text-zinc-800">{material.material_name}</p>
                            <p className="mt-0.5 text-xs text-zinc-400">{material.category}</p>
                          </div>
                          <p className="text-sm font-black text-green-700">{formatWeight(material.weight_kg)} kg</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                  <TextInput id="pickup_date" label="Preferred date" required type="date" value={form.preferred_pickup_date}
                    onChange={(value) => setForm((current) => ({ ...current, preferred_pickup_date: value }))} />
                  <TextInput id="pickup_start" label="Start time" type="time" value={form.preferred_time_start}
                    onChange={(value) => setForm((current) => ({ ...current, preferred_time_start: value }))} />
                  <TextInput id="pickup_end" label="End time" type="time" value={form.preferred_time_end}
                    onChange={(value) => setForm((current) => ({ ...current, preferred_time_end: value }))} />
                </div>

                <TextInput id="pickup_address" label="Pickup address or landmark" required value={form.address_line}
                  onChange={(value) => setForm((current) => ({ ...current, address_line: value }))} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput id="pickup_barangay" label="Barangay" required value={form.barangay}
                    onChange={(value) => setForm((current) => ({ ...current, barangay: value }))} />
                  <TextInput id="pickup_city" label="City or municipality" required value={form.city}
                    onChange={(value) => setForm((current) => ({ ...current, city: value }))} />
                  <TextInput id="pickup_province" label="Province" value={form.province}
                    onChange={(value) => setForm((current) => ({ ...current, province: value }))} />
                  <TextInput id="pickup_postal" label="Postal code" value={form.postal_code}
                    onChange={(value) => setForm((current) => ({ ...current, postal_code: value }))} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput id="pickup_contact_person" label="Contact person" required value={form.contact_person}
                    onChange={(value) => setForm((current) => ({ ...current, contact_person: value }))} />
                  <TextInput id="pickup_contact_number" label="Contact number" required inputMode="tel" value={form.contact_number}
                    onChange={(value) => setForm((current) => ({ ...current, contact_number: value }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickup_notes">Pickup instructions</Label>
                  <Textarea
                    id="pickup_notes"
                    rows={5}
                    maxLength={500}
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Add gate instructions, storage details, parking notes, or preparation reminders."
                    className="resize-none rounded-xl border-zinc-300 bg-white focus-visible:ring-green-500"
                  />
                </div>
              </div>
            </div>

            <aside className="hidden min-h-0 overflow-y-auto border-l border-green-100 bg-green-50 p-6 lg:block">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">Request preview</p>
              <div className="mt-4 rounded-[24px] border border-green-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-black text-zinc-900">{selectedDrive?.title ?? "Collection drive"}</p>
                    <p className="mt-1 text-xs text-zinc-500">Pending recycler response</p>
                  </div>
                </div>
                <div className="mt-5 space-y-4 border-t border-zinc-100 pt-5">
                  <PreviewRow icon={Weight} value={selectedDrive ? `${formatWeight(selectedDrive.collected_weight_kg)} kg total` : "No material selected"} />
                  <PreviewRow icon={CalendarDays} value={form.preferred_pickup_date ? `${formatDate(form.preferred_pickup_date)} · ${timeRange(form.preferred_time_start || null, form.preferred_time_end || null)}` : "Pickup schedule"} />
                  <PreviewRow icon={MapPin} value={[form.address_line, form.barangay, form.city, form.province].filter(Boolean).join(", ") || "Pickup location"} />
                  <PreviewRow icon={Phone} value={form.contact_number || "Contact number"} />
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-green-100 bg-white p-4">
                <p className="text-sm font-bold text-zinc-800">What happens next?</p>
                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  Matching junkshops can express interest. Review their proposed date and message, then select one recycler.
                </p>
              </div>
            </aside>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-green-200 bg-white px-5 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] sm:px-7">
            <Button type="button" variant="ghost" disabled={saving} onClick={() => onOpenChange(false)} className="rounded-full">Cancel</Button>
            <Button type="submit" disabled={saving} className="rounded-full bg-green-600 px-6 hover:bg-green-700">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {saving ? "Publishing..." : "Publish request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResponsesDialog({
  open, request, changing, onOpenChange, onAccept,
}: {
  open: boolean;
  request: PickupRequestView | null;
  changing: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: (response: PickupResponseView) => void;
}) {
  const visibleResponses = request?.responses.filter((response) =>
    response.status === "interested" || response.status === "accepted"
  ) ?? [];

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!changing) onOpenChange(next); }}>
      <DialogContent className="max-h-[92dvh] !w-[calc(100vw-1rem)] !max-w-none gap-0 overflow-hidden rounded-[26px] border border-green-200 !bg-white p-0 text-zinc-900 shadow-[0_28px_100px_rgba(0,0,0,0.35)] sm:!w-[min(92vw,760px)]">
        <DialogHeader className="sr-only">
          <DialogTitle>Recycler responses</DialogTitle>
          <DialogDescription>Review interested recycler partners and select one for pickup.</DialogDescription>
        </DialogHeader>

        <DialogHeaderPanel
          eyebrow="Recycler responses"
          title={request?.drive?.title ?? "Pickup request"}
          description="Compare proposed schedules and select the recycler that fits the organization."
          icon={Inbox}
        />

        <div className="max-h-[68dvh] overflow-y-auto p-5 sm:p-7">
          {visibleResponses.length ? (
            <div className="space-y-4">
              {visibleResponses.map((response) => (
                <ResponseCard
                  key={response.id}
                  response={response}
                  requestStatus={request?.status ?? "pending"}
                  changing={changing}
                  onAccept={() => onAccept(response)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-[24px] border border-dashed border-green-200 bg-green-50/60 px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-green-600 shadow-sm">
                <Inbox className="h-7 w-7" />
              </div>
              <h3 className="mt-5 font-black text-zinc-900">No recycler responses yet</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Matching junkshops will appear here after they express interest in the pickup.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-green-100 bg-white px-5 py-4 sm:px-7">
          <Button type="button" variant="outline" disabled={changing} onClick={() => onOpenChange(false)} className="rounded-full border-green-200">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


function ActionConfirmationDialog({
  action,
  changing,
  onClose,
  onConfirm,
}: {
  action: {
    kind: "cancel" | "complete";
    request: PickupRequestView;
  } | null;
  changing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const isCancel = action?.kind === "cancel";

  return (
    <Dialog
      open={Boolean(action)}
      onOpenChange={(open) => {
        if (!open && !changing) {
          onClose();
        }
      }}
    >
      <DialogContent className="!w-[calc(100vw-1rem)] !max-w-none rounded-[26px] border border-green-200 !bg-white p-0 text-zinc-900 shadow-[0_28px_100px_rgba(0,0,0,0.35)] sm:!w-[min(92vw,520px)]">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {isCancel ? "Cancel pickup request" : "Confirm completed pickup"}
          </DialogTitle>
          <DialogDescription>
            Review this action before applying it to the pickup request.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 sm:p-7">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
              isCancel
                ? "bg-red-50 text-red-600"
                : "bg-green-50 text-green-700"
            }`}
          >
            {isCancel ? (
              <XCircle className="h-7 w-7" />
            ) : (
              <CheckCircle2 className="h-7 w-7" />
            )}
          </div>

          <h2 className="mt-5 text-xl font-black text-zinc-900">
            {isCancel
              ? "Cancel this pickup request?"
              : "Confirm that pickup is complete?"}
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {isCancel
              ? "The request will stop accepting recycler responses. This keeps the record but changes its status to cancelled."
              : "Use this only after the selected recycler has collected the materials. The completed weight will be included in the impact report."}
          </p>

          {action?.request && (
            <div className="mt-5 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
              <p className="font-black text-zinc-900">
                {action.request.drive?.title ?? "Collection drive"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {formatWeight(action.request.total_weight_kg)} kg · Pickup{" "}
                {formatDate(action.request.preferred_pickup_date)}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-100 bg-white px-6 py-4 sm:px-7">
          <Button
            type="button"
            variant="ghost"
            disabled={changing}
            onClick={onClose}
            className="rounded-full"
          >
            Keep request
          </Button>

          <Button
            type="button"
            disabled={changing}
            onClick={onConfirm}
            className={`rounded-full ${
              isCancel
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {changing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isCancel ? (
              <XCircle className="mr-2 h-4 w-4" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}

            {isCancel ? "Cancel request" : "Confirm completed"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({
  title, value, description, icon: Icon, delay,
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
      className="pickup-motion group animate-[pickupFadeUp_.38s_ease-out_both] rounded-[24px] border border-green-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-500">{title}</p>
          <p className="mt-2 text-3xl font-black text-zinc-900">{value}</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600 transition-transform duration-300 group-hover:scale-105">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function PickupRequestCard({
  request, animationDelay, changing, onResponses, onCancel, onComplete,
}: {
  request: PickupRequestView;
  animationDelay: string;
  changing: boolean;
  onResponses: () => void;
  onCancel: () => void;
  onComplete: () => void;
}) {
  const details = statusDetails(request.status);
  const StatusIcon = details.icon;
  const interestedCount = request.responses.filter((response) => response.status === "interested").length;

  return (
    <article
      style={{ animationDelay }}
      className="pickup-motion group animate-[pickupFadeUp_.4s_ease-out_both] overflow-hidden rounded-[28px] border border-green-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-md"
    >
      <div className="border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Badge variant="outline" className={details.className}>
              <StatusIcon className="mr-1.5 h-3.5 w-3.5" /> {details.label}
            </Badge>
            <h3 className="mt-3 truncate text-xl font-black text-zinc-900">
              {request.drive?.title ?? "Collection drive"}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">Created {relativeDate(request.created_at)}</p>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-black text-green-700 shadow-sm">
            {formatWeight(request.total_weight_kg)} kg
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <InformationRow
            icon={CalendarDays}
            label="Preferred schedule"
            value={`${formatDate(request.preferred_pickup_date)} · ${timeRange(request.preferred_time_start, request.preferred_time_end)}`}
          />
          <InformationRow
            icon={MapPin}
            label="Pickup location"
            value={[request.address_line, request.barangay, request.city, request.province].filter(Boolean).join(", ")}
          />
          <InformationRow
            icon={Phone}
            label="Pickup contact"
            value={`${request.contact_person} · ${request.contact_number}`}
          />
        </div>

        <div className="mt-5">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">Materials</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {request.items.map((item) => (
              <Badge key={item.id} variant="secondary" className="bg-green-50 text-green-700">
                {item.material_name} · {formatWeight(item.estimated_weight_kg)} kg
              </Badge>
            ))}
          </div>
        </div>

        {request.selected_junkshop && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-blue-600 shadow-sm">
              {request.selected_junkshop.photo_url ? (
                <img
                  src={request.selected_junkshop.photo_url}
                  alt={request.selected_junkshop.junkshop_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Store className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-500">Selected recycler</p>
              <p className="mt-1 truncate font-black text-zinc-900">{request.selected_junkshop.junkshop_name}</p>
              <p className="mt-1 truncate text-xs text-zinc-500">
                {[request.selected_junkshop.barangay, request.selected_junkshop.city].filter(Boolean).join(", ")}
              </p>
              {request.selected_junkshop.contact_number && (
                <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                  <Phone className="h-3.5 w-3.5" />
                  {request.selected_junkshop.contact_number}
                </p>
              )}
            </div>
          </div>
        )}

        {request.notes && (
          <p className="mt-5 rounded-2xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">{request.notes}</p>
        )}

        <div className="mt-5 flex flex-wrap gap-2 border-t border-zinc-100 pt-5">
          {request.status === "pending" && (
            <>
              <Button type="button" onClick={onResponses} className="rounded-full bg-green-600 hover:bg-green-700">
                <Inbox className="mr-2 h-4 w-4" /> Responses
                {interestedCount > 0 && (
                  <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs font-black text-green-700">
                    {interestedCount}
                  </span>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={changing}
                onClick={onCancel}
                className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                {changing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Cancel request
              </Button>
            </>
          )}

          {request.status === "accepted" && (
            <>
              <Button type="button" disabled={changing} onClick={onComplete} className="rounded-full bg-green-600 hover:bg-green-700">
                {changing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Confirm completed pickup
              </Button>
              <Button type="button" variant="outline" onClick={onResponses} className="rounded-full border-green-200 text-green-700 hover:bg-green-50">
                View recycler
              </Button>
            </>
          )}

          {request.status === "completed" && (
            <div className="flex flex-1 items-center justify-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700">
              <Check className="h-4 w-4" /> Recovery completed
            </div>
          )}

          {request.status === "cancelled" && (
            <div className="flex flex-1 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-bold text-zinc-500">
              <XCircle className="h-4 w-4" /> Request cancelled
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ResponseCard({
  response, requestStatus, changing, onAccept,
}: {
  response: PickupResponseView;
  requestStatus: PickupStatus;
  changing: boolean;
  onAccept: () => void;
}) {
  const junkshop = response.junkshop;
  return (
    <div className="rounded-[24px] border border-green-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-green-50 text-green-600">
          {junkshop?.photo_url ? (
            <img src={junkshop.photo_url} alt={junkshop.junkshop_name} className="h-full w-full object-cover" />
          ) : (
            <Store className="h-6 w-6" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-zinc-900">{junkshop?.junkshop_name ?? "Recycler partner"}</h3>
            {junkshop?.verification_status === "approved" && (
              <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                <BadgeCheck className="mr-1 h-3.5 w-3.5" /> Verified
              </Badge>
            )}
            {response.status === "accepted" && (
              <Badge className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">Selected</Badge>
            )}
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
            <MapPin className="h-3.5 w-3.5 text-green-600" />
            {[junkshop?.barangay, junkshop?.city, junkshop?.province].filter(Boolean).join(", ") || "Location not provided"}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InformationRow
              icon={CalendarDays}
              label="Proposed date"
              value={response.proposed_pickup_date ? formatDate(response.proposed_pickup_date) : "Flexible date"}
            />
            <InformationRow
              icon={Truck}
              label="Pickup"
              value={response.pickup_available ? "Pickup available" : "Arrangement required"}
            />
          </div>

          {response.message && (
            <p className="mt-4 rounded-2xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">{response.message}</p>
          )}

          {requestStatus === "pending" && response.status === "interested" && (
            <Button type="button" disabled={changing} onClick={onAccept} className="mt-4 rounded-full bg-green-600 hover:bg-green-700">
              {changing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Handshake className="mr-2 h-4 w-4" />}
              Select this recycler
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function InformationRow({
  icon: Icon, label, value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-green-600 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">{label}</p>
        <p className="mt-1 break-words text-xs font-semibold leading-5 text-zinc-700">{value}</p>
      </div>
    </div>
  );
}

function TextInput({
  id, label, value, onChange, required = false, type = "text", inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal" | "search" | "url";
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}{required && <span className="text-red-500"> *</span>}</Label>
      <Input
        id={id}
        type={type}
        min={type === "date" ? toLocalDateInput(new Date()) : undefined}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-xl border-zinc-300 bg-white text-zinc-900 focus-visible:ring-green-500"
      />
    </div>
  );
}

function DialogHeaderPanel({
  eyebrow, title, description, icon: Icon,
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
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-100">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-black sm:text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-green-50/85">{description}</p>
        </div>
      </div>
    </div>
  );
}

function PreviewRow({
  icon: Icon, value,
}: {
  icon: ComponentType<{ className?: string }>;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
      <p className="break-words text-xs leading-5 text-zinc-600">{value}</p>
    </div>
  );
}

function EmptyPickupState({
  hasRequests, onCreate,
}: {
  hasRequests: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-[28px] border border-dashed border-green-200 bg-white px-6 py-14 text-center shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
        <Truck className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-lg font-black text-zinc-900">
        {hasRequests ? "No requests match the filters" : "No pickup requests yet"}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
        {hasRequests
          ? "Adjust the search or status filter to view other pickup records."
          : "Record collected materials in a drive, then publish the batch for recycler pickup."}
      </p>
      {!hasRequests && (
        <Button type="button" onClick={onCreate} className="mt-6 rounded-full bg-green-600 hover:bg-green-700">
          <Send className="mr-2 h-4 w-4" /> Request first pickup
        </Button>
      )}
    </div>
  );
}

function MissingPartnerState({ onSetup }: { onSetup: () => void }) {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center">
      <div className="w-full overflow-hidden rounded-[30px] border border-green-100 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-green-600 to-emerald-800 p-8 text-center text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white p-2 shadow-lg">
            <img src="/logo.png" alt="Trashure logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="mt-5 text-2xl font-black">Complete the partner profile</h1>
          <p className="mt-3 text-sm leading-7 text-green-50">
            The organization identity and pickup contact details are required before publishing material pickup requests.
          </p>
          <Button type="button" onClick={onSetup} className="mt-6 rounded-full bg-white text-green-700 hover:bg-green-50">
            <UserRound className="mr-2 h-4 w-4" /> Set up profile
          </Button>
        </div>
      </div>
    </div>
  );
}

function PickupErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-xl items-center justify-center">
      <div className="w-full rounded-[28px] border border-red-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-xl font-black text-zinc-900">Pickup requests unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">{message}</p>
        <Button type="button" onClick={onRetry} className="mt-6 rounded-full bg-green-600 hover:bg-green-700">
          <RefreshCcw className="mr-2 h-4 w-4" /> Try again
        </Button>
      </div>
    </div>
  );
}

function PickupPageSkeleton() {
  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <Skeleton className="h-4 w-44 bg-green-100" />
        <Skeleton className="h-9 w-72 max-w-full bg-green-100" />
        <Skeleton className="h-4 w-96 max-w-full bg-green-100" />
      </div>
      <Skeleton className="h-56 rounded-[30px] bg-green-100" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-[24px] bg-green-100" />
        ))}
      </div>
      <Skeleton className="h-24 rounded-[26px] bg-green-100" />
      <div className="grid gap-5 xl:grid-cols-2">
        <Skeleton className="h-96 rounded-[28px] bg-green-100" />
        <Skeleton className="h-96 rounded-[28px] bg-green-100" />
      </div>
    </div>
  );
}
