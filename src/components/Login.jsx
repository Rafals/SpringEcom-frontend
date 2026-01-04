import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../axios"; // Używamy Twojej instancji axios z interceptorem!
import ReCAPTCHA from "react-google-recaptcha";
import { GoogleLogin } from "@react-oauth/google";

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState(null);

    const navigate = useNavigate();
    const recaptchaRef = useRef();

    // Pamiętaj: To musi być klucz typu "Checkbox" (v2), a nie "Score" (v3)
    const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCaptchaChange = (token) => {
        setCaptchaToken(token);
    };

    // --- LOGOWANIE GOOGLE ---
    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError("");

        try {
            console.log("Wysyłam token Google do backendu...");
            // Wysyłamy token do backendu
            const response = await axios.post("/auth/google", {
                token: credentialResponse.credential
            });

            // Backend zwrócił nasz JWT - zapisujemy go
            if (response.data.token) {
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("username", response.data.username);
                localStorage.setItem("role", response.data.role);

                navigate("/");
                window.location.reload();
            }
        } catch (err) {
            console.error("Google Login Error:", err);

            // --- TUTAJ JEST ZMIANA ---
            // Sprawdzamy, czy backend przysłał odpowiedź z błędem
            if (err.response && err.response.data) {
                // Spring Boot zazwyczaj zwraca komunikat w polu 'message' lub bezpośrednio w 'data'
                // Jeśli wysyłasz String z backendu, może być w err.response.data
                // Jeśli wysyłasz obiekt JSON, może być w err.response.data.message
                const backendMessage = err.response.data.message || err.response.data;

                // Ustawiamy ten komunikat jako błąd (np. "Twoje konto zostało zablokowane...")
                setError(typeof backendMessage === 'string' ? backendMessage : JSON.stringify(backendMessage));
            } else {
                // Jeśli to błąd sieci lub inny nieznany błąd
                setError("Google login failed. Please try again.");
            }
            // -------------------------

        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError("Google Sign In was unsuccessful.");
    };

    // --- STANDARDOWE LOGOWANIE ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!captchaToken) {
            setError("Please confirm you are not a robot!");
            return;
        }

        setLoading(true);

        if (!isLogin && formData.password !== formData.confirmPassword) {
            setError("Passwords do not match!");
            setLoading(false);
            return;
        }

        const endpoint = isLogin ? "/auth/login" : "/auth/register";

        const payload = isLogin
            ? {
                email: formData.email,
                password: formData.password,
                captchaToken: captchaToken
            }
            : {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                captchaToken: captchaToken
            };

        try {
            const response = await axios.post(endpoint, payload);

            if (response.status === 200 || response.status === 201) {
                if (isLogin) {
                    localStorage.setItem("token", response.data.token);
                    localStorage.setItem("username", response.data.username);
                    localStorage.setItem("role", response.data.role);
                }
                navigate("/");
                window.location.reload();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Action failed. Please try again.");
            setCaptchaToken(null);
            if (recaptchaRef.current) {
                recaptchaRef.current.reset();
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "80vh", marginTop: "80px" }}>
            <div className="card shadow-lg p-4 border-0" style={{ width: "100%", maxWidth: "400px", borderRadius: "15px" }}>
                <div className="text-center mb-4">
                    <i className="bi bi-person-circle text-primary" style={{ fontSize: "3rem" }}></i>
                    <h2 className="fw-bold mt-2">{isLogin ? "Sign In" : "Create Account"}</h2>
                </div>

                {error && <div className="alert alert-danger p-2 small text-center">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Username</label>
                            <input type="text" className="form-control" name="username" value={formData.username} onChange={handleChange} required placeholder="johndoe" />
                        </div>
                    )}
                    <div className="mb-3">
                        <label className="form-label small fw-bold">Email address</label>
                        <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} required placeholder="name@example.com" />
                    </div>
                    <div className="mb-3">
                        <label className="form-label small fw-bold">Password</label>
                        <input type="password" className="form-control" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" />
                    </div>
                    {!isLogin && (
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Confirm Password</label>
                            <input type="password" className="form-control" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••" />
                        </div>
                    )}

                    <div className="mb-3 d-flex justify-content-center">
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey={recaptchaSiteKey}
                            onChange={handleCaptchaChange}
                            theme="light"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary w-100 mt-2 mb-3 py-2 fw-bold" disabled={loading}>
                        {loading ? <span className="spinner-border spinner-border-sm"></span> : (isLogin ? "Login" : "Sign Up")}
                    </button>
                </form>

                <div className="d-flex align-items-center my-3">
                    <hr className="flex-grow-1" />
                    <span className="mx-2 text-muted small">OR</span>
                    <hr className="flex-grow-1" />
                </div>

                <div className="d-flex justify-content-center mb-3">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="filled_blue"
                        shape="pill"
                        text={isLogin ? "signin_with" : "signup_with"}
                        width="300"
                    />
                </div>

                <div className="text-center">
                    <span className="text-muted small">{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
                    <button className="btn btn-link btn-sm p-0 fw-bold" onClick={() => setIsLogin(!isLogin)} style={{ textDecoration: "none" }}>
                        {isLogin ? "Register here" : "Login here"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;