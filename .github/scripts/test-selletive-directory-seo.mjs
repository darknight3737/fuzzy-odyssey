import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// CI-only tests: no application server or database writes are needed.
const require = createRequire(
  new URL('../../apps/web/package.json', import.meta.url),
);
const { loadBindings, transformSync } = require('next/dist/build/swc');
await loadBindings();
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(path, dependencies = {}) {
  const source = readFileSync(
    new URL(`../../apps/web/${path}`, import.meta.url),
    'utf8',
  );
  const { code } = transformSync(source, {
    filename: path,
    jsc: {
      parser: { syntax: 'typescript', tsx: path.endsWith('.tsx') },
      target: 'es2022',
      transform: { react: { runtime: 'automatic' } },
    },
    module: { type: 'commonjs', noInterop: true },
  });
  const module = { exports: {} };
  new Function('require', 'exports', 'module', code)(
    (name) => (name in dependencies ? dependencies[name] : require(name)),
    module.exports,
    module,
  );
  return module.exports;
}

const visibility = load('lib/categories/visibility.ts');
const tree = [
  { id: 'root', parent_id: null },
  { id: 'child', parent_id: 'root' },
  { id: 'leaf', parent_id: 'child' },
  { id: 'empty', parent_id: null },
  { id: 'orphan', parent_id: 'inactive' },
];
assert.deepEqual(
  [...visibility.getPopulatedCategoryIds(tree, ['leaf', 'inactive'])].sort(),
  ['child', 'leaf', 'root'],
);
assert.deepEqual([...visibility.getPopulatedCategoryIds(tree, [])], []);
assert.deepEqual([...visibility.getCategoryTreeIds('root', tree)].sort(), [
  'child',
  'leaf',
  'root',
]);
const cycle = [
  { id: 'a', parent_id: 'b' },
  { id: 'b', parent_id: 'a' },
];
assert.equal(visibility.getPopulatedCategoryIds(cycle, ['a']).size, 2);
assert.equal(visibility.getCategoryTreeIds('a', cycle).size, 2);

// Exercise pagination beyond PostgREST's default 1,000-row response limit.
const categories = [...tree].map((row) => ({
  ...row,
  slug: row.id,
  updated_at: null,
}));
const assignments = Array.from({ length: 1001 }, (_, index) => ({
  category_id: index === 1000 ? 'leaf' : 'orphan',
}));
const calls = [];
let fail = false;
const client = {
  from(table) {
    const query = {
      select() {
        return query;
      },
      eq() {
        return query;
      },
      order() {
        return query;
      },
      async range(start, end) {
        calls.push({ table, start });
        return fail
          ? { data: null, error: new Error('database unavailable') }
          : {
              data: (table === 'categories' ? categories : assignments).slice(
                start,
                end + 1,
              ),
              error: null,
            };
      },
    };
    return query;
  },
};
const sitemap = load('lib/categories/sitemap.ts', {
  'server-only': {},
  '~/lib/supabase/directory-client': { getDirectoryClient: () => client },
  './visibility': visibility,
});
assert.deepEqual(
  (await sitemap.getIndexableCategories()).map((row) => row.slug),
  ['child', 'leaf', 'orphan', 'root'],
);
assert(
  calls.some(
    (call) => call.table === 'business_categories' && call.start === 1000,
  ),
);
fail = true;
await assert.rejects(sitemap.getIndexableCategories(), /database unavailable/);

const appConfig = {
  url: 'https://selletive.example',
  title: 'Selletive',
  description: 'Empresas B2B',
};
const social = load('lib/social-images.ts', {
  '~/config/app.config': { default: appConfig },
});
const seo = load('lib/seo.ts', {
  '~/config/app.config': { default: appConfig },
  './social-images': social,
});
const images = load('lib/directory-images.ts', { '~/lib/seo': seo });
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
assert.equal(images.directoryImageSource('javascript:alert(1)'), undefined);
assert.equal(images.directoryImageSource('/images/../api/private'), undefined);
assert.equal(
  images.directoryImageSource('/images/%2e%2e/api/private'),
  undefined,
);
assert.equal(
  images.canOptimizeDirectoryImage('https://external.example/logo.png'),
  false,
);
assert.equal(
  images.canOptimizeDirectoryImage('https://project.supabase.co/auth/v1/user'),
  false,
);
assert.equal(
  images.canOptimizeDirectoryImage(
    'https://project.supabase.co/storage/v1/object/public/logos/acme.png',
  ),
  true,
);
assert.equal(images.canOptimizeDirectoryImage('/images/billing.webp'), true);
assert.equal(
  new URL(social.socialImageUrl('company', 'acme', null)).searchParams.get('v'),
  '1',
);
let row = {
  name: 'Empresa com acentuação',
  description: 'Serviços B2B',
  updated_at: '2026-11-06T12:00:00Z',
};
let queryError = null;
const og = load('app/api/og/[kind]/[slug]/route.ts', {
  '@kit/next/routes': {
    enhanceRouteHandler:
      (handler) =>
      async (request, { params }) =>
        handler({ request, params: await params }),
  },
  '~/config/app.config': { default: appConfig },
  '~/lib/social-images': social,
  '~/lib/social-image-response': {
    createSocialImage: (data) => Response.json(data),
  },
  '~/lib/supabase/directory-client': {
    getDirectoryClient: () => ({
      from() {
        const query = {
          select() {
            return query;
          },
          eq() {
            return query;
          },
          async maybeSingle() {
            return { data: row, error: queryError };
          },
        };
        return query;
      },
    }),
  },
});
async function image(kind, slug, query = '') {
  return og.GET(
    new Request(`${appConfig.url}/api/og/${kind}/${slug}${query}`),
    { params: Promise.resolve({ kind, slug }) },
  );
}
assert.equal((await image('unknown', 'acme')).status, 404);
assert.equal((await image('site', 'unknown')).status, 404);
assert.equal((await image('company', '../private')).status, 404);
assert.equal((await image('company', 'a'.repeat(200))).status, 307);
assert.equal((await image('company', 'agência-ação')).status, 307);
assert.equal((await image('company', 'a'.repeat(201))).status, 404);
const redirect = await image('company', 'acme', '?title=Injected');
assert.equal(redirect.status, 307);
assert.equal(
  redirect.headers.get('location'),
  social.socialImageUrl('company', 'acme', row.updated_at),
);
assert.equal(
  (
    await (
      await image(
        'company',
        'acme',
        new URL(redirect.headers.get('location')).search,
      )
    ).json()
  ).title,
  row.name,
);
row = null;
assert.equal((await image('company', 'missing')).status, 404);
queryError = new Error('database unavailable');
assert.equal((await image('category', 'acme')).status, 503);

const primitive = ({ children }) => React.createElement('div', null, children);
const { BusinessInfo } = load(
  'app/[locale]/company/[slug]/_components/business-info.tsx',
  {
    'next/link': {
      default: ({ children, ...props }) =>
        React.createElement('a', props, children),
    },
    '@kit/ui/badge': { Badge: primitive },
    '@kit/ui/card': {
      Card: primitive,
      CardContent: primitive,
      CardHeader: primitive,
      CardTitle: primitive,
    },
    '@kit/ui/trans': { Trans: ({ defaults }) => defaults },
    '~/lib/seo': { safeWebsite: () => undefined },
    './business-interest': {
      BusinessContactLink: ({ businessId: _id, event: _event, ...props }) =>
        React.createElement('a', props),
    },
  },
);
const business = {
  business_categories: [
    {
      is_primary: true,
      categories: { name: 'Inativa', slug: 'inactive', is_active: false },
    },
    {
      is_primary: false,
      categories: { name: 'Design', slug: 'design', is_active: true },
    },
  ],
  business_locations: [
    { locations: { name: 'São Paulo', slug: 'sao-paulo-sp-br' } },
  ],
};
const html = renderToStaticMarkup(
  React.createElement(BusinessInfo, { business }),
);
assert(html.includes('href="/categories/design"'));
assert(html.includes('href="/design/sao-paulo-sp-br"'));
assert(!html.includes('href="/categories/inactive"'));
const noCategory = renderToStaticMarkup(
  React.createElement(BusinessInfo, {
    business: { ...business, business_categories: [] },
  }),
);
assert(!noCategory.includes('business-location-link'));
console.log(
  'Directory SEO: hierarchy, pagination, failure states, social URLs and profile navigation passed.',
);
