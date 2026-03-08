import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/constants';

const CUSTOMERS_URL = `${API_URL}/customers/`;

// Helper to get token
const getToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

// Async Thunks
export const getCustomers = createAsyncThunk('customers/getAll', async (_, thunkAPI) => {
    try {
        const token = getToken();
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.get(CUSTOMERS_URL, config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const searchCustomerByPhone = createAsyncThunk('customers/search', async (phone: string, thunkAPI) => {
    try {
        const token = getToken();
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.get(`${CUSTOMERS_URL}search/${phone}`, config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const createCustomer = createAsyncThunk('customers/create', async (customerData: any, thunkAPI) => {
    try {
        const token = getToken();
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.post(CUSTOMERS_URL, customerData, config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const updateCustomer = createAsyncThunk('customers/update', async ({ id, customerData }: { id: string, customerData: any }, thunkAPI) => {
    try {
        const token = getToken();
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.put(CUSTOMERS_URL + id, customerData, config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const deleteCustomer = createAsyncThunk('customers/delete', async (id: string, thunkAPI) => {
    try {
        const token = getToken();
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        await axios.delete(CUSTOMERS_URL + id, config);
        return id;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

interface CustomerState {
    customers: any[];
    searchedCustomer: any | null;
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    message: string;
}

const initialState: CustomerState = {
    customers: [],
    searchedCustomer: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
    message: '',
};

const customerSlice = createSlice({
    name: 'customers',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
        resetSearch: (state) => {
            state.searchedCustomer = null;
        },
        setSearchedCustomer: (state, action) => {
            state.searchedCustomer = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getCustomers.pending, (state) => { state.isLoading = true; })
            .addCase(getCustomers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.customers = action.payload;
            })
            .addCase(getCustomers.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(searchCustomerByPhone.pending, (state) => { state.isLoading = true; })
            .addCase(searchCustomerByPhone.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.searchedCustomer = action.payload;
            })
            .addCase(searchCustomerByPhone.rejected, (state, action) => {
                state.isLoading = false;
                state.searchedCustomer = null;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(createCustomer.pending, (state) => { state.isLoading = true; })
            .addCase(createCustomer.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.customers.push(action.payload);
                state.searchedCustomer = action.payload; // Automatically select new customer
            })
            .addCase(createCustomer.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(updateCustomer.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const index = state.customers.findIndex(c => c._id === action.payload._id);
                if (index !== -1) {
                    state.customers[index] = action.payload;
                }
            })
            .addCase(deleteCustomer.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.customers = state.customers.filter(c => c._id !== action.payload);
            });
    },
});

export const { reset, resetSearch, setSearchedCustomer } = customerSlice.actions;
export default customerSlice.reducer;
