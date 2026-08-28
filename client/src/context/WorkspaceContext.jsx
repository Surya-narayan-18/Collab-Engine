import { createContext, useContext, useState, useCallback } from "react";
import { get, post, del } from "../lib/api";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
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

  const addMember = useCallback(async (workspaceId, email) => {
    const res = await post(`/workspaces/${workspaceId}/members`, { email });
    // Refresh workspace to update member count
    const wsRes = await get(`/workspaces/${workspaceId}`);
    setCurrentWorkspace(wsRes.data.workspace);
    return res.data.member;
  }, []);

  const removeMember = useCallback(async (workspaceId, userId) => {
    await del(`/workspaces/${workspaceId}/members/${userId}`);
    // Refresh workspace to update member list
    const wsRes = await get(`/workspaces/${workspaceId}`);
    setCurrentWorkspace(wsRes.data.workspace);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        channels,
        currentChannel,
        loading,
        fetchWorkspaces,
        selectWorkspace,
        selectChannel,
        createWorkspace,
        joinChannel,
        addMember,
        removeMember,
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
