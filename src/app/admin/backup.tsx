// src/app/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import styles from './AdminPage.module.css'; // Ensure path is correct
import { useAuth } from '@/context/AuthContext'; // Ensure path is correct
// Import RTDB functions for presence
import { rtdb } from '@/lib/firebase/config'; // Ensure path is correct
import { ref, onValue, DataSnapshot } from "firebase/database"; // Import DataSnapshot
import { FiUsers, FiSearch, FiEdit, FiSave, FiEye, FiLoader, FiArrowLeft, FiCircle } from 'react-icons/fi'; // Ensure all icons are imported
import { Timestamp } from 'firebase/firestore'; // Import Timestamp for type checking/conversion display

// Define interfaces for fetched data (can be moved to types file)
interface SearchUserResult {
    uid: string;
    username?: string;
    email?: string;
    displayName?: string;
}

interface UserGameSave {
    gameId: string;
    saveData: string; // JSON string
    savedAt: Timestamp | { seconds: number, nanoseconds: number }; // Firestore Timestamp (or object if converted)
    lastEditedByAdmin?: string; // Optional field we added
}
interface UserGameRating {
    gameId: string;
    rating: number;
    ratedAt: Timestamp | { seconds: number, nanoseconds: number };
}
interface UserRecentPlay {
    gameId: string;
    lastPlayed: Timestamp | { seconds: number, nanoseconds: number };
    playtimeSeconds?: number;
}

// Type for the game details map received from API
interface GameDetailsMapType {
    [key: string]: { name: string; imageUrl?: string };
}

interface AdminUserDetails {
    profile: unknown; // Replace 'any' with your specific UserProfile type if defined elsewhere
    gameSaves: UserGameSave[];
    gameRatings: UserGameRating[];
    recentlyPlayed: UserRecentPlay[];
    // Use the defined type for the map
    gameDetailsMap?: GameDetailsMapType;
}

// NEW Interface for Online User Data from RTDB
interface OnlineUser {
    uid: string;
    isOnline: boolean;
    lastSeen: number; // Timestamp (milliseconds from RTDB serverTimestamp)
    username?: string | null;
    displayName?: string | null;
    // email?: string | null; // Add if needed and stored in RTDB status
}

// Logger
const logAdmin = (message: string, ...optionalParams: unknown[]) => {
    const DEBUG_ENABLED = true; // Toggle admin page specific logs
    if (DEBUG_ENABLED) console.log(`[AdminPage] ${message}`, ...optionalParams);
};

