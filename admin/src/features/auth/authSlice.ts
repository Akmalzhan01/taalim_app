import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/constants';

// Define API URL
const AUTH_URL = `${API_URL}/users`;

interface User {
    _id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    role: 'superadmin' | 'manager' | 'cashier';
    branch?: {
        _id: string;
        name: string;
    };
    permissions?: string[];
    token: string;
}

interface AuthState {
    user: User | null;
    isError: boolean;
    isSuccess: boolean;
    isLoading: boolean;
    message: string;
}

// Get user from localStorage
const user = JSON.parse(localStorage.getItem('user') || 'null');

const initialState: AuthState = {
    user: user ? user : null,
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',
};

// Login user
export const login = createAsyncThunk('auth/login', async (userData: any, thunkAPI) => {
    try {
        const response = await axios.post(AUTH_URL + '/login', userData);
        if (response.data) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Logout user
export const logout = createAsyncThunk('auth/logout', async () => {
    localStorage.removeItem('user');
});

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
                state.user = null;
            })
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
            });
    },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;
