import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import type { AppDispatch, RootState } from "./store";

/** Dispatch typed to the app's actions/thunks. */
export const useAppDispatch: () => AppDispatch = useDispatch;

/** Selector pre-bound to the app's RootState. */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
