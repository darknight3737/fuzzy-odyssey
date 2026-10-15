import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * Resolves a category slug (could be alias) to the primary category
 * Returns the primary category data
 */
export async function resolveCategoryFromSlug(slug: string): Promise<{
  id: string;
  name: string;
  slug: string;
  description: string | null;
} | null> {
  const client = getSupabaseServerClient();

  // First, try to find in categories table
  const { data: category } = await client
    .from('categories')
    .select('id, name, slug, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (category) {
    return category;
  }

  // If not found, check if it's an alias and get the primary category
  const { data: alias } = await client
    .from('category_aliases')
    .select('category_id')
    .eq('alias_slug', slug)
    .single();

  if (alias) {
    // Fetch the primary category using the category_id from alias
    const { data: primaryCategory } = await client
      .from('categories')
      .select('id, name, slug, description')
      .eq('id', alias.category_id)
      .eq('is_active', true)
      .single();

    if (primaryCategory) {
      return primaryCategory;
    }
  }

  return null;
}
