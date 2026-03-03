import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import bookReducer from '../features/books/bookSlice';
import userReducer from '../features/users/userSlice';
import orderReducer from '../features/orders/orderSlice';
import bannerReducer from '../features/banners/bannerSlice';
import categoryReducer from '../features/categories/categorySlice';

import quoteReducer from '../features/quotes/quoteSlice';
import blogReducer from '../features/blogs/blogSlice';
import socialLinkReducer from '../features/socialLinks/socialLinkSlice';
import settingReducer from '../features/settings/settingSlice';
import expenditureReducer from '../features/expenditures/expenditureSlice';
import reportReducer from '../features/reports/reportSlice';
import taskReducer from '../features/tasks/taskSlice';
import kanbanColumnReducer from '../features/kanbanColumns/kanbanColumnSlice';
import supplyReducer from '../features/supplies/supplySlice';
import branchReducer from '../features/branches/branchSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        books: bookReducer,
        userList: userReducer,
        banners: bannerReducer,
        categories: categoryReducer,
        orderList: orderReducer,
        quotes: quoteReducer,
        blogs: blogReducer,
        socialLinks: socialLinkReducer,
        settings: settingReducer,
        expenditures: expenditureReducer,
        reports: reportReducer,
        tasks: taskReducer,
        kanbanColumns: kanbanColumnReducer,
        supplies: supplyReducer,
        branches: branchReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
