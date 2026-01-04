import React, { useState } from "react";
import axios from "../axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1 = Podaj Email, 2 = Podaj Kod i Hasło
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // KROK 1: Wyślij kod
    const handleRequestCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post("/auth/forgot-password", { email });
            toast.success("Kod wysłany! Sprawdź skrzynkę.");
            setStep(2);
        } catch (err) {
            toast.error(err.response?.data?.message || "Błąd wysyłania kodu");
        } finally {
            setLoading(false);
        }
    };

    // KROK 2: Zmień hasło
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post("/auth/reset-password", { email, code, newPassword });
            toast.success("Hasło zmienione! Zaloguj się.");
            navigate("/login");
        } catch (err) {
            toast.error(err.response?.data?.message || "Błąd resetowania hasła");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "80vh", marginTop: "80px" }}>
            <div className="card shadow p-4" style={{ maxWidth: "400px", width: "100%" }}>
                <h3 className="text-center mb-3 fw-bold">Reset Hasła</h3>

                {step === 1 ? (
                    <form onSubmit={handleRequestCode}>
                        <p className="text-muted small text-center">Podaj email, aby otrzymać kod resetujący.</p>
                        <div className="mb-3">
                            <label className="form-label">Email</label>
                            <input
                                type="email" className="form-control" required
                                value={email} onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                            {loading ? "Wysyłanie..." : "Wyślij kod"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        <div className="alert alert-info py-2 small">Kod wysłano na: <strong>{email}</strong></div>
                        <div className="mb-3">
                            <label className="form-label">Kod z maila</label>
                            <input
                                type="text" className="form-control text-center" required maxLength="6"
                                style={{ letterSpacing: "3px" }}
                                value={code} onChange={e => setCode(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Nowe hasło</label>
                            <input
                                type="password" className="form-control" required
                                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-success w-100" disabled={loading}>
                            {loading ? "Przetwarzanie..." : "Zmień hasło"}
                        </button>
                        <button type="button" className="btn btn-link w-100 mt-2" onClick={() => setStep(1)}>
                            Wróć
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;