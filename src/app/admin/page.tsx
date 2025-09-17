// src/app/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import styles from './AdminPage.module.css';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { FiUsers, FiSearch, FiEye, FiLoader, FiArrowLeft, FiCircle, FiEdit, FiSave, FiX } from 'react-icons/fi';
import AdminPanel from '@/components/Admin/AdminPanel.js';

// --- Interfaces ---
interface OnlineUser {
    uid: string;
    username?: string | null;
    display_name?: string | null;
    activity?: { type: string; name: string } | null;
}
interface SearchUserResult { 
    id: string; 
    username?: string; 
    email?: string; 
    display_name?: string; 
}
interface UserGameSave {
    game_id: string;
    save_data: any; // JSON object from Supabase
    saved_at: string;
    games?: { name: string };
}
interface UserGameRating {
    game_id: string;
    rating: number;
    rated_at: string;
    games?: { name: string };
}
interface UserRecentPlay {
    id: number; // Unique row ID
    game_id: string;
    last_played: string;
    games?: { name: string };
}
interface AdminUserDetails { 
    profile: any; 
    gameSaves: UserGameSave[]; 
    gameRatings: UserGameRating[]; 
    recentlyPlayed: UserRecentPlay[]; 
}

// --- Helper to format timestamps ---
const formatTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp) return 'N/A';
    try {
        return new Date(timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch (e) {
        return 'Invalid Date';
    }
};


const AdminPage: React.FC = () => {
    const { user } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [isLoadingOnline, setIsLoadingOnline] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    const [selectedUser, setSelectedUser] = useState<SearchUserResult | OnlineUser | null>(null);
    const [selectedUserDetails, setSelectedUserDetails] = useState<AdminUserDetails | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // --- NEW: State for editing game saves ---
    const [editingSaveGameId, setEditingSaveGameId] = useState<string | null>(null);
    const [editingSaveData, setEditingSaveData] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);


    // --- Presence Listener ---
    useEffect(() => {
        const channel = supabase.channel('online-users');
        channel.on('presence', { event: 'sync' }, () => {
            const presenceState = channel.presenceState<any>();
            const users = Object.keys(presenceState).map(key => ({ uid: key, ...presenceState[key][0] })).sort((a, b) => (a.username || a.display_name || a.uid).localeCompare(b.username || b.display_name || b.uid));
            setOnlineUsers(users);
            setIsLoadingOnline(false);
        });
        channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
            setOnlineUsers(prev => [...prev, { uid: key, ...newPresences[0] }].sort((a, b) => (a.username || a.display_name || a.uid).localeCompare(b.username || b.display_name || b.uid)));
        });
        channel.on('presence', { event: 'leave' }, ({ key }) => {
            setOnlineUsers(prev => prev.filter(user => user.uid !== key));
        });
        channel.subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    // --- Search Functionality ---
    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsLoadingSearch(true);
        setSearchResults([]);
        setSelectedUser(null);
        setSelectedUserDetails(null);
        setApiError(null);

        try {
            const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Search failed');
            setSearchResults(data.users || []);
        } catch (error: any) {
            setApiError(error.message || "Failed to search for users.");
        } finally {
            setIsLoadingSearch(false);
        }
    };

    // --- User Details Fetching ---
    const fetchUserDetails = async (targetUser: SearchUserResult | OnlineUser) => {
        const targetId = (targetUser as SearchUserResult).id || (targetUser as OnlineUser).uid;
        if (!targetId) return;

        setSelectedUser({ id: targetId, ...targetUser });
        setIsLoadingDetails(true);
        setSelectedUserDetails(null);
        setApiError(null);
        
        try {
            const response = await fetch(`/api/admin/users/${targetId}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to fetch user details');
            setSelectedUserDetails(data);
        } catch (error: any) {
            setApiError(error.message || "Failed to load user details.");
        } finally {
            setIsLoadingDetails(false);
        }
    };
    
    // Helper to clear selection and return to search results
    const clearSelection = () => {
        setSelectedUser(null);
        setSelectedUserDetails(null);
        setApiError(null);
        setEditingSaveGameId(null);
    };

    // --- NEW: Game Save Edit Handlers ---
    const handleEditSave = (save: UserGameSave) => {
        setEditingSaveGameId(save.game_id);
        try {
            // Pretty-print the JSON object for readability in the textarea
            setEditingSaveData(JSON.stringify(save.save_data, null, 2));
        } catch {
            setEditingSaveData('Error: Could not parse save data.');
        }
    };

    const handleSaveEdit = async () => {
        if (!selectedUser || !editingSaveGameId) return;
        
        // Validate JSON before sending
        try {
            JSON.parse(editingSaveData);
        } catch (e) {
            setApiError("Invalid JSON format. Please correct it and try again.");
            return;
        }

        setIsSavingEdit(true);
        setApiError(null);
        try {
            const response = await fetch(`/api/admin/users/${selectedUser.id}/gameSaves/${editingSaveGameId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ saveData: editingSaveData })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.details || 'Failed to save data.');
            
            setEditingSaveGameId(null); // Close editor on success
            await fetchUserDetails(selectedUser); // Refresh data
        } catch (error: any) {
            setApiError(error.message);
        } finally {
            setIsSavingEdit(false);
        }
    };


    return (
        <div className={styles.adminContainer}>
            <h1>Admin Panel</h1>

            <section className={styles.section}>
                <h2>Live Analytics</h2>
                <div className={styles.onlineUsersSection}>
                    <h3><FiUsers /> Online Users: ({isLoadingOnline ? '...' : onlineUsers.length})</h3>
                    {isLoadingOnline ? <p className={styles.loadingText}>Loading online users...</p> : onlineUsers.length > 0 ? (
                        <ul className={styles.onlineList}>
                            {onlineUsers.map(onlineUser => (
                                <li key={onlineUser.uid} onClick={() => fetchUserDetails(onlineUser)} title={`Click to view details for ${onlineUser.uid}`}>
                                    <FiCircle className={styles.onlineIndicator} />
                                    <span className={styles.onlineName}>{onlineUser.display_name || onlineUser.username || '(No Name)'}</span>
                                    {onlineUser.activity && (<span className={styles.onlineUsername}>({onlineUser.activity.name})</span>)}
                                    <button className={styles.viewButtonSmall} title="View Details"><FiEye/></button>
                                </li>
                            ))}
                        </ul>
                    ) : <p className={styles.noItemsText}>No users currently online.</p>}
                </div>
            </section>

            <section className={styles.section}>
                <h2>User Management</h2>
                {!selectedUser ? (
                    <>
                        <form onSubmit={handleSearch} className={styles.searchForm}>
                            <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by Username or Display Name..." className={styles.searchInput}/>
                            <button type="submit" className={styles.searchButton} disabled={isLoadingSearch || !searchQuery.trim()}>{isLoadingSearch ? <FiLoader className={styles.spinner} /> : <FiSearch />}</button>
                        </form>
                        {apiError && <p className={styles.errorText}>{apiError}</p>}
                        {searchResults.length > 0 && (
                            <div className={styles.searchResults}>
                                <h3>Search Results ({searchResults.length})</h3>
                                <ul>
                                    {searchResults.map(u => (
                                        <li key={u.id} onClick={() => fetchUserDetails(u)}>
                                            <span>{u.display_name || u.username}</span>
                                            <small>({u.id})</small>
                                            <button className={styles.viewButton} title="View Details"><FiEye/></button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {!isLoadingSearch && searchQuery && searchResults.length === 0 && <p className={styles.noResults}>No users found.</p>}
                    </>
                ) : (
                     <div className={styles.userDetails}>
                        <button onClick={clearSelection} className={styles.backButton}><FiArrowLeft /> Back to Search</button>
                        <h3>Details for {(selectedUser as any).display_name || selectedUser.username || (selectedUser as any).id}</h3>
                        {isLoadingDetails ? <p className={styles.loadingText}>Loading details...</p> : apiError ? <p className={styles.errorText}>{apiError}</p> : selectedUserDetails ? (
                            <div className={styles.detailsContent}>
                                <h4>Profile</h4>
                                <pre>{JSON.stringify(selectedUserDetails.profile || {}, null, 2)}</pre>
                                
                                <h4>Recently Played ({selectedUserDetails.recentlyPlayed?.length || 0})</h4>
                                <ul className={styles.dataList}>
                                    {selectedUserDetails.recentlyPlayed?.length > 0 ? selectedUserDetails.recentlyPlayed.map(p => (
                                        <li key={p.id}> 
                                            {p.games?.name || p.game_id}
                                            <small>(Played: {formatTimestamp(p.last_played)})</small>
                                        </li>
                                    )) : <li>No recent activity.</li>}
                                </ul>

                                <h4>Game Ratings ({selectedUserDetails.gameRatings?.length || 0})</h4>
                                <ul className={styles.dataList}>
                                    {selectedUserDetails.gameRatings?.length > 0 ? selectedUserDetails.gameRatings.map(r => (
                                        <li key={r.game_id}>
                                            {r.games?.name || r.game_id}: <strong>{r.rating}/5</strong>
                                            <small>(Rated: {formatTimestamp(r.rated_at)})</small>
                                        </li>
                                    )) : <li>No ratings.</li>}
                                </ul>

                                <h4>Game Saves ({selectedUserDetails.gameSaves?.length || 0})</h4>
                                <ul className={styles.dataList}>
                                    {selectedUserDetails.gameSaves?.length > 0 ? selectedUserDetails.gameSaves.map(s => (
                                        <li key={s.game_id}>
                                            <div className={styles.saveHeader}>
                                                <div>
                                                    <strong>{s.games?.name || s.game_id}</strong>
                                                    <small>(Saved: {formatTimestamp(s.saved_at)})</small>
                                                </div>
                                                <button onClick={() => handleEditSave(s)} className={styles.editButton} disabled={editingSaveGameId === s.game_id}>
                                                    <FiEdit /> Edit
                                                </button>
                                            </div>

                                            {editingSaveGameId === s.game_id ? (
                                                <div className={styles.editArea}>
                                                    <textarea
                                                        value={editingSaveData}
                                                        onChange={(e) => setEditingSaveData(e.target.value)}
                                                        className={styles.saveTextarea}
                                                        spellCheck="false"
                                                    />
                                                    <div className={styles.editActions}>
                                                        <button onClick={() => setEditingSaveGameId(null)} className={styles.cancelEditButton} disabled={isSavingEdit}>
                                                            Cancel
                                                        </button>
                                                        <button onClick={handleSaveEdit} className={styles.saveEditButton} disabled={isSavingEdit}>
                                                            {isSavingEdit ? <FiLoader className={styles.spinner} /> : <FiSave />} Save
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <pre className={styles.savePreview}>{JSON.stringify(s.save_data, null, 2)}</pre>
                                            )}
                                        </li>
                                    )) : <li>No game saves.</li>}
                                </ul>
                            </div>
                        ) : <p>No details found.</p>}
                     </div>
                )}
            </section>

            <section className={styles.section}>
                <h2>Client Device Controller</h2>
                <div className={styles.mainPanel}>
                    <AdminPanel />
                </div>
            </section>
        </div>
    );
};

export default AdminPage;
