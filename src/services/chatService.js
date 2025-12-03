import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    where,
    or,
    and,
    deleteDoc,
    doc,
    getDocs,
    Timestamp,
    limit
} from "firebase/firestore";
import { db } from "../firebase";

// Send a message to a specific chat room
export const sendMessage = async (chatId, text, uid, displayName) => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
        text,
        uid,
        displayName: displayName || "Unknown User",
        createdAt: serverTimestamp()
    });
};

// Delete a message
export const deleteMessage = async (chatId, messageId) => {
    await deleteDoc(doc(db, "chats", chatId, "messages", messageId));
};

// Subscribe to messages in a specific chat room
// Subscribe to messages in a specific chat room (only last 24 hours)
// Subscribe to messages in a specific chat room
export const subscribeToMessages = (chatId, callback) => {
    // We use limit(100) instead of a time filter for the view to ensure 
    // optimistic updates (newly sent messages) appear immediately without index issues.
    // The cleanupOldMessages function handles the 24h retention policy on the backend.
    const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("createdAt", "asc"),
        limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
            messages.push({ ...doc.data(), id: doc.id });
        });
        callback(messages);
    });

    return unsubscribe;
};

// Cleanup messages older than 24 hours
export const cleanupOldMessages = async (chatId) => {
    try {
        const oneDayAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);

        // Query for messages older than 24 hours
        const q = query(
            collection(db, "chats", chatId, "messages"),
            where("createdAt", "<=", oneDayAgo)
        );

        const snapshot = await getDocs(q);

        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        if (snapshot.size > 0) {
            console.log(`Cleaned up ${snapshot.size} old messages.`);
        }
    } catch (error) {
        console.error("Error cleaning up old messages:", error);
    }
};

// Create a unique chat ID for two users (e.g., "uid1_uid2" sorted)
export const getChatId = (uid1, uid2) => {
    return [uid1, uid2].sort().join("_");
};

// Subscribe to list of all users
export const subscribeToUsers = (callback) => {
    const q = query(collection(db, "users"));
    return onSnapshot(q, (snapshot) => {
        const users = [];
        snapshot.forEach((doc) => {
            users.push(doc.data());
        });
        callback(users);
    });
};