// Helper to safely format Timestamp or timestamp-like objects
const formatAdminTimestamp = (timestamp: Timestamp | { seconds: number, nanoseconds: number } | undefined): string => {
    if (!timestamp) return 'N/A';
    let date: Date;
    if (timestamp instanceof Timestamp) {
        date = timestamp.toDate();
    } else if (timestamp && typeof timestamp.seconds === 'number') {
        // Handle plain object format that might come from JSON serialization/deserialization
        date = new Date(timestamp.seconds * 1000);
    } else {
        return 'Invalid Date';
    }
    try {
        return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch (e) {
        return 'Formatting Error';
    }
}


const AdminPage: React.FC = () => {
    const { user } = useAuth(); // Need user to get ID token for API calls
    // State for online users list
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [isLoadingOnline, setIsLoadingOnline] = useState(true); // Loading state for online list
    // State for search/details
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    const [selectedUser, setSelectedUser] = useState<SearchUserResult | null>(null);
    const [selectedUserDetails, setSelectedUserDetails] = useState<AdminUserDetails | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [editingSaveGameId, setEditingSaveGameId] = useState<string | null>(null);
    const [editingSaveData, setEditingSaveData] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // --- Fetch Online User List (Real-time) ---
    useEffect(() => {
        logAdmin("Setting up online user listener...");
        setIsLoadingOnline(true);
        const statusRef = ref(rtdb, 'status');
        // Listen to the entire /status node
        const unsubscribe = onValue(statusRef, (snapshot: DataSnapshot) => {
            const statusData = snapshot.val(); // Get all data under /status
            const currentOnlineUsers: OnlineUser[] = [];

            if (statusData) {
                logAdmin("Received status update from RTDB:", Object.keys(statusData).length, "total entries");
                Object.keys(statusData).forEach((uid) => {
                    const userData = statusData[uid];
                    // Check if user is marked as online
                    if (userData && userData.isOnline === true) {
                        currentOnlineUsers.push({
                            uid: uid,
                            isOnline: true,
                            lastSeen: userData.lastSeen, // Keep original timestamp
                            username: userData.username || null,
                            displayName: userData.displayName || null,
                        });
                    }
                });
            } else {
                 logAdmin("Received empty status update from RTDB.");
            }

            // Sort online users by username or display name
            currentOnlineUsers.sort((a, b) => (a.username || a.displayName || a.uid).localeCompare(b.username || b.displayName || b.uid));

            logAdmin(`Processed online users: ${currentOnlineUsers.length}`);
            setOnlineUsers(currentOnlineUsers);
            setIsLoadingOnline(false); // Mark loading as false after first fetch/update
        }, (error) => {
            console.error("[AdminPage] Error listening to online status:", error);
            setOnlineUsers([]); // Clear list on error
            setIsLoadingOnline(false); // Stop loading on error
            setApiError("Failed to load online user list."); // Show error
        });

        // Cleanup listener on unmount
        return () => {
            logAdmin("Cleaning up online user listener.");
            unsubscribe();
        };
    }, []); // Run once on mount


    // --- User Search ---
    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim() || !user) return;
        logAdmin("Searching users for:", searchQuery);
        setIsLoadingSearch(true); setSearchResults([]); setSelectedUser(null); setSelectedUserDetails(null); setApiError(null);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery.trim())}`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Search failed');
            logAdmin("Search results:", data);
            setSearchResults(data.users || []);
        } catch (error: unknown) {
            logAdmin("User search error:", error); setApiError(error.message || "Failed to search users.");
        } finally { setIsLoadingSearch(false); }
    };

    // --- Fetch User Details ---
    const fetchUserDetails = async (targetUser: SearchUserResult | OnlineUser) => { // Accept OnlineUser type too
         if (!user || !targetUser?.uid) return; // Check for uid existence
         const targetUid = targetUser.uid;
         logAdmin("Fetching details for user:", targetUid);
         // Set selectedUser based on available info (might just be UID from online list)
         setSelectedUser({ uid: targetUid, username: targetUser.username, displayName: targetUser.displayName });
         setIsLoadingDetails(true); setSelectedUserDetails(null); setApiError(null); setEditingSaveGameId(null);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`/api/admin/users/${targetUid}`, { headers: { 'Authorization': `Bearer ${idToken}` } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to fetch details');
            logAdmin("User details received:", data);
            // Convert gameDetailsMap from object back to Map if needed (or just use the object)
            // API response already converts timestamps to ISO strings
            setSelectedUserDetails(data);
        } catch (error: unknown) { logAdmin("Fetch details error:", error); setApiError((error as Error).message || "Failed to fetch user details."); }
        finally { setIsLoadingDetails(false); }
    };

    // --- Edit Game Save ---
    const handleEditSave = (save: UserGameSave) => {
        setEditingSaveGameId(save.gameId);
        try {
            // Attempt to parse and pretty-print
            setEditingSaveData(JSON.stringify(JSON.parse(save.saveData), null, 2));
        } catch {
            // Fallback to raw string if parsing fails
            setEditingSaveData(save.saveData);
        }
    };

    const handleSaveEdit = async () => {
        if (!user || !selectedUser || !editingSaveGameId || isSavingEdit) return;
        let validatedData = editingSaveData;
        // Validate/reformat JSON before saving
        try {
             validatedData = JSON.stringify(JSON.parse(editingSaveData)); // Ensure valid, compact JSON
        } catch (e) {
            alert("Invalid JSON format in save data. Please correct it before saving.");
            return;
        }

        logAdmin(`Saving edited save for user ${selectedUser.uid}, game ${editingSaveGameId}`);
        setIsSavingEdit(true); setApiError(null);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`/api/admin/users/${selectedUser.uid}/gameSaves/${editingSaveGameId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ saveData: validatedData }) // Send validated JSON string
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to save');
            logAdmin("Save edit successful.");
            setEditingSaveGameId(null); // Close editor
            fetchUserDetails(selectedUser); // Refresh details
        } catch (error: unknown) { logAdmin("Save edit error:", error); setApiError((error as Error).message || "Failed to save edited data."); }
        finally { setIsSavingEdit(false); }
    };

    // --- Render ---
    return (
        <div className={styles.adminContainer}>
            <h1>Admin Panel</h1>

            {/* --- Analytics --- */}
            <section className={styles.section}>
                <h2>Live Analytics</h2>
                <div className={styles.onlineUsersSection}>
                    <h3>
                        <FiUsers /> Online Users: ({isLoadingOnline ? '...' : onlineUsers.length})
                    </h3>
                    {isLoadingOnline ? (
                        <p className={styles.loadingText}>Loading online users...</p>
                    ) : onlineUsers.length > 0 ? (
                        <ul className={styles.onlineList}>
                            {onlineUsers.map(onlineUser => (
                                <li key={onlineUser.uid} onClick={() => fetchUserDetails(onlineUser)} title={`Click to view details for ${onlineUser.uid}`}>
                                    <FiCircle className={styles.onlineIndicator} />
                                    <span className={styles.onlineName}>
                                        {onlineUser.displayName || onlineUser.username || '(No Name)'}
                                    </span>
                                    {/* Show username only if different from display name */}
                                    {onlineUser.username && onlineUser.username !== (onlineUser.displayName || '(No Name)') && (
                                         <span className={styles.onlineUsername}>
                                             (@{onlineUser.username})
                                         </span>
                                    )}
                                    <button className={styles.viewButtonSmall} title="View Details"><FiEye/></button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className={styles.noItemsText}>No users currently online.</p>
                    )}
                </div>
            </section>

            {/* --- User Management --- */}
            <section className={styles.section}>
                <h2>User Management</h2>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by Username or Email..."
                        className={styles.searchInput}
                    />
                    <button type="submit" className={styles.searchButton} disabled={isLoadingSearch || !searchQuery.trim()}>
                        {isLoadingSearch ? <FiLoader className={styles.spinner} /> : <FiSearch />}
                    </button>
                </form>

                {/* Search Results */}
                {!selectedUser && searchResults.length > 0 && ( // Show only if user not selected
                    <div className={styles.searchResults}>
                        <h3>Search Results ({searchResults.length})</h3>
                        <ul>
                            {searchResults.map(u => (
                                <li key={u.uid} onClick={() => fetchUserDetails(u)}>
                                    <span>{u.username || u.displayName || u.uid.substring(0, 8)}</span>
                                    <small>({u.email || 'No Email'})</small>
                                    <button className={styles.viewButton} title="View Details"><FiEye/></button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {!selectedUser && !isLoadingSearch && searchQuery && searchResults.length === 0 && ( // Show only if user not selected
                     <p className={styles.noResults}>No users found matching &quot;{searchQuery}&quot;.</p>
                )}

                {/* Selected User Details */}
                {selectedUser && (
                    <div className={styles.userDetails}>
                        <button onClick={() => { setSelectedUser(null); setSelectedUserDetails(null); setApiError(null); setEditingSaveGameId(null); }} className={styles.backButton}>
                            <FiArrowLeft /> Back to Search Results
                        </button>
                        <h3>Details for {selectedUser.username || selectedUser.displayName || selectedUser.uid}</h3>
                        {isLoadingDetails ? (
                            <p className={styles.loadingText}>Loading details...</p>
                        ) : apiError ? (
                             <p className={styles.errorText}>Error loading details: {apiError}</p>
                        ) : selectedUserDetails ? (
                            <div className={styles.detailsContent}>
                               <h4>Profile</h4>
                               {/* Display profile data - check if selectedUserDetails.profile exists */}
                               <pre>{JSON.stringify(selectedUserDetails.profile || { info: 'No profile data found.' }, null, 2)}</pre>

                               <h4>Recently Played ({selectedUserDetails.recentlyPlayed?.length || 0})</h4>
                               <ul className={styles.dataList}>
                                   {selectedUserDetails.recentlyPlayed?.length > 0 ? selectedUserDetails.recentlyPlayed.map(p => (
                                        <li key={p.gameId}>
                                            {selectedUserDetails.gameDetailsMap?.[p.gameId]?.name || p.gameId}
                                            <small>(Last: {formatAdminTimestamp(p.lastPlayed)})</small>
                                        </li>
                                   )) : <li className={styles.noDataListItem}>No recent activity.</li>}
                               </ul>

                               <h4>Game Ratings ({selectedUserDetails.gameRatings?.length || 0})</h4>
                                <ul className={styles.dataList}>
                                   {selectedUserDetails.gameRatings?.length > 0 ? selectedUserDetails.gameRatings.map(r => (
                                        <li key={r.gameId}>
                                            {selectedUserDetails.gameDetailsMap?.[r.gameId]?.name || r.gameId}:
                                            <strong> {r.rating}/5 </strong>
                                            <small>(Rated: {formatAdminTimestamp(r.ratedAt)})</small>
                                        </li>
                                   )) : <li className={styles.noDataListItem}>No ratings submitted.</li>}
                               </ul>

                               <h4>Game Saves ({selectedUserDetails.gameSaves?.length || 0})</h4>
                                <ul className={styles.dataList}>
                                   {selectedUserDetails.gameSaves?.length > 0 ? selectedUserDetails.gameSaves.map(s => (
                                        <li key={s.gameId}>
                                            <div className={styles.saveHeader}>
                                                <strong>{selectedUserDetails.gameDetailsMap?.[s.gameId]?.name || s.gameId}</strong>
                                                <small>(Saved: {formatAdminTimestamp(s.savedAt)}) {s.lastEditedByAdmin ? `(Admin Edit)` : ''}</small>
                                                <button onClick={() => handleEditSave(s)} className={styles.editButton} disabled={editingSaveGameId === s.gameId} title="Edit Save Data">
                                                     <FiEdit/> Edit
                                                 </button>
                                            </div>
                                            {editingSaveGameId === s.gameId ? (
                                                <div className={styles.editArea}>
                                                    <textarea
                                                        value={editingSaveData}
                                                        onChange={(e) => setEditingSaveData(e.target.value)}
                                                        rows={10}
                                                        className={styles.saveTextarea}
                                                        spellCheck="false"
                                                        aria-label={`Edit save data for ${selectedUserDetails.gameDetailsMap?.[s.gameId]?.name || s.gameId}`}
                                                    />
                                                    <div className={styles.editActions}>
                                                         <button onClick={handleSaveEdit} disabled={isSavingEdit} className={styles.saveEditButton}>
                                                             {isSavingEdit ? <FiLoader className={styles.spinner}/> : <FiSave/>} Save Changes
                                                         </button>
                                                         <button onClick={() => setEditingSaveGameId(null)} disabled={isSavingEdit} className={styles.cancelEditButton}>
                                                             Cancel
                                                         </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <pre className={styles.savePreview}>{s.saveData.substring(0, 300)}{s.saveData.length > 300 ? '...' : ''}</pre>
                                            )}
                                        </li>
                                   )) : <li className={styles.noDataListItem}>No game saves found.</li>}
                               </ul>

                            </div>
                        ) : (
                            <p className={styles.loadingText}>No details loaded.</p>
                        )}
                    </div>
                )}

                 {/* General API Error Display (Only show if no user selected or details failed) */}
                 {apiError && !isLoadingDetails && !selectedUserDetails && <p className={styles.errorText}>{apiError}</p>}

            </section>
        </div>
    );
};

export default AdminPage;