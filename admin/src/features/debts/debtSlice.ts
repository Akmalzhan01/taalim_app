import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/constants';

const DEBTS_URL = `${API_URL}/debts/`;

const getToken = (thunkAPI: any) => {
    try {
        const state = thunkAPI.getState() as any;
        if (state.auth?.user?.token) return state.auth.user.token;
    } catch (e) {}
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

export const getDebts = createAsyncThunk(
    'debts/getAll',
    async (branchId: string | undefined, thunkAPI: any) => {
        try {
            const token = getToken(thunkAPI);
            const config = {
                headers: { Authorization: `Bearer ${token}` },
                params: { branch: branchId },
            };
            const response = await axios.get(DEBTS_URL, config);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const addDebt = createAsyncThunk(
    'debts/add',
    async (debtData: any, thunkAPI: any) => {
        try {
            const token = getToken(thunkAPI);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post(DEBTS_URL, debtData, config);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const payDebt = createAsyncThunk(
    'debts/pay',
    async ({ id, amount, note }: { id: string; amount: number; note?: string }, thunkAPI: any) => {
        try {
            const token = getToken(thunkAPI);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post(`${DEBTS_URL}${id}/pay`, { amount, note }, config);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const deleteDebt = createAsyncThunk(
    'debts/delete',
    async (id: string, thunkAPI: any) => {
        try {
            const token = getToken(thunkAPI);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`${DEBTS_URL}${id}`, config);
            return { id };
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const debtSlice = createSlice({
    name: 'debts',
    initialState: {
        debts: [] as any[],
        isLoading: false,
        isError: false,
        isSuccess: false,
        message: '',
    },
    reducers: {
        resetDebts: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.isSuccess = false;
            state.message = '';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getDebts.pending, (state) => { state.isLoading = true; })
            .addCase(getDebts.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.debts = action.payload;
            })
            .addCase(getDebts.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(addDebt.pending, (state) => { state.isLoading = true; })
            .addCase(addDebt.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.debts.unshift(action.payload);
            })
            .addCase(addDebt.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(payDebt.pending, (state) => { state.isLoading = true; })
            .addCase(payDebt.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const idx = state.debts.findIndex((d) => d._id === action.payload._id);
                if (idx !== -1) state.debts[idx] = action.payload;
            })
            .addCase(payDebt.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(deleteDebt.pending, (state) => { state.isLoading = true; })
            .addCase(deleteDebt.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.debts = state.debts.filter((d) => d._id !== action.payload.id);
            })
            .addCase(deleteDebt.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { resetDebts } = debtSlice.actions;
export default debtSlice.reducer;
