import axios from "../axios";
import { useState, useEffect, createContext, useCallback } from "react";

const AppContext = createContext({
    data: [],
    isError: "",
    cart: [],
    addToCart: (product) => {},
    removeFromCart: (productId) => {},
    refreshData: () => {},
    fetchCart: () => {}, // Nowa funkcja w interfejsie
    clearCart: () => {}
});

export const AppProvider = ({ children }) => {
    const [data, setData] = useState([]);
    const [isError, setIsError] = useState("");
    const [cart, setCart] = useState([]);
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const token = localStorage.getItem("token");

    // Pobieranie koszyka z backendu
    const fetchCart = useCallback(async () => {
        // Zawsze pobieraj aktualny token z localStorage
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

    // Funkcja odświeżająca dane produktów
    const refreshData = async () => {
        try {
            const response = await axios.get(`${baseUrl}/api/products`);
            setData(response.data);
        } catch (error) {
            setIsError(error.message);
        }
    };

    // Lokalna funkcja dodawania (opcjonalna, jeśli backend obsłuży wszystko)
    const addToCart = async (product, quantity = 1) => {
        const currentToken = localStorage.getItem("token"); // Pobierz świeży token
        if (!currentToken || currentToken === "null") {
            toast.error("Please login first");
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
            await fetchCart(); // Odświeżamy stan po usunięciu
        } catch (error) {
            console.error("Error removing from cart:", error);
        }
    };

    const clearCart = () => {
        setCart([]);
    };

    // Ładowanie danych przy starcie
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
            fetchCart, // Udostępniamy fetchCart komponentom
            clearCart
        }}>
            {children}
        </AppContext.Provider>
    );
};

export default AppContext;