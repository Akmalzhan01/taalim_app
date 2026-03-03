import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/constants';

const SETTINGS_URL = `${API_URL}/settings/`;

// Helper to get token
const getToken = (thunkAPI: any) => {
    try {
        const state = thunkAPI.getState() as any;
        if (state.auth?.user?.token) return state.auth.user.token;
    } catch (e) { }

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

// Get settings
export const getSettings = createAsyncThunk('settings/get', async (_, thunkAPI) => {
    try {
        const response = await axios.get(SETTINGS_URL);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

// Update settings
export const updateSettings = createAsyncThunk('settings/update', async (settingData: any, thunkAPI) => {
    try {
        const token = getToken(thunkAPI);
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.put(SETTINGS_URL, settingData, config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

const settingSlice = createSlice({
    name: 'settings',
    initialState: {
        settings: null as any,
        isLoading: false,
        isError: false,
        isSuccess: false,
        message: '',
    },
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
            .addCase(getSettings.pending, (state) => { state.isLoading = true; })
            .addCase(getSettings.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.settings = action.payload;
            })
            .addCase(getSettings.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(updateSettings.pending, (state) => { state.isLoading = true; })
            .addCase(updateSettings.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.settings = action.payload;
            })
            .addCase(updateSettings.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            });
    },
});

export const { reset } = settingSlice.actions;
export default settingSlice.reducer;
