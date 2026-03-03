import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/kanban-columns/';

interface KanbanColumnState {
    columns: any[];
    isError: boolean;
    isSuccess: boolean;
    isLoading: boolean;
    message: string;
}

const initialState: KanbanColumnState = {
    columns: [],
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: ''
};

// Create new column
export const createKanbanColumn = createAsyncThunk('kanbanColumns/create', async (columnData: any, thunkAPI: any) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.post(API_URL, columnData, config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Get columns
export const getKanbanColumns = createAsyncThunk('kanbanColumns/getAll', async (branchId: string | undefined, thunkAPI: any) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = {
            headers: { Authorization: `Bearer ${token}` },
            params: { branch: branchId }
        };
        const response = await axios.get(API_URL, config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Update column
export const updateKanbanColumn = createAsyncThunk('kanbanColumns/update', async (columnData: any, thunkAPI: any) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { id, ...data } = columnData;
        const response = await axios.put(API_URL + id, data, config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Delete column
export const deleteKanbanColumn = createAsyncThunk('kanbanColumns/delete', async (id: string, thunkAPI: any) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(API_URL + id, config);
        return id;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Reorder columns
export const reorderKanbanColumns = createAsyncThunk('kanbanColumns/reorder', async (items: any, thunkAPI: any) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.put(API_URL + 'reorder', { items }, config);
        return items;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const kanbanColumnSlice = createSlice({
    name: 'kanbanColumn',
    initialState,
    reducers: {
        resetColumnsState: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.isSuccess = false;
            state.message = '';
        },
        setOptimisticColumns: (state, action) => {
            state.columns = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(createKanbanColumn.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createKanbanColumn.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.columns.push(action.payload);
            })
            .addCase(createKanbanColumn.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(getKanbanColumns.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getKanbanColumns.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.columns = action.payload;
            })
            .addCase(getKanbanColumns.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(updateKanbanColumn.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.columns = state.columns.map(col => col._id === action.payload._id ? action.payload : col);
            })
            .addCase(deleteKanbanColumn.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.columns = state.columns.filter(col => col._id !== action.payload);
            })
            .addCase(reorderKanbanColumns.fulfilled, (state) => {
                state.isLoading = false;
                state.isSuccess = true;
                // Optimization handles moving logic, this is just successful confirmation
                // action.payload is the array of items with IDs and new orders
                // We've already optimistically updated the state using setOptimisticColumns
            })
    }
});

export const { resetColumnsState, setOptimisticColumns } = kanbanColumnSlice.actions;
export default kanbanColumnSlice.reducer;
