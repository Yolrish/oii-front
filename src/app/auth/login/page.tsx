import { Metadata } from 'next';
import LoginClient from './client';

export const metadata: Metadata = {
    title: 'Sign In - Tapi',
    description: 'Sign in to your Tapi account to access personalized content, create timelines, and engage with the community. Secure authentication with multiple login options.',
    keywords: 'sign in, login, authentication, account access, tapi login',
    openGraph: {
        title: 'Sign In - Tapi',
        description: 'Sign in to your Tapi account to access personalized content and features',
        type: 'website',
        url: '/auth/login',
    },
    twitter: {
        card: 'summary',
        title: 'Sign In - Tapi',
        description: 'Sign in to your Tapi account to access personalized content and features',
    },
    alternates: {
        canonical: '/auth/login',
    }
};

export default function LoginPage() {
    return <LoginClient />;
}