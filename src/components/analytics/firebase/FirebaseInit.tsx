import { initializeApp, getApps } from 'firebase/app'
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics'

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// 防止重复初始化
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Analytics 实例 - 仅在客户端且支持时初始化
let analytics: Analytics | null = null

// 确保在客户端环境中初始化Firebase Analytics
const initializeFirebaseAnalytics = async (): Promise<Analytics | null> => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const supported = await isSupported();
        if (supported && !analytics) {
            analytics = getAnalytics(app);
            console.log('Firebase Analytics initialized successfully');
        }
        return analytics;
    } catch (error) {
        console.warn('Failed to initialize Firebase Analytics:', error);
        return null;
    }
};

// 立即尝试初始化（如果在客户端环境）
if (typeof window !== 'undefined') {
    initializeFirebaseAnalytics();
}

export { analytics, initializeFirebaseAnalytics }
export default app