import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/constants';

const BOOKS_URL = `${API_URL}/books/`;

// Helper to get token
const getToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

export interface BookQuery {
    branch?: string;
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    stock?: 'all' | 'in' | 'out';
    sort?: string;
}

const buildParams = (arg: string | BookQuery | undefined) => {
    const params = new URLSearchParams({ showAll: 'true' });
    const query: BookQuery = typeof arg === 'string' || arg === undefined ? { branch: arg } : arg;

    if (query.branch) params.set('branch', query.branch);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.search) params.set('search', query.search);
    if (query.category && query.category !== 'all') params.set('category', query.category);
    if (query.stock && query.stock !== 'all') params.set('stock', query.stock);
    if (query.sort) params.set('sort', query.sort);

    return params;
};

// Async Thunks
// Pass a page/limit for a paginated slice, or just a branch id for the whole list.
export const getBooks = createAsyncThunk('books/getAll', async (arg: string | BookQuery | undefined, thunkAPI) => {
    try {
        const response = await axios.get(`${BOOKS_URL}?${buildParams(arg).toString()}`);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

// Unpaginated list for pickers (bundle contents, supply items) that need every book.
export const getAllBooks = createAsyncThunk('books/getAllUnpaged', async (branchId: string | undefined, thunkAPI) => {
    try {
        const response = await axios.get(`${BOOKS_URL}?${buildParams(branchId).toString()}`);
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
        books: [] as any[],
        allBooks: [] as any[],
        page: 1,
        pages: 1,
        total: 0,
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
                const payload = action.payload;
                if (Array.isArray(payload)) {
                    state.books = payload;
                    state.page = 1;
                    state.pages = 1;
                    state.total = payload.length;
                } else {
                    state.books = payload.books;
                    state.page = payload.page;
                    state.pages = payload.pages;
                    state.total = payload.total;
                }
            })
            .addCase(getAllBooks.fulfilled, (state, action) => {
                state.allBooks = action.payload;
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
