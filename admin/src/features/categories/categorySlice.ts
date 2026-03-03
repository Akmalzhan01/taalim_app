import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/constants';

const CATEGORIES_URL = `${API_URL}/categories/`;

// Helper to get token
const getToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

// Async Thunks
export const getCategories = createAsyncThunk('categories/getAll', async (_, thunkAPI) => {
    try {
        const response = await axios.get(CATEGORIES_URL);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const createCategory = createAsyncThunk('categories/create', async (categoryData: any, thunkAPI) => {
    try {
        const token = getToken();
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.post(CATEGORIES_URL, categoryData, config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const updateCategory = createAsyncThunk('categories/update', async ({ id, categoryData }: any, thunkAPI) => {
    try {
        const token = getToken();
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.put(CATEGORIES_URL + id, categoryData, config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const deleteCategory = createAsyncThunk('categories/delete', async (id: string, thunkAPI) => {
    try {
        const token = getToken();
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        await axios.delete(CATEGORIES_URL + id, config);
        return id;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

const categorySlice = createSlice({
    name: 'categories',
    initialState: {
        categories: [],
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
            .addCase(getCategories.pending, (state) => { state.isLoading = true; })
            .addCase(getCategories.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.categories = action.payload;
            })
            .addCase(getCategories.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(createCategory.pending, (state) => { state.isLoading = true; })
            .addCase(createCategory.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.categories.push(action.payload as never);
            })
            .addCase(createCategory.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(updateCategory.pending, (state) => { state.isLoading = true; })
            .addCase(updateCategory.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const index = state.categories.findIndex((category: any) => category._id === action.payload._id);
                if (index !== -1) {
                    state.categories[index] = action.payload as never;
                }
            })
            .addCase(updateCategory.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.categories = state.categories.filter((category: any) => category._id !== action.payload) as never;
            });
    },
});

export const { reset } = categorySlice.actions;
export default categorySlice.reducer;
