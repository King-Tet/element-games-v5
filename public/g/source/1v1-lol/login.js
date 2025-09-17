// Mock Firebase Authentication Implementation

/**
 * Retrieves a mock ID token for a pre-defined user.
 * This token is used to authenticate the user with a secure backend.
 */
function retrieveIdToken(successCallback, errorCallback) {
    const user = {
        displayName: "Test User",
        token: "mock-id-token-12345"
    };

    console.log("Successfully retrieved ID token for:", user.displayName);
    if (successCallback) {
        successCallback(user);
    }
}

/**
 * Main login function. This function is mocked to prevent the Google login pop-up.
 * It now immediately calls the success callback with pre-filled credentials.
 */
function firebaseLogin(providerName, successCallback, errorCallback) {
    console.log("---MOCK LOGIN ENABLED---");
    console.log("Attempting to log in with mock Google credentials...");

    // Directly call retrieveIdToken to simulate a successful login
    retrieveIdToken(successCallback, errorCallback);
}

/**
 * Signs the current user out.
 */
function firebaseLogout() {
    console.log("Logging out...");
    // In a mock environment, there's no real session to clear.
    console.log("Logout successful (mock).");
}

/**
 * Gets the display name of the currently signed-in user.
 */
function getCurrentUserDisplayName() {
    // Return the mock user's display name.
    return "Test User";
}

// These UI-related mock functions can be kept as placeholders for now,
// as they don't affect the core login functionality.
function setModalContent(modalContentId, contentString) {
    console.log(`Mock: Setting modal content for ${modalContentId}:`, contentString);
}

function showModal(modalId) {
    console.log("Mock: Showing modal:", modalId);
}

function hideModal(modalId) {
    console.log("Mock: Hiding modal:", modalId);
}