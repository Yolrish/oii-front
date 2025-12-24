import { Metadata } from 'next';
import RegisterClient from './client';

export const metadata: Metadata = {
    title: 'Sign Up - Tapi',
    description: 'Create your Tapi account to start exploring AI-powered content, building timelines, and connecting with the community. Join thousands of users discovering knowledge together.',
    keywords: 'sign up, register, create account, join tapi, new user registration',
    openGraph: {
        title: 'Sign Up - Tapi',
        description: 'Create your Tapi account to start exploring AI-powered content and building timelines',
        type: 'website',
        url: '/auth/register',
    },
    twitter: {
        card: 'summary',
        title: 'Sign Up - Tapi',
        description: 'Create your Tapi account to start exploring AI-powered content and building timelines',
    },
    alternates: {
        canonical: '/auth/register',
    }
};

export default function RegisterPage() {
    return <RegisterClient />;
}