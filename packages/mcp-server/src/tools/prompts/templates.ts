export interface PromptArgument {
  name: string;
  description: string;
  required: boolean;
  type: 'string' | 'text' | 'enum';
  options?: string[];
}

export interface PromptTemplate {
  name: string;
  title: string;
  description: string;
  category:
    | 'development'
    | 'database'
    | 'testing'
    | 'architecture'
    | 'debugging';
  arguments: PromptArgument[];
  template: string;
  examples?: string[];
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    name: 'supabase_rls_policy_design',
    title: 'Supabase RLS Policy Design',
    description:
      'Design Row Level Security policies for Makerkit multi-tenant architecture',
    category: 'database',
    arguments: [
      {
        name: 'table_name',
        description: 'Table that needs RLS policies',
        required: true,
        type: 'string',
      },
      {
        name: 'access_patterns',
        description: 'Who should access this data and how',
        required: true,
        type: 'text',
      },
      {
        name: 'data_sensitivity',
        description: 'Sensitivity level of the data',
        required: true,
        type: 'enum',
        options: [
          'public',
          'account-restricted',
          'role-restricted',
          'owner-only',
        ],
      },
    ],
    template: `Design RLS policies for table: {{table_name}}

**Access Requirements:** {{access_patterns}}
**Data Sensitivity:** {{data_sensitivity}}

**Please provide:**

**1. Policy Design:**
- Complete RLS policy definitions (SELECT, INSERT, UPDATE, DELETE)
- Use of existing Makerkit functions: has_role_on_account, has_permission
- Account-based access control following multi-tenant patterns

**2. Security Analysis:**
- How policies enforce account boundaries
- Role-based access control integration
- Prevention of data leakage between accounts

**3. Performance Considerations:**
- Index requirements for efficient policy execution
- Query optimization with RLS overhead
- Use of SECURITY DEFINER functions where needed

**4. Policy SQL:**
\`\`\`sql
-- Enable RLS
ALTER TABLE {{table_name}} ENABLE ROW LEVEL SECURITY;

-- Your policies here
\`\`\`

**5. Testing Strategy:**
- Test cases for different user roles and permissions
- Verification of account isolation
- Performance testing with large datasets

**Makerkit RLS Standards:**
- All user data must respect account boundaries
- Use existing permission functions for consistency
- Personal accounts: auth.users.id = accounts.id
- Team accounts: check via accounts_memberships table
- Leverage roles and role_permissions for granular access`,
    examples: [
      'Design RLS for a documents table',
      'Create policies for team collaboration data',
      'Set up RLS for billing and subscription data',
    ],
  },
];
