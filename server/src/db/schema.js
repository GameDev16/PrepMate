const {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  unique,
} = require("drizzle-orm/pg-core");

const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"),
  credits: integer("credits").default(3).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  preferredLanguage: varchar("preferred_language", { length: 50 }).default("English"),
  theme: varchar("theme", { length: 20 }).default("light"),
  learningPreferences: jsonb("learning_preferences"),
  avatarUrl: text("avatar_url"),
  googleId: varchar("google_id", { length: 255 }),
  tokenVersion: integer("token_version").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const verificationTokens = pgTable("verification_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const resetTokens = pgTable("reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const notebooks = pgTable("notebooks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  emoji: varchar("emoji", { length: 10 }).default(""),
  color: varchar("color", { length: 20 }).default("#6366f1"),
  description: text("description"),
  isPinned: boolean("is_pinned").default(false).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const pdfUploads = pgTable("pdf_uploads", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  notebookId: uuid("notebook_id").references(() => notebooks.id, { onDelete: "set null" }),
  fileName: varchar("file_name", { length: 500 }).notNull(),
  fileSize: integer("file_size").notNull(),
  pageCount: integer("page_count"),
  detectedLanguage: varchar("detected_language", { length: 50 }),
  extractedText: text("extracted_text"),
  status: varchar("status", { length: 50 }).default("uploaded").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const generatedNotes = pgTable("generated_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  pdfUploadId: uuid("pdf_upload_id").references(() => pdfUploads.id, { onDelete: "set null" }),
  // notebookId intentionally removed: this used to duplicate what the
  // notebook_notes join table already tracks. It was set once at generation
  // time and never updated when a note was added to / removed from a
  // notebook afterwards (that only ever touched notebook_notes), so it
  // silently went stale the moment anyone used the "manage notebooks" UI.
  // notebook_notes is the single source of truth for membership now.
  title: varchar("title", { length: 500 }).notNull(),
  templateType: varchar("template_type", { length: 100 }).notNull(),
  depthLevel: varchar("depth_level", { length: 50 }).default("standard"),
  persona: varchar("persona", { length: 100 }),
  outputLanguage: varchar("output_language", { length: 50 }).default("English"),
  content: text("content").notNull(),
  contentJson: jsonb("content_json"),
  diagrams: jsonb("diagrams"),
  charts: jsonb("charts"),
  flashcards: jsonb("flashcards"),
  mcqs: jsonb("mcqs"),
  subject: varchar("subject", { length: 255 }),
  isBookmarked: boolean("is_bookmarked").default(false).notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  customPrompt: text("custom_prompt"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const notebookNotes = pgTable("notebook_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  notebookId: uuid("notebook_id").references(() => notebooks.id, { onDelete: "cascade" }).notNull(),
  noteId: uuid("note_id").references(() => generatedNotes.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  unq: unique().on(t.notebookId, t.noteId),
}));

const subjects = pgTable("subjects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 20 }).default("#6366f1"),
  emoji: varchar("emoji", { length: 10 }).default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  amount: integer("amount").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const generationHistory = pgTable("generation_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  pdfUploadId: uuid("pdf_upload_id").references(() => pdfUploads.id, { onDelete: "set null" }),
  noteId: uuid("note_id").references(() => generatedNotes.id, { onDelete: "set null" }),
  templateType: varchar("template_type", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  creditsUsed: integer("credits_used").default(1),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  razorpayOrderId: varchar("razorpay_order_id", { length: 255 }).notNull(),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),
  amount: integer("amount").notNull(), // in paise
  creditsPurchased: integer("credits_purchased").notNull(),
  status: varchar("status", { length: 50 }).default("created").notNull(), // created | paid | failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

module.exports = {
  users,
  verificationTokens,
  resetTokens,
  notebooks,
  pdfUploads,
  generatedNotes,
  notebookNotes,
  subjects,
  transactions,
  generationHistory,
  payments,
};
