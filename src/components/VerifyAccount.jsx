import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "../axios"; // Twój skonfigurowany axios

const VerifyAccount = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Pobieramy email z linku ?email=...
    const emailFromUrl = searchParams.get("email") || "";

    const [email, setEmail] = useState(emailFromUrl);
    const [code, setCode] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleVerify = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            await axios.post("/auth/verify", { email, code });
            setMessage("Konto zweryfikowane pomyślnie! Przekierowanie do logowania...");
            setTimeout(() => navigate("/login"), 3000); // Po 3 sek do logowania
        } catch (err) {
            setError(err.response?.data?.message || "Weryfikacja nieudana.");
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "80vh", marginTop: "80px" }}>
            <div className="card shadow p-4" style={{ maxWidth: "400px", width: "100%" }}>
                <h3 className="text-center mb-3">Weryfikacja Konta</h3>
                <p className="text-muted small text-center">Wpisz kod, który wysłaliśmy na Twój email.</p>

                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleVerify}>
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={!!emailFromUrl} // Zablokuj edycję, jeśli przyszedł z linku
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Kod weryfikacyjny</label>
                        <input
                            type="text"
                            className="form-control text-center"
                            style={{ letterSpacing: "4px", fontSize: "1.2rem" }}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            maxLength="6"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-success w-100">Zatwierdź kod</button>
                </form>
            </div>
        </div>
    );
};

export default VerifyAccount;