"use client";

import type {
  ComponentType,
  ReactNode,
} from "react";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertCircle,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Factory,
  GraduationCap,
  MapPinned,
  PackageCheck,
  Recycle,
  RefreshCcw,
  Scale,
  School,
  Store,
  Users,
  Weight,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";


type PeriodPreset =
  | "30"
  | "90"
  | "365"
  | "all";


interface MonitoringScope {
  profile_id: string;
  administrator_name: string;
  city: string;
  province: string | null;
}


interface MonitoringPeriod {
  start_date: string;
  end_date: string;
  generated_at: string;
}


interface MonitoringSummary {
  total_recovered_kg:
  | number
  | string;
  total_recovered_tons:
  | number
  | string;
  resident_recovered_kg:
  | number
  | string;
  resident_recovered_tons:
  | number
  | string;
  school_recovered_kg:
  | number
  | string;
  school_recovered_tons:
  | number
  | string;
  completed_resident_recoveries: number;
  school_collection_entries: number;
  pipeline_kg:
  | number
  | string;
  pipeline_tons:
  | number
  | string;
  pipeline_count: number;
  registered_residents: number;
  active_junkshops: number;
  verified_school_partners: number;
  active_school_drives: number;
}


interface DataQuality {
  resident_actual_weight_records: number;
  resident_estimated_weight_records: number;
  school_actual_weight_records: number;
  note: string;
}


interface MonthlyTrend {
  month_start: string;
  month_label: string;
  resident_kg:
  | number
  | string;
  school_kg:
  | number
  | string;
  total_kg:
  | number
  | string;
  total_tons:
  | number
  | string;
}


interface MaterialBreakdown {
  material_id: string;
  material_name: string;
  category: string;
  total_kg:
  | number
  | string;
  total_tons:
  | number
  | string;
  activity_count: number;
  share_percent:
  | number
  | string;
}


interface BarangayPerformance {
  barangay: string;
  total_kg:
  | number
  | string;
  total_tons:
  | number
  | string;
  activity_count: number;
  resident_recoveries: number;
  school_entries: number;
}


interface RecyclerPerformance {
  id: string;
  name: string;
  barangay: string | null;
  completed_count: number;
  recovered_kg:
  | number
  | string;
  recovered_tons:
  | number
  | string;
}


interface SchoolPerformance {
  id: string;
  name: string;
  barangay: string | null;
  entry_count: number;
  recovered_kg:
  | number
  | string;
  recovered_tons:
  | number
  | string;
}


interface RecentActivity {
  id: string;
  source_type:
  | "resident_recovery"
  | "school_collection";
  material_name: string;
  category: string;
  weight_kg:
  | number
  | string;
  weight_tons:
  | number
  | string;
  barangay: string;
  title: string;
  occurred_at: string;
}


interface MonitoringDashboard {
  scope: MonitoringScope;
  period: MonitoringPeriod;
  summary: MonitoringSummary;
  data_quality: DataQuality;
  monthly_trend: MonthlyTrend[];
  materials: MaterialBreakdown[];
  barangays: BarangayPerformance[];
  recyclers: RecyclerPerformance[];
  school_partners: SchoolPerformance[];
  recent_activity: RecentActivity[];
}


function numberValue(
  value:
    | number
    | string
    | null
    | undefined,
) {
  const parsed =
    Number(
      value ??
      0,
    );

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : 0;
}


function formatNumber(
  value: number,
  maximumFractionDigits =
    0,
) {
  return new Intl.NumberFormat(
    "en-PH",
    {
      maximumFractionDigits,
    },
  ).format(
    value,
  );
}


function formatKilograms(
  value:
    | number
    | string,
) {
  return `${formatNumber(
    numberValue(
      value,
    ),
    2,
  )} kg`;
}




