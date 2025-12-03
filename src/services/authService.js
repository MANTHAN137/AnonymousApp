import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, signInWithCredential } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

// Initialize Google Auth for Web only (Native uses capacitor.config.json)
if (!Capacitor.isNativePlatform()) {
    GoogleAuth.initialize({
        clientId: '173685988048-fmo4eqgoocmjnijcnnch68q8o5cgc4hm.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
    });
}

const saveUserToFirestore = async (user) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || '',
            createdAt: new Date()
        });
    }
};

export const signup = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await saveUserToFirestore(userCredential.user);
    return userCredential;
};

export const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const loginWithGoogle = async () => {
    if (Capacitor.isNativePlatform()) {
        // Native Login (Android/iOS)
        try {
            const googleUser = await GoogleAuth.signIn();
            const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
            const userCredential = await signInWithCredential(auth, credential);
            await saveUserToFirestore(userCredential.user);
            return userCredential;
        } catch (error) {
            console.error("Google Native Login Error:", error);
            throw error;
        }
    } else {
        // Web Login
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        await saveUserToFirestore(userCredential.user);
        return userCredential;
    }
};

export const logout = async () => {
    if (Capacitor.isNativePlatform()) {
        await GoogleAuth.signOut();
    }
    return signOut(auth);
};
