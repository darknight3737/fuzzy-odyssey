'use client';
import Link from 'next/link';
import { PersonalAccountDropdown } from '@kit/accounts/personal-account-dropdown';
import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { useUser } from '@kit/supabase/hooks/use-user';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@kit/ui/dropdown-menu';
import { Trans } from '@kit/ui/trans';
import pathsConfig from '~/config/paths.config';
import { UserRound } from 'lucide-react';
const paths = {
  home: pathsConfig.app.home,
  profileSettings: pathsConfig.app.personalAccountSettings,
};
const features = {
    enableThemeToggle: false,
};
export function SiteHeaderAccountSection() {
    const {data: user} = useUser();
    const signOut = useSignOut();
    if (user) {
        return (<PersonalAccountDropdown showProfileName={false} paths={paths} features={features} user={user} signOutRequested={() => signOut.mutateAsync()}/>);
    }
    return <AuthUserIcon />;
}
function AuthUserIcon() {
    return (<DropdownMenu>
      <DropdownMenuTrigger aria-label={'Account menu'} className={'rounded-full p-2 hover:bg-accent'}>
        <UserRound className={'h-5 w-5'}/>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuItem render={<Link href={pathsConfig.auth.signIn} className={'flex w-full items-center'}/>}>
            <Trans i18nKey={'auth.signIn'} defaults={'Sign In'}/>
          </DropdownMenuItem>

        <DropdownMenuItem render={<Link href={pathsConfig.auth.signUp} className={'flex w-full items-center'}/>}>
            <Trans i18nKey={'auth.signUp'} defaults={'Sign Up'}/>
          </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>);
}
