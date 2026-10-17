import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiGet, apiPost, apiDelete } from "../lib/api";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { EmptyState } from "../components/ui/Dialog";
import { Search, UserPlus, Users, Ban } from "lucide-react";

export default function Friends() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const { data: friendsData } = useQuery({ queryKey: ["friends"], queryFn: () => apiGet<any>("/friends") });
  const friends = friendsData?.data || [];
  const { data: incomingData } = useQuery({ queryKey: ["friend-requests-incoming"], queryFn: () => apiGet<any>("/friends/requests/incoming") });
  const incoming = incomingData?.data || [];
  const { data: outgoingData } = useQuery({ queryKey: ["friend-requests-outgoing"], queryFn: () => apiGet<any>("/friends/requests/outgoing") });
  const outgoing = outgoingData?.data || [];

  async function doSearch() {
    if (!q.trim()) return;
    const r = await apiGet<any>(`/users/search?q=${encodeURIComponent(q)}`);
    setSearchResults(r.data || []);
  }

  async function sendRequest(id: string) {
    await apiPost("/friends/requests", { recipientId: id });
    qc.invalidateQueries({ queryKey: ["friend-requests-outgoing"] });
    doSearch();
  }

  async function accept(id: string) {
    await apiPost(`/friends/requests/${id}/accept`);
    qc.invalidateQueries({ queryKey: ["friends", "friend-requests-incoming"] });
  }
  async function reject(id: string) {
    await apiPost(`/friends/requests/${id}/reject`);
    qc.invalidateQueries({ queryKey: ["friend-requests-incoming"] });
  }
  async function cancel(id: string) {
    await apiDelete(`/friends/requests/${id}`);
    qc.invalidateQueries({ queryKey: ["friend-requests-outgoing"] });
  }
  async function removeFriend(id: string) {
    if (!confirm("Remove friend?")) return;
    await apiDelete(`/friends/${id}`);
    qc.invalidateQueries({ queryKey: ["friends"] });
  }
  async function block(id: string) {
    await apiPost("/blocks", { userId: id });
    qc.invalidateQueries({ queryKey: ["friends"] });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Amigos</h1>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Buscar usuarios..." value={q} onChange={(e) => setQ(e.target.value)} />
            <Button onClick={doSearch}><Search className="h-4 w-4" /></Button>
          </div>
          {searchResults.map((u: any) => (
            <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div>
                <p className="font-medium">{u.displayName || u.name} <span className="text-xs text-gray-500">@{u.username}</span></p>
                {u.bio && <p className="text-xs text-gray-500">{u.bio}</p>}
              </div>
              <Button size="sm" onClick={() => sendRequest(u.id)}><UserPlus className="h-3 w-3" /> Agregar</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {incoming.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="font-semibold">Solicitudes recibidas</h2>
            {incoming.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between py-2">
                <span>{r.sender?.displayName || r.sender?.name} @{r.sender?.username}</span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => accept(r.id)}>Aceptar</Button>
                  <Button size="sm" variant="outline" onClick={() => reject(r.id)}>Rechazar</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {outgoing.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="font-semibold">Solicitudes enviadas</h2>
            {outgoing.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between py-2">
                <span>{r.recipient?.displayName || r.recipient?.name} @{r.recipient?.username}</span>
                <Button size="sm" variant="outline" onClick={() => cancel(r.id)}>Cancelar</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> Mis amigos ({friends.length})</h2>
          {friends.length === 0 ? <EmptyState title="Sin amigos todavía" /> : friends.map((f: any) => (
            <div key={f.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div>
                <p className="font-medium">{f.displayName || f.name} <span className="text-xs text-gray-500">@{f.username}</span></p>
                {f.bio && <p className="text-xs text-gray-500">{f.bio}</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => removeFriend(f.id)}>Eliminar</Button>
                <Button size="sm" variant="ghost" onClick={() => block(f.id)} className="text-red-600"><Ban className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
