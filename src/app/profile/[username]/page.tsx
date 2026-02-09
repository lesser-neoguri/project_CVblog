import { Metadata } from 'next';
import { getProfileByUsername } from '@/lib/profiles';
import ProfilePageClient from './ProfilePageClient';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    return {
      title: '프로필을 찾을 수 없습니다',
    };
  }

  return {
    title: `${profile.full_name || profile.username} - DevBlog`,
    description: profile.bio || profile.description || '프로필 페이지',
    openGraph: {
      title: `${profile.full_name || profile.username} - DevBlog`,
      description: profile.bio || profile.description || '프로필 페이지',
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  return <ProfilePageClient profile={profile} />;
}
