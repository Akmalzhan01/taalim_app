import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/constants';

const BANNERS_URL = `${API_URL}/banners/`;

// Helper to get token
const getToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

// Async Thunks
export const getBanners = createAsyncThunk('banners/getAll', async (_, thunkAPI) => {
    try {
        const response = await axios.get(BANNERS_URL);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const createBanner = createAsyncThunk('banners/create', async (bannerData: any, thunkAPI) => {
    try {
        const token = getToken();
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.post(BANNERS_URL, bannerData, config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const deleteBanner = createAsyncThunk('banners/delete', async (id: string, thunkAPI) => {
    try {
        const token = getToken();
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        await axios.delete(BANNERS_URL + id, config);
        return id;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

const bannerSlice = createSlice({
    name: 'banners',
    initialState: {
        banners: [],
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
            .addCase(getBanners.pending, (state) => { state.isLoading = true; })
            .addCase(getBanners.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.banners = action.payload;
            })
            .addCase(getBanners.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(createBanner.pending, (state) => { state.isLoading = true; })
            .addCase(createBanner.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.banners.push(action.payload as never);
            })
            .addCase(createBanner.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(deleteBanner.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.banners = state.banners.filter((banner: any) => banner._id !== action.payload) as never;
            });
    },
});

export const { reset } = bannerSlice.actions;
export default bannerSlice.reducer;
