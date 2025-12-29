import React, { useContext, useState, useEffect } from "react";
import AppContext from "../Context/Context";
import CheckoutPopup from "./CheckoutPopup";
import { Button } from 'react-bootstrap';
import { toast } from "react-toastify";

const Cart = () => {
    // Pobieramy wszystko z Contextu - teraz to serwer zarządza stanem
    const { cart, removeFromCart, addToCart, clearCart } = useContext(AppContext);
    const [totalPrice, setTotalPrice] = useState(0);
    const [showModal, setShowModal] = useState(false);

    // Kalkulacja sumy za każdym razem, gdy koszyk w Contextie się zmieni
    useEffect(() => {
        const total = cart.reduce(
            (acc, item) => acc + item.price * item.quantity,
            0
        );
        setTotalPrice(total);
    }, [cart]);

    // Funkcja pomocnicza do wyświetlania zdjęć Base64
    const convertBase64ToDataURL = (base64String, mimeType = 'image/jpeg') => {
        if (!base64String) return "/fallback-image.jpg";
        if (base64String.startsWith("data:") || base64String.startsWith("http")) {
            return base64String;
        }
        return `data:${mimeType};base64,${base64String}`;
    };

    // Zwiększanie ilości - wysyła zapytanie do bazy przez Context
    const handleIncreaseQuantity = (item) => {
        if (item.quantity < item.stockQuantity) {
            // Dodajemy 1 sztukę do bazy
            addToCart(item, 1);
        } else {
            toast.info("Cannot add more than available stock");
        }
    };

    // Zmniejszanie ilości - wysyła zapytanie do bazy przez Context
    const handleDecreaseQuantity = (item) => {
        if (item.quantity > 1) {
            // "Dodajemy" -1 sztukę, co w bazie zmniejszy licznik
            addToCart(item, -1);
        }
    };

    const handleRemove = (itemId) => {
        if (window.confirm("Remove this item from cart?")) {
            removeFromCart(itemId);
        }
    };

    // Logika po udanym zamówieniu w popupie
    const onCheckoutSuccess = () => {
        clearCart(); // Czyścimy lokalny stan
        setShowModal(false);
        toast.success("Order placed successfully!");
    };

    return (
        <div className="container mt-5 pt-5">
            <div className="row justify-content-center">
                <div className="col-md-10">
                    <div className="card shadow border-0">
                        <div className="card-header bg-primary text-white py-3">
                            <h4 className="mb-0"><i className="bi bi-cart3 me-2"></i>Your Shopping Cart</h4>
                        </div>
                        <div className="card-body">
                            {cart.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="bi bi-cart-x fs-1 text-muted"></i>
                                    <h5 className="mt-3">Your cart is empty</h5>
                                    <p className="text-muted">Looks like you haven't added anything yet.</p>
                                    <a href="/" className="btn btn-primary px-4 mt-2">Start Shopping</a>
                                </div>
                            ) : (
                                <>
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle">
                                            <thead className="table-light">
                                            <tr>
                                                <th>Product</th>
                                                <th className="text-center">Price</th>
                                                <th className="text-center">Quantity</th>
                                                <th className="text-center">Total</th>
                                                <th className="text-end">Action</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {cart.map((item) => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <img
                                                                src={convertBase64ToDataURL(item.imageData, item.imageType)}
                                                                alt={item.name}
                                                                className="rounded me-3 shadow-sm"
                                                                width="70"
                                                                height="70"
                                                                style={{ objectFit: "cover" }}
                                                            />
                                                            <div>
                                                                <h6 className="mb-0 fw-bold">{item.name}</h6>
                                                                <small className="text-muted">{item.brand}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-center">$ {item.price.toFixed(2)}</td>
                                                    <td>
                                                        <div className="d-flex justify-content-center">
                                                            <div className="input-group input-group-sm" style={{ width: "110px" }}>
                                                                <button className="btn btn-outline-secondary" onClick={() => handleDecreaseQuantity(item)}>
                                                                    <i className="bi bi-dash"></i>
                                                                </button>
                                                                <input type="text" className="form-control text-center bg-white" value={item.quantity} readOnly />
                                                                <button className="btn btn-outline-secondary" onClick={() => handleIncreaseQuantity(item)}>
                                                                    <i className="bi bi-plus"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-center fw-bold text-primary">
                                                        $ {(item.price * item.quantity).toFixed(2)}
                                                    </td>
                                                    <td className="text-end">
                                                        <button className="btn btn-sm btn-link text-danger" onClick={() => handleRemove(item.id)}>
                                                            <i className="bi bi-trash3 fs-5"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center mt-4 p-3 bg-light rounded">
                                        <h5 className="mb-0 fw-bold">Grand Total:</h5>
                                        <h4 className="mb-0 text-primary fw-bold">$ {totalPrice.toFixed(2)}</h4>
                                    </div>

                                    <div className="d-grid mt-4">
                                        <Button variant="primary" size="lg" className="fw-bold py-3" onClick={() => setShowModal(true)}>
                                            Proceed to Checkout
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Popup zamówienia */}
            <CheckoutPopup
                show={showModal}
                handleClose={() => setShowModal(false)}
                cartItems={cart}
                totalPrice={totalPrice}
                onSuccess={onCheckoutSuccess} // Przekazujemy callback sukcesu
            />
        </div>
    );
};

export default Cart;