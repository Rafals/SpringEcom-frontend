import React, { useState } from "react";
import axios from "../axios";
import { toast } from "react-toastify";

const UserProfile = () => {
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    // --- STAN: HASŁO ---
    const [passData, setPassData] = useState({ oldPassword: "", newPassword: "" });

    // --- STAN: EMAIL ---
    const [emailStep, setEmailStep] = useState(1); // 1 = podaj maila, 2 = podaj kod
    const [newEmail, setNewEmail] = useState("");
    const [emailCode, setEmailCode] = useState("");

    // --- ZMIANA HASŁA ---
    const handleChangePassword = async (e) => {
        e.preventDefault();
        try {
            await axios.put("/user/change-password", passData);
            toast.success("Hasło zmienione pomyślnie! Sprawdź maila.");
            setPassData({ oldPassword: "", newPassword: "" });
        } catch (err) {
            toast.error(err.response?.data?.message || "Błąd zmiany hasła");
        }
    };

    // --- ZMIANA MAILA: KROK 1 (Wyślij kod) ---
    const handleEmailRequest = async (e) => {
        e.preventDefault();
        try {
            await axios.post("/user/change-email-request", { newEmail });
            toast.info(`Kod bezpieczeństwa wysłany na Twój OBECNY adres email.`);
            setEmailStep(2);
        } catch (err) {
            toast.error(err.response?.data?.message || "Błąd wysyłania kodu");
        }
    };

    // --- ZMIANA MAILA: KROK 2 (Zatwierdź kod) ---
    const handleEmailVerify = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("/user/change-email-verify", { code: emailCode });
            toast.success("Email zmieniony pomyślnie!");

            // WAŻNE: Aktualizujemy token, bo w starym jest stary email!
            localStorage.setItem("token", res.data.token);

            setEmailStep(1);
            setNewEmail("");
            setEmailCode("");
        } catch (err) {
            toast.error(err.response?.data?.message || "Błędny kod");
        }
    };

    return (
        <div className="container mt-5 pt-5">
            <h2 className="mb-4 text-center fw-bold"><i className="bi bi-person-gear me-2"></i>Ustawienia Konta</h2>

            <div className="row g-4">
                {/* KARTA 1: INFO O KONCIE */}
                <div className="col-md-4">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body text-center">
                            <div className="mb-3">
                                <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto" style={{width: "80px", height: "80px", fontSize: "2rem"}}>
                                    {username.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <h5 className="card-title fw-bold">{username}</h5>
                            <p className="badge bg-secondary">{role}</p>
                            <p className="text-muted small mt-2">Twoje konto jest aktywne.</p>
                        </div>
                    </div>
                </div>

                {/* KARTA 2: ZMIANA HASŁA */}
                <div className="col-md-8">
                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-header fw-bold py-3"><i className="bi bi-shield-lock me-2"></i>Zmiana Hasła</div>
                        <div className="card-body">
                            <form onSubmit={handleChangePassword}>
                                <div className="mb-3">
                                    <label className="form-label small">Obecne hasło</label>
                                    <input type="password" class="form-control" required
                                           value={passData.oldPassword}
                                           onChange={e => setPassData({...passData, oldPassword: e.target.value})}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small">Nowe hasło</label>
                                    <input type="password" class="form-control" required
                                           value={passData.newPassword}
                                           onChange={e => setPassData({...passData, newPassword: e.target.value})}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary btn-sm">Zmień hasło</button>
                            </form>
                        </div>
                    </div>

                    {/* KARTA 3: ZMIANA MAILA */}
                    <div className="card shadow-sm border-0">
                        <div className="card-header fw-bold py-3"><i className="bi bi-envelope me-2"></i>Zmiana Adresu Email</div>
                        <div className="card-body">
                            {emailStep === 1 ? (
                                <form onSubmit={handleEmailRequest}>
                                    <div className="input-group mb-3">
                                        <input type="email" className="form-control" placeholder="Nowy adres email" required
                                               value={newEmail} onChange={e => setNewEmail(e.target.value)}
                                        />
                                        <button className="btn btn-outline-primary" type="submit">Wyślij kod</button>
                                    </div>
                                    <div className="form-text">Wyślemy kod weryfikacyjny na obecny adres mailowy.</div>
                                </form>
                            ) : (
                                <form onSubmit={handleEmailVerify}>
                                    <div className="alert alert-info py-2 small">Kod wysłano na: <strong>obecny</strong> email.</div>
                                    <div className="mb-3">
                                        <label className="form-label small">Kod weryfikacyjny</label>
                                        <input type="text" className="form-control" required maxLength="6"
                                               value={emailCode} onChange={e => setEmailCode(e.target.value)}
                                        />
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button type="submit" className="btn btn-success btn-sm">Potwierdź zmianę</button>
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEmailStep(1)}>Anuluj</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;