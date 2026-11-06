import { safeWebsite } from '~/lib/seo';

export function directoryImageSource(value: string) {
  if (value.startsWith('/images/') && !value.includes('\\')) {
    const url = new URL(value, 'https://selletive.invalid');
    return url.pathname.startsWith('/images/') ? `${url.pathname}${url.search}` : undefined;
  }
  return safeWebsite(value);
}

export function canOptimizeDirectoryImage(src: string) {
  if (src.startsWith('/images/')) return true;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;
  try {
    const url = new URL(src);
    return (
      url.protocol === 'https:' &&
      url.origin === new URL(supabaseUrl).origin &&
      url.pathname.startsWith('/storage/v1/object/public/')
    );
  } catch {
    return false;
  }
}
