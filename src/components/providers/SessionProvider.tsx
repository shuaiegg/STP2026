"use client";

import React, { createContext, useContext } from 'react';
import { authClient } from '@/lib/auth-client';

type SessionType = ReturnType<typeof authClient.useSession>['data'];

interface SessionContextType {
    session: SessionType;
    isPending: boolean;
    refetch: () => Promise<any>;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const { data: session, isPending, refetch } = authClient.useSession();

    return (
        <SessionContext.Provider value={{ session, isPending, refetch }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSessionContext() {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSessionContext must be used within SessionProvider');
    }
    return context;
}
