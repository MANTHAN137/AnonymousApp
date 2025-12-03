import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyAHEtmq1XiK1G73X1crDq1e4pkp3GRhle8",
    authDomain: "chatapp-d865d.firebaseapp.com",
    projectId: "chatapp-d865d",
    storageBucket: "chatapp-d865d.firebasestorage.app",
    messagingSenderId: "173685988048",
    appId: "1:173685988048:web:593551f49dd4496b671cd5",
    measurementId: "G-XM4TR387VE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export default app;
