import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiGet, apiPost } from "../lib/api";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { EmptyState } from "../components/ui/Dialog";
import { io, Socket } from "socket.io-client";
import { MessageCircle, Send } from "lucide-react";

export default function Messages() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: convsData } = useQuery({ queryKey: ["conversations"], queryFn: () => apiGet<any>("/conversations") });
  const convs = convsData?.data || [];

  useEffect(() => {
    const apiUrl = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || "/";
    const socket = io(apiUrl, { withCredentials: true });
    socketRef.current = socket;
    socket.on("message:new", (msg: any) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
    socket.on("typing:start", () => {});
    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    if (!activeConv) return;
    socketRef.current?.emit("conversation:join", activeConv);
    apiGet<any>(`/conversations/${activeConv}/messages`).then((r) => {
      setMessages(r.data || []);
      setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
    });
    apiPost(`/conversations/${activeConv}/read`).catch(() => {});
  }, [activeConv]);

  async function send() {
    if (!text.trim() || !activeConv) return;
    const clientId = `c-${Date.now()}`;
    const r = await apiPost<any>(`/conversations/${activeConv}/messages`, { text, clientId });
    setMessages((prev) => (prev.some((m) => m.id === r.data.id) ? prev : [...prev, r.data]));
    setText("");
    socketRef.current?.emit("typing:stop", activeConv);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function startChat(userId: string) {
    apiPost<any>("/conversations/direct", { userId }).then((r) => {
      setActiveConv(r.data.id);
      qc.invalidateQueries({ queryKey: ["conversations"] });
    });
  }

  return (
    <div className="grid md:grid-cols-3 gap-4 h-[70vh]">
      <Card className="md:col-span-1 overflow-auto">
        <CardContent className="p-3 space-y-2">
          <h2 className="font-semibold flex items-center gap-2"><MessageCircle className="h-4 w-4" /> {t("messages.conversations")}</h2>
          {convs.length === 0 && <EmptyState title={t("messages.noConversations")} />}
          {convs.map((c: any) => (
            <button key={c.id} onClick={() => setActiveConv(c.id)} className={`w-full text-left p-2 rounded-lg ${activeConv === c.id ? "bg-brand-50 dark:bg-brand-900/30" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
              <p className="font-medium text-sm">{c.name || "Chat"}</p>
              <p className="text-xs text-gray-500 truncate">{c.messages?.[0]?.text || ""}</p>
            </button>
          ))}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 mb-1">Iniciar chat con un amigo (usa su ID):</p>
            <FriendsPicker onSelect={startChat} />
          </div>
        </CardContent>
      </Card>
      <Card className="md:col-span-2 flex flex-col">
        <CardContent className="p-3 flex-1 overflow-auto space-y-2">
          {!activeConv ? <EmptyState title={t("messages.selectConversation")} /> : messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.senderId === (window as any).__uid ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${m.senderId === (window as any).__uid ? "bg-brand-600 text-white" : "bg-gray-100 dark:bg-gray-800"}`}>
                {m.deletedAt ? <em>{t("messages.deleted")}</em> : m.text}
                {m.editedAt && <span className="text-xs opacity-70 ml-1">({t("messages.edited")})</span>}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </CardContent>
        {activeConv && (
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
            <Input value={text} onChange={(e) => { setText(e.target.value); socketRef.current?.emit("typing:start", activeConv); }} placeholder={t("messages.typeMessage")} />
            <Button onClick={send}><Send className="h-4 w-4" /></Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function FriendsPicker({ onSelect }: { onSelect: (id: string) => void }) {
  const [id, setId] = useState("");
  return (
    <div className="flex gap-2">
      <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="User ID" />
      <Button size="sm" onClick={() => { if (id) onSelect(id); setId(""); }}>Iniciar</Button>
    </div>
  );
}
