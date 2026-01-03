import React, { useContext, useState, useEffect } from "react";
import AppContext from "../Context/Context";
import { useNavigate } from "react-router-dom";
import axios from "../axios";
import { toast } from "react-toastify";

const Checkout = () => {
    const { cart, clearCart } = useContext(AppContext);
    const navigate = useNavigate();

    // Rozszerzone pola o Imię i Nazwisko
    const [address, setAddress] = useState({
        firstName: "",
        lastName: "",
        street: "",
        city: "",
        zipCode: "",
        country: "Poland"
    });

    const shippingPrices = {
        "DHL": 15.00,
        "DPD": 12.00,
        "Poczta Polska": 8.50
    };

    const [shippingMethod, setShippingMethod] = useState("DHL");

    const productsTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const finalTotal = productsTotal + shippingPrices[shippingMethod];

    useEffect(() => {
        const fetchSavedAddress = async () => {
            try {
                const res = await axios.get("/user/address");
                if (res.data) setAddress(res.data);
            } catch (err) {
                console.log("No saved address found");
            }
        };
        fetchSavedAddress();
    }, []);

    const handleConfirmPurchase = async () => {
        if (!address.firstName || !address.lastName || !address.street || !address.city || !address.zipCode) {
            toast.error("Please fill in ALL fields");
            return;
        }

        try {
            // SPŁASZCZAMY OBIEKT: Usuwamy zagnieżdżenie 'shippingAddress'
            const orderPayload = {
                firstName: address.firstName,
                lastName: address.lastName,
                street: address.street,
                city: address.city,
                zipCode: address.zipCode,
                shippingMethod: shippingMethod,
                totalAmount: finalTotal
            };

            console.log("Wysyłam do backendu:", orderPayload); // Sprawdź to w konsoli F12

            await axios.post("/orders", orderPayload);
            toast.success("Order confirmed!");
            clearCart();
            navigate("/orders");
        } catch (err) {
            // Wyświetl konkretny błąd z serwera, żeby wiedzieć co poszło nie tak
            console.error("Błąd serwera:", err.response?.data);
            toast.error(err.response?.data?.message || "Checkout failed");
        }
    };

    if (cart.length === 0) return <div className="container mt-5 pt-5 text-center"><h3>Cart is empty</h3></div>;

    return (
        <div className="container mt-5 pt-5">
            <div className="row">
                <div className="col-md-7">
                    <div className="card shadow-sm p-4 border-0 bg-dark text-white">
                        <h4 className="mb-4 fw-bold text-primary">Shipping Information</h4>

                        <div className="row g-3">
                            {/* NOWE POLA: Imię i Nazwisko */}
                            <div className="col-md-6">
                                <label className="form-label small fw-bold">First Name</label>
                                <input type="text" className="form-control bg-secondary text-white border-0"
                                       value={address.firstName} onChange={(e) => setAddress({...address, firstName: e.target.value})}
                                       placeholder="John" />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold">Last Name</label>
                                <input type="text" className="form-control bg-secondary text-white border-0"
                                       value={address.lastName} onChange={(e) => setAddress({...address, lastName: e.target.value})}
                                       placeholder="Doe" />
                            </div>

                            <div className="col-12">
                                <label className="form-label small fw-bold">Street & Number</label>
                                <input type="text" className="form-control bg-secondary text-white border-0"
                                       value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})}
                                       placeholder="Sunny Street 15" />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold">City</label>
                                <input type="text" className="form-control bg-secondary text-white border-0"
                                       value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold">Zip Code</label>
                                <input type="text" className="form-control bg-secondary text-white border-0"
                                       value={address.zipCode} onChange={(e) => setAddress({...address, zipCode: e.target.value})} />
                            </div>
                        </div>

                        <h4 className="mt-5 mb-3 fw-bold text-primary">Shipping Method</h4>
                        <div className="list-group">
                            {Object.entries(shippingPrices).map(([method, price]) => (
                                <label key={method} className={`list-group-item d-flex justify-content-between align-items-center bg-secondary text-white border-0 mb-2 rounded ${shippingMethod === method ? 'border border-primary' : ''}`} style={{ cursor: "pointer" }}>
                                    <div>
                                        <input className="form-check-input me-3" type="radio" name="shipping"
                                               checked={shippingMethod === method} onChange={() => setShippingMethod(method)} />
                                        {method}
                                    </div>
                                    <span className="fw-bold">$ {price.toFixed(2)}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Podsumowanie */}
                <div className="col-md-5">
                    <div className="card shadow-sm p-4 border-0 bg-dark text-white">
                        <h4 className="mb-4 fw-bold">Order Summary</h4>
                        <div className="mb-4">
                            {cart.map(item => (
                                <div key={item.id} className="d-flex justify-content-between mb-2 small text-muted">
                                    <span>{item.name} x {item.quantity}</span>
                                    <span>$ {(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-top pt-3">
                            <div className="d-flex justify-content-between mb-2">
                                <span>Products:</span>
                                <span>$ {productsTotal.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2 text-info">
                                <span>Shipping:</span>
                                <span>$ {shippingPrices[shippingMethod].toFixed(2)}</span>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold">Total:</h5>
                                <h4 className="fw-bold text-primary">$ {finalTotal.toFixed(2)}</h4>
                            </div>
                        </div>

                        <button className="btn btn-primary w-100 mt-4 py-3 fw-bold" onClick={handleConfirmPurchase}>
                            Confirm & Pay
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;