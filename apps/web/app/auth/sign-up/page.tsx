import Link from 'next/link';
import { SignUpMethodsContainer } from '@kit/auth/sign-up';
import { Button } from '@kit/ui/button';
import { Heading } from '@kit/ui/heading';
import { Trans } from '@kit/ui/trans';
import authConfig from '~/config/auth.config';
import pathsConfig from '~/config/paths.config';
import { getTranslations } from 'next-intl/server';
export const generateMetadata = async () => {
    const t = await getTranslations();
    return {
        title: t('auth.signUp'),
    };
};
interface Props {
    searchParams: Promise<{
        invite_token?: string;
        next?: string;
    }>;
}
const paths = {
    callback: pathsConfig.auth.callback,
    appHome: pathsConfig.app.home,
};
async function SignUpPage({ searchParams }: Props) {
    const { invite_token: inviteToken, next } = await searchParams;
    const returnPath = next?.startsWith('/') && !next.startsWith('//')
        ? next
        : pathsConfig.app.home;
    const signUpPaths = { ...paths, appHome: returnPath };
    const signInPath = pathsConfig.auth.signIn +
        (inviteToken ? `?invite_token=${inviteToken}` : '');
    return (<>
      <div className={'flex flex-col items-center gap-1'}>
        <Heading level={4} className={'tracking-tight'}>
          <Trans i18nKey={'auth.signUpHeading'}/>
        </Heading>

        <p className={'text-muted-foreground text-sm'}>
          <Trans i18nKey={'auth.signUpSubheading'}/>
        </p>
      </div>

      <SignUpMethodsContainer providers={authConfig.providers} displayTermsCheckbox={authConfig.displayTermsCheckbox} captchaSiteKey={authConfig.captchaTokenSiteKey} paths={signUpPaths}/>

      <div className={'flex justify-center'}>
        <Button variant={'link'} size={'sm'} render={<Link href={signInPath} prefetch={true}/>} nativeButton={false}>
            <Trans i18nKey={'auth.alreadyHaveAnAccount'}/>
          </Button>
      </div>
    </>);
}
export default SignUpPage;
