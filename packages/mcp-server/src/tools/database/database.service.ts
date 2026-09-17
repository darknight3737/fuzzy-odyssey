import { assertSafeFileName } from '../../lib/safe-file-name';
import type {
  DatabaseFunction,
  EnumInfo,
  GetAllEnumsOutput,
  GetDatabaseFunctionsOutput,
  GetDatabaseSummaryOutput,
  GetDatabaseTablesOutput,
  GetEnumInfoInput,
  GetFunctionDetailsInput,
  GetSchemaBySectionInput,
  GetSchemaBySectionOutput,
  GetSchemaContentInput,
  GetSchemaContentOutput,
  GetSchemaFilesOutput,
  GetSchemasByTopicInput,
  GetSchemasByTopicOutput,
  GetTableInfoInput,
  ProjectTable,
  SchemaFile,
  SearchDatabaseFunctionsInput,
  SearchDatabaseFunctionsOutput,
  TableColumn,
  TableForeignKey,
  TableIndex,
  TableInfo,
} from './schema';
import {
  KNOWN_TOPICS,
  derivePurpose,
  determineTopic,
  extractDependencies,
  extractFunctionNames,
  extractFunctionsFromContent,
  extractSectionHeader,
  extractTableDefinition,
  extractTableNames,
  parseColumns,
  parseEnums,
  parseForeignKeys,
  parseIndexes,
  parseParameterList,
} from './sql-parsers';

import { join } from 'node:path';

type Row = Record<string, unknown>;

export interface DatabaseDeps {
  rootPath: string;
  readdir(path: string): Promise<string[]>;
  readFile(path: string): Promise<string>;
  stat(path: string): Promise<{ mtime: Date }>;
  /**
   * Run a parameterised query against the local database. Implementations
   * should reject quickly when the database is unreachable; every caller
   * falls back to schema-file parsing.
   */
  query(text: string, params?: SqlParam[]): Promise<Row[]>;
  /** Release any pooled connections. Safe to call when nothing is open. */
  close?(): Promise<void>;
}

export type SqlParam = string | number | boolean | null;

const SCHEMA_FILES_NOTE =
  'Schema files under apps/web/supabase/schemas are the source of truth for the current database state. Prefer them over migrations.';

export function createDatabaseService(deps: DatabaseDeps) {
  return new DatabaseService(deps);
}

export class DatabaseService {
  constructor(private readonly deps: DatabaseDeps) {}

  get schemasDir() {
    return join(this.deps.rootPath, 'apps', 'web', 'supabase', 'schemas');
  }

  // Schema files ------------------------------------------------------------

  async getSchemaFiles(): Promise<SchemaFile[]> {
    let names: string[];

    try {
      names = await this.deps.readdir(this.schemasDir);
    } catch {
      return [];
    }

    const files: SchemaFile[] = [];

    for (const name of names.filter((file) => file.endsWith('.sql'))) {
      const path = join(this.schemasDir, name);
      const content = await this.deps.readFile(path);
      const { mtime } = await this.deps.stat(path);
      const header = extractSectionHeader(content);

      files.push({
        name,
        path,
        section: header.section,
        description: header.description,
        lastModified: mtime.toISOString(),
        tables: extractTableNames(content),
        functions: extractFunctionNames(content),
        dependencies: extractDependencies(content),
        topic: determineTopic(name, content),
      });
    }

    return files.sort((a, b) => a.name.localeCompare(b.name));
  }

  async listSchemaFiles(): Promise<GetSchemaFilesOutput> {
    const files = await this.getSchemaFiles();

    return {
      files,
      total: files.length,
      schemas_dir: this.schemasDir,
      note: SCHEMA_FILES_NOTE,
    };
  }

  async getSchemaContent(
    input: GetSchemaContentInput,
  ): Promise<GetSchemaContentOutput> {
    const fileName = assertSafeFileName(input.fileName, 'schema file name');
    const path = join(this.schemasDir, fileName);

    try {
      return { fileName, path, content: await this.deps.readFile(path) };
    } catch {
      throw new Error(`Schema file "${fileName}" not found`);
    }
  }

