import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit'

// ─── UI Slice ────────────────────────────────────────────────────────────────

interface UIState {
  sidebarShow: boolean
  sidebarUnfoldable?: boolean
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarShow: true } as UIState,
  reducers: {
    set: (state, action: PayloadAction<Partial<UIState>>) => ({ ...state, ...action.payload }),
  },
})

// ─── Auth Slice ───────────────────────────────────────────────────────────────

export interface UserPreferences {
  darkMode: boolean
  [key: string]: any
}

export interface AuthUser {
  id: number
  email: string
  name: string
  avatar: string | null
  role: 'admin' | 'viewer'
  preferences: UserPreferences
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
}

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, loading: true } as AuthState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload
      state.loading = false
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    updatePreferences: (state, action: PayloadAction<UserPreferences>) => {
      if (state.user) state.user.preferences = action.payload
    },
    updateProfile: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) state.user = { ...state.user, ...action.payload }
    },
  },
})

// ─── Owner Slice (Type de bailleur) ──────────────────────────────────────────

interface OwnerState {
  profileType: 'SCI' | 'PROFESSIONAL' | 'INDIVIDUAL'
}

const ownerSlice = createSlice({
  name: 'owner',
  initialState: { profileType: 'INDIVIDUAL' } as OwnerState,
  reducers: {
    setOwnerProfileType: (state, action: PayloadAction<'SCI' | 'PROFESSIONAL' | 'INDIVIDUAL'>) => {
      state.profileType = action.payload
    },
  },
})

// ─── Store ────────────────────────────────────────────────────────────────────

export const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
    auth: authSlice.reducer,
    owner: ownerSlice.reducer,
  },
})

export const { set } = uiSlice.actions
export const { setUser, setLoading, updatePreferences, updateProfile } = authSlice.actions
export const { setOwnerProfileType } = ownerSlice.actions
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store
