import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import supplierService from './supplierService';

const initialState = {
    suppliers: [],
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',
};

// Get suppliers
export const getSuppliers = createAsyncThunk('suppliers/getAll', async (_, thunkAPI) => {
    try {
        return await supplierService.getSuppliers();
    } catch (error: any) {
        const message = error.response?.data?.message || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Create new supplier
export const createSupplier = createAsyncThunk('suppliers/create', async (supplierData: any, thunkAPI) => {
    try {
        return await supplierService.createSupplier(supplierData);
    } catch (error: any) {
        const message = error.response?.data?.message || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Update supplier
export const updateSupplier = createAsyncThunk('suppliers/update', async (data: { id: string, supplierData: any }, thunkAPI) => {
    try {
        return await supplierService.updateSupplier(data.id, data.supplierData);
    } catch (error: any) {
        const message = error.response?.data?.message || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Pay supplier
export const paySupplier = createAsyncThunk('suppliers/pay', async (data: { id: string, paymentData: any }, thunkAPI) => {
    try {
        return await supplierService.paySupplier(data.id, data.paymentData);
    } catch (error: any) {
        const message = error.response?.data?.message || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Delete supplier
export const deleteSupplier = createAsyncThunk('suppliers/delete', async (id: string, thunkAPI) => {
    try {
        await supplierService.deleteSupplier(id);
        return id;
    } catch (error: any) {
        const message = error.response?.data?.message || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const supplierSlice = createSlice({
    name: 'supplier',
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
            .addCase(getSuppliers.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getSuppliers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.suppliers = action.payload as never;
            })
            .addCase(getSuppliers.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(createSupplier.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createSupplier.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.suppliers.unshift(action.payload as never); // Add to beginning
            })
            .addCase(createSupplier.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(updateSupplier.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateSupplier.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const index = state.suppliers.findIndex((supplier: any) => supplier._id === action.payload._id);
                if (index !== -1) {
                    state.suppliers[index] = action.payload as never;
                }
            })
            .addCase(updateSupplier.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(paySupplier.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(paySupplier.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const index = state.suppliers.findIndex((supplier: any) => supplier._id === action.payload._id);
                if (index !== -1) {
                    state.suppliers[index] = action.payload as never;
                }
            })
            .addCase(paySupplier.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(deleteSupplier.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteSupplier.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.suppliers = state.suppliers.filter((supplier: any) => supplier._id !== action.payload) as never;
            })
            .addCase(deleteSupplier.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            });
    },
});

export const { reset } = supplierSlice.actions;
export default supplierSlice.reducer;