  async getSchemasByTopic(
    input: GetSchemasByTopicInput,
  ): Promise<GetSchemasByTopicOutput> {
    const term = input.topic.toLowerCase();

    const files = (await this.getSchemaFiles()).filter((file) =>
      [file.topic, file.section, file.description, file.name].some((field) =>
        field.toLowerCase().includes(term),
      ),
    );

    return {
      topic: input.topic,
      files,
      total: files.length,
      available_topics: KNOWN_TOPICS,
    };
  }

  async getSchemaBySection(
    input: GetSchemaBySectionInput,
  ): Promise<GetSchemaBySectionOutput> {
    const files = await this.getSchemaFiles();
    const term = input.section.toLowerCase();

    return {
      section: input.section,
      file: files.find((file) => file.section.toLowerCase() === term) ?? null,
      available_sections: files.map((file) => file.section),
    };
  }

  // Functions ---------------------------------------------------------------

  async getFunctions(): Promise<GetDatabaseFunctionsOutput> {
    const schemaFiles = await this.getSchemaFiles();

    const rows = await this.tryQuery(`
      SELECT
        p.proname AS function_name,
        n.nspname AS schema_name,
        pg_get_function_result(p.oid) AS return_type,
        pg_get_function_arguments(p.oid) AS parameters,
        p.prosecdef AS is_definer,
        obj_description(p.oid, 'pg_proc') AS description
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname IN ('public', 'kit')
        AND p.prokind = 'f'
      ORDER BY n.nspname, p.proname
    `);

    if (rows) {
      const fileMapping = buildNameMapping(schemaFiles, 'functions');

      return {
        source: 'database',
        total: rows.length,
        functions: rows.map((row) => {
          const name = asString(row.function_name);
          const schema = asString(row.schema_name);
          const description = asString(
            row.description,
            'No description available',
          );

          return {
            name,
            schema,
            returnType: asString(row.return_type, 'unknown'),
            parameters: parseParameterList(asString(row.parameters)),
            securityLevel: row.is_definer ? 'definer' : 'invoker',
            description,
            purpose: derivePurpose(description, name),
            sourceFile: fileMapping.get(`${schema}.${name}`) ?? 'unknown',
          };
        }),
      };
    }

    const functions: DatabaseFunction[] = [];

    for (const file of schemaFiles) {
      const content = await this.deps.readFile(file.path);
      functions.push(...extractFunctionsFromContent(content, file.name));
    }

    functions.sort((a, b) => a.name.localeCompare(b.name));

    return { source: 'schema_files', total: functions.length, functions };
  }

  async getFunctionDetails(
    input: GetFunctionDetailsInput,
  ): Promise<DatabaseFunction> {
    const { functions } = await this.getFunctions();
    const parts = input.functionName.split('.');
    const name = parts[parts.length - 1]!;
    const schema = parts.length > 1 ? parts[0]! : null;

    const match = schema
      ? functions.find((fn) => fn.name === name && fn.schema === schema)
      : // Without a schema prefix prefer public, then anything else.
        (functions.find((fn) => fn.name === name && fn.schema === 'public') ??
        functions.find((fn) => fn.name === name));

    if (!match) {
      throw new Error(`Function "${input.functionName}" not found`);
    }

    return match;
  }

  async searchFunctions(
    input: SearchDatabaseFunctionsInput,
  ): Promise<SearchDatabaseFunctionsOutput> {
    const { functions } = await this.getFunctions();
    const term = input.query.toLowerCase();
    const parts = term.split('.');
    const nameTerm = parts[parts.length - 1]!;
    const schemaTerm = parts.length > 1 ? parts[0]! : null;

    const matches = functions.filter((fn) => {
      if (schemaTerm) {
        return (
          fn.schema.toLowerCase() === schemaTerm &&
          fn.name.toLowerCase().includes(nameTerm)
        );
      }

      return [fn.name, fn.description, fn.purpose, fn.returnType].some(
        (field) => field.toLowerCase().includes(term),
      );
    });

    return { query: input.query, functions: matches, total: matches.length };
  }

  // Tables ------------------------------------------------------------------

