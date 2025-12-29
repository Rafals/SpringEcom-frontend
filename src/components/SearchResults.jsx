import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SearchResults = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchData, setSearchData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (location.state && location.state.searchData) {
            setSearchData(location.state.searchData);
            setLoading(false);
        } else {
            navigate("/");
        }
    }, [location, navigate]);

    const convertBase64ToDataURL = (base64String, mimeType = 'image/jpeg') => {
        if (!base64String) return "/placeholder.png"; // Użyj poprawnego ścieżki do obrazka fallback
        return `data:${mimeType};base64,${base64String}`;
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border"></div></div>;

    return (
        <div className="container mt-5 pt-5">
            <h2 className="mb-4">Results for your search</h2>
            <div className="row row-cols-1 row-cols-md-3 g-4">
                {searchData.map((product) => (
                    <div key={product.id} className="col">
                        <div className="card h-100 shadow-sm border-0">
                            {/* Zmienione na product.imageData zgodnie z logami Hibernate */}
                            <img
                                src={convertBase64ToDataURL(product.imageData, product.imageType)}
                                className="card-img-top p-3"
                                style={{ height: "200px", objectFit: "contain" }}
                                alt={product.name}
                            />
                            <div className="card-body d-flex flex-column">
                                <h5 className="card-title">{product.name}</h5>
                                <p className="text-muted small mb-2">{product.brand} | {product.category}</p>
                                <p className="card-text flex-grow-1">{product.description.substring(0, 80)}...</p>
                                {/* Zmienione na DOLARY */}
                                <h4 className="text-primary mb-3">${product.price}</h4>
                                <button className="btn btn-primary w-100 mt-auto" onClick={() => navigate(`/product/${product.id}`)}>
                                    View Product
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SearchResults;