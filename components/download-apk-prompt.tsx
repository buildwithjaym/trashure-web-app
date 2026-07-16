"use client";

import { useEffect, useState } from "react";

function AndroidIcon({
  className = "h-6 w-6",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${className} fill-current`}
    >
      <path d="M17.52 15.34a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm-11.04 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm11.4-6.02 2-3.46a.42.42 0 0 0-.15-.57.42.42 0 0 0-.57.15l-2.02 3.51A12.29 12.29 0 0 0 12 7.85c-1.85 0-3.59.39-5.14 1.1L4.84 5.44a.42.42 0 0 0-.57-.15.42.42 0 0 0-.15.57l2 3.46C2.69 11.19.34 14.66 0 18.76h24c-.34-4.1-2.69-7.57-6.12-9.44Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function DownloadApkPrompt() {
  const [showMobilePrompt, setShowMobilePrompt] = useState(false);

  useEffect(() => {
    const wasDismissed =
      window.sessionStorage.getItem("trashure-apk-prompt-dismissed") ===
      "true";

    if (wasDismissed) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowMobilePrompt(true);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, []);

  function dismissPrompt() {
    setShowMobilePrompt(false);

    window.sessionStorage.setItem(
      "trashure-apk-prompt-dismissed",
      "true",
    );
  }

  return (
    <>
      {/* Mobile message-style prompt */}
      <div
        className={`
          fixed inset-x-3 bottom-4 z-[100]
          transition-all duration-500 ease-out
          md:hidden
          ${
            showMobilePrompt
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-8 opacity-0"
          }
        `}
      >
        <div
          role="dialog"
          aria-label="Download Trashure Android application"
          className="
            relative overflow-hidden rounded-2xl
            border border-emerald-200
            bg-white/95 p-3.5
            shadow-[0_18px_60px_rgba(0,0,0,0.18)]
            backdrop-blur-xl
          "
        >
          {/* Decorative glow */}
          <div
            aria-hidden="true"
            className="
              absolute -right-10 -top-12
              h-28 w-28 rounded-full
              bg-emerald-100 blur-2xl
            "
          />

          <div className="relative flex items-start gap-3">
            <div
              className="
                flex h-11 w-11 shrink-0
                items-center justify-center
                rounded-full bg-emerald-600
                text-white shadow-md
              "
            >
              <AndroidIcon className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-zinc-900">
                    Trashure is available for Android
                  </p>

                  <p className="mt-0.5 text-xs leading-5 text-zinc-600">
                    Download the APK and take Trashure with you.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={dismissPrompt}
                  aria-label="Close download message"
                  className="
                    flex h-8 w-8 shrink-0
                    items-center justify-center
                    rounded-full text-zinc-500
                    transition
                    hover:bg-zinc-100
                    hover:text-zinc-900
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-emerald-500
                  "
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <a
                  href="/trashure.apk"
                  download="Trashure.apk"
                  onClick={dismissPrompt}
                  className="
                    inline-flex min-h-10 flex-1
                    items-center justify-center gap-2
                    rounded-xl bg-emerald-600
                    px-4 py-2
                    text-sm font-bold text-white
                    shadow-sm transition
                    active:scale-[0.98]
                    hover:bg-emerald-700
                    focus-visible:outline-none
                    focus-visible:ring-4
                    focus-visible:ring-emerald-200
                  "
                >
                  <AndroidIcon className="h-5 w-5" />
                  Download APK
                </a>

                <button
                  type="button"
                  onClick={dismissPrompt}
                  className="
                    min-h-10 rounded-xl
                    border border-zinc-200
                    bg-white px-3 py-2
                    text-xs font-semibold text-zinc-600
                    transition
                    hover:bg-zinc-50
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-emerald-500
                  "
                >
                  Not now
                </button>
              </div>
            </div>
          </div>

          <div className="relative mt-3 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
            </span>

            <p className="text-[11px] font-medium text-zinc-500">
              Safe direct download from Trashure
            </p>
          </div>
        </div>
      </div>

      {/* Desktop floating button */}
      <a
        href="/trashure.apk"
        download="Trashure.apk"
        aria-label="Download the Trashure Android APK"
        className="
          group fixed bottom-6 right-6 z-[100]
          hidden items-center gap-3
          rounded-full border border-emerald-400/60
          bg-emerald-600 px-4 py-3
          text-white
          shadow-[0_12px_35px_rgba(5,150,105,0.35)]
          transition-all duration-300
          hover:-translate-y-1
          hover:bg-emerald-700
          hover:shadow-[0_18px_45px_rgba(5,150,105,0.45)]
          active:translate-y-0
          focus-visible:outline-none
          focus-visible:ring-4
          focus-visible:ring-emerald-300
          md:inline-flex
        "
      >
        <span
          className="
            relative flex h-10 w-10
            items-center justify-center
            rounded-full bg-white/15
            transition-transform duration-300
            group-hover:scale-110
          "
        >
          <AndroidIcon />

          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
            <span className="absolute h-full w-full animate-ping rounded-full bg-lime-300 opacity-70" />
            <span className="relative h-3 w-3 rounded-full border-2 border-emerald-700 bg-lime-300" />
          </span>
        </span>

        <span className="flex flex-col items-start leading-tight">
          <span className="text-sm font-bold">Download APK</span>

          <span className="text-[10px] font-medium text-emerald-100">
            Available for Android
          </span>
        </span>
      </a>
    </>
  );
}