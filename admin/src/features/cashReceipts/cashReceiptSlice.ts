import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/constants';

const RECEIPTS_URL = `${API_URL}/cash-receipts/`;

const getToken = (thunkAPI: any) => {
    try {
        const state = thunkAPI.getState() as any;
        if (state.auth?.user?.token) return state.auth.user.token;
    } catch (e) {}
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

export const getCashReceipts = createAsyncThunk(
    'cashReceipts/getAll',
    async (branchId: string | undefined, thunkAPI: any) => {
        try {
            const token = getToken(thunkAPI);
            const config = {
                headers: { Authorization: `Bearer ${token}` },
                params: { branch: branchId },
            };
            const response = await axios.get(RECEIPTS_URL, config);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const addCashReceipt = createAsyncThunk(
    'cashReceipts/add',
    async (data: any, thunkAPI: any) => {
        try {
            const token = getToken(thunkAPI);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post(RECEIPTS_URL, data, config);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const deleteCashReceipt = createAsyncThunk(
    'cashReceipts/delete',
    async (id: string, thunkAPI: any) => {
        try {
            const token = getToken(thunkAPI);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`${RECEIPTS_URL}${id}`, config);
            return { id };
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const cashReceiptSlice = createSlice({
    name: 'cashReceipts',
    initialState: {
        receipts: [] as any[],
        isLoading: false,
        isError: false,
        isSuccess: false,
        message: '',
    },
    reducers: {
        resetCashReceipts: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.isSuccess = false;
            state.message = '';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getCashReceipts.pending, (state) => { state.isLoading = true; })
            .addCase(getCashReceipts.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.receipts = action.payload;
            })
            .addCase(getCashReceipts.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(addCashReceipt.pending, (state) => { state.isLoading = true; })
            .addCase(addCashReceipt.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.receipts.unshift(action.payload);
            })
            .addCase(addCashReceipt.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(deleteCashReceipt.pending, (state) => { state.isLoading = true; })
            .addCase(deleteCashReceipt.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.receipts = state.receipts.filter((r) => r._id !== action.payload.id);
            })
            .addCase(deleteCashReceipt.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { resetCashReceipts } = cashReceiptSlice.actions;
export default cashReceiptSlice.reducer;
