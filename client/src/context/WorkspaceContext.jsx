import { createContext, useContext, useState, useCallback } from "react";
import { get, post, del, patch } from "../lib/api";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get("/workspaces");
      setWorkspaces(res.data.workspaces);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectWorkspace = useCallback(async (workspaceId) => {
    setLoading(true);
    try {
      const res = await get(`/workspaces/${workspaceId}`);
      setCurrentWorkspace(res.data.workspace);

      const chRes = await get(`/workspaces/${workspaceId}/channels`);
      setChannels(chRes.data.channels);
      setCurrentChannel(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectChannel = useCallback((channel) => {
    setCurrentChannel(channel);
  }, []);

  const createWorkspace = useCallback(async (name) => {
    const res = await post("/workspaces", { name });
    await fetchWorkspaces();
    return res.data.workspace;
  }, [fetchWorkspaces]);

  const joinChannel = useCallback(async (workspaceId, channelId) => {
    await post(`/workspaces/${workspaceId}/channels/${channelId}/join`);
    const chRes = await get(`/workspaces/${workspaceId}/channels`);
    setChannels(chRes.data.channels);
  }, []);

  const createChannel = useCallback(async (workspaceId, name) => {
    const res = await post(`/workspaces/${workspaceId}/channels`, { name });
    // Refresh channel list
    const chRes = await get(`/workspaces/${workspaceId}/channels`);
    setChannels(chRes.data.channels);
    return res.data.channel;
  }, []);

  // Send invitation — accepts { email } or { userId } (exactly one)
  const sendInvitation = useCallback(async (workspaceId, { email, userId }) => {
    const body = {};
    if (email) body.email = email;
    if (userId) body.userId = userId;
    const res = await post(`/workspaces/${workspaceId}/members`, body);
    return res.data.invitation;
  }, []);

  const removeMember = useCallback(async (workspaceId, userId) => {
    await del(`/workspaces/${workspaceId}/members/${userId}`);
    // Refresh workspace to update member list
    const wsRes = await get(`/workspaces/${workspaceId}`);
    setCurrentWorkspace(wsRes.data.workspace);
  }, []);

  const updateMemberRole = useCallback(async (workspaceId, userId, role) => {
    await patch(`/workspaces/${workspaceId}/members/${userId}`, { role });
    // Refresh workspace to update member list
    const wsRes = await get(`/workspaces/${workspaceId}`);
    setCurrentWorkspace(wsRes.data.workspace);
  }, []);

  const deleteWorkspace = useCallback(async (workspaceId) => {
    await del(`/workspaces/${workspaceId}`);
    // Clear current workspace if it was the deleted one
    setCurrentWorkspace((prev) => (prev?.id === workspaceId ? null : prev));
    // Refresh workspace list
    await fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Fetch pending invitations for the current user
  const fetchInvitations = useCallback(async () => {
    try {
      const res = await get("/workspaces/invitations");
      setInvitations(res.data.invitations);
    } catch {
      // Silently fail if invitations can't be fetched
    }
  }, []);

  // Accept an invitation
  const acceptInvitation = useCallback(async (invitationId) => {
    const res = await post(`/workspaces/invitations/${invitationId}/accept`);
    // Remove from local invitations list
    setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    // Refresh workspaces to include the newly joined workspace
    await fetchWorkspaces();
    return res.data;
  }, [fetchWorkspaces]);

  // Decline an invitation
  const declineInvitation = useCallback(async (invitationId) => {
    await post(`/workspaces/invitations/${invitationId}/decline`);
    // Remove from local invitations list
    setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        channels,
        currentChannel,
        invitations,
        loading,
        fetchWorkspaces,
        selectWorkspace,
        selectChannel,
        createWorkspace,
        joinChannel,
        createChannel,
        sendInvitation,
        removeMember,
        updateMemberRole,
        deleteWorkspace,
        fetchInvitations,
        acceptInvitation,
        declineInvitation,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
