import axios from 'axios';
import { API_URL } from '../../config/constants';

const SUPPLIERS_URL = `${API_URL}/suppliers/`;

const getToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

// Get suppliers
const getSuppliers = async () => {
    const token = getToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.get(SUPPLIERS_URL, config);
    return response.data;
};

// Create new supplier
const createSupplier = async (supplierData: any) => {
    const token = getToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.post(SUPPLIERS_URL, supplierData, config);
    return response.data;
};

const updateSupplier = async (id: string, supplierData: any) => {
    const token = getToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.put(SUPPLIERS_URL + id, supplierData, config);
    return response.data;
};

// Pay supplier
const paySupplier = async (id: string, paymentData: any) => {
    const token = getToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.post(SUPPLIERS_URL + id + '/pay', paymentData, config);
    return response.data;
};

// Delete supplier
const deleteSupplier = async (id: string) => {
    const token = getToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.delete(SUPPLIERS_URL + id, config);
    return response.data;
};

const supplierService = {
    getSuppliers,
    createSupplier,
    updateSupplier,
    paySupplier,
    deleteSupplier,
};

export default supplierService;
