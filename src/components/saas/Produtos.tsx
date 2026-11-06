"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Loader2, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api, formatKz } from "./helpers";

interface Product {
  id: string;
  name: string;
  kikoloUrl: string | null;
  priceKz: number | null;
  description: string | null;
  benefits: string | null;
  usage: string | null;
  image: string | null;
  active: boolean;
}

const EMPTY = {
  name: "",
  kikoloUrl: "",
  priceKz: "",
  description: "",
  benefits: "",
  usage: "",
  image: "",
};

export function Produtos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await api<{ products: Product[] }>("/api/products");
    setProducts(data.products);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      kikoloUrl: p.kikoloUrl || "",
      priceKz: p.priceKz != null ? String(p.priceKz) : "",
      description: p.description || "",
      benefits: p.benefits || "",
      usage: p.usage || "",
      image: p.image || "",
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast({
        title: "Falta o nome",
        description: "Indica o nome do produto.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        priceKz: form.priceKz ? Number(form.priceKz) : null,
      };
      if (editing) {
        await api(`/api/products/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await api("/api/products", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      toast({ title: editing ? "Produto actualizado ✓" : "Produto adicionado ✓" });
      setDialogOpen(false);
      await load();
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha ao guardar",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Product) {
    if (!window.confirm(`Remover "${p.name}" do catálogo da Ana?`)) return;
    try {
      await api(`/api/products/${p.id}`, { method: "DELETE" });
      toast({ title: "Produto removido" });
      await load();
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha",
        variant: "destructive",
      });
    }
  }

  async function toggleActive(p: Product) {
    await api(`/api/products/${p.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !p.active }),
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-white/50">
            Estes são os produtos que a Ana conhece — adiciona os links da Kikolo
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-navy-dark transition-all hover:bg-gold-light"
        >
          <Plus className="h-4 w-4" />
          Adicionar produto
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-gold" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.id}
              className={`overflow-hidden rounded-2xl border bg-white/5 transition-all ${
                p.active ? "border-white/10" : "border-white/5 opacity-50"
              }`}
            >
              <div className="flex gap-4 p-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white">
                  {p.image ? (
                     
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl">
                      📦
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-semibold">{p.name}</p>
                  </div>
                  <p className="text-sm font-medium text-gold-light">
                    {p.priceKz != null ? formatKz(p.priceKz) : "Sob consulta"}
                  </p>
                  {p.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-white/50">
                      {p.description}
                    </p>
                  )}
                  {p.kikoloUrl && (
                    <a
                      href={p.kikoloUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-blue-300 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Link Kikolo
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => toggleActive(p)}
                  className="text-xs text-white/50 hover:text-white"
                >
                  {p.active ? "● Activo na Ana" : "○ Inactivo"}
                </button>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    aria-label={`Editar ${p.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p)}
                    aria-label={`Remover ${p.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-red-300/70 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog produto */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDialogOpen(false)} />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-navy-light p-6 shadow-2xl">
            <h2 className="mb-1 text-lg font-bold">
              {editing ? "Editar produto" : "Novo produto"}
            </h2>
            <p className="mb-5 text-xs text-white/40">
              A Ana usa estes dados para responder sobre o produto (preço,
              benefícios, como usar).
            </p>
            <div className="space-y-4">
              <Field label="Nome do produto *">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="ex: iPhone 13 Pro Max"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Preço (Kz) — vazio = sob consulta">
                  <input
                    type="number"
                    value={form.priceKz}
                    onChange={(e) => setForm({ ...form, priceKz: e.target.value })}
                    className="input"
                    placeholder="ex: 850000"
                  />
                </Field>
                <Field label="Link do produto na Kikolo">
                  <input
                    value={form.kikoloUrl}
                    onChange={(e) => setForm({ ...form, kikoloUrl: e.target.value })}
                    className="input"
                    placeholder="https://kikolo.online/produto..."
                  />
                </Field>
              </div>
              <Field label="Descrição / para que serve">
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input"
                  placeholder="ex: Smartphone Apple 128GB, ecrã 6.7&quot;"
                />
              </Field>
              <Field label="Benefícios (separados por vírgula)">
                <input
                  value={form.benefits}
                  onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                  className="input"
                  placeholder="ex: câmara profissional, bateria duradoura"
                />
              </Field>
              <Field label="Como usar (curto)">
                <input
                  value={form.usage}
                  onChange={(e) => setForm({ ...form, usage: e.target.value })}
                  className="input"
                  placeholder="ex: Carregar 2h antes do primeiro uso"
                />
              </Field>
              <Field label="Imagem (URL, opcional)">
                <input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="input"
                  placeholder="/images/photo_2.jpg"
                />
              </Field>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="flex h-11 flex-1 items-center justify-center rounded-xl border border-white/15 text-sm font-medium text-white/70 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gold text-sm font-semibold text-navy-dark hover:bg-gold-light disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar produto
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input {
          height: 2.75rem;
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          padding: 0 0.75rem;
          font-size: 0.875rem;
          color: #fff;
          outline: none;
        }
        .input:focus {
          border-color: rgba(201, 164, 92, 0.5);
        }
        .input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/60">
        {label}
      </label>
      {children}
    </div>
  );
}
