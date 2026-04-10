const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions");

admin.initializeApp();

/**
 * Triggered when a document is deleted in the 'users' collection.
 * v1 Trigger with Enhanced Logging
 */
exports.deleteAuthUser = functions.firestore
    .document("users/{userId}")
    .onDelete(async (snap, context) => {
        const userId = context.params.userId;
        
        logger.info(`TRIGGERED: deleteAuthUser for userId: ${userId}`);

        try {
            await admin.auth().deleteUser(userId);
            logger.info(`SUCCESS: Deleted Firebase Auth user ${userId}`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                logger.warn(`NOTICE: Auth user ${userId} not found in Authentication table.`);
            } else {
                logger.error(`ERROR: Failed to delete auth user ${userId}`, error);
                throw error; // Re-throw to show in Firebase logs as failure
            }
        }
    });

/**
 * Triggered when a document is deleted in the 'franchise' collection.
 * v1 Trigger with Enhanced Logging
 */
exports.deleteAuthFranchise = functions.firestore
    .document("franchise/{franchiseId}")
    .onDelete(async (snap, context) => {
        const franchiseId = context.params.franchiseId;
        const deletedData = snap.data();
        const authUid = deletedData ? deletedData.uid : null;

        logger.info(`TRIGGERED: deleteAuthFranchise for franchiseId: ${franchiseId}`, { authUid });

        if (!authUid) {
            logger.warn(`SKIP: No 'uid' field found in franchise document ${franchiseId}.`);
            return;
        }

        try {
            await admin.auth().deleteUser(authUid);
            logger.info(`SUCCESS: Deleted Firebase Auth user ${authUid} (Franchise: ${franchiseId})`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                logger.warn(`NOTICE: Auth user ${authUid} not found for franchise ${franchiseId}.`);
            } else {
                logger.error(`ERROR: Failed to delete auth user for franchise ${franchiseId}`, error);
                throw error;
            }
        }
    });

/**
 * Triggered when a document is deleted in the 'owners' collection.
 * Backup Trigger
 */
exports.deleteAuthOwner = functions.firestore
    .document("owners/{ownerId}")
    .onDelete(async (snap, context) => {
        const ownerId = context.params.ownerId;
        const deletedData = snap.data();
        const authUid = deletedData ? deletedData.uid : null;

        logger.info(`TRIGGERED: deleteAuthOwner for ownerId: ${ownerId}`);

        if (!authUid) {
            logger.warn("SKIP: No 'uid' field found in owner document.");
            return;
        }

        try {
            await admin.auth().deleteUser(authUid);
            logger.info(`SUCCESS: Deleted Firebase Auth owner ${authUid}`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                logger.warn(`NOTICE: Auth owner ${authUid} not found.`);
            } else {
                logger.error(`ERROR: Failed to delete auth owner ${ownerId}`, error);
                throw error;
            }
        }
    });

/**
 * Callable function to delete a user from Firebase Authentication by UID.
 * This is used by the Admin Panel for synchronous deletion.
 */
exports.deleteUserAuth = functions.https.onCall(async (data, context) => {
    // Check if the request is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }

    const uid = data.uid;
    if (!uid) {
        logger.error(`CALLABLE_ERROR: deleteUserAuth called without UID by Admin: ${context.auth.uid}`);
        throw new functions.https.HttpsError(
            "invalid-argument",
            "The function must be called with a 'uid'."
        );
    }

    logger.info(`CALLABLE_REQUEST: Attempting to delete Auth user [${uid}] requested by Admin [${context.auth.uid}]`);

    try {
        await admin.auth().deleteUser(uid);
        logger.info(`CALLABLE_SUCCESS: Deleted Firebase Auth user [${uid}]`);
        return { success: true, message: `Successfully deleted user ${uid}` };
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            logger.warn(`CALLABLE_NOTICE: Auth user [${uid}] not found. Record was likely deleted manually or never existed.`);
            return { success: true, message: "User not found in Auth, nothing to delete." };
        } else {
            logger.error(`CALLABLE_FAILURE: Failed to delete auth user [${uid}]`, error);
            throw new functions.https.HttpsError(
                "internal",
                `Failed to delete user: ${error.message}`
            );
        }
    }
});
