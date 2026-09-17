import type {
  DatabaseFunction,
  EnumInfo,
  FunctionParameter,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from './schema';

/**
 * Regex-based extraction from declarative schema files. These are fallbacks
 * for when the local database is not reachable, and metadata helpers for
 * mapping live objects back to their source file. They are intentionally
 * forgiving rather than a full SQL parser.
 */

const IDENTIFIER = '[a-zA-Z_][a-zA-Z0-9_]*';

export function extractTableNames(content: string): string[] {
  return uniqueTrailingIdentifiers(
    content.match(
      new RegExp(
        `create\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?(?:public\\.)?(${IDENTIFIER})`,
        'gi',
      ),
    ),
  );
}

export function extractFunctionNames(content: string): string[] {
  return uniqueTrailingIdentifiers(
    content.match(
      new RegExp(
        `create\\s+(?:or\\s+replace\\s+)?function\\s+(?:public\\.|kit\\.)?(${IDENTIFIER})`,
        'gi',
      ),
    ),
  );
}

export function extractDependencies(content: string): string[] {
  return uniqueTrailingIdentifiers(
    content.match(
      new RegExp(`references\\s+(?:${IDENTIFIER}\\.)?(${IDENTIFIER})`, 'gi'),
    ),
  ).filter((name) => name !== 'users');
}

function uniqueTrailingIdentifiers(matches: RegExpMatchArray | null) {
  if (!matches) return [];

  const names = matches
    .map((match) => match.match(new RegExp(`(${IDENTIFIER})$`))?.[1] ?? '')
    .filter(Boolean);

  return [...new Set(names)];
}

/**
 * Headers look like:
 *   * Section: Accounts
 *   * We create the schema for the accounts. ...
 * The description is the first prose line after the Section line.
 */
export function extractSectionHeader(content: string) {
  const lines = content.split('\n');
  const sectionIndex = lines.findIndex((line) => /\*\s*Section:/i.test(line));

  if (sectionIndex === -1) {
    return { section: 'Unknown', description: 'No description available' };
  }

  const section =
    lines[sectionIndex]!.match(/Section:\s*([^\n*]+)/i)?.[1]?.trim() ||
    'Unknown';

  let description = 'No description available';

  for (const line of lines.slice(sectionIndex + 1, sectionIndex + 6)) {
    const text = line.replace(/^\s*\*+\s?/, '').trim();

    if (text.length === 0 || /^[-=*/]+$/.test(text)) continue;

    description = text;
    break;
  }

  return { section, description };
}

export function extractTableDefinition(
  content: string,
  schema: string,
  tableName: string,
): string | null {
  const tableRegex = new RegExp(
    `create\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?(?:${escapeRegex(schema)}\\.)?${escapeRegex(tableName)}\\s*\\([^;]*?\\);`,
    'gis',
  );

  return content.match(tableRegex)?.[0] ?? null;
}

export function parseColumns(tableDefinition: string): TableColumn[] {
  const contentMatch = tableDefinition.match(/\(([\s\S]*)\)/);

  if (!contentMatch) return [];

  const columns: TableColumn[] = [];

  const lines = contentMatch[1]!
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (
      lower.startsWith('constraint') ||
      lower.startsWith('primary key') ||
      lower.startsWith('foreign key') ||
      lower.startsWith('unique') ||
      lower.startsWith('check')
    ) {
      continue;
    }

    const columnMatch = line.match(
      new RegExp(`^(${IDENTIFIER})\\s+([^,\\s]+)(?:\\s+(.*))?`),
    );

    if (!columnMatch) continue;

    const [, name, type, constraints = ''] = columnMatch;
    const lowerConstraints = constraints.toLowerCase();

    columns.push({
      name: name!,
      type: type!.replace(/,$/, ''),
      nullable:
        !lowerConstraints.includes('not null') &&
        !lowerConstraints.includes('primary key'),
      defaultValue: constraints.match(/default\s+([^,\s]+)/i)?.[1],
      isPrimaryKey: lowerConstraints.includes('primary key'),
      isForeignKey: lowerConstraints.includes('references'),
      referencedTable: constraints.match(
        new RegExp(`references\\s+(?:public\\.)?(${IDENTIFIER})`, 'i'),
      )?.[1],
      referencedColumn: constraints
        .match(
          new RegExp(
            `references\\s+(?:public\\.)?${IDENTIFIER}\\s*\\(([^)]+)\\)`,
            'i',
          ),
        )?.[1]
        ?.trim(),
    });
  }

  return columns;
}

