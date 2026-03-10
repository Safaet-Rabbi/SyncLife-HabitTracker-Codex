import { configureStore } from '@reduxjs/toolkit';
import tuitionReducer from '../features/tuition/tuitionSlice';
import authReducer from '../features/auth/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tuition: tuitionReducer,
    // Add other reducers here if you have them
  },
});
