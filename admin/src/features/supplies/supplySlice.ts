import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/constants';

const SUPPLIES_URL = `${API_URL}/supplies`;

// Helper to get token
const getToken = (thunkAPI: any) => {
    try {
        const state = thunkAPI.getState() as any;
        if (state.auth?.user?.token) return state.auth.user.token;
    } catch (e) { }

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

// Create new supply
export const createSupply = createAsyncThunk(
    'supplies/create',
    async (supplyData: any, thunkAPI) => {
        try {
            const token = getToken(thunkAPI);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.post(SUPPLIES_URL, supplyData, config);
            return response.data;
        } catch (error: any) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get all supplies
export const getSupplies = createAsyncThunk(
    'supplies/getAll',
    async (branchId: string | undefined, thunkAPI) => {
        try {
            const token = getToken(thunkAPI);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: { branch: branchId }
            };
            const response = await axios.get(SUPPLIES_URL, config);
            return response.data;
        } catch (error: any) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Delete supply
export const deleteSupply = createAsyncThunk(
    'supplies/delete',
    async (id: string, thunkAPI) => {
        try {
            const token = getToken(thunkAPI);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            await axios.delete(SUPPLIES_URL + `/${id}`, config);
            return id;
        } catch (error: any) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get supply details
export const getSupplyDetails = createAsyncThunk(
    'supplies/getDetails',
    async (id: string, thunkAPI) => {
        try {
            const token = getToken(thunkAPI);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.get(SUPPLIES_URL + `/${id}`, config);
            return response.data;
        } catch (error: any) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

interface SupplyState {
    supplies: any[];
    supplyDetails: any;
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    message: string;
}

const initialState: SupplyState = {
    supplies: [],
    supplyDetails: null,
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',
};

export const supplySlice = createSlice({
    name: 'supply',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
        clearSupplyDetails: (state) => {
            state.supplyDetails = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(createSupply.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createSupply.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.supplies.unshift(action.payload);
            })
            .addCase(createSupply.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(getSupplies.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getSupplies.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.supplies = action.payload;
            })
            .addCase(getSupplies.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(deleteSupply.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteSupply.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.supplies = state.supplies.filter((s) => s._id !== action.payload);
            })
            .addCase(deleteSupply.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(getSupplyDetails.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getSupplyDetails.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.supplyDetails = action.payload;
            })
            .addCase(getSupplyDetails.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            });
    },
});

export const { reset, clearSupplyDetails } = supplySlice.actions;
export default supplySlice.reducer;