function formatDate(
  value: string,
) {
  return new Date(
    value.includes(
      "T",
    )
      ? value
      : `${value}T00:00:00`,
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


function formatDateTime(
  value: string,
) {
  return new Date(
    value,
  ).toLocaleString(
    "en-PH",
    {
      month:
        "short",
      day:
        "numeric",
      year:
        "numeric",
      hour:
        "numeric",
      minute:
        "2-digit",
    },
  );
}


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


function dateString(
  date: Date,
) {
  return [
    date.getFullYear(),
    String(
      date.getMonth() +
      1,
    ).padStart(
      2,
      "0",
    ),
    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    ),
  ].join(
    "-",
  );
}


function periodDates(
  preset: PeriodPreset,
) {
  const end =
    new Date();

  if (
    preset ===
    "all"
  ) {
    return {
      start:
        "2000-01-01",

      end:
        dateString(
          end,
        ),
    };
  }

  const days =
    Number(
      preset,
    );

  const start =
    new Date(
      end,
    );

  start.setDate(
    start.getDate() -
    (
      days -
      1
    ),
  );

  return {
    start:
      dateString(
        start,
      ),

    end:
      dateString(
        end,
      ),
  };
}


function readDashboard(
  value: unknown,
) {
  if (
    !value ||
    typeof value !==
    "object"
  ) {
    throw new Error(
      "The LGU monitoring function returned invalid data.",
    );
  }

  return value as MonitoringDashboard;
}


export default function LguMonitoringPage() {
  return (
    <Suspense
      fallback={
        <MonitoringPageSkeleton />
      }
    >
      <LguMonitoringContent />
    </Suspense>
  );
}


function LguMonitoringContent() {
  const supabase =
    useMemo(
      () =>
        createClient(),
      [],
    );

  const [
    dashboard,
    setDashboard,
  ] =
    useState<MonitoringDashboard | null>(
      null,
    );

  const [
    periodPreset,
    setPeriodPreset,
  ] =
    useState<PeriodPreset>(
      "90",
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
    pageError,
    setPageError,
  ] =
    useState<string | null>(
      null,
    );


  const loadDashboard =
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
          const dates =
            periodDates(
              periodPreset,
            );

          const {
            data,
            error,
          } =
            await supabase.rpc(
              "get_lgu_monitoring_dashboard",
              {
                p_start_date:
                  dates.start,

                p_end_date:
                  dates.end,
              },
            );

          if (
            error
          ) {
            throw error;
          }

          setDashboard(
            readDashboard(
              data,
            ),
          );
        } catch (
        error
        ) {
          setPageError(
            getErrorMessage(
              error,
              "The city monitoring dashboard could not be loaded.",
            ),
          );
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
        periodPreset,
        supabase,
      ],
    );


  useEffect(
    () => {
      void loadDashboard();
    },
    [
      loadDashboard,
    ],
  );


  if (
    loading
  ) {
    return (
      <MonitoringPageSkeleton />
    );
  }


  if (
    pageError ||
    !dashboard
  ) {
    return (
      <MonitoringErrorState
        message={
          pageError ??
          "The city monitoring dashboard returned no data."
        }
        onRetry={() =>
          void loadDashboard()
        }
      />
    );
  }


  const summary =
    dashboard.summary;

  const totalRecoveredKg =
    numberValue(
      summary.total_recovered_kg,
    );

  const materialMaximum =
    Math.max(
      1,
      ...dashboard.materials.map(
        (
          material,
        ) =>
          numberValue(
            material.total_kg,
          ),
      ),
    );

  const barangayMaximum =
    Math.max(
      1,
      ...dashboard.barangays.map(
        (
          barangay,
        ) =>
          numberValue(
            barangay.total_kg,
          ),
      ),
    );

  const trendMaximum =
    Math.max(
      1,
      ...dashboard.monthly_trend.map(
        (
          month,
        ) =>
          numberValue(
            month.total_kg,
          ),
      ),
    );

  const weightRecords =
    dashboard.data_quality
      .resident_actual_weight_records +
    dashboard.data_quality
      .resident_estimated_weight_records;

  const actualWeightRecords =
    dashboard.data_quality
      .resident_actual_weight_records;

  const actualResidentShare =
    weightRecords >
      0
      ? (
        actualWeightRecords /
        weightRecords
      ) *
      100
      : 0;


  return (
    <div className="space-y-7">
      {/* HERO */}

      <section
        id="overview"
        className="scroll-mt-28 overflow-hidden rounded-[30px] border border-green-100 bg-white shadow-sm"
      >
        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-green-100/70 blur-2xl" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                <Building2 className="mr-1.5 h-3.5 w-3.5" />

                {
                  dashboard.scope.city
                }
              </Badge>

              <Badge className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">
                Monitoring only
              </Badge>
            </div>


            <h1 className="mt-5 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
              City Recovery Overview
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-500">
              A city-level view of completed material recovery, school
              collections, pending recovery volume, barangay participation,
              and the active recovery network.
            </p>


            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-green-600" />

                {formatDate(
                  dashboard.period.start_date,
                )}{" "}
                to{" "}
                {formatDate(
                  dashboard.period.end_date,
                )}
              </span>

              <span className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-green-600" />

                Updated{" "}
                {formatDateTime(
                  dashboard.period.generated_at,
                )}
              </span>
            </div>
          </div>


          <div className="relative flex flex-col gap-3 sm:flex-row lg:flex-col">
            <select
              value={
                periodPreset
              }
              onChange={(
                event,
              ) =>
                setPeriodPreset(
                  event.target
                    .value as PeriodPreset,
                )
              }
              className="h-11 min-w-48 rounded-full border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            >
              <option value="30">
                Last 30 days
              </option>

              <option value="90">
                Last 90 days
              </option>

              <option value="365">
                Last 12 months
              </option>

              <option value="all">
                All available data
              </option>
            </select>


            <Button
              type="button"
              variant="outline"
              disabled={
                refreshing
              }
              onClick={() =>
                void loadDashboard(
                  true,
                )
              }
              className="h-11 rounded-full border-green-200 bg-white text-green-700 hover:bg-green-50"
            >
              <RefreshCcw
                className={`mr-2 h-4 w-4 ${refreshing
                  ? "animate-spin"
                  : ""
                  }`}
              />

              Refresh data
            </Button>
          </div>
        </div>
      </section>


      {/* PRIMARY METRICS */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Weight}
          label="Recovered weight"
          value={formatKilograms(summary.total_recovered_kg)}
          description="Completed recovery in the selected period"
          featured
        />

        <MetricCard
          icon={Recycle}
          label="Resident recoveries"
          value={formatKilograms(summary.resident_recovered_kg)}
          description={`${summary.completed_resident_recoveries} completed resident transaction${summary.completed_resident_recoveries === 1 ? "" : "s"
            }`}
        />

        <MetricCard
          icon={GraduationCap}
          label="School collections"
          value={formatKilograms(summary.school_recovered_kg)}
          description={`${summary.school_collection_entries} recorded collection entr${summary.school_collection_entries === 1 ? "y" : "ies"
            }`}
        />

        <MetricCard
          icon={Clock3}
          label="Recovery pipeline"
          value={formatKilograms(summary.pipeline_kg)}
          description={`${summary.pipeline_count} open or accepted resident offer${summary.pipeline_count === 1 ? "" : "s"
            }`}
        />
      </section>


      {/* NETWORK METRICS */}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CompactMetric
          icon={
            Users
          }
          label="Registered residents"
          value={
            summary.registered_residents
          }
        />

        <CompactMetric
          icon={
            Store
          }
          label="Active junkshops"
          value={
            summary.active_junkshops
          }
        />

        <CompactMetric
          icon={
            School
          }
          label="Verified school partners"
          value={
            summary.verified_school_partners
          }
        />

        <CompactMetric
          icon={
            Activity
          }
          label="Active school drives"
          value={
            summary.active_school_drives
          }
        />
      </section>


      {/* DATA QUALITY */}

      <section className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

            <div>
              <p className="font-black text-amber-900">
                Weight accuracy note
              </p>

              <p className="mt-1 max-w-4xl text-sm leading-6 text-amber-800">
                {
                  dashboard.data_quality.note
                }
              </p>
            </div>
          </div>


          <div className="shrink-0 rounded-2xl border border-amber-200 bg-white px-4 py-3">
            <p className="text-xs font-bold text-zinc-500">
              Resident records with actual weight
            </p>

            <p className="mt-1 text-lg font-black text-zinc-900">
              {formatNumber(
                actualResidentShare,
                1,
              )}
              %
            </p>
          </div>
        </div>
      </section>


      {/* TREND + MATERIAL */}
<section
  id="trend"
  className="scroll-mt-28 grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]"
>
  {/* RECOVERY TREND */}
  <div className="min-w-0">
    <Panel
      icon={BarChart3}
      title="Recovery trend"
      description="Completed kilograms by month, separated by resident and school activity."
    >
      {dashboard.monthly_trend.length === 0 ? (
        <EmptyPanel message="No monthly recovery data is available for this period." />
      ) : (
        <div className="mt-6 min-w-0">
          <div
            className="
              -mx-2 overflow-x-auto px-2 pb-3
              overscroll-x-contain scroll-smooth
              [scrollbar-width:thin]
            "
          >
            <div
              className="
                grid min-w-max grid-flow-col
                auto-cols-[72px] items-end gap-3
                px-1 sm:auto-cols-[84px]
                xl:min-w-0 xl:grid-flow-row
                xl:grid-cols-[repeat(auto-fit,minmax(72px,1fr))]
              "
            >
              {dashboard.monthly_trend.map((month) => {
                const residentKg = numberValue(month.resident_kg)
                const schoolKg = numberValue(month.school_kg)
                const totalKg = numberValue(month.total_kg)

                const totalHeight =
                  trendMaximum > 0
                    ? Math.min(
                        210,
                        Math.max(
                          8,
                          (totalKg / trendMaximum) * 210,
                        ),
                      )
                    : 8

                const residentHeight =
                  totalKg > 0
                    ? (residentKg / totalKg) * totalHeight
                    : 0

                const schoolHeight =
                  totalKg > 0
                    ? (schoolKg / totalKg) * totalHeight
                    : 0

                return (
                  <div
                    key={month.month_start}
                    className="
                      flex min-w-0 snap-start
                      flex-col items-center
                    "
                  >
                    <p
                      className="
                        mb-2 whitespace-nowrap
                        text-[11px] font-black
                        text-zinc-700 sm:text-xs
                      "
                    >
                      {formatNumber(totalKg, 0)} kg
                    </p>

                    <div className="flex h-[210px] w-full items-end justify-center">
                      <div
                        className="
                          flex w-9 flex-col justify-end
                          overflow-hidden rounded-t-lg
                          bg-zinc-100 sm:w-10 sm:rounded-t-xl
                        "
                        style={{
                          height: `${totalHeight}px`,
                        }}
                        title={`${month.month_label}: ${formatKilograms(
                          totalKg,
                        )}`}
                        role="img"
                        aria-label={`${month.month_label}, ${formatKilograms(
                          totalKg,
                        )} recovered`}
                      >
                        {schoolHeight > 0 && (
                          <div
                            className="w-full shrink-0 bg-emerald-300"
                            style={{
                              height: `${schoolHeight}px`,
                            }}
                            aria-hidden="true"
                          />
                        )}

                        {residentHeight > 0 && (
                          <div
                            className="w-full shrink-0 bg-green-600"
                            style={{
                              height: `${residentHeight}px`,
                            }}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </div>

                    <p
                      className="
                        mt-3 w-full truncate px-1
                        text-center text-[10px]
                        font-semibold text-zinc-500
                        sm:text-[11px]
                      "
                      title={month.month_label}
                    >
                      {month.month_label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <div
            className="
              mt-3 grid grid-cols-1 gap-2
              border-t border-zinc-100 pt-4
              text-xs font-semibold text-zinc-500
              sm:flex sm:flex-wrap sm:gap-4
            "
          >
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-sm bg-green-600"
                aria-hidden="true"
              />
              Resident recovery
            </span>

            <span className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-sm bg-emerald-300"
                aria-hidden="true"
              />
              School collection
            </span>
          </div>
        </div>
      )}
    </Panel>
  </div>

  {/* TOP MATERIALS */}
  <div className="min-w-0">
    <Panel
      icon={PackageCheck}
      title="Top recovered materials"
      description="Materials contributing the most weight to city recovery."
    >
      {dashboard.materials.length === 0 ? (
        <EmptyPanel message="No recovered material data is available." />
      ) : (
        <div className="mt-6 space-y-5">
          {dashboard.materials.map((material) => {
            const kilograms = numberValue(material.total_kg)

            const width =
              materialMaximum > 0
                ? Math.min(
                    100,
                    Math.max(
                      3,
                      (kilograms / materialMaximum) * 100,
                    ),
                  )
                : 3

            return (
              <div
                key={material.material_id}
                className="min-w-0"
              >
                <div
                  className="
                    grid min-w-0
                    grid-cols-[minmax(0,1fr)_auto]
                    items-end gap-3
                  "
                >
                  <div className="min-w-0">
                    <p
                      className="
                        line-clamp-2 break-words
                        text-sm font-black leading-5
                        text-zinc-900 sm:text-base
                      "
                      title={material.material_name}
                    >
                      {material.material_name}
                    </p>

                    <div
                      className="
                        mt-1 flex flex-wrap items-center
                        gap-x-1 gap-y-0.5
                        text-[11px] text-zinc-500
                        sm:text-xs
                      "
                    >
                      <span className="break-words">
                        {material.category}
                      </span>

                      <span aria-hidden="true">·</span>

                      <span className="whitespace-nowrap">
                        {material.activity_count} activit
                        {material.activity_count === 1
                          ? "y"
                          : "ies"}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className="
                        whitespace-nowrap text-sm
                        font-black text-green-700
                        sm:text-base
                      "
                    >
                      {formatKilograms(material.total_kg)}
                    </p>

                    <p className="text-[11px] text-zinc-400 sm:text-xs">
                      {formatNumber(
                        numberValue(material.share_percent),
                        1,
                      )}
                      %
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="
                      h-full rounded-full
                      bg-green-600 transition-[width]
                      duration-500 ease-out
                    "
                    style={{
                      width: `${width}%`,
                    }}
                    role="progressbar"
                    aria-label={`${material.material_name} recovery share`}
                    aria-valuenow={numberValue(
                      material.share_percent,
                    )}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Panel>
  </div>
</section>

      {/* BARANGAYS */}

      <section
        id="barangays"
        className="scroll-mt-28"
      >
        <Panel
          icon={
            MapPinned
          }
          title="Barangay performance"
          description="Recovery volume by barangay within the LGU monitoring scope."
        >
          {dashboard.barangays.length ===
            0 ? (
            <EmptyPanel
              message="No barangay recovery activity is available for this period."
            />
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200">
              <div className="hidden grid-cols-[60px_minmax(180px,1fr)_minmax(220px,1.4fr)_130px_150px] border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs font-black uppercase tracking-[0.08em] text-zinc-500 md:grid">
                <span>
                  Rank
                </span>

                <span>
                  Barangay
                </span>

                <span>
                  Relative volume
                </span>

                <span className="text-right">
                  Total
                </span>

                <span className="text-right">
                  Activity
                </span>
              </div>


              {dashboard.barangays.map(
                (
                  barangay,
                  index,
                ) => {
                  const kilograms =
                    numberValue(
                      barangay.total_kg,
                    );

                  const width =
                    Math.max(
                      2,
                      (
                        kilograms /
                        barangayMaximum
                      ) *
                      100,
                    );

                  return (
                    <div
                      key={
                        barangay.barangay
                      }
                      className="grid gap-3 border-b border-zinc-100 px-5 py-4 last:border-b-0 md:grid-cols-[60px_minmax(180px,1fr)_minmax(220px,1.4fr)_130px_150px] md:items-center"
                    >
                      <div className="flex items-center justify-between md:block">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-sm font-black text-green-700">
                          {index +
                            1}
                        </span>

                        <span className="text-sm font-black text-zinc-900 md:hidden">
                          {
                            barangay.barangay
                          }
                        </span>
                      </div>


                      <p className="hidden font-black text-zinc-900 md:block">
                        {
                          barangay.barangay
                        }
                      </p>


                      <div>
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full bg-green-600"
                            style={{
                              width:
                                `${width}%`,
                            }}
                          />
                        </div>

                        <p className="mt-2 text-xs text-zinc-500 md:hidden">
                          {
                            barangay.resident_recoveries
                          }{" "}
                          resident ·{" "}
                          {
                            barangay.school_entries
                          }{" "}
                          school
                        </p>
                      </div>


                      <div className="flex justify-between md:block md:text-right">
                        <span className="text-xs font-semibold text-zinc-400 md:hidden">
                          Recovered
                        </span>

                        <p className="font-black text-green-700">
                          {formatKilograms(barangay.total_kg)}
                        </p>
                      </div>


                      <div className="flex justify-between md:block md:text-right">
                        <span className="text-xs font-semibold text-zinc-400 md:hidden">
                          Activities
                        </span>

                        <p className="font-semibold text-zinc-700">
                          {
                            barangay.activity_count
                          }
                        </p>

                        <p className="mt-0.5 hidden text-[10px] text-zinc-400 md:block">
                          {
                            barangay.resident_recoveries
                          }{" "}
                          resident ·{" "}
                          {
                            barangay.school_entries
                          }{" "}
                          school
                        </p>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </Panel>
      </section>


      {/* NETWORK */}

      <section
        id="network"
        className="scroll-mt-28 grid gap-5 xl:grid-cols-2"
      >
        <Panel
          icon={
            Factory
          }
          title="Recycler network"
          description="Approved city junkshops ranked by completed resident recovery weight."
        >
          <PartnerList
            items={dashboard.recyclers.map(
              (
                recycler,
              ) => ({
                id:
                  recycler.id,

                name:
                  recycler.name,

                location:
                  recycler.barangay,

                weight:
                  numberValue(
                    recycler.recovered_kg,
                  ),

                weightLabel: formatKilograms(
                  recycler.recovered_kg,
                ),

                activityLabel:
                  `${recycler.completed_count} completed recover${recycler.completed_count ===
                    1
                    ? "y"
                    : "ies"
                  }`,
              }),
            )}
            emptyMessage="No approved recycler performance is available."
            icon={
              Store
            }
          />
        </Panel>


        <Panel
          icon={
            School
          }
          title="School partner network"
          description="Verified schools and organizations ranked by recorded collection weight."
        >
          <PartnerList
            items={dashboard.school_partners.map(
              (
                school,
              ) => ({
                id:
                  school.id,

                name:
                  school.name,

                location:
                  school.barangay,

                weight:
                  numberValue(
                    school.recovered_kg,
                  ),

                weightLabel: formatKilograms(
                  school.recovered_kg,
                ),

                activityLabel:
                  `${school.entry_count} collection entr${school.entry_count ===
                    1
                    ? "y"
                    : "ies"
                  }`,
              }),
            )}
            emptyMessage="No verified school collection performance is available."
            icon={
              GraduationCap
            }
          />
        </Panel>
      </section>


      {/* RECENT ACTIVITY */}

      <section>
        <Panel
          icon={
            Activity
          }
          title="Recent completed activity"
          description="Latest recovery events included in the city total."
        >
          {dashboard.recent_activity.length ===
            0 ? (
            <EmptyPanel
              message="No completed recovery activity is available for this period."
            />
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200">
              <div
                className="
    hidden border-b border-zinc-200 bg-zinc-50
    px-5 py-3
    text-xs font-black uppercase
    tracking-[0.08em] text-zinc-500
    lg:grid
    lg:grid-cols-[minmax(220px,1.4fr)_minmax(160px,1fr)_120px_170px_180px]
    lg:items-center
    lg:gap-x-8
  "
              >
                <span>
                  Activity
                </span>

                <span>
                  Material
                </span>

                <span className="pr-2 text-right">
                  Weight
                </span>

                <span>
                  Barangay
                </span>

                <span className="text-right">
                  Completed
                </span>
              </div>


              {dashboard.recent_activity.map(
                (
                  activity,
                ) => (
                  <div
                    key={`${activity.source_type}-${activity.id}`}
                    className="
  grid gap-y-3
  border-b border-zinc-100
  px-5 py-4
  last:border-b-0
  lg:grid-cols-[minmax(220px,1.4fr)_minmax(160px,1fr)_120px_170px_180px]
  lg:items-center
  lg:gap-x-8
"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${activity.source_type ===
                        "school_collection"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-green-50 text-green-600"
                        }`}>
                        {activity.source_type ===
                          "school_collection" ? (
                          <School className="h-5 w-5" />
                        ) : (
                          <Recycle className="h-5 w-5" />
                        )}
                      </div>

                      <div>
                        <p className="font-black text-zinc-900">
                          {
                            activity.title
                          }
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {activity.source_type ===
                            "school_collection"
                            ? "School collection"
                            : "Resident recovery"}
                        </p>
                      </div>
                    </div>


                    <div>
                      <p className="font-semibold text-zinc-800">
                        {
                          activity.material_name
                        }
                      </p>

                      <p className="mt-0.5 text-xs text-zinc-400">
                        {
                          activity.category
                        }
                      </p>
                    </div>


                    <p className="font-black text-green-700 lg:text-right">
                      {formatKilograms(
                        activity.weight_kg,
                      )}
                    </p>


                    <p className="text-sm font-semibold text-zinc-600">
                      {
                        activity.barangay
                      }
                    </p>


                    <p className="text-sm text-zinc-500 lg:text-right">
                      {formatDateTime(
                        activity.occurred_at,
                      )}
                    </p>
                  </div>
                ),
              )}
            </div>
          )}
        </Panel>
      </section>


      {/* FOOTNOTE */}

      <section className="rounded-[24px] border border-green-100 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

          <div>
            <p className="font-black text-zinc-900">
              Monitoring scope
            </p>

            <p className="mt-1 text-sm leading-6 text-zinc-500">
              This LGU dashboard is read-only. It reports records associated
              with{" "}
              <strong>
                {
                  dashboard.scope.city
                }
              </strong>
              {dashboard.scope.province
                ? `, ${dashboard.scope.province}`
                : ""}
              . Scans alone are not counted as recovered weight. Only
              completed resident recoveries and recorded school collection
              entries contribute to the total.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}


function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  featured =
  false,
}: {
  icon:
  ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
  description: string;
  featured?: boolean;
}) {
  return (
    <article
      className={`rounded-[26px] border p-5 shadow-sm ${featured
        ? "border-green-600 bg-green-600 text-white"
        : "border-green-100 bg-white text-zinc-900"
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-sm font-semibold ${featured
              ? "text-green-100"
              : "text-zinc-500"
              }`}
          >
            {label}
          </p>

          <p className="mt-3 text-3xl font-black">
            {value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${featured
            ? "bg-white/15 text-white"
            : "bg-green-50 text-green-600"
            }`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <p
        className={`mt-4 text-xs leading-5 ${featured
          ? "text-green-50"
          : "text-zinc-500"
          }`}
      >
        {description}
      </p>
    </article>
  );
}


function CompactMetric({
  icon: Icon,
  label,
  value,
}: {
  icon:
  ComponentType<{
    className?: string;
  }>;
  label: string;
  value: number;
}) {
  return (
    <article className="flex items-center gap-4 rounded-[22px] border border-green-100 bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-2xl font-black text-zinc-900">
          {formatNumber(
            value,
          )}
        </p>

        <p className="mt-0.5 text-xs font-semibold text-zinc-500">
          {label}
        </p>
      </div>
    </article>
  );
}


function Panel({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon:
  ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
  children:
  ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
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

      {children}
    </section>
  );
}


function PartnerList({
  items,
  emptyMessage,
  icon: Icon,
}: {
  items: Array<{
    id: string;
    name: string;
    location: string | null;
    weight: number;
    weightLabel: string;
    activityLabel: string;
  }>;
  emptyMessage: string;
  icon:
  ComponentType<{
    className?: string;
  }>;
}) {
  const maximum =
    Math.max(
      1,
      ...items.map(
        (
          item,
        ) =>
          item.weight,
      ),
    );

  if (
    items.length ===
    0
  ) {
    return (
      <EmptyPanel
        message={
          emptyMessage
        }
      />
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {items.map(
        (
          item,
          index,
        ) => (
          <div
            key={
              item.id
            }
            className="rounded-2xl border border-zinc-200 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-100 px-1.5 text-[10px] font-black text-zinc-500">
                      {index +
                        1}
                    </span>

                    <p className="truncate font-black text-zinc-900">
                      {
                        item.name
                      }
                    </p>
                  </div>

                  <p className="mt-1 text-xs text-zinc-500">
                    {item.location ||
                      "Barangay not specified"}{" "}
                    ·{" "}
                    {
                      item.activityLabel
                    }
                  </p>
                </div>
              </div>

              <p className="shrink-0 font-black text-green-700">
                {
                  item.weightLabel
                }
              </p>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-green-600"
                style={{
                  width:
                    `${Math.max(
                      2,
                      (
                        item.weight /
                        maximum
                      ) *
                      100,
                    )}%`,
                }}
              />
            </div>
          </div>
        ),
      )}
    </div>
  );
}


function EmptyPanel({
  message,
}: {
  message: string;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-green-200 bg-green-50 px-5 py-10 text-center">
      <Scale className="mx-auto h-7 w-7 text-green-600" />

      <p className="mt-3 text-sm font-semibold text-zinc-500">
        {message}
      </p>
    </div>
  );
}


function MonitoringErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
      <div className="w-full rounded-[28px] border border-red-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertCircle className="h-8 w-8" />
        </div>

        <h1 className="mt-5 text-xl font-black text-zinc-900">
          City monitoring unavailable
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


function MonitoringPageSkeleton() {
  return (
    <div className="space-y-7">
      <Skeleton className="h-72 rounded-[30px] bg-green-100" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              className="h-40 rounded-[26px] bg-green-100"
            />
          ),
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              className="h-24 rounded-[22px] bg-green-100"
            />
          ),
        )}
      </div>

      <Skeleton className="h-24 rounded-[24px] bg-green-100" />

      <div className="grid gap-5 xl:grid-cols-2">
        <Skeleton className="h-[520px] rounded-[28px] bg-green-100" />

        <Skeleton className="h-[520px] rounded-[28px] bg-green-100" />
      </div>

      <Skeleton className="h-[560px] rounded-[28px] bg-green-100" />
    </div>
  );
}
