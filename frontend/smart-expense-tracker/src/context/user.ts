import { createContext, useContext } from "react";
import type { User } from "../api/types";

export interface UserContextValue {
  user: User | null;
  setUser: (user: User) => void;
}

export const UserContext = createContext<UserContextValue>({ user: null, setUser: () => {} });

export const useUser = () => useContext(UserContext);

export const displayName = (user: User | null) => user?.name || user?.fullname || user?.email.split("@")[0] || "";
