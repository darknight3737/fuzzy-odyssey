import Link from 'next/link';
import { SignInMethodsContainer } from '@kit/auth/sign-in';
import { Button } from '@kit/ui/button';
import { Heading } from '@kit/ui/heading';
import { Trans } from '@kit/ui/trans';
import authConfig from '~/config/auth.config';
import pathsConfig from '~/config/paths.config';
import { getTranslations } from 'next-intl/server';
interface SignInPageProps {
    searchParams: Promise<{
        invite_token?: string;
        next?: string;
    }>;
}
export const generateMetadata = async () => {
    const t = await getTranslations();
    return {
        title: t('auth.signIn'),
    };
};
async function SignInPage({ searchParams }: SignInPageProps) {
    const { invite_token: inviteToken, next } = await searchParams;
    const signUpPath = pathsConfig.auth.signUp +
        (inviteToken ? `?invite_token=${inviteToken}` : '');
    const paths = {
        callback: pathsConfig.auth.callback,
        returnPath: next?.startsWith('/') && !next.startsWith('//')
            ? next
            : pathsConfig.app.home,
        joinTeam: pathsConfig.app.joinTeam,
    };
    return (<>
      <div className={'flex flex-col items-center gap-1'}>
        <Heading level={4} className={'tracking-tight'}>
          <Trans i18nKey={'auth.signInHeading'}/>
        </Heading>

        <p className={'text-muted-foreground text-sm'}>
          <Trans i18nKey={'auth.signInSubheading'}/>
        </p>
      </div>

      <SignInMethodsContainer captchaSiteKey={authConfig.captchaTokenSiteKey} paths={paths} providers={authConfig.providers}/>

      <div className={'flex justify-center'}>
        <Button variant={'link'} size={'sm'} render={<Link href={signUpPath} prefetch={true}/>} nativeButton={false}>
            <Trans i18nKey={'auth.doNotHaveAccountYet'}/>
          </Button>
      </div>
    </>);
}
export default SignInPage;
