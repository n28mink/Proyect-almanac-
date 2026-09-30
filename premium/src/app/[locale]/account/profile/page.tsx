import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ProfileForm } from '@/components/account/ProfileForm';
import { routing } from '@/i18n/routing';
import { requireUser } from '@/server/auth/guards';

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const user = await requireUser(locale, '/account/profile');
  const t = await getTranslations('account');
  return (
    <div>
      <h1 className="font-display text-display-m">{t('tabs.profile')}</h1>
      <div className="mt-10"><ProfileForm user={user} /></div>
    </div>
  );
}
