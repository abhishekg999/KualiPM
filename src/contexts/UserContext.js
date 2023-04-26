/**
 * Manages overall site context and syncs context with local storage.
 */

import { useState, createContext, useEffect } from "react";

export const UserContext = createContext();

export const UserContextProvider = ({ children }) => {
    const [userContext, setUserContext] = useState({
        subdomain: "",
        api_key: "",
        stored_api_keys: [],
        selected_categories: "",
        category_graph: {},
        id_to_name: {},
        group_graph: {}
    });

    // load the context from local storage on mount
    useEffect(() => {
        const storedContext = localStorage.getItem('userContextState');
        if (storedContext) {
            setUserContext((prev) => JSON.parse(storedContext));
        }
    }, []);

    // save the context to local storage on change
    useEffect(() => {
        if (userContext.subdomain || userContext.api_key) {
            localStorage.setItem('userContextState', JSON.stringify(userContext));
        }
    }, [userContext]);

    return (
        <UserContext.Provider value={{ userContext, setUserContext }}>
            {children}
        </UserContext.Provider>
    );
};
