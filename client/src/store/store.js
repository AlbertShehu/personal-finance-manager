import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import transactionReducer from "./transactionSlice"; // do e rishikojmë kur ta dërgosh

// 🏗️ Krijimi i store global me slices për autentikim dhe transaksione
export const store = configureStore({
  reducer: {
    auth: authReducer,
    transactions: transactionReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
