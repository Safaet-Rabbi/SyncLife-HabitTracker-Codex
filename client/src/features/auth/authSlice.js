import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as api from '../../api';

const token = localStorage.getItem('authToken');

export const loginUser = createAsyncThunk('auth/loginUser', async (credentials, { rejectWithValue }) => {
  try {
    const response = await api.login(credentials);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/registerUser', async (payload, { rejectWithValue }) => {
  try {
    const response = await api.register(payload);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed');
  }
});

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    if (!localStorage.getItem('authToken')) {
      const refreshResponse = await api.refreshSession();
      if (refreshResponse?.data?.token) {
        localStorage.setItem('authToken', refreshResponse.data.token);
      }
    }
    const response = await api.getMe();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Session expired');
  }
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { rejectWithValue }) => {
  try {
    await api.logoutSession();
    return true;
  } catch (error) {
    // Even if backend logout fails, we still clear local state.
    return rejectWithValue(error.response?.data?.message || 'Logout failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token,
    isLoading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('authToken');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('authToken', action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        const msg = String(action.payload || '').toLowerCase();
        if (msg.includes('token') || msg.includes('not authorized') || msg.includes('session')) {
          state.user = null;
          state.token = null;
          localStorage.removeItem('authToken');
        }
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('authToken', action.payload.token);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        const msg = String(action.payload || '').toLowerCase();
        if (msg.includes('token') || msg.includes('not authorized') || msg.includes('session')) {
          state.user = null;
          state.token = null;
          localStorage.removeItem('authToken');
        }
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.token = null;
        localStorage.removeItem('authToken');
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.error = null;
        localStorage.removeItem('authToken');
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.error = null;
        localStorage.removeItem('authToken');
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
