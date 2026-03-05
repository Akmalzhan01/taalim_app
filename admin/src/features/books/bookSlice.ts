import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/constants';

const BOOKS_URL = `${API_URL}/books/`;

// Helper to get token
const getToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

// Async Thunks
export const getBooks = createAsyncThunk('books/getAll', async (branchId: string | undefined, thunkAPI) => {
    try {
        const url = branchId ? `${BOOKS_URL}?branch=${branchId}` : BOOKS_URL;
        const response = await axios.get(url);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const createBook = createAsyncThunk('books/create', async (bookData: any, thunkAPI) => {
    try {
        const token = getToken();
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.post(BOOKS_URL, bookData, config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const updateBook = createAsyncThunk('books/update', async ({ id, bookData }: { id: string, bookData: any }, thunkAPI) => {
    try {
        const token = getToken();
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.put(BOOKS_URL + id, bookData, config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const deleteBook = createAsyncThunk('books/delete', async (id: string, thunkAPI) => {
    try {
        const token = getToken();
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        await axios.delete(BOOKS_URL + id, config);
        return id;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

const bookSlice = createSlice({
    name: 'books',
    initialState: {
        books: [],
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
            .addCase(getBooks.pending, (state) => { state.isLoading = true; })
            .addCase(getBooks.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.books = action.payload;
            })
            .addCase(getBooks.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(createBook.pending, (state) => { state.isLoading = true; })
            .addCase(createBook.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.books.push(action.payload as never);
            })
            .addCase(createBook.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(deleteBook.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.books = state.books.filter((book: any) => book._id !== action.payload) as never;
            })
            .addCase(updateBook.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const index = state.books.findIndex((book: any) => book._id === action.payload._id);
                if (index !== -1) {
                    state.books[index] = action.payload as never;
                }
            });
    },
});

export const { reset } = bookSlice.actions;
export default bookSlice.reducer;
