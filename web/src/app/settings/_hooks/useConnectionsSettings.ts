"use client";

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { User } from "firebase/auth";
import {
  type SavedConnection,
  type ConnectionDraft,
  EMPTY_CONNECTION_DRAFT,
  readJsonResponse,
} from "../_utils/settings-helpers";

interface ConnectionsShared {
  user: User | null;
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>;
  setSavingKey: (key: string | null) => void;
  setSuccess: (msg: string) => void;
  setError: (msg: string) => void;
}

export function useConnectionsSettings({
  user,
  authorizedFetch,
  setSavingKey,
  setSuccess,
  setError,
}: ConnectionsShared) {
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [connectionDraft, setConnectionDraft] = useState<ConnectionDraft>(EMPTY_CONNECTION_DRAFT);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    if (!user) return;
    try {
      const response = await authorizedFetch("/api/connections", { method: "GET" });
      const data = await readJsonResponse<{ connections?: SavedConnection[]; error?: string }>(response);
      if (!response.ok) throw new Error(data?.error ?? "Couldn't load your connections.");
      setConnections(data?.connections ?? []);
    } catch (error) {
      console.error("[settings/connections/load]", error);
      setError(error instanceof Error ? error.message : "Couldn't load your connections.");
    }
  }, [authorizedFetch, setError, user]);

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => {
      void loadConnections();
    });
  }, [loadConnections, user]);

  const resetConnectionDraft = useCallback(() => {
    setConnectionDraft(EMPTY_CONNECTION_DRAFT);
    setEditingConnectionId(null);
  }, []);

  const editConnection = useCallback((connection: SavedConnection) => {
    setConnectionDraft({
      name: connection.name,
      relationship: connection.relationship,
      phone: connection.phone ?? "",
      email: connection.email ?? "",
      handle: connection.handle ?? "",
      notes: connection.notes ?? "",
    });
    setEditingConnectionId(connection.id);
  }, []);

  const saveConnection = useCallback(async () => {
    setSavingKey("connection-save");
    try {
      const body = JSON.stringify(connectionDraft);
      const response = await authorizedFetch(
        editingConnectionId ? `/api/connections/${editingConnectionId}` : "/api/connections",
        { method: editingConnectionId ? "PATCH" : "POST", body },
      );
      const data = await readJsonResponse<{ connection?: SavedConnection; error?: string }>(response);
      if (!response.ok || !data?.connection) throw new Error(data?.error ?? "Couldn't save that connection.");
      await loadConnections();
      resetConnectionDraft();
      setSuccess(editingConnectionId ? "Connection updated." : "Connection added.");
    } catch (error) {
      console.error("[settings/connections/save]", error);
      setError(error instanceof Error ? error.message : "Couldn't save that connection.");
    } finally {
      setSavingKey(null);
    }
  }, [authorizedFetch, setSavingKey, setSuccess, setError, connectionDraft, editingConnectionId, loadConnections, resetConnectionDraft]);

  const deleteConnection = useCallback(async (connectionId: string) => {
    setSavingKey(`connection-delete-${connectionId}`);
    try {
      const response = await authorizedFetch(`/api/connections/${connectionId}`, { method: "DELETE" });
      const data = await readJsonResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data?.error ?? "Couldn't remove that connection.");
      await loadConnections();
      if (editingConnectionId === connectionId) resetConnectionDraft();
      setSuccess("Connection removed.");
    } catch (error) {
      console.error("[settings/connections/delete]", error);
      setError(error instanceof Error ? error.message : "Couldn't remove that connection.");
    } finally {
      setSavingKey(null);
    }
  }, [authorizedFetch, setSavingKey, setSuccess, setError, editingConnectionId, loadConnections, resetConnectionDraft]);

  return {
    connections,
    connectionDraft,
    setConnectionDraft: setConnectionDraft as Dispatch<SetStateAction<ConnectionDraft>>,
    editingConnectionId,
    saveConnection,
    deleteConnection,
    editConnection,
    resetConnectionDraft,
  };
}
