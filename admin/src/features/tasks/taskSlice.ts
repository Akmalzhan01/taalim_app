import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/constants';

const TASKS_URL = `${API_URL}/tasks/`;

interface TaskState {
    tasks: any[];
    isError: boolean;
    isSuccess: boolean;
    isLoading: boolean;
    message: string;
}

const initialState: TaskState = {
    tasks: [],
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: ''
};

// Get all tasks
export const getTasks = createAsyncThunk('tasks/getAll', async (branchId: string | undefined, thunkAPI: any) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = {
            headers: { Authorization: `Bearer ${token}` },
            params: { branch: branchId }
        };
        const response = await axios.get(TASKS_URL, config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Create task
export const createTask = createAsyncThunk('tasks/create', async (taskData: any, thunkAPI: any) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.post(TASKS_URL, taskData, config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Update task
export const updateTask = createAsyncThunk('tasks/update', async (taskData: any, thunkAPI: any) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.put(TASKS_URL + taskData.id, taskData, config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Delete task
export const deleteTask = createAsyncThunk('tasks/delete', async (id: string, thunkAPI: any) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(TASKS_URL + id, config);
        return id;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Reorder tasks
export const reorderTasks = createAsyncThunk('tasks/reorder', async (items: any[], thunkAPI: any) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.put(TASKS_URL + 'reorder', { items }, config);
        return items; // return items to update local state efficiently without fetching again
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const taskSlice = createSlice({
    name: 'task',
    initialState,
    reducers: {
        reset: () => initialState,
        // Optimistic update for drag and drop
        setOptimisticTasks: (state, action) => {
            state.tasks = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getTasks.pending, (state) => { state.isLoading = true; })
            .addCase(getTasks.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.tasks = action.payload;
            })
            .addCase(getTasks.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(createTask.pending, (state) => { state.isLoading = true; })
            .addCase(createTask.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.tasks.push(action.payload);
            })
            .addCase(createTask.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(updateTask.fulfilled, (state, action) => {
                const index = state.tasks.findIndex(task => task._id === action.payload._id);
                if (index !== -1) {
                    state.tasks[index] = action.payload;
                }
            })
            .addCase(deleteTask.fulfilled, (state, action) => {
                state.tasks = state.tasks.filter(task => task._id !== action.payload);
            })
            // Reorder doesn't need to do much as we handle it optimistically, 
            // but we can catch errors and refetch if needed.
            .addCase(reorderTasks.rejected, (state, action) => {
                state.isError = true;
                state.message = action.payload as string;
            });
    }
});

export const { reset, setOptimisticTasks } = taskSlice.actions;
export default taskSlice.reducer;
