import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/constants';

const BRANCHES_URL = `${API_URL}/branches/`;

const getToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

export const getBranches = createAsyncThunk('branches/getAll', async (_, thunkAPI) => {
    try {
        const token = getToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(BRANCHES_URL, config);
        return response.data;
    } catch (error: any) {
        const message = error.response?.data?.message || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const createBranch = createAsyncThunk('branches/create', async (branchData: any, thunkAPI) => {
    try {
        const token = getToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.post(BRANCHES_URL, branchData, config);
        return response.data;
    } catch (error: any) {
        const message = error.response?.data?.message || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const updateBranch = createAsyncThunk('branches/update', async ({ id, branchData }: any, thunkAPI) => {
    try {
        const token = getToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.put(BRANCHES_URL + id, branchData, config);
        return response.data;
    } catch (error: any) {
        const message = error.response?.data?.message || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const deleteBranch = createAsyncThunk('branches/delete', async (id: string, thunkAPI) => {
    try {
        const token = getToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(BRANCHES_URL + id, config);
        return id;
    } catch (error: any) {
        const message = error.response?.data?.message || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

const branchSlice = createSlice({
    name: 'branches',
    initialState: {
        branches: [],
        selectedBranch: localStorage.getItem('selectedBranch') || '',
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
        setSelectedBranch: (state, action) => {
            state.selectedBranch = action.payload;
            localStorage.setItem('selectedBranch', action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getBranches.pending, (state) => { state.isLoading = true; })
            .addCase(getBranches.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.branches = action.payload;
            })
            .addCase(getBranches.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(createBranch.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.branches.push(action.payload as never);
            })
            .addCase(updateBranch.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const index = state.branches.findIndex((b: any) => b._id === action.payload._id);
                if (index !== -1) {
                    state.branches[index] = action.payload as never;
                }
            })
            .addCase(deleteBranch.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.branches = state.branches.filter((b: any) => b._id !== action.payload) as never;
            });
    },
});

export const { reset, setSelectedBranch } = branchSlice.actions;
export default branchSlice.reducer;
