import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Navbar = ({ onSelectCategory }) => {
    const getInitialTheme = () => {
        const storedTheme = localStorage.getItem("theme");
        return storedTheme ? storedTheme : "light";
    };

    // Pobieranie danych autoryzacji z localStorage
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    const [theme, setTheme] = useState(getInitialTheme());
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isNavCollapsed, setIsNavCollapsed] = useState(true);
    const [showNoProductsMessage, setShowNoProductsMessage] = useState(false);

    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const searchContainerRef = useRef(null);
    const navbarRef = useRef(null);
    const navigate = useNavigate();
    const baseUrl = import.meta.env.VITE_BASE_URL;

    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    useEffect(() => {
        document.documentElement.setAttribute("data-bs-theme", theme);
        localStorage.setItem("theme", theme);
        document.body.className = theme === "light" ? "light-theme" : "dark-theme";
    }, [theme]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (input.trim().length > 1) {
                fetchSuggestions();
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [input]);

    const fetchSuggestions = async () => {
        try {
            const response = await axios.get(`${baseUrl}/api/products/search?keyword=${input}`);
            setSuggestions(response.data);
            setShowSuggestions(true);
        } catch (error) {
            console.error("Suggestions error:", error);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
            if (navbarRef.current && !navbarRef.current.contains(event.target)) {
                setIsNavCollapsed(true);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNavbarToggle = () => setIsNavCollapsed(!isNavCollapsed);
    const handleLinkClick = () => {
        setIsNavCollapsed(true);
        setShowSuggestions(false);
    };

    const toggleTheme = () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
    };

    const handleLogout = () => {
        localStorage.clear();
        handleLinkClick();
        navigate("/login");
        window.location.reload(); // Odświeżenie stanu aplikacji
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (input.trim() === "") return;

        setIsLoading(true);
        setShowSuggestions(false);
        setIsNavCollapsed(true);

        try {
            const response = await axios.get(`${baseUrl}/api/products/search?keyword=${input}`);
            navigate(`/search-results`, { state: { searchData: response.data } });
        } catch (error) {
            console.error("Error searching:", error);
            setShowNoProductsMessage(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <nav className="navbar navbar-expand-lg fixed-top bg-body-tertiary shadow-sm" ref={navbarRef}>
            <div className="container-fluid">
                <a className="navbar-brand fw-bold" href="https://github.com/rafals">
                    Github
                </a>

                <button className="navbar-toggler" type="button" onClick={handleNavbarToggle}>
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className={`${isNavCollapsed ? 'collapse' : ''} navbar-collapse`} id="navbarSupportedContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <a className="nav-link" href="/" onClick={handleLinkClick}>Home</a>
                        </li>

                        {/* GUZIK DLA ADMINA */}
                        {role === "ROLE_ADMIN" && (
                            <li className="nav-item">
                                <a className="nav-link" href="/add_product" onClick={handleLinkClick}>Add Product</a>
                            </li>
                        )}

                        {/* ORDERS DLA ZALOGOWANYCH */}
                        {token && (
                            <li className="nav-item">
                                <a className="nav-link" href="/orders" onClick={handleLinkClick}>Orders</a>
                            </li>
                        )}
                    </ul>

                    <div className="d-flex align-items-center">
                        {/* Theme Toggle */}
                        <button className="btn btn-link nav-link me-2" onClick={toggleTheme}>
                            {theme === "light" ? <i className="bi bi-moon-stars-fill text-dark"></i> : <i className="bi bi-sun-fill text-warning"></i>}
                        </button>

                        {/* DYNAMICZNA SEKCJA LOGOWANIA */}
                        {token ? (
                            <div className="dropdown me-3">
                                <button
                                    className={`btn btn-outline-primary dropdown-toggle d-flex align-items-center ${showProfileDropdown ? 'show' : ''}`}
                                    type="button"
                                    onClick={() => setShowProfileDropdown(!showProfileDropdown)} // Przełączanie menu
                                >
                                    <i className="bi bi-person-circle me-1"></i> {username}
                                </button>

                                {/* Menu rozwijane sterowane przez Reacta */}
                                <ul className={`dropdown-menu dropdown-menu-end shadow border-0 mt-2 ${showProfileDropdown ? 'show' : ''}`}
                                    style={{
                                        display: showProfileDropdown ? 'block' : 'none', // Wymuszamy widoczność
                                        position: 'absolute',
                                        right: 0
                                    }}
                                >
                                    <li>
                                        <button className="dropdown-item text-danger fw-bold" onClick={handleLogout}>
                                            <i className="bi bi-box-arrow-right me-2"></i> Logout
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        ) : (
                            <button className="btn btn-outline-primary me-3 d-flex align-items-center" onClick={() => { handleLinkClick(); navigate("/login"); }}>
                                <i className="bi bi-person-circle me-1"></i> Sign In
                            </button>
                        )}

                        <a href="/cart" className="nav-link text-dark me-3" onClick={handleLinkClick}>
                            <i className="bi bi-cart me-1"></i> Cart
                        </a>

                        <form className="d-flex position-relative" role="search" onSubmit={handleSubmit} id="searchForm" ref={searchContainerRef}>
                            <input
                                className="form-control me-2"
                                type="search"
                                placeholder="Type to search"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onFocus={() => input.length > 1 && setShowSuggestions(true)}
                            />

                            {showSuggestions && suggestions.length > 0 && (
                                <div className="list-group position-absolute w-100 shadow-lg" style={{ top: "100%", zIndex: 1100, marginTop: "5px" }}>
                                    {suggestions.slice(0, 5).map((product) => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            className="list-group-item list-group-item-action d-flex align-items-center px-2 py-2"
                                            onClick={() => {
                                                navigate(`/product/${product.id}`);
                                                setShowSuggestions(false);
                                                setInput("");
                                                setIsNavCollapsed(true);
                                            }}
                                        >
                                            {product.imageData ? (
                                                <img
                                                    src={`data:${product.imageType};base64,${product.imageData}`}
                                                    alt={product.name}
                                                    className="rounded me-2"
                                                    style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                                />
                                            ) : (
                                                <i className="bi bi-image me-2 text-muted" style={{ fontSize: "1.5rem" }}></i>
                                            )}

                                            <div className="text-truncate">
                                                <span className="fw-bold small d-block text-truncate">{product.name}</span>
                                                <span className="text-primary small">${product.price}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <button className="btn btn-outline-success" type="submit" disabled={isLoading}>
                                {isLoading ? <span className="spinner-border spinner-border-sm"></span> : "Search"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;