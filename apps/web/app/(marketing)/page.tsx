import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@kit/ui/navigation-menu';
import { withI18n } from '~/lib/i18n/with-i18n';

import { Search, Star, UserRound } from 'lucide-react';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { TypeSelect } from './_components/type-select';

type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

async function Home({ searchParams }: PageProps) {
  const typeParam = typeof searchParams?.type === 'string' ? searchParams?.type : undefined;
  const type = typeParam === 'software' ? 'software' : 'services';

  const parentSlug = type === 'software' ? 'development-product' : 'it-services';
  const client = getSupabaseServerAdminClient();

  const { data: parent } = await client
    .from('categories')
    .select('id')
    .eq('slug', parentSlug)
    .maybeSingle();

  let level2: Array<{ id: string; name: string; slug: string }> = [];
  if (parent?.id) {
    const { data } = await client
      .from('categories')
      .select('id, name, slug')
      .eq('level', 2)
      .eq('parent_id', parent.id)
      .order('name');

    level2 = data ?? [];
  }
  return (
    <div className={'flex flex-col'}>
      {/* Main Menu Bar */}
      <header className={'border-b'}>
        <div className={'container mx-auto flex items-center justify-between py-4'}>
          {/* Logo */}
          <Link href={'/'} className={'font-bold lowercase'}>
            <span className={'text-2xl'}>selletive</span>
          </Link>

          {/* Center Navigation */}
          <div className={'hidden md:flex'}>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Find providers</NavigationMenuTrigger>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Get clients</NavigationMenuTrigger>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right controls */}
          <div className={'flex items-center space-x-3'}>
            <div className={'relative hidden md:block'}>
              <Input placeholder={"What service?"} className={'pr-9 w-[260px]'} />
              <Search className={'text-muted-foreground absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2'} />
            </div>

            <Button asChild>
              <Link href={'/contact'}>Post a project</Link>
            </Button>

            <button aria-label={'Profile'} className={'rounded-full p-2 hover:bg-accent'}>
              <UserRound className={'h-5 w-5'} />
            </button>
          </div>
        </div>
      </header>

      {/* Menu Sub Bar */}
      <div className={'border-b'}>
        <nav className={'container mx-auto flex items-center justify-between gap-6 overflow-x-auto py-3 text-sm'}>
          {/* Type selector */}
          <TypeSelect defaultValue={type} />

          {/* Dynamic level-2 categories for selected parent */}
          <div className={'flex min-w-0 flex-1 items-center justify-end gap-6'}>
            {level2.length > 0 ? (
              level2.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className={'text-muted-foreground hover:underline hover:decoration-muted-foreground/50 hover:underline-offset-4 whitespace-nowrap'}
                >
                  {cat.name}
                </Link>
              ))
            ) : (
              <span className={'text-muted-foreground text-sm'}>No categories found</span>
            )}
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <section className={'container mx-auto grid grid-cols-1 items-center gap-10 py-14 md:grid-cols-2'}>
        {/* Left column */}
        <div className={'space-y-6'}>
          <h1 className={'font-serif text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl'}>
            Find the perfect service provider
            <span className={'relative inline-block'}>
              <span className={'sr-only'}>.</span>
              <span className={'ml-1 inline-block h-3 w-3 translate-y-[-0.35em] rounded-full bg-blue-600 align-top'} />
            </span>
          </h1>

          <p className={'text-muted-foreground max-w-xl text-base md:text-lg'}>
            Sortlist helps you describe your needs, meet relevant providers, and hire the best one.
          </p>

          <Button size={'lg'}>Get started - it&apos;s free!</Button>
        </div>

        {/* Right column */}
        <div className={'relative mx-auto h-[460px] w-full max-w-[560px]'}>
          {/* Mark - background image */}
          <Image
            src={'/images/dashboard-header.webp'}
            alt={'Mark — background'}
            width={800}
            height={600}
            className={'absolute left-0 top-6 h-[340px] w-[260px] rounded-xl object-cover shadow-md md:h-[380px] md:w-[300px]'}
            priority
          />

          {/* Lilia - foreground image */}
          <Image
            src={'/images/sign-in.webp'}
            alt={'Lilia — foreground'}
            width={900}
            height={700}
            className={'absolute right-0 top-0 h-[380px] w-[300px] rounded-xl object-cover shadow-lg md:h-[420px] md:w-[340px]'}
            priority
          />

          {/* Name labels */}
          <div className={'absolute left-6 top-10 rounded-lg bg-black/40 px-3 py-2 text-xs text-white backdrop-blur-sm'}>
            <div className={'font-semibold'}>Mark</div>
            <div className={'text-white/90'}>Marketing Manager at a food company</div>
          </div>

          <div className={'absolute right-3 top-6 rounded-lg bg-black/40 px-3 py-2 text-xs text-white backdrop-blur-sm md:right-4'}>
            <div className={'font-semibold'}>Lilia</div>
            <div className={'text-white/90'}>Web Agency Owner</div>
          </div>

          {/* Testimonial card */}
          <div className={'absolute bottom-2 left-1/2 w-[88%] -translate-x-1/2 rounded-xl bg-white p-4 shadow-lg md:bottom-4 md:w-[70%]'}>
            <div className={'flex items-center gap-1'}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={'h-4 w-4 fill-yellow-400 text-yellow-400'} />
              ))}
            </div>

            <p className={'mt-2 text-sm text-foreground'}>
              <b>Mark</b> found <b>Lilia</b> to build his new website
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default withI18n(Home);
