import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/constants';

const USERS_URL = `${API_URL}/users/`;

// Get all users (Admin)
export const getUsers = createAsyncThunk(
    'users/getAll',
    async (branchId: string | undefined, thunkAPI: any) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: { branch: branchId }
            };
            const response = await axios.get(USERS_URL, config);
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

// Delete user
export const deleteUser = createAsyncThunk(
    'users/delete',
    async (id: string, thunkAPI: any) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            await axios.delete(`${USERS_URL}${id}`, config);
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

// Get user details
export const getUserDetails = createAsyncThunk(
    'users/getDetails',
    async (id: string, thunkAPI: any) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.get(`${USERS_URL}${id}`, config);
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

// Update user
export const updateUser = createAsyncThunk(
    'users/update',
    async (user: any, thunkAPI: any) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const { _id, ...data } = user;
            const response = await axios.put(`${USERS_URL}${_id}`, data, config);
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

// Admin create user
export const adminCreateUser = createAsyncThunk(
    'users/adminCreate',
    async (userData: any, thunkAPI: any) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.post(`${USERS_URL}admin`, userData, config);
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

const userSlice = createSlice({
    name: 'userList',
    initialState: {
        users: [],
        user: {},
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
            .addCase(getUsers.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getUsers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.users = action.payload;
            })
            .addCase(getUsers.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(deleteUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.users = state.users.filter((user: any) => user._id !== action.payload);
            })
            .addCase(deleteUser.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(getUserDetails.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getUserDetails.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
            })
            .addCase(getUserDetails.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(updateUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload;
            })
            .addCase(updateUser.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(adminCreateUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(adminCreateUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.users.push(action.payload as never);
            })
            .addCase(adminCreateUser.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset } = userSlice.actions;
export default userSlice.reducer;
