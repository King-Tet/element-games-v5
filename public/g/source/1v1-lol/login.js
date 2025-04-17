var tempErrorCreds;
var tempProviderName;

function retrieveIdToken(successCallback, errorCallback) {
    console.log("Mock: Retrieving ID token...");
    const mockToken = "mock-id-token";
    const mockDisplayName = "Mock User";

    const resultObj = {
        token: mockToken,
        displayName: mockDisplayName
    };
    console.log("Sending mock result to unity:", resultObj);

    if (successCallback !== undefined) {
        successCallback(resultObj);
    } else if (errorCallback !== undefined) {
        errorCallback("Mock error: Failed to retrieve token");
    }
}

function anonymousLogin(successCallback, errorCallback) {
    console.log("Mock: Anonymous login...");
    const resultObj = {
        token: "mock-anonymous-token",
        displayName: "guest"
    };
    console.log("Sending mock result to unity:", resultObj);

    if (successCallback !== undefined) {
        successCallback(resultObj);
    }
}

function firebaseLogin(providerName, successCallback, errorCallback) {
    console.log("Mock: Logging in with provider:", providerName);

    if (providerName === "anonymous") {
        anonymousLogin(successCallback, errorCallback);
        return;
    }

    const mockUser = { displayName: "Mock User", isAnonymous: false };
    console.log("Mock: Retrieved user:", mockUser);

    if (!mockUser.isAnonymous) {
        retrieveIdToken(successCallback, errorCallback);
        return;
    }

    console.log("Mock: Signing in with popup...");
    const resultObj = {
        token: "mock-login-token",
        displayName: "Mock User"
    };
    console.log("Sending mock result to unity:", resultObj);

    if (successCallback !== undefined) {
        successCallback(resultObj);
    }
}

function firebaseLogout() {
    console.log("Mock: Logging out...");
}

function getCurrentUserDisplayName() {
    console.log("Mock: Getting current user display name...");
    return "Mock User";
}

function getProvider(providerName) {
    console.log("Mock: Getting provider for:", providerName);
    return { providerName: providerName };
}

function setModalContent(modalContentId, contentString) {
    console.log(`Mock: Setting modal content for ${modalContentId}:`, contentString);
}

function continueLogin() {
    console.log("Mock: Continuing login...");
    console.log("Mock: Successfully linked credentials");
}

function showModal(modalId) {
    console.log("Mock: Showing modal:", modalId);
}

function hideModal(modalId) {
    console.log("Mock: Hiding modal:", modalId);
}
