'use client';

import { useEffect, useState } from 'react';
import { getFirebaseInstance } from '@/lib/firebase';

function FirebaseInitializer() {
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const initFirebase = async () => {
            try {
                const firebase = await getFirebaseInstance();
                if (firebase) {
                    setIsInitialized(true);
                }
            } catch (error) {
                console.error('Firebase initialization error:', error);
            }
        };

        initFirebase();
    }, []);

    if (!isInitialized) {
        return <div>Firebase 초기화 중...</div>;
    }

    return null;
}

export default FirebaseInitializer; 