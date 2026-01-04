import React, { useEffect, useState } from "react";
import axios from "../axios"; // Twoja instancja axios
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const AdminPanel = () => {
    // --- STANY OGÓLNE ---
    const [activeTab, setActiveTab] = useState("users"); // 'users' lub 'coupons'
    const [isLoading, setIsLoading] = useState(false);

    // --- STANY DANYCH ---
    const [users, setUsers] = useState([]);
    const [coupons, setCoupons] = useState([]);

    // --- STANY FORMULARZY ---
    // 1. Kupony
    const [newCoupon, setNewCoupon] = useState({ code: "", discountPercent: "" });

    // 2. Banowanie
    const [banningUserId, setBanningUserId] = useState(null); // ID usera, któremu chcemy dać bana (otwiera formularz)
    const [banDetails, setBanDetails] = useState({ days: 0, reason: "" });

    const navigate = useNavigate();

    // Weryfikacja Admina i pobranie danych
    useEffect(() => {
        const role = localStorage.getItem("role");
        if (role !== "ROLE_ADMIN") {
            toast.error("Access Denied");
            navigate("/");
        } else {
            fetchData();
        }
    }, [activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === "users") {
                const res = await axios.get("/users");
                setUsers(res.data);
            } else {
                const res = await axios.get("/coupons/all");
                setCoupons(res.data);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Failed to fetch data");
        } finally {
            setIsLoading(false);
        }
    };

    // ==========================================
    // SEKCJA USERÓW (BAN / UNBAN / DELETE)
    // ==========================================

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
        try {
            await axios.delete(`/users/${id}`);
            toast.success("User deleted");
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete user");
        }
    };

    const handleBanUser = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/users/${banningUserId}/ban`, {
                days: parseInt(banDetails.days),
                reason: banDetails.reason
            });
            toast.success("User banned successfully");
            setBanningUserId(null); // Zamknij formularz
            setBanDetails({ days: 0, reason: "" }); // Wyczyść
            fetchData(); // Odśwież listę
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to ban user");
        }
    };

    const handleUnbanUser = async (id) => {
        if (!window.confirm("Unban this user?")) return;
        try {
            await axios.put(`/users/${id}/unban`);
            toast.success("User unbanned");
            fetchData();
        } catch (error) {
            toast.error("Failed to unban");
        }
    };

    // ==========================================
    // SEKCJA KUPONÓW (CREATE / DELETE)
    // ==========================================

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        try {
            await axios.post("/coupons/create", {
                code: newCoupon.code.toUpperCase(),
                discountPercent: parseInt(newCoupon.discountPercent),
                isActive: true
            });
            toast.success("Coupon created!");
            setNewCoupon({ code: "", discountPercent: "" });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data || "Failed to create coupon");
        }
    };

    const handleDeleteCoupon = async (id) => {
        if (!window.confirm("Delete this coupon?")) return;
        try {
            await axios.delete(`/coupons/${id}`);
            toast.success("Coupon deleted");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete coupon");
        }
    };

    // ==========================================
    // RENDEROWANIE (WIDOK)
    // ==========================================

    return (
        <div className="container mt-5 pt-5 mb-5">
            <h2 className="text-center mb-4 text-primary fw-bold">
                <i className="bi bi-shield-lock me-2"></i>Admin Dashboard
            </h2>

            {/* ZAKŁADKI (TABS) */}
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "users" ? "active fw-bold" : ""}`}
                        onClick={() => setActiveTab("users")}
                    >
                        <i className="bi bi-people me-2"></i>Users Management
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "coupons" ? "active fw-bold" : ""}`}
                        onClick={() => setActiveTab("coupons")}
                    >
                        <i className="bi bi-ticket-perforated me-2"></i>Coupons
                    </button>
                </li>
            </ul>

            <div className="card shadow-sm border-0 bg-body-tertiary">
                <div className="card-body">

                    {isLoading && <div className="text-center py-5"><span className="spinner-border text-primary"></span></div>}

                    {/* ------------------------- */}
                    {/* WIDOK: USERS              */}
                    {/* ------------------------- */}
                    {!isLoading && activeTab === "users" && (
                        <div className="table-responsive">

                            {/* PANEL BANOWANIA (WYSYWA SIĘ NAD TABELĄ) */}
                            {banningUserId && (
                                <div className="alert alert-warning p-3 mb-4 shadow-sm border-warning">
                                    <h5 className="alert-heading fw-bold"><i className="bi bi-hammer me-2"></i>Ban User (ID: {banningUserId})</h5>
                                    <hr />
                                    <form onSubmit={handleBanUser} className="row g-3 align-items-end">
                                        <div className="col-md-3">
                                            <label className="form-label small fw-bold">Duration (Days)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                min="0"
                                                placeholder="0 = Permanent"
                                                value={banDetails.days}
                                                onChange={e => setBanDetails({...banDetails, days: e.target.value})}
                                            />
                                            <div className="form-text text-muted">0 for permanent ban</div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Reason</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. Spam, Abusive language..."
                                                required
                                                value={banDetails.reason}
                                                onChange={e => setBanDetails({...banDetails, reason: e.target.value})}
                                            />
                                        </div>
                                        <div className="col-md-3 d-flex gap-2">
                                            <button type="submit" className="btn btn-danger w-100 fw-bold">Confirm Ban</button>
                                            <button
                                                type="button"
                                                className="btn btn-secondary w-100"
                                                onClick={() => { setBanningUserId(null); setBanDetails({days:0, reason:""}); }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <table className="table table-hover align-middle">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className={user.banned ? "table-danger" : ""}>
                                        <td>{user.id}</td>
                                        <td>
                                            <div className="fw-bold">{user.username}</div>
                                            <small className="text-muted">{user.email}</small>
                                            <div className="small text-muted fst-italic">{user.authProvider}</div>
                                        </td>
                                        <td>
                                                <span className={`badge ${user.role === 'ROLE_ADMIN' ? 'bg-dark' : 'bg-secondary'}`}>
                                                    {user.role}
                                                </span>
                                        </td>

                                        {/* --- ZMIANA TUTAJ: Nowa logika statusów (Banned / Registered / Active) --- */}
                                        <td>
                                            {user.banned ? (
                                                <div>
                                                    <span className="badge bg-danger mb-1">BANNED</span>
                                                    <div className="small text-danger fw-bold">
                                                        {user.banExpiration ? `Till: ${new Date(user.banExpiration).toLocaleDateString()}` : "PERMANENT"}
                                                    </div>
                                                    <div className="small text-muted fst-italic">"{user.banReason}"</div>
                                                </div>
                                            ) : !user.enabled ? (
                                                // Jeśli user nie jest zbanowany, ale nie potwierdził maila
                                                <span className="badge bg-warning text-dark border border-warning">Registered (Not Verified)</span>
                                            ) : (
                                                // Jeśli wszystko OK
                                                <span className="badge bg-success">Active</span>
                                            )}
                                        </td>
                                        {/* ----------------------------------------------------------------------- */}

                                        <td className="text-end">
                                            {/* ... przyciski akcji bez zmian ... */}
                                            {user.role !== "ROLE_ADMIN" && (
                                                <div className="d-flex justify-content-end gap-2">
                                                    {user.banned ? (
                                                        <button
                                                            className="btn btn-sm btn-outline-success"
                                                            title="Unban User"
                                                            onClick={() => handleUnbanUser(user.id)}
                                                        >
                                                            <i className="bi bi-unlock-fill"></i> Unban
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="btn btn-sm btn-outline-warning"
                                                            title="Ban User"
                                                            onClick={() => {
                                                                setBanningUserId(user.id);
                                                                setBanDetails({ days: 0, reason: "" });
                                                                window.scrollTo(0, 0);
                                                            }}
                                                        >
                                                            <i className="bi bi-hammer"></i> Ban
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        title="Delete User Permanently"
                                                        onClick={() => handleDeleteUser(user.id)}
                                                    >
                                                        <i className="bi bi-trash3"></i>
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            {users.length === 0 && <p className="text-center text-muted mt-3">No users found.</p>}
                        </div>
                    )}

                    {/* ------------------------- */}
                    {/* WIDOK: KUPONY             */}
                    {/* ------------------------- */}
                    {!isLoading && activeTab === "coupons" && (
                        <div>
                            {/* Formularz dodawania */}
                            <div className="p-3 mb-4 bg-opacity-10 border rounded mx-1 bg-success-subtle">
                                <h5 className="mb-3 text-success fw-bold"><i className="bi bi-plus-circle me-2"></i>Create New Coupon</h5>
                                <form onSubmit={handleCreateCoupon} className="row g-3 align-items-end">
                                    <div className="col-md-5">
                                        <label className="form-label small fw-bold">Coupon Code</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. SUMMER2026"
                                            value={newCoupon.code}
                                            onChange={e => setNewCoupon({...newCoupon, code: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small fw-bold">Discount %</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="10"
                                            min="1" max="100"
                                            value={newCoupon.discountPercent}
                                            onChange={e => setNewCoupon({...newCoupon, discountPercent: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <button type="submit" className="btn btn-success w-100 fw-bold">
                                            Create
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Lista Kuponów */}
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Discount</th>
                                        <th>Status</th>
                                        <th className="text-end">Action</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {coupons.map(coupon => (
                                        <tr key={coupon.id}>
                                            <td className="fw-bold text-success font-monospace fs-5">{coupon.code}</td>
                                            <td><span className="badge bg-primary fs-6">-{coupon.discountPercent}%</span></td>
                                            <td>
                                                <span className="badge bg-success">Active</span>
                                            </td>
                                            <td className="text-end">
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDeleteCoupon(coupon.id)}
                                                >
                                                    <i className="bi bi-trash3"></i> Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                {coupons.length === 0 && <p className="text-center text-muted mt-3">No coupons available.</p>}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default AdminPanel;