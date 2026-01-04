import React, { useContext, useState } from "react";
import AppContext from "../Context/Context";
import { useNavigate } from "react-router-dom";
import axios from "../axios"; // Używamy Twojej instancji axios
import { toast } from "react-toastify";

const Checkout = () => {
    const { cart, clearCart } = useContext(AppContext);
    const navigate = useNavigate();

    // --- STANY FORMULARZA ---
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        street: "",
        city: "",
        zipCode: "",
        shippingMethod: "DHL", // Domyślna metoda
    });

    // --- STANY KUPONÓW ---
    const [couponCode, setCouponCode] = useState("");      // To co wpisuje user
    const [appliedCoupon, setAppliedCoupon] = useState(null); // Kod zatwierdzony przez backend
    const [discountPercent, setDiscountPercent] = useState(0); // Ile % zniżki
    const [isCouponLoading, setIsCouponLoading] = useState(false);

    // --- LOGIKA KALKULACJI ---
    const calculateSubtotal = () => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const getShippingCost = (method) => {
        switch (method) {
            case "DHL": return 15.00;
            case "DPD": return 12.00;
            case "Poczta Polska": return 8.50;
            default: return 0;
        }
    };

    // 1. Obliczamy sumę produktów
    const subtotal = calculateSubtotal();

    // 2. Obliczamy wartość zniżki (Subtotal * Procent)
    const discountAmount = (subtotal * discountPercent) / 100;

    // 3. Obliczamy koszt wysyłki
    const shippingCost = getShippingCost(formData.shippingMethod);

    // 4. FINALNA KWOTA (Produkty - Rabat + Wysyłka)
    const total = subtotal - discountAmount + shippingCost;


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- FUNKCJA SPRAWDZAJĄCA KUPON ---
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsCouponLoading(true);

        try {
            // Strzał do Twojego nowego endpointu w CouponController
            const response = await axios.get(`/coupons/validate/${couponCode}`);

            // Jeśli sukces (200 OK):
            setDiscountPercent(response.data.discountPercent);
            setAppliedCoupon(response.data.code);
            toast.success(`Coupon applied! -${response.data.discountPercent}%`);
        } catch (error) {
            console.error(error);
            setDiscountPercent(0);
            setAppliedCoupon(null);
            toast.error(error.response?.data || "Invalid coupon code");
        } finally {
            setIsCouponLoading(false);
        }
    };

    // --- SKŁADANIE ZAMÓWIENIA ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        const orderRequest = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            street: formData.street,
            city: formData.city,
            zipCode: formData.zipCode,
            shippingMethod: formData.shippingMethod,
            totalAmount: total, // To i tak backend przeliczy, ale wysyłamy poglądowo
            couponCode: appliedCoupon // <--- WAŻNE: Wysyłamy zatwierdzony kod!
        };

        try {
            const response = await axios.post("/orders", orderRequest);
            if (response.status === 200 || response.status === 201) {
                toast.success("Order placed successfully!");
                clearCart();
                navigate("/orders");
            }
        } catch (error) {
            console.error("Order error:", error);
            toast.error("Failed to place order. Please try again.");
        }
    };

    if (cart.length === 0) {
        return (
            <div className="container mt-5 pt-5 text-center">
                <h2>Your cart is empty</h2>
                <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>Go Shopping</button>
            </div>
        );
    }

    return (
        <div className="container mt-5 pt-5 mb-5">
            <div className="row g-5">

                {/* --- LEWA KOLUMNA: PODSUMOWANIE KOSZYKA --- */}
                <div className="col-md-5 col-lg-4 order-md-last">
                    <h4 className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-primary">Your cart</span>
                        <span className="badge bg-primary rounded-pill">{cart.length}</span>
                    </h4>

                    <ul className="list-group mb-3 shadow-sm">
                        {cart.map((item) => (
                            <li className="list-group-item d-flex justify-content-between lh-sm" key={item.id}>
                                <div>
                                    <h6 className="my-0">{item.name}</h6>
                                    <small className="text-muted">Quantity: {item.quantity}</small>
                                </div>
                                <span className="text-muted">${(item.price * item.quantity).toFixed(2)}</span>
                            </li>
                        ))}

                        {/* Wiersz z rabatem (pokazuje się tylko gdy jest zniżka) */}
                        {discountPercent > 0 && (
                            <li className="list-group-item d-flex justify-content-between bg-body-tertiary">
                                <div className="text-success">
                                    <h6 className="my-0">Promo code</h6>
                                    <small>{appliedCoupon}</small>
                                </div>
                                <span className="text-success">-${discountAmount.toFixed(2)}</span>
                            </li>
                        )}

                        {/* Wiersz z wysyłką */}
                        <li className="list-group-item d-flex justify-content-between">
                            <span>Shipping ({formData.shippingMethod})</span>
                            <span>${shippingCost.toFixed(2)}</span>
                        </li>

                        {/* Suma całkowita */}
                        <li className="list-group-item d-flex justify-content-between fw-bold fs-5">
                            <span>Total (USD)</span>
                            <span>${total.toFixed(2)}</span>
                        </li>
                    </ul>

                    {/* --- INPUT NA KOD RABATOWY --- */}
                    <div className="card p-2 shadow-sm">
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Promo code"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())} // Auto uppercase
                                disabled={discountPercent > 0} // Zablokuj jak już dodano
                            />
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleApplyCoupon}
                                disabled={isCouponLoading || discountPercent > 0 || !couponCode}
                            >
                                {isCouponLoading ? "Checking..." : (discountPercent > 0 ? "Applied" : "Redeem")}
                            </button>
                        </div>
                        {discountPercent > 0 && (
                            <button
                                className="btn btn-link btn-sm text-danger text-decoration-none mt-1 text-end"
                                onClick={() => {
                                    setDiscountPercent(0);
                                    setAppliedCoupon(null);
                                    setCouponCode("");
                                }}
                            >
                                Remove coupon
                            </button>
                        )}
                    </div>
                </div>

                {/* --- PRAWA KOLUMNA: DANE ADRESOWE --- */}
                <div className="col-md-7 col-lg-8">
                    <h4 className="mb-3">Billing address</h4>
                    <form className="needs-validation" onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-sm-6">
                                <label className="form-label">First name</label>
                                <input type="text" className="form-control" name="firstName" value={formData.firstName} onChange={handleChange} required />
                            </div>

                            <div className="col-sm-6">
                                <label className="form-label">Last name</label>
                                <input type="text" className="form-control" name="lastName" value={formData.lastName} onChange={handleChange} required />
                            </div>

                            <div className="col-12">
                                <label className="form-label">Street Address</label>
                                <input type="text" className="form-control" name="street" value={formData.street} onChange={handleChange} required />
                            </div>

                            <div className="col-md-5">
                                <label className="form-label">City</label>
                                <input type="text" className="form-control" name="city" value={formData.city} onChange={handleChange} required />
                            </div>

                            <div className="col-md-3">
                                <label className="form-label">Zip</label>
                                <input type="text" className="form-control" name="zipCode" value={formData.zipCode} onChange={handleChange} required />
                            </div>

                            <div className="col-12">
                                <label className="form-label">Shipping Method</label>
                                <select className="form-select" name="shippingMethod" value={formData.shippingMethod} onChange={handleChange}>
                                    <option value="DHL">DHL ($15.00)</option>
                                    <option value="DPD">DPD ($12.00)</option>
                                    <option value="Poczta Polska">Poczta Polska ($8.50)</option>
                                </select>
                            </div>
                        </div>

                        <hr className="my-4" />

                        <button className="w-100 btn btn-primary btn-lg" type="submit">
                            Continue to checkout
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Checkout;