/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Triggered when a document is deleted in the 'users' collection.
 * Since we set the Firestore document ID to match the Authentication UID for users,
 * we can use context.params.userId directly.
 */
exports.deleteAuthUser = functions.firestore
    .document("users/{userId}")
    .onDelete(async (snap, context) => {
        const userId = context.params.userId;
        console.log(`Attempting to delete auth user directly related to document ID: ${userId}`);

        try {
            await admin.auth().deleteUser(userId);
            console.log(`Successfully deleted auth user ${userId}`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log(`Auth user ${userId} not found, probably already deleted.`);
            } else {
                console.error(`Error deleting auth user ${userId}:`, error);
            }
        }
    });

/**
 * Triggered when a document is deleted in the 'owners' collection.
 * Owners are created with an auto-generated Firestore ID (via addDoc),
 * but store the Auth ID in the 'uid' field.
 */
exports.deleteAuthOwner = functions.firestore
    .document("owners/{ownerId}")
    .onDelete(async (snap, context) => {
        const deletedValue = snap.data();
        const ownerAuthId = deletedValue.uid;

        if (!ownerAuthId) {
            console.log("No 'uid' field found in deleted owner document. Skipping auth deletion.");
            return;
        }

        console.log(`Attempting to delete auth owner with UID: ${ownerAuthId}`);

        try {
            await admin.auth().deleteUser(ownerAuthId);
            console.log(`Successfully deleted auth owner ${ownerAuthId}`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log(`Auth owner ${ownerAuthId} not found, probably already deleted.`);
            } else {
                console.error(`Error deleting auth owner ${ownerAuthId}:`, error);
            }
        }
    });
