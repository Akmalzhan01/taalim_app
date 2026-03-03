import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/constants';

const SOCIAL_LINKS_URL = `${API_URL}/social-links/`;

// Helper to get token
const getToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

// Async Thunks
export const getSocialLinks = createAsyncThunk('socialLinks/getAll', async (_, thunkAPI) => {
    try {
        const response = await axios.get(SOCIAL_LINKS_URL + 'admin', {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const createSocialLink = createAsyncThunk('socialLinks/create', async (linkData: any, thunkAPI) => {
    try {
        const token = getToken();
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.post(SOCIAL_LINKS_URL, linkData, config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const updateSocialLink = createAsyncThunk('socialLinks/update', async ({ id, linkData }: any, thunkAPI) => {
    try {
        const token = getToken();
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.put(SOCIAL_LINKS_URL + id, linkData, config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const deleteSocialLink = createAsyncThunk('socialLinks/delete', async (id: string, thunkAPI) => {
    try {
        const token = getToken();
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        await axios.delete(SOCIAL_LINKS_URL + id, config);
        return id;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

const socialLinkSlice = createSlice({
    name: 'socialLinks',
    initialState: {
        socialLinks: [],
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
            .addCase(getSocialLinks.pending, (state) => { state.isLoading = true; })
            .addCase(getSocialLinks.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.socialLinks = action.payload;
            })
            .addCase(getSocialLinks.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(createSocialLink.pending, (state) => { state.isLoading = true; })
            .addCase(createSocialLink.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.socialLinks.push(action.payload as never);
            })
            .addCase(createSocialLink.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(updateSocialLink.pending, (state) => { state.isLoading = true; })
            .addCase(updateSocialLink.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const index = state.socialLinks.findIndex((link: any) => link._id === action.payload._id);
                if (index !== -1) {
                    state.socialLinks[index] = action.payload as never;
                }
            })
            .addCase(updateSocialLink.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(deleteSocialLink.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.socialLinks = state.socialLinks.filter((link: any) => link._id !== action.payload) as never;
            });
    },
});

export const { reset } = socialLinkSlice.actions;
export default socialLinkSlice.reducer;