export function parseForeignKeys(tableDefinition: string): TableForeignKey[] {
  const foreignKeys: TableForeignKey[] = [];

  const fkRegex = new RegExp(
    `foreign\\s+key\\s*\\(([^)]+)\\)\\s*references\\s+(?:public\\.)?(${IDENTIFIER})\\s*\\(([^)]+)\\)(?:\\s+on\\s+delete\\s+([a-z\\s]+?))?(?:\\s+on\\s+update\\s+([a-z\\s]+?))?(?=,|\\)|$)`,
    'gi',
  );

  let match: RegExpExecArray | null;

  while ((match = fkRegex.exec(tableDefinition)) !== null) {
    const [, columns, referencedTable, referencedColumns, onDelete, onUpdate] =
      match;

    const columnList = splitList(columns!);

    foreignKeys.push({
      name: `fk_${referencedTable}_${columnList.join('_')}`,
      columns: columnList,
      referencedTable: referencedTable!,
      referencedColumns: splitList(referencedColumns!),
      onDelete: onDelete?.trim(),
      onUpdate: onUpdate?.trim(),
    });
  }

  return foreignKeys;
}

export function parseIndexes(content: string, tableName: string): TableIndex[] {
  const indexes: TableIndex[] = [];

  const indexRegex = new RegExp(
    `create\\s+(unique\\s+)?index\\s+(?:if\\s+not\\s+exists\\s+)?(${IDENTIFIER})\\s+on\\s+(?:public\\.)?${escapeRegex(tableName)}\\s*(?:using\\s+(\\w+)\\s*)?\\(([^)]+)\\)`,
    'gi',
  );

  let match: RegExpExecArray | null;

  while ((match = indexRegex.exec(content)) !== null) {
    const [fullMatch, unique, indexName, method, columns] = match;

    indexes.push({
      name: indexName!,
      columns: splitList(columns!),
      unique: Boolean(unique),
      type: method?.toLowerCase() ?? 'btree',
      definition: fullMatch,
    });
  }

  return indexes;
}

