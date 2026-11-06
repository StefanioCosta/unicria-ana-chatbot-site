import { z } from "zod";

export const RoleSchema = z.enum(["owner", "admin", "atendente", "viewer"]);
export type UserRole = z.infer<typeof RoleSchema>;

export const LoginSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").max(128),
});

export const ProductCreateSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(150),
  priceKz: z.number().nonnegative("Preço deve ser positivo").nullable().optional(),
  kikoloUrl: z.string().trim().url("URL Kikolo inválida").nullable().optional().or(z.literal("")),
  description: z.string().trim().max(1000).nullable().optional().or(z.literal("")),
  benefits: z.string().trim().max(1000).nullable().optional().or(z.literal("")),
  usage: z.string().trim().max(1000).nullable().optional().or(z.literal("")),
  image: z.string().trim().max(500).nullable().optional().or(z.literal("")),
  active: z.boolean().optional().default(true),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export const SettingsUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  botNumber: z.string().trim().regex(/^\+?[0-9\s-]{7,20}$/, "Número de telefone inválido").nullable().optional().or(z.literal("")),
  anaPrompt: z.string().max(8000).optional(),
  knowledge: z.string().max(8000).optional(),
  openHour: z.number().int().min(0).max(23).optional(),
  closeHour: z.number().int().min(1).max(24).optional(),
  botEnabled: z.boolean().optional(),
  whatsappProvider: z.enum(["cloud_api", "uazapi", "nenhum"]).optional(),
  whatsappPhoneId: z.string().trim().max(100).nullable().optional().or(z.literal("")),
  whatsappToken: z.string().trim().max(1000).nullable().optional().or(z.literal("")),
  whatsappVerifyTok: z.string().trim().min(6).max(100).optional(),
  uazapiUrl: z.string().trim().url().nullable().optional().or(z.literal("")),
  kikoloUrl: z.string().trim().url().nullable().optional().or(z.literal("")),
  kikoloEmail: z.string().trim().email().nullable().optional().or(z.literal("")),
  kikoloPassword: z.string().trim().max(255).nullable().optional().or(z.literal("")),
});

export const SaleUpdateSchema = z.object({
  status: z.enum(["fechada", "perdida", "agendada"]).optional(),
  lossReason: z.string().trim().max(500).nullable().optional(),
  valueKz: z.number().nonnegative().optional(),
});

export const ConversationPatchSchema = z.object({
  status: z.enum(["aberta", "agendada", "perdida", "humana"]),
  lossReason: z.string().trim().max(500).nullable().optional(),
});

export const MessageCreateSchema = z.object({
  text: z.string().trim().min(1, "Mensagem não pode estar vazia").max(4000),
});

