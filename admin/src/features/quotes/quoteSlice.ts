import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/constants';

const QUOTES_URL = `${API_URL}/quotes/`;

// Get quotes
export const getQuotes = createAsyncThunk(
    'quotes/getAll',
    async (_, thunkAPI: any) => {
        try {
            const response = await axios.get(QUOTES_URL);
            return response.data;
        } catch (error: any) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Create quote
export const createQuote = createAsyncThunk(
    'quotes/create',
    async (quoteData: any, thunkAPI: any) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.post(QUOTES_URL, quoteData, config);
            return response.data;
        } catch (error: any) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Update quote
export const updateQuote = createAsyncThunk(
    'quotes/update',
    async ({ id, quoteData }: any, thunkAPI: any) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.put(QUOTES_URL + id, quoteData, config);
            return response.data;
        } catch (error: any) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Delete quote
export const deleteQuote = createAsyncThunk(
    'quotes/delete',
    async (id: string, thunkAPI: any) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            await axios.delete(QUOTES_URL + id, config);
            return id;
        } catch (error: any) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const quoteSlice = createSlice({
    name: 'quote',
    initialState: {
        quotes: [],
        isLoading: false,
        isError: false,
        isSuccess: false,
        message: '',
    },
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.isSuccess = false;
            state.message = '';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getQuotes.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getQuotes.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.quotes = action.payload;
            })
            .addCase(getQuotes.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(createQuote.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createQuote.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.quotes.unshift(action.payload as never);
            })
            .addCase(createQuote.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(updateQuote.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateQuote.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const index = state.quotes.findIndex((quote: any) => quote._id === action.payload._id);
                if (index !== -1) {
                    state.quotes[index] = action.payload as never;
                }
            })
            .addCase(updateQuote.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(deleteQuote.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteQuote.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.quotes = state.quotes.filter((quote: any) => quote._id !== action.payload);
            })
            .addCase(deleteQuote.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset } = quoteSlice.actions;
export default quoteSlice.reducer;
