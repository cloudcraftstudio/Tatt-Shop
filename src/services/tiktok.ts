import { TikTokReel } from '../types';

export interface TikTokStatusResponse {
  configured: boolean;
  hasClientKey: boolean;
  hasClientSecret: boolean;
  clientKey: string;
  rawClientKey?: string;
  redirectUri: string;
  isConnected: boolean;
  user?: {
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  } | null;
  expiresAt?: number | null;
}

export interface TikTokVideosResponse {
  success: boolean;
  count: number;
  videos: TikTokReel[];
  user?: {
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  } | null;
  error?: string;
}

export const tiktokService = {
  async getStatus(): Promise<TikTokStatusResponse> {
    try {
      const res = await fetch('/api/tiktok/status');
      if (!res.ok) throw new Error(`Status HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Could not fetch TikTok status:', err);
      return {
        configured: false,
        hasClientKey: false,
        hasClientSecret: false,
        clientKey: '',
        redirectUri: `${window.location.origin}/api/tiktok/callback`,
        isConnected: false,
        user: null
      };
    }
  },

  async saveConfig(clientKey: string, clientSecret?: string, redirectUri?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/tiktok/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientKey,
          clientSecret,
          redirectUri
        })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to save config.' };
    }
  },

  async getAuthUrl(redirectUri?: string, scopes?: string): Promise<{ authUrl?: string; state?: string; redirectUri?: string; scopes?: string; error?: string }> {
    try {
      const url = new URL('/api/tiktok/auth-url', window.location.origin);
      if (redirectUri) {
        url.searchParams.set('redirectUri', redirectUri);
      }
      if (scopes) {
        url.searchParams.set('scopes', scopes);
      }
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Failed to generate authorization URL.' };
      }
      return data;
    } catch (err: any) {
      return { error: err.message || 'Network error while getting auth URL.' };
    }
  },

  async publishVideo(payload: {
    title: string;
    caption: string;
    privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
    disableDuet?: boolean;
    disableStitch?: boolean;
    disableComment?: boolean;
    videoDataUrl?: string;
    videoBlob?: Blob;
  }): Promise<{
    success: boolean;
    postId?: string;
    shareId?: string;
    status?: string;
    message?: string;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/tiktok/publish-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || `Publish failed HTTP ${res.status}`
        };
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error during video publishing.'
      };
    }
  },

  async fetchVideos(): Promise<TikTokVideosResponse> {
    try {
      const res = await fetch('/api/tiktok/videos');
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          count: 0,
          videos: [],
          error: data.error || `HTTP ${res.status}`
        };
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        count: 0,
        videos: [],
        error: err.message || 'Network error while fetching TikTok videos.'
      };
    }
  },

  async disconnect(): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/tiktok/disconnect', { method: 'POST' });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
};
