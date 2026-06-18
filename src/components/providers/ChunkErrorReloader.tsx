"use client";

import { useEffect } from "react";

/**
 * Recovers from ChunkLoadError — happens when a user holds an old page open and a
 * new deploy (or a dev HMR rebuild) replaces the chunk hashes, so a lazy chunk
 * fetch 404s. We reload once to pull the fresh build.
 *
 * Guard: only one reload per 10s window (sessionStorage) to avoid reload loops if
 * the chunk is genuinely unrecoverable.
 *
 * Root-layout safe: no useLocale / no next-intl hooks (constraint: root client
 * components must not call useLocale).
 */
const RELOAD_KEY = "__chunk_reload_at";
const COOLDOWN_MS = 10_000;

function isChunkError(message?: string): boolean {
    if (!message) return false;
    return /ChunkLoadError|Loading chunk [\d]+ failed|Failed to load chunk|error loading dynamically imported module/i.test(message);
}

function reloadOnce() {
    try {
        const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
        if (Date.now() - last < COOLDOWN_MS) return; // already reloaded recently — avoid loop
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch {
        // sessionStorage unavailable — still attempt a single reload
    }
    window.location.reload();
}

export function ChunkErrorReloader() {
    useEffect(() => {
        const onError = (e: ErrorEvent) => {
            if (isChunkError(e?.message) || isChunkError((e?.error as Error)?.name)) reloadOnce();
        };
        const onRejection = (e: PromiseRejectionEvent) => {
            const reason: any = e?.reason;
            if (isChunkError(reason?.name) || isChunkError(reason?.message)) reloadOnce();
        };
        window.addEventListener("error", onError);
        window.addEventListener("unhandledrejection", onRejection);
        return () => {
            window.removeEventListener("error", onError);
            window.removeEventListener("unhandledrejection", onRejection);
        };
    }, []);

    return null;
}
