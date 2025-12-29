import { useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect } from "react";
import { useState } from "react";
import AppContext from "../Context/Context";
import axios from "../axios";
import { toast } from "react-toastify";

const Product = () => {
    const { id } = useParams();
    const { addToCart, removeFromCart, refreshData, fetchCart } = useContext(AppContext);
    const [product, setProduct] = useState(null);
    const [imageUrl, setImageUrl] = useState("");
    const navigate = useNavigate();
    const baseUrl = import.meta.env.VITE_BASE_URL;

    // POBIERANIE DANYCH O TYPIE UŻYTKOWNIKA
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(
                    `${baseUrl}/api/product/${id}`
                );
                setProduct(response.data);
                if (response.data.imageName) {
                    fetchImage();
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            }
        };

        const fetchImage = async () => {
            try {
                const response = await axios.get(
                    `${baseUrl}/api/product/${id}/image`,
                    { responseType: "blob" }
                );
                setImageUrl(URL.createObjectURL(response.data));
            } catch (error) {
                console.error("Error fetching image:", error);
            }
        };
        fetchProduct();
    }, [id, baseUrl]);

    const deleteProduct = async () => {
        try {
            // Przy usuwaniu warto dodać token do nagłówka (jeśli nie masz tego w axios.js)
            await axios.delete(`${baseUrl}/api/product/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            removeFromCart(id);
            toast.success("Product deleted successfully");
            refreshData();
            navigate("/");
        } catch (error) {
            toast.error("Error deleting product");
            console.error("Error deleting product:", error);
        }
    };

    const handleEditClick = () => {
        navigate(`/product/update/${id}`);
    };

    // Product.jsx
    const handlAddToCart = async () => {
        const currentToken = localStorage.getItem("token"); // Pobierz świeży token

        if (!currentToken || currentToken === "null") {
            toast.info("Please login to add products to cart");
            navigate("/login");
            return;
        }

        try {
            await axios.post(`${baseUrl}/api/cart/add/${product.id}`, {}, {
                headers: { Authorization: `Bearer ${currentToken}` }
            });
            fetchCart();
            toast.success("Product saved in your account cart!");
        } catch (error) {
            toast.error("Could not sync cart with server");
        }
    };

    if (!product) {
        return (
            <div className="container mt-5 pt-5 text-center">
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        );
    }

    return (
        <div className="container mt-5 pt-5">
            <div className="row">
                <div className="col-md-6 mb-4 text-center">
                    <div className="card border-0 shadow-sm p-3 bg-body-tertiary">
                        <img
                            src={imageUrl || "https://via.placeholder.com/400"}
                            alt={product.name}
                            className="img-fluid rounded"
                            style={{ maxHeight: "450px", objectFit: "contain" }}
                        />
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge bg-primary px-3 py-2">{product.category}</span>
                        <small className="text-muted">
                            Listed: {new Date(product.releaseDate).toLocaleDateString()}
                        </small>
                    </div>

                    <h1 className="fw-bold mb-1">{product.name}</h1>
                    <p className="text-muted fs-5">Brand: {product.brand}</p>

                    <div className="my-4">
                        <h5 className="fw-bold">Description:</h5>
                        <p className="text-secondary">{product.description}</p>
                    </div>

                    <h2 className="text-primary fw-bold mb-4">$ {product.price}</h2>

                    <div className="d-grid gap-2 mb-4">
                        <button
                            className="btn btn-primary btn-lg fw-bold py-3"
                            onClick={handlAddToCart}
                            disabled={!product.productAvailable || product.stockQuantity === 0}
                        >
                            {product.stockQuantity !== 0 ? (
                                <><i className="bi bi-cart-plus me-2"></i>Add to Cart</>
                            ) : (
                                "Out of Stock"
                            )}
                        </button>
                    </div>

                    <p className="mb-4">
                        Status: {product.stockQuantity > 0 ? (
                        <span className="badge bg-success">In Stock ({product.stockQuantity})</span>
                    ) : (
                        <span className="badge bg-danger">Unavailable</span>
                    )}
                    </p>

                    {/* PRZYCISKI ADMINISTRATORA - WIDOCZNE TYLKO DLA ROLE_ADMIN */}
                    {role === "ROLE_ADMIN" && (
                        <div className="border-top pt-4 mt-2">
                            <h6 className="text-uppercase fw-bold text-muted mb-3 small">Admin Actions</h6>
                            <div className="d-flex gap-3">
                                <button className="btn btn-warning flex-fill fw-bold" onClick={handleEditClick}>
                                    <i className="bi bi-pencil-square me-2"></i>Update
                                </button>

                                <button className="btn btn-danger flex-fill fw-bold" onClick={() => {
                                    if(window.confirm("Are you sure?")) deleteProduct();
                                }}>
                                    <i className="bi bi-trash3 me-2"></i>Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Product;