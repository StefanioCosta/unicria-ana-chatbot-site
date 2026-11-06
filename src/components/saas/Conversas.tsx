"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Send,
  Loader2,
  Bot,
  User,
  Search,
  FlaskConical,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  api,
  timeAgo,
  dateTime,
  STATUS_LABEL,
  STATUS_CLASS,
} from "./helpers";

interface ConversationItem {
  id: string;
  customerName: string | null;
  customerPhone: string;
  status: string;
  source: string;
  lastMessageAt: string;
  _count: { messages: number };
  sales: { id: string; valueKz: number; status: string }[];
}

interface MessageItem {
  id: string;
  role: "cliente" | "ana" | "humano";
  content: string;
  createdAt: string;
}

interface ConvDetail {
  id: string;
  customerName: string | null;
  customerPhone: string;
  status: string;
  source: string;
  messages: MessageItem[];
  sales: { id: string; valueKz: number; status: string; productName: string }[];
}

export function Conversas() {
  const [convs, setConvs] = useState<ConversationItem[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConvDetail | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [simOpen, setSimOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadConvs = useCallback(async () => {
    const data = await api<{ conversations: ConversationItem[] }>(
      `/api/conversations${search ? `?q=${encodeURIComponent(search)}` : ""}`
    );
    setConvs(data.conversations);
  }, [search]);

  const loadDetail = useCallback(async (id: string) => {
    const data = await api<{ conversation: ConvDetail }>(
      `/api/conversations/${id}`
    );
    setDetail(data.conversation);
  }, []);

  useEffect(() => {
    loadConvs();
    const t = setInterval(loadConvs, 5000);
    return () => clearInterval(t);
  }, [loadConvs]);

  useEffect(() => {
    if (!selected) return;
    loadDetail(selected);
    const t = setInterval(() => loadDetail(selected), 4000);
    return () => clearInterval(t);
  }, [selected, loadDetail]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.messages.length]);

  async function sendAsHuman() {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      await api(`/api/conversations/${selected}`, {
        method: "POST",
        body: JSON.stringify({ text: reply.trim() }),
      });
      setReply("");
      await loadDetail(selected);
      await loadConvs();
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha ao enviar",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Conversas</h1>
          <p className="text-sm text-white/50">
            A Ana responde automaticamente — podes assumir quando quiseres
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSimOpen(true)}
          className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-navy-dark transition-all hover:bg-gold-light"
        >
          <FlaskConical className="h-4 w-4" />
          Testar Ana (simulador)
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Lista de conversas */}
        <div className="rounded-2xl border border-white/10 bg-white/5 lg:col-span-2">
          <div className="border-b border-white/10 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar nome ou telefone..."
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-gold/50 focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-[65vh] divide-y divide-white/5 overflow-y-auto">
            {convs.length === 0 && (
              <p className="p-6 text-center text-sm text-white/40">
                Nenhuma conversa ainda. Usa o simulador para testar a Ana!
              </p>
            )}
            {convs.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c.id)}
                className={`flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/5 ${
                  selected === c.id ? "bg-gold/10" : ""
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/15 font-bold text-gold-light">
                  {(c.customerName || c.customerPhone).charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                      {c.customerName || "Cliente"}
                    </p>
                    <span className="shrink-0 text-xs text-white/40">
                      {timeAgo(c.lastMessageAt)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] ${STATUS_CLASS[c.status] || ""}`}
                    >
                      {STATUS_LABEL[c.status] || c.status}
                    </span>
                    {c.source === "whatsapp" && (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                        WhatsApp
                      </span>
                    )}
                    <span className="text-xs text-white/30">
                      {c._count.messages} msgs
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-white/5 lg:col-span-3">
          {!detail ? (
            <div className="flex h-[65vh] flex-col items-center justify-center gap-3 text-white/40">
              <Bot className="h-12 w-12" />
              <p className="text-sm">Selecciona uma conversa para ver o histórico</p>
            </div>
          ) : (
            <>
              {/* Cabeçalho do chat */}
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 font-bold text-gold-light">
                    {(detail.customerName || detail.customerPhone)
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      {detail.customerName || "Cliente"}
                    </p>
                    <p className="text-xs text-white/40">
                      {detail.customerPhone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${STATUS_CLASS[detail.status] || ""}`}
                  >
                    {STATUS_LABEL[detail.status] || detail.status}
                  </span>
                  {detail.status === "aberta" && (
                    <button
                      type="button"
                      onClick={async () => {
                        await api(`/api/conversations/${detail.id}`, {
                          method: "PATCH",
                          body: JSON.stringify({
                            status: "perdida",
                            lossReason: "Marcada como perdida pelo atendente",
                          }),
                        });
                        await loadDetail(detail.id);
                        await loadConvs();
                      }}
                      className="flex items-center gap-1 rounded-full border border-red-400/30 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10"
                    >
                      <XCircle className="h-3 w-3" />
                      Marcar perdida
                    </button>
                  )}
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: "55vh" }}>
                {detail.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.role === "cliente" ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.role === "cliente"
                          ? "rounded-bl-sm bg-white/10 text-white"
                          : m.role === "ana"
                            ? "rounded-br-sm bg-gold/15 text-gold-light"
                            : "rounded-br-sm bg-blue-500/20 text-blue-100"
                      }`}
                    >
                      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide opacity-60">
                        {m.role === "ana" ? (
                          <Bot className="h-3 w-3" />
                        ) : m.role === "humano" ? (
                          <User className="h-3 w-3" />
                        ) : null}
                        {m.role === "ana"
                          ? "Ana (IA)"
                          : m.role === "humano"
                            ? "Atendente"
                            : "Cliente"}
                      </p>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <p className="mt-1 text-right text-[10px] opacity-40">
                        {dateTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {detail.sales.filter((s) => s.status !== "perdida").length > 0 && (
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      Venda fechada nesta conversa — agendamento na Kikolo
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Responder como atendente */}
              <div className="flex gap-2 border-t border-white/10 p-3">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendAsHuman()}
                  placeholder="Responder como atendente humano (a Ana pausa nesta conversa)..."
                  className="h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 focus:border-gold/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={sendAsHuman}
                  disabled={sending || !reply.trim()}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold text-navy-dark transition-all hover:bg-gold-light disabled:opacity-40"
                  aria-label="Enviar resposta"
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {simOpen && (
        <Simulador
          onClose={() => setSimOpen(false)}
          onConversation={(id) => {
            setSimOpen(false);
            setSelected(id);
            loadConvs();
          }}
        />
      )}
    </div>
  );
}

/** Simulador: conversa com a Ana como se fosses o cliente, sem WhatsApp real */
function Simulador({
  onClose,
  onConversation,
}: {
  onClose: () => void;
  onConversation: (id: string) => void;
}) {
  const [phone, setPhone] = useState("+2449" + Math.floor(10000000 + Math.random() * 89999999));
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [saleInfo, setSaleInfo] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  async function send() {
    if (!text.trim() || loading) return;
    const msg = text.trim();
    setText("");
    setMessages((m) => [...m, { role: "cliente", content: msg }]);
    setLoading(true);
    try {
      const res = await api<{
        conversationId: string;
        anaReply: string | null;
        saleCreated: { customerName: string; productName: string; valueKz: number } | null;
      }>("/api/chat/simulate", {
        method: "POST",
        body: JSON.stringify({ phone, name, text: msg }),
      });
      setConvId(res.conversationId);
      if (res.anaReply) {
        setMessages((m) => [...m, { role: "ana", content: res.anaReply! }]);
      }
      if (res.saleCreated) {
        const s = res.saleCreated;
        setSaleInfo(
          `🔔 Venda Fechada! Cliente: ${s.customerName} · Produto: ${s.productName} · Valor: ${
            s.valueKz ? s.valueKz.toLocaleString("pt-AO") + " Kz" : "sob consulta"
          } — agendamento Kikolo disparado!`
        );
        toast({
          title: "🔔 Venda Fechada!",
          description: `${s.customerName} — ${s.productName}`,
        });
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha na Ana",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/10 bg-navy-light shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div>
            <p className="font-semibold">Simulador de cliente</p>
            <p className="text-xs text-white/40">
              Testa a Ana sem WhatsApp real — conversa como se fosses o cliente
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar simulador"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 border-b border-white/10 p-4">
          <div>
            <label className="mb-1 block text-xs text-white/50">Nome do cliente</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Maria Domingos"
              className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:border-gold/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">WhatsApp do cliente</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-gold/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ minHeight: 280 }}>
          {messages.length === 0 && (
            <div className="mt-10 text-center text-sm text-white/40">
              <p>Experimenta escrever:</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {["Quanto custa o iPhone 13 Pro Max?", "Entregam no Cazenga?", "Quero comprar"].map(
                  (ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setText(ex)}
                      className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:border-gold/50 hover:text-gold-light"
                    >
                      {ex}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "cliente" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "cliente"
                    ? "rounded-br-sm bg-gold text-navy-dark"
                    : "rounded-bl-sm bg-white/10 text-white"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/60">
                <Loader2 className="h-4 w-4 animate-spin" />
                Ana está a escrever...
              </div>
            </div>
          )}
          {saleInfo && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              {saleInfo}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="flex gap-2 border-t border-white/10 p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Escreve como cliente..."
            className="h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 focus:border-gold/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={send}
            disabled={loading || !text.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold text-navy-dark transition-all hover:bg-gold-light disabled:opacity-40"
            aria-label="Enviar mensagem"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {convId && (
          <button
            type="button"
            onClick={() => onConversation(convId)}
            className="border-t border-white/10 py-3 text-center text-sm font-medium text-gold-light hover:bg-white/5"
          >
            Abrir esta conversa no painel →
          </button>
        )}
      </div>
    </div>
  );
}
