import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core"
import { ProjectTable } from "../project/project.sql"
import { Timestamps } from "../storage/schema.sql"
import type { ProjectID } from "../project/schema"
import type { SessionID, MessageID } from "../session/schema"

export const MemoryTable = sqliteTable(
  "memory",
  {
    id: text().primaryKey(),
    project_id: text()
      .$type<ProjectID>()
      .notNull()
      .references(() => ProjectTable.id, { onDelete: "cascade" }),
    session_id: text().$type<SessionID>(),
    message_id: text().$type<MessageID>(),
    type: text().notNull().$type<"user_preference" | "fact" | "context" | "summary">(),
    content: text().notNull(),
    importance: integer().notNull().default(0),
    embedding: text(),
    ...Timestamps,
  },
  (table) => [
    index("memory_project_idx").on(table.project_id),
    index("memory_session_idx").on(table.session_id),
    index("memory_type_idx").on(table.type),
    index("memory_importance_idx").on(table.importance),
  ],
)

export const MemoryConfigTable = sqliteTable("memory_config", {
  project_id: text()
    .$type<ProjectID>()
    .primaryKey()
    .references(() => ProjectTable.id, { onDelete: "cascade" }),
  enabled: integer().notNull().default(1),
  auto_capture: integer().notNull().default(1),
  max_memories: integer().notNull().default(100),
  min_importance: integer().notNull().default(5),
  ...Timestamps,
})
