import 'server-only';
import {
  createDatabaseDeps,
  createDatabaseService,
} from '@kit/mcp-server/database';
import { resolveProjectRoot } from '@kit/mcp-server/resolve-root';

export interface DatabaseTable {
  name: string;
  schema: string;
  sourceFile: string;
  topic: string;
}

export interface DatabaseFunction {
  name: string;
  signature: string;
  returnType: string;
  purpose: string;
  source: string;
  isSecurityDefiner: boolean;
  isTrigger: boolean;
  category: string;
}

export interface DatabaseEnum {
  name: string;
  values: string[];
  sourceFile: string;
  category: string;
  description: string;
}

export interface SchemaFile {
  filename: string;
  topic: string;
  description: string;
  section?: string;
  tables?: string[];
  functions?: string[];
}

type DatabaseService = ReturnType<typeof createDatabaseService>;

// One service per process. The deps hold a lazily-opened postgres pool, so
// the instance is pinned to globalThis to survive HMR module re-evaluation
// in `next dev` without leaking a pool per reload.
const globalStore = globalThis as typeof globalThis & {
  __devToolDatabaseService?: DatabaseService;
};

export function getDatabaseService(): DatabaseService {
  globalStore.__devToolDatabaseService ??= createDatabaseService(
    createDatabaseDeps(resolveProjectRoot()),
  );

  return globalStore.__devToolDatabaseService;
}

export async function loadDatabaseToolsData() {
  const databaseService = getDatabaseService();

  try {
    const [
      schemaFilesResponse,
      tablesResponse,
      functionsResponse,
      enumsResponse,
    ] = await Promise.all([
      databaseService.getSchemaFiles(),
      databaseService.getTables(),
      databaseService.getFunctions(),
      databaseService.getEnums(),
    ]);

    const schemaFiles: SchemaFile[] = schemaFilesResponse.map((file) => ({
      filename: file.name,
      topic: file.topic || 'general',
      description: file.description || 'Database schema file',
      section: file.section,
      tables: file.tables,
      functions: file.functions,
    }));

    const tables: DatabaseTable[] = tablesResponse.tables.map((table) => ({
      name: table.name,
      schema: table.schema || 'public',
      sourceFile: table.sourceFile || 'unknown',
      topic: table.topic || 'general',
    }));

    const functions: DatabaseFunction[] = functionsResponse.functions.map(
      (func) => {
        const signature = `${func.name}(${func.parameters
          .map((param) => `${param.name} ${param.type}`)
          .join(', ')})`;

        return {
          name: func.name,
          signature,
          returnType: func.returnType || 'unknown',
          purpose: func.purpose || 'Database function',
          source: func.sourceFile || 'unknown',
          isSecurityDefiner: func.securityLevel === 'definer',
          isTrigger: func.returnType === 'trigger',
          category: categorizeFunction(func.name, func.returnType),
        };
      },
    );

    const enums: DatabaseEnum[] = Object.entries(enumsResponse).map(
      ([name, data]) => ({
        name,
        values: data.values || [],
        sourceFile: data.sourceFile || 'database',
        ...describeEnum(name),
      }),
    );

    return {
      schemaFiles,
      tables,
      functions,
      enums,
    };
  } catch (error) {
    console.error('Error loading database tools data:', error);

    return {
      schemaFiles: [],
      tables: [],
      functions: [],
      enums: [],
    };
  }
}

function categorizeFunction(name: string, returnType: string) {
  if (returnType === 'trigger') {
    return 'Triggers';
  }

  if (
    name.includes('nonce') ||
    name.includes('mfa') ||
    name.includes('auth') ||
    name.includes('aal2')
  ) {
    return 'Authentication';
  }

  if (
    name.includes('account') ||
    name.includes('team') ||
    name.includes('user')
  ) {
    return 'Accounts';
  }

  if (
    name.includes('permission') ||
    name.includes('role') ||
    name.includes('member')
  ) {
    return 'Permissions';
  }

  if (name.includes('invitation') || name.includes('invite')) {
    return 'Invitations';
  }

  if (
    name.includes('billing') ||
    name.includes('subscription') ||
    name.includes('payment') ||
    name.includes('order')
  ) {
    return 'Billing';
  }

  return 'Utilities';
}

function describeEnum(name: string) {
  if (name.includes('permission')) {
    return {
      category: 'Security & Permissions',
      description:
        'Application-level permissions that can be assigned to roles for granular access control',
    };
  }

  if (
    name.includes('billing') ||
    name.includes('payment') ||
    name.includes('subscription')
  ) {
    const descriptions: Record<string, string> = {
      billing_provider:
        'Supported payment processing providers for handling subscriptions and transactions',
      payment_status:
        'Status values for tracking the state of payment transactions',
      subscription_status:
        'Comprehensive status tracking for subscription lifecycle management',
      subscription_item_type:
        'Different pricing models for subscription line items and billing calculations',
    };

    return {
      category: 'Billing & Payments',
      description: descriptions[name] ?? `Database enum type: ${name}`,
    };
  }

  if (name.includes('notification')) {
    const descriptions: Record<string, string> = {
      notification_channel:
        'Available channels for delivering notifications to users',
      notification_type:
        'Classification types for different notification severity levels',
    };

    return {
      category: 'Notifications',
      description: descriptions[name] ?? `Database enum type: ${name}`,
    };
  }

  return {
    category: 'General',
    description: `Database enum type: ${name}`,
  };
}
