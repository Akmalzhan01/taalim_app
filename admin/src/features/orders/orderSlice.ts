import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/constants';

const ORDERS_URL = `${API_URL}/orders`;

// Helper to get token
const getToken = (thunkAPI: any) => {
    try {
        const state = thunkAPI.getState() as any;
        if (state.auth?.user?.token) return state.auth.user.token;
    } catch (e) { }

    // Fallback to localStorage just in case Redux state is out of sync
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};


// Get all orders (Admin)
export const getOrders = createAsyncThunk(
    'orders/getAll',
    async (branchId: string | undefined, thunkAPI: any) => {
        try {
            const token = getToken(thunkAPI);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: { branch: branchId }
            };
            const response = await axios.get(ORDERS_URL, config);
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

// Update order to delivered
export const deliverOrder = createAsyncThunk(
    'orders/deliver',
    async (id: string, thunkAPI: any) => {
        try {
            const token = getToken(thunkAPI);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.put(`${ORDERS_URL}/${id}/deliver`, {}, config);
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

// Get order details
export const getOrderDetails = createAsyncThunk(
    'orders/getDetails',
    async (id: string, thunkAPI: any) => {
        try {
            const token = getToken(thunkAPI);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.get(`${ORDERS_URL}/${id}`, config);
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

// Get orders by user
export const getOrdersByUser = createAsyncThunk(
    'orders/getByUser',
    async (userId: string, thunkAPI: any) => {
        try {
            const token = getToken(thunkAPI);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.get(`${ORDERS_URL}/user/${userId}`, config);
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

// Get dashboard stats
export const getDashboardStats = createAsyncThunk(
    'orders/getStats',
    async (branchId: string | undefined, thunkAPI: any) => {
        try {
            const token = getToken(thunkAPI);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: { branch: branchId }
            };
            const response = await axios.get(`${ORDERS_URL}/stats`, config);
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




// Refund order
export const refundOrder = createAsyncThunk(
    'orders/refund',
    async (id: string, thunkAPI: any) => {
        try {
            const token = getToken(thunkAPI);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.put(`${ORDERS_URL}/${id}/refund`, {}, config);
            return response.data;
        } catch (error: any) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get Z-Report
export const getZReport = createAsyncThunk(
    'orders/zReport',
    async (branchId: string | undefined, thunkAPI: any) => {
        try {
            const token = getToken(thunkAPI);
            const config = {
                headers: { Authorization: `Bearer ${token}` },
                params: { branch: branchId }
            };
            const response = await axios.get(`${ORDERS_URL}/z-report`, config);
            return response.data;
        } catch (error: any) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Create new order (Admin/POS)
export const createOrderAdmin = createAsyncThunk(
    'orders/createAdmin',
    async (orderData: any, thunkAPI: any) => {
        try {
            const token = getToken(thunkAPI);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.post(`${ORDERS_URL}/admin`, orderData, config);
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

const orderSlice = createSlice({
    name: 'orderList',
    initialState: {
        orders: [],
        order: {},
        userOrders: [], // Store history for specific user
        stats: null, // Dashboard statistics
        zReport: null as any, // Z-Report statistics
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
            .addCase(getOrders.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getOrders.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.orders = action.payload;
            })
            .addCase(getOrders.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(getOrderDetails.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getOrderDetails.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.order = action.payload;
            })
            .addCase(getOrderDetails.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(getOrdersByUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getOrdersByUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.userOrders = action.payload;
            })
            .addCase(getOrdersByUser.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(getDashboardStats.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getDashboardStats.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.stats = action.payload;
            })
            .addCase(getDashboardStats.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(createOrderAdmin.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createOrderAdmin.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.orders.push(action.payload as never); // Add to local list
            })
            .addCase(createOrderAdmin.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(deliverOrder.fulfilled, (state, action) => {
                // Update the single order in the list
                const idx = state.orders.findIndex((x: any) => x._id === action.payload._id);
                if (idx !== -1) {
                    state.orders[idx] = action.payload as never;
                }
                state.order = action.payload; // Also update the detailed view if active
            })
            .addCase(refundOrder.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(refundOrder.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const idx = state.orders.findIndex((x: any) => x._id === action.payload._id);
                if (idx !== -1) {
                    state.orders[idx] = action.payload as never;
                }
                state.order = action.payload;
            })
            .addCase(refundOrder.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(getZReport.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getZReport.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.zReport = action.payload;
            })
            .addCase(getZReport.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset } = orderSlice.actions;
export default orderSlice.reducer;
