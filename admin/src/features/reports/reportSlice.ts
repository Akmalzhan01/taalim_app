import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config/constants';

const REPORTS_URL = `${API_URL}/reports/`;

interface ReportState {
    dashboardStats: any;
    topBooks: any[];
    leastBooks: any[];
    salesChart: any[];
    selectedDateSales: any[];
    isError: boolean;
    isSuccess: boolean;
    isLoading: boolean;
    message: string;
}

interface ReportFilter {
    startDate?: string;
    endDate?: string;
    date?: string;
    branch?: string;
}

const initialState: ReportState = {
    dashboardStats: null,
    topBooks: [],
    leastBooks: [],
    salesChart: [],
    selectedDateSales: [],
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: ''
};

// Get Dashboard Stats
export const getDashboardStats = createAsyncThunk('reports/dashboardStats', async (filters: ReportFilter | undefined, thunkAPI: any) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` }, params: filters };
        const response = await axios.get(REPORTS_URL + 'dashboard', config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Get Top Books
export const getTopBooks = createAsyncThunk('reports/topBooks', async (filters: ReportFilter | undefined, thunkAPI: any) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` }, params: filters };
        const response = await axios.get(REPORTS_URL + 'top-books', config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Get Sales Chart
export const getSalesChart = createAsyncThunk('reports/salesChart', async (filters: ReportFilter | undefined, thunkAPI: any) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` }, params: filters };
        const response = await axios.get(REPORTS_URL + 'sales-chart', config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Get Detailed Sales By Date
export const getSalesByDate = createAsyncThunk('reports/salesByDate', async (filters: ReportFilter, thunkAPI: any) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` }, params: filters };
        const response = await axios.get(REPORTS_URL + 'sales-by-date', config);
        return response.data;
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});


export const reportSlice = createSlice({
    name: 'report',
    initialState,
    reducers: {
        reset: () => initialState,
        clearSelectedDateSales: (state) => {
            state.selectedDateSales = [];
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getDashboardStats.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getDashboardStats.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.dashboardStats = action.payload;
            })
            .addCase(getDashboardStats.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(getTopBooks.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getTopBooks.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.topBooks = action.payload.topBooks || [];
                state.leastBooks = action.payload.leastBooks || [];
            })
            .addCase(getTopBooks.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(getSalesChart.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getSalesChart.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.salesChart = action.payload;
            })
            .addCase(getSalesChart.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(getSalesByDate.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getSalesByDate.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.selectedDateSales = action.payload;
            })
            .addCase(getSalesByDate.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            });
    }
});

export const { reset, clearSelectedDateSales } = reportSlice.actions;
export default reportSlice.reducer;
