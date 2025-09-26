/* eslint-disable no-empty */
// src/store/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import api from "@/lib/axios"

/* ---------------- Helpers: storage + headers ---------------- */

const STORAGE = { token: "token", user: "user", remember: "remember_me" }


const safeParse = (json) => {
  try {
    const v = JSON.parse(json)
    return v && v !== "undefined" ? v : null
  } catch {
    return null
  }
}

const setAuthHeader = (token) => {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`
  else delete api.defaults.headers.common.Authorization
}

const persistAuth = ({ user, token, remember }) => {
  const primary = remember ? localStorage : sessionStorage
  const secondary = remember ? sessionStorage : localStorage
  try {
    primary.setItem(STORAGE.token, token)
    primary.setItem(STORAGE.user, JSON.stringify(user))
    localStorage.setItem(STORAGE.remember, remember ? "1" : "0")
    secondary.removeItem(STORAGE.token)
    secondary.removeItem(STORAGE.user)
  } catch {}
}

const clearAuth = () => {
  try {
    localStorage.removeItem(STORAGE.token)
    localStorage.removeItem(STORAGE.user)
    localStorage.removeItem(STORAGE.remember)
  } catch {}
  try {
    sessionStorage.removeItem(STORAGE.token)
    sessionStorage.removeItem(STORAGE.user)
  } catch {}
}

const getStoredAuth = () => {
  // prefero token-in në localStorage (remember = true), pastaj sessionStorage
  const lsToken = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE.token) : null
  const ssToken = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(STORAGE.token) : null

  if (lsToken) {
    const user = safeParse(localStorage.getItem(STORAGE.user))
    return { token: lsToken, user }
  }
  if (ssToken) {
    const user = safeParse(sessionStorage.getItem(STORAGE.user))
    return { token: ssToken, user }
  }
  return { token: null, user: null }
}

/* ---------------- Thunks ---------------- */

/**
 * Login – kthen { user, token } ose rejectWithValue({ status, message })
 */
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password, remember = true }, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/login", { email, password })
      const { user, token } = res?.data || {}
      if (!token || !user) throw new Error("Invalid response")

      // Persist + vendos header-in
      persistAuth({ user, token, remember })
      setAuthHeader(token)

      return { user, token, remember }
    } catch (err) {
      const status = err?.response?.status
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed"
      return rejectWithValue({ status, message })
    }
  }
)

/**
 * Logout – pastron storage dhe header-at
 */
export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  clearAuth()
  setAuthHeader(null)
})

/* ---------------- Initial state (rehydrate) ---------------- */

const { user: initialUser, token: initialToken } = getStoredAuth()
// vendos header-in në ngarkim të modulit nëse ka token
setAuthHeader(initialToken)

const initialState = {
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!initialToken,
  isLoading: false,
  error: null, // do të mbajë vetëm message-in
}

/* ---------------- Slice ---------------- */

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // opsionale: p.sh. thirrje kur bën restore nga jashtë
    restoreSession(state, action) {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = !!action.payload.token
      setAuthHeader(action.payload.token)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.isLoading = false
        state.user = payload.user
        state.token = payload.token
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginUser.rejected, (state, { payload }) => {
        state.isLoading = false
        // payload vjen si { status, message }
        state.error = payload?.message || "Login failed"
        state.isAuthenticated = false
        state.user = null
        state.token = null
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.isLoading = false
        state.error = null
      })
  },
})

export const { restoreSession } = authSlice.actions
export default authSlice.reducer