  async getTables(): Promise<GetDatabaseTablesOutput> {
    const schemaFiles = await this.getSchemaFiles();
    const fileMapping = buildNameMapping(schemaFiles, 'tables');

    const rows = await this.tryQuery(`
      SELECT t.table_name, t.table_schema
      FROM information_schema.tables t
      WHERE t.table_schema IN ('public', 'kit')
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_schema, t.table_name
    `);

    const tables: ProjectTable[] = rows
      ? rows.map((row) => {
          const name = asString(row.table_name);
          const schema = asString(row.table_schema, 'public');

          return {
            name,
            schema,
            sourceFile:
              fileMapping.get(`${schema}.${name}`) ??
              fileMapping.get(name) ??
              'database',
            topic: topicForTable(name, schemaFiles),
          };
        })
      : schemaFiles.flatMap((file) =>
          file.tables.map((name) => ({
            name,
            schema: 'public',
            sourceFile: file.name,
            topic: file.topic,
          })),
        );

    return { tables, total: tables.length };
  }

  async getTableInfo(input: GetTableInfoInput): Promise<TableInfo> {
    const schema = input.schema || 'public';
    const schemaFiles = await this.getSchemaFiles();

    for (const file of schemaFiles) {
      const content = await this.deps.readFile(file.path);
      const definition = extractTableDefinition(
        content,
        schema,
        input.tableName,
      );

      if (!definition) continue;

      const [liveColumns, liveForeignKeys, liveIndexes] = await Promise.all([
        this.getColumnsFromDb(schema, input.tableName),
        this.getForeignKeysFromDb(schema, input.tableName),
        this.getIndexesFromDb(schema, input.tableName),
      ]);

      const fromDb = liveColumns !== null;

      return {
        name: input.tableName,
        schema,
        sourceFile: file.name,
        topic: file.topic,
        columns: liveColumns ?? parseColumns(definition),
        foreignKeys: liveForeignKeys ?? parseForeignKeys(definition),
        indexes: liveIndexes ?? parseIndexes(content, input.tableName),
        createStatement: definition,
        source: fromDb ? 'database' : 'schema_files',
      };
    }

    throw new Error(
      `Table ${schema}.${input.tableName} not found in schema files`,
    );
  }

  // Enums -------------------------------------------------------------------

  async getEnums(): Promise<Record<string, EnumInfo>> {
    const rows = await this.tryQuery(`
      SELECT
        t.typname AS enum_name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname
    `);

    if (rows && rows.length > 0) {
      const enums: Record<string, EnumInfo> = {};

      for (const row of rows) {
        const name = asString(row.enum_name);

        enums[name] = {
          name,
          values: Array.isArray(row.enum_values)
            ? row.enum_values.map(String)
            : [],
          sourceFile: 'database',
        };
      }

      return enums;
    }

    const enums: Record<string, EnumInfo> = {};

    for (const file of await this.getSchemaFiles()) {
      const content = await this.deps.readFile(file.path);
      Object.assign(enums, parseEnums(content, file.name));
    }

    return enums;
  }

  async listEnums(): Promise<GetAllEnumsOutput> {
    const enums = Object.values(await this.getEnums());

    return { enums, total: enums.length };
  }

  async getEnumInfo(input: GetEnumInfoInput): Promise<EnumInfo> {
    const enums = await this.getEnums();
    const match = Object.hasOwn(enums, input.enumName)
      ? enums[input.enumName]
      : undefined;

    if (!match) {
      throw new Error(
        `Enum "${input.enumName}" not found. Available enums: ${Object.keys(enums).join(', ') || 'none'}`,
      );
    }

    return match;
  }

  // Summary -----------------------------------------------------------------

  async getSummary(): Promise<GetDatabaseSummaryOutput> {
    const [{ tables }, enums, { functions }] = await Promise.all([
      this.getTables(),
      this.getEnums(),
      this.getFunctions(),
    ]);

    const tablesByTopic: Record<string, string[]> = {};

    for (const table of tables) {
      (tablesByTopic[table.topic] ??= []).push(table.name);
    }

    return {
      overview: {
        totalTables: tables.length,
        totalEnums: Object.keys(enums).length,
        totalFunctions: functions.length,
      },
      tables,
      enums: Object.values(enums),
      functions: functions.map(({ name, schema, purpose, sourceFile }) => ({
        name,
        schema,
        purpose,
        sourceFile,
      })),
      tablesByTopic,
    };
  }

  // Live-database helpers ---------------------------------------------------

