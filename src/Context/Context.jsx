import axios from "../axios";
import { useState, useEffect, createContext, useCallback } from "react";

const AppContext = createContext({
    data: [],
    isError: "",
    cart: [],
    addToCart: (product) => {},
    removeFromCart: (productId) => {},
    refreshData: () => {},
    fetchCart: () => {},
    clearCart: () => {},
    theme: "light",        // Nowe pole
    toggleTheme: () => {}  // Nowa funkcja
});

export const AppProvider = ({ children }) => {
    const [data, setData] = useState([]);
    const [isError, setIsError] = useState("");
    const [cart, setCart] = useState([]);

    // --- NOWA LOGIKA MOTYWU ---
    // Pobieramy motyw z localStorage lub domyślnie 'light'
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

    // Ten useEffect automatycznie zmienia kolory całej strony (Bootstrap 5.3)
    useEffect(() => {
        document.documentElement.setAttribute("data-bs-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };
    // ---------------------------

    const baseUrl = import.meta.env.VITE_BASE_URL;
    const token = localStorage.getItem("token");

    const fetchCart = useCallback(async () => {
        const currentToken = localStorage.getItem("token");
        if (!currentToken || currentToken === "null") {
            setCart([]);
            return;
        }
        try {
            const response = await axios.get(`${baseUrl}/api/cart`, {
                headers: { Authorization: `Bearer ${currentToken}` }
            });
            const formattedCart = response.data.map(item => ({
                ...item.product,
                quantity: item.quantity
            }));
            setCart(formattedCart);
        } catch (error) {
            console.error("Cart fetch error:", error);
        }
    }, [baseUrl]);

    const refreshData = async () => {
        try {
            const response = await axios.get(`${baseUrl}/api/products`);
            setData(response.data);
        } catch (error) {
            setIsError(error.message);
        }
    };

    const addToCart = async (product, quantity = 1) => {
        const currentToken = localStorage.getItem("token");
        if (!currentToken || currentToken === "null") {
            return;
        }
        try {
            await axios.post(`${baseUrl}/api/cart/add/${product.id}?quantity=${quantity}`, {}, {
                headers: { Authorization: `Bearer ${currentToken}` }
            });
            await fetchCart();
        } catch (error) {
            console.error("Error adding to cart:", error);
        }
    };

    const removeFromCart = async (productId) => {
        if (!token) return;
        try {
            await axios.delete(`${baseUrl}/api/cart/remove/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchCart();
        } catch (error) {
            console.error("Error removing from cart:", error);
        }
    };

    const clearCart = () => {
        setCart([]);
    };

    useEffect(() => {
        refreshData();
        if (token) {
            fetchCart();
        }
    }, [token, fetchCart]);

    return (
        <AppContext.Provider value={{
            data,
            isError,
            cart,
            addToCart,
            removeFromCart,
            refreshData,
            fetchCart,
            clearCart,
            theme,        // Eksportujemy
            toggleTheme   // Eksportujemy
        }}>
            {children}
        </AppContext.Provider>
    );
};

export default AppContext;