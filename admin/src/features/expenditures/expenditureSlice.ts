import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/constants';

const EXPENDITURES_URL = `${API_URL}/expenditures/`;

// Get user token helper
const getToken = (thunkAPI: any) => {
    try {
        const state = thunkAPI.getState() as any;
        if (state.auth?.user?.token) return state.auth.user.token;
    } catch (e) { }

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

// Get today's expenditures
export const getExpenditures = createAsyncThunk(
    'expenditures/getAll',
    async (branchId: string | undefined, thunkAPI: any) => {
        try {
            const token = getToken(thunkAPI);
            const config = {
                headers: { Authorization: `Bearer ${token}` },
                params: { branch: branchId }
            };
            const response = await axios.get(EXPENDITURES_URL, config);
            return response.data;
        } catch (error: any) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Create expenditure
export const createExpenditure = createAsyncThunk(
    'expenditures/create',
    async (expenditureData: { title: string, amount: number }, thunkAPI: any) => {
        try {
            const token = getToken(thunkAPI);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post(EXPENDITURES_URL, expenditureData, config);
            return response.data;
        } catch (error: any) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Delete expenditure
export const deleteExpenditure = createAsyncThunk(
    'expenditures/delete',
    async (id: string, thunkAPI: any) => {
        try {
            const token = getToken(thunkAPI);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.delete(`${EXPENDITURES_URL}${id}`, config);
            return response.data;
        } catch (error: any) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const expenditureSlice = createSlice({
    name: 'expenditureList',
    initialState: {
        expenditures: [],
        isLoading: false,
        isError: false,
        isSuccess: false,
        message: '',
    },
    reducers: {
        resetExp: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.isSuccess = false;
            state.message = '';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getExpenditures.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getExpenditures.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.expenditures = action.payload as never;
            })
            .addCase(getExpenditures.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(createExpenditure.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createExpenditure.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.expenditures.push(action.payload as never);
            })
            .addCase(createExpenditure.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(deleteExpenditure.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteExpenditure.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.expenditures = state.expenditures.filter((x: any) => x._id !== action.payload.id) as never;
            })
            .addCase(deleteExpenditure.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { resetExp } = expenditureSlice.actions;
export default expenditureSlice.reducer;