  private async getColumnsFromDb(
    schema: string,
    tableName: string,
  ): Promise<TableColumn[] | null> {
    const rows = await this.tryQuery(
      `
      SELECT
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        pk.column_name IS NOT NULL AS is_primary_key,
        fk.column_name IS NOT NULL AS is_foreign_key,
        fk.foreign_table_name AS referenced_table,
        fk.foreign_column_name AS referenced_column
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT ku.table_name, ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name
         AND tc.table_schema = ku.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = $1
      ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
      LEFT JOIN (
        SELECT ku.table_name, ku.column_name,
               ccu.table_name AS foreign_table_name,
               ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name
         AND tc.table_schema = ku.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
         AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = $1
      ) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
      WHERE c.table_schema = $1 AND c.table_name = $2
      ORDER BY c.ordinal_position
    `,
      [schema, tableName],
    );

    if (!rows || rows.length === 0) return null;

    return rows.map((row) => ({
      name: asString(row.column_name),
      type: asString(row.data_type),
      nullable: row.is_nullable === 'YES',
      defaultValue: optionalString(row.column_default),
      isPrimaryKey: Boolean(row.is_primary_key),
      isForeignKey: Boolean(row.is_foreign_key),
      referencedTable: optionalString(row.referenced_table),
      referencedColumn: optionalString(row.referenced_column),
    }));
  }

  private async getForeignKeysFromDb(
    schema: string,
    tableName: string,
  ): Promise<TableForeignKey[] | null> {
    const rows = await this.tryQuery(
      `
      SELECT
        tc.constraint_name,
        string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position) AS columns,
        ccu.table_name AS foreign_table_name,
        string_agg(ccu.column_name, ',' ORDER BY kcu.ordinal_position) AS foreign_columns,
        rc.delete_rule,
        rc.update_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
       AND tc.table_schema = rc.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1
        AND tc.table_name = $2
      GROUP BY tc.constraint_name, ccu.table_name, rc.delete_rule, rc.update_rule
    `,
      [schema, tableName],
    );

    if (!rows) return null;

    return rows.map((row) => ({
      name: asString(row.constraint_name),
      columns: asString(row.columns).split(','),
      referencedTable: asString(row.foreign_table_name),
      referencedColumns: asString(row.foreign_columns).split(','),
      onDelete: optionalString(row.delete_rule),
      onUpdate: optionalString(row.update_rule),
    }));
  }

  private async getIndexesFromDb(
    schema: string,
    tableName: string,
  ): Promise<TableIndex[] | null> {
    const rows = await this.tryQuery(
      `
      SELECT
        i.indexname,
        i.indexdef,
        ix.indisunique AS is_unique,
        am.amname AS method,
        string_agg(a.attname, ',' ORDER BY a.attnum) AS columns
      FROM pg_indexes i
      JOIN pg_class c ON c.relname = i.tablename
      JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = i.schemaname
      JOIN pg_class ic ON ic.relname = i.indexname AND ic.relnamespace = n.oid
      JOIN pg_index ix ON ix.indexrelid = ic.oid
      JOIN pg_am am ON am.oid = ic.relam
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(ix.indkey)
      WHERE n.nspname = $1
        AND i.tablename = $2
        AND i.indexname NOT LIKE '%_pkey'
      GROUP BY i.indexname, i.indexdef, ix.indisunique, am.amname
      ORDER BY i.indexname
    `,
      [schema, tableName],
    );

    if (!rows) return null;

    return rows.map((row) => ({
      name: asString(row.indexname),
      columns: asString(row.columns).split(','),
      unique: Boolean(row.is_unique),
      type: asString(row.method, 'btree'),
      definition: asString(row.indexdef),
    }));
  }

  /** Returns null when the database is unreachable or the query fails. */
  private async tryQuery(text: string, params: SqlParam[] = []) {
    try {
      return await this.deps.query(text, params);
    } catch {
      return null;
    }
  }
}

function buildNameMapping(
  schemaFiles: SchemaFile[],
  key: 'tables' | 'functions',
) {
  const mapping = new Map<string, string>();

  for (const file of schemaFiles) {
    for (const name of file[key]) {
      mapping.set(`public.${name}`, file.name);
      mapping.set(`kit.${name}`, file.name);
      mapping.set(name, file.name);
    }
  }

  return mapping;
}

function topicForTable(tableName: string, schemaFiles: SchemaFile[]) {
  return (
    schemaFiles.find((file) => file.tables.includes(tableName))?.topic ??
    'general'
  );
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;

  return String(value);
}

function optionalString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;

  return String(value);
}