export function parseEnums(
  content: string,
  sourceFile: string,
): Record<string, EnumInfo> {
  const enums: Record<string, EnumInfo> = {};

  const enumRegex = new RegExp(
    `create\\s+type\\s+(?:public\\.)?(${IDENTIFIER})\\s+as\\s+enum\\s*\\(([^)]+)\\)`,
    'gi',
  );

  let match: RegExpExecArray | null;

  while ((match = enumRegex.exec(content)) !== null) {
    const [, enumName, values] = match;

    enums[enumName!] = {
      name: enumName!,
      values: splitList(values!).map((value) => value.replace(/['"]/g, '')),
      sourceFile,
    };
  }

  return enums;
}

export function extractFunctionsFromContent(
  content: string,
  sourceFile: string,
): DatabaseFunction[] {
  const functions: DatabaseFunction[] = [];

  // Capture everything between "returns" and the body delimiter, then pick
  // the header apart: modifiers may sit on the same line or on their own.
  const functionRegex =
    /create\s+(?:or\s+replace\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_.]*)\s*\(([^)]*)\)\s*returns?\s+([^$]*?)\$\$([^$]*)\$\$/gi;

  let match: RegExpExecArray | null;

  while ((match = functionRegex.exec(content)) !== null) {
    const [, fullName, params, header, body] = match;

    if (!fullName || !header) continue;

    const returnType = header
      .split(
        /\n|\s+(?:language|security|as|set|stable|volatile|immutable|strict|parallel)\b/i,
      )[0]!
      .trim();

    if (!returnType) continue;

    const securityLevel = /security\s+definer/i.test(header)
      ? 'definer'
      : 'invoker';

    const nameParts = fullName.split('.');
    const functionName = nameParts[nameParts.length - 1]!;
    const schema = nameParts.length > 1 ? nameParts[0]! : 'public';

    const before = content.substring(
      Math.max(0, match.index - 500),
      match.index,
    );

    const description = extractDescription(before, body ?? '');

    functions.push({
      name: functionName,
      schema,
      parameters: parseParameterList(params ?? ''),
      returnType: returnType.trim(),
      description,
      purpose: derivePurpose(description, functionName),
      securityLevel,
      sourceFile,
    });
  }

  return functions;
}

/**
 * Parse `name type [DEFAULT value]` lists as produced by both schema files and
 * `pg_get_function_arguments`. IN/OUT/INOUT markers are ignored.
 */
export function parseParameterList(paramString: string): FunctionParameter[] {
  if (!paramString.trim()) return [];

  const parameters: FunctionParameter[] = [];

  for (const raw of splitList(paramString)) {
    const match = raw.match(
      new RegExp(
        `^(?:(?:IN|OUT|INOUT|VARIADIC)\\s+)?(${IDENTIFIER})\\s+([^=]+?)(?:\\s+DEFAULT\\s+(.+))?$`,
        'i',
      ),
    );

    if (match) {
      const [, name, type, defaultValue] = match;

      parameters.push({
        name: name!.trim(),
        type: type!.trim(),
        defaultValue: defaultValue?.trim(),
      });

      continue;
    }

    const parts = raw.split(/\s+/);

    if (parts.length >= 2) {
      parameters.push({
        name: parts[0] ?? 'unnamed',
        type: parts.slice(1).join(' ').trim(),
      });
    }
  }

  return parameters;
}

function extractDescription(beforeFunction: string, body: string): string {
  const commentMatch = beforeFunction.match(/--\s*(.+?)(?:\n|$)/);

  if (commentMatch?.[1]) {
    return commentMatch[1].trim();
  }

  const bodyCommentMatch = body.match(/--\s*(.+?)(?:\n|$)/);

  if (bodyCommentMatch?.[1]) {
    return bodyCommentMatch[1].trim();
  }

  return 'No description available';
}

const PURPOSE_MAP: Record<string, string> = {
  create_nonce: 'Create one-time authentication tokens for secure operations',
  verify_nonce: 'Verify and consume one-time tokens for authentication',
  is_mfa_compliant: 'Check if user has completed multi-factor authentication',
  team_account_workspace:
    'Load comprehensive team account data with permissions',
  has_role_on_account: 'Check if user has access to a specific account',
  has_permission: 'Verify user permissions for specific account operations',
  get_user_billing_account: 'Retrieve billing account information for user',
  create_team_account: 'Create new team account with proper permissions',
  invite_user_to_account: 'Send invitation to join team account',
  accept_invitation: 'Process and accept team invitation',
  transfer_account_ownership: 'Transfer account ownership between users',
  delete_account: 'Safely delete account and associated data',
};

export function derivePurpose(description: string, functionName: string) {
  const known = PURPOSE_MAP[functionName];

  if (known) return known;

  const name = functionName.toLowerCase();

  if (name.includes('create')) return 'Create database records with validation';
  if (name.includes('delete') || name.includes('remove'))
    return 'Delete records with proper authorization';
  if (name.includes('update') || name.includes('modify'))
    return 'Update existing records with validation';
  if (name.includes('get') || name.includes('fetch'))
    return 'Retrieve data with access control';
  if (name.includes('verify') || name.includes('validate'))
    return 'Validate data or permissions';
  if (name.includes('check') || name.includes('is_'))
    return 'Check conditions or permissions';
  if (name.includes('invite')) return 'Handle user invitations and access';
  if (name.includes('transfer'))
    return 'Transfer ownership or data between entities';

  return `Custom database function: ${description}`;
}

const FILE_TOPIC_MAP: Record<string, string> = {
  '00-privileges.sql': 'security',
  '01-enums.sql': 'types',
  '02-config.sql': 'configuration',
  '03-accounts.sql': 'accounts',
  '04-roles.sql': 'permissions',
  '05-memberships.sql': 'teams',
  '06-roles-permissions.sql': 'permissions',
  '07-invitations.sql': 'teams',
  '08-billing-customers.sql': 'billing',
  '09-subscriptions.sql': 'billing',
  '10-orders.sql': 'billing',
  '11-notifications.sql': 'notifications',
  '12-one-time-tokens.sql': 'auth',
  '13-mfa.sql': 'auth',
  '14-super-admin.sql': 'admin',
  '15-account-views.sql': 'accounts',
  '16-storage.sql': 'storage',
  '17-roles-seed.sql': 'permissions',
};

export const KNOWN_TOPICS = [
  'accounts',
  'auth',
  'billing',
  'permissions',
  'teams',
  'notifications',
  'storage',
  'admin',
  'security',
  'types',
  'configuration',
];

export function determineTopic(fileName: string, content: string): string {
  const known = FILE_TOPIC_MAP[fileName];

  if (known) return known;

  const lower = content.toLowerCase();

  if (lower.includes('account') && lower.includes('team')) return 'accounts';
  if (lower.includes('subscription') || lower.includes('billing'))
    return 'billing';
  if (
    lower.includes('auth') ||
    lower.includes('mfa') ||
    lower.includes('token')
  )
    return 'auth';
  if (lower.includes('permission') || lower.includes('role'))
    return 'permissions';
  if (lower.includes('notification') || lower.includes('email'))
    return 'notifications';
  if (lower.includes('storage') || lower.includes('bucket')) return 'storage';
  if (lower.includes('admin') || lower.includes('super')) return 'admin';

  return 'general';
}

function splitList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
