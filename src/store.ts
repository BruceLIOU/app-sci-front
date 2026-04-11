import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  sidebarShow: boolean
  sidebarUnfoldable?: boolean
}

const initialState: UIState = { sidebarShow: true }

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    set: (state, action: PayloadAction<Partial<UIState>>) => {
      return { ...state, ...action.payload }
    },
  },
})

export const store = configureStore({ reducer: uiSlice.reducer })
export const { set } = uiSlice.actions
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store
