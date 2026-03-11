import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/constants';

const VENDORS_URL = `${API_URL}/vendors`;

const getToken = (thunkAPI: any) => {
    try {
        const state = thunkAPI.getState() as any;
        if (state.auth?.user?.token) return state.auth.user.token;
    } catch (e) { }

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

// Create new vendor
export const createVendor = createAsyncThunk(
    'vendors/create',
    async (vendorData: any, thunkAPI) => {
        try {
            const token = getToken(thunkAPI);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post(VENDORS_URL, vendorData, config);
            return response.data;
        } catch (error: any) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get all vendors
export const getVendors = createAsyncThunk(
    'vendors/getAll',
    async (_, thunkAPI) => {
        try {
            const token = getToken(thunkAPI);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(VENDORS_URL, config);
            return response.data;
        } catch (error: any) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Delete vendor
export const deleteVendor = createAsyncThunk(
    'vendors/delete',
    async (id: string, thunkAPI) => {
        try {
            const token = getToken(thunkAPI);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`${VENDORS_URL}/${id}`, config);
            return id;
        } catch (error: any) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Update vendor
export const updateVendor = createAsyncThunk(
    'vendors/update',
    async ({ id, vendorData }: { id: string, vendorData: any }, thunkAPI) => {
        try {
            const token = getToken(thunkAPI);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.put(`${VENDORS_URL}/${id}`, vendorData, config);
            return response.data;
        } catch (error: any) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

interface VendorState {
    vendors: any[];
    isError: boolean;
    isSuccess: boolean;
    isLoading: boolean;
    message: string;
}

const initialState: VendorState = {
    vendors: [],
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',
};

export const vendorSlice = createSlice({
    name: 'vendor',
    initialState,
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
            .addCase(createVendor.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createVendor.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.vendors.push(action.payload);
            })
            .addCase(createVendor.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(getVendors.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getVendors.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.vendors = action.payload;
            })
            .addCase(getVendors.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(deleteVendor.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteVendor.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.vendors = state.vendors.filter((v) => v._id !== action.payload);
            })
            .addCase(deleteVendor.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(updateVendor.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateVendor.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const index = state.vendors.findIndex((v) => v._id === action.payload._id);
                if (index !== -1) {
                    state.vendors[index] = action.payload;
                }
            })
            .addCase(updateVendor.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            });
    },
});

export const { reset } = vendorSlice.actions;
export default vendorSlice.reducer;
