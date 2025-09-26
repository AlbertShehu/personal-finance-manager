// src/store/transactionSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

// 🔄 Async thunk për marrjen e transaksioneve nga API
export const fetchTransactions = createAsyncThunk(
  "transactions/fetch",
  async (_, thunkAPI) => {
    try {
      // console.log("Redux: Fetching transactions from API...");
      const res = await axios.get("/transactions");
      const data = res.data;
      // console.log("Redux: Received data:", data);
      // Siguro që gjithmonë kthejmë një array
      if (Array.isArray(data)) {
        return data;
      }
      if (Array.isArray(data.transactions)) {
        return data.transactions;
      }
      return [];
    } catch (err) {
      // Log për debug
      console.error("Error fetching transactions:", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Gabim në server";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const transactionSlice = createSlice({
  name: "transactions",
  initialState: {
    items: [],      // 💡 emër më i qartë
    loading: false,
    error: null,
  },
  reducers: {
    // ➕ Shto një transaksion në mënyrë lokale (pa request)
    addTransactionLocal: (state, action) => {
      // console.log("Redux: Adding transaction locally:", action.payload);
      state.items.push(action.payload);
    },
    // ❌ Fshi një transaksion lokal
    deleteTransactionLocal: (state, action) => {
      state.items = state.items.filter((tx) => tx.id !== action.payload);
    },
    // 🔄 Përditëso një transaksion lokal
    updateTransactionLocal: (state, action) => {
      const idx = state.items.findIndex((tx) => tx.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
    },
    // 🧹 Reset të transactions (p.sh. pas logout)
    resetTransactions: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        // console.log("Redux: Fetch transactions pending...");
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        // console.log("Redux: Fetch transactions fulfilled:", action.payload);
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        // console.log("Redux: Fetch transactions rejected:", action.payload);
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  addTransactionLocal,
  deleteTransactionLocal,
  updateTransactionLocal,
  resetTransactions,
} = transactionSlice.actions;

export default transactionSlice.reducer;
