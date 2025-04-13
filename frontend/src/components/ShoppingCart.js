import React, { useState, useEffect } from 'react';
import './ShoppingCart.css';

function ShoppingCart({ isOpen, onClose }) {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);

  // Load cart items when the cart is opened
  useEffect(() => {
    if (isOpen) {
      loadCartItems();
    }
  }, [isOpen]);

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = (event) => {
      if (event.detail?.cartItems) {
        setCartItems(event.detail.cartItems);
      } else {
        loadCartItems();
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const loadCartItems = () => {
    try {
      const savedCart = localStorage.getItem('cartItems_v2');
      if (savedCart) {
        const items = JSON.parse(savedCart);
        setCartItems(items);
      }
    } catch (error) {
      console.error('Error loading cart items:', error);
      setCartItems([]);
    }
  };

  useEffect(() => {
    // Calculate total price
    const newTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotal(newTotal);
  }, [cartItems]);

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 0) return;
    
    const updatedItems = cartItems.map(item =>
      item.id === itemId
        ? { ...item, quantity: newQuantity }
        : item
    ).filter(item => item.quantity > 0);

    setCartItems(updatedItems);
    localStorage.setItem('cartItems_v2', JSON.stringify(updatedItems));

    // Dispatch cart update event
    const event = new CustomEvent('cartUpdated', {
      detail: { cartItems: updatedItems }
    });
    window.dispatchEvent(event);
  };

  const removeItem = (itemId) => {
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedItems);
    localStorage.setItem('cartItems_v2', JSON.stringify(updatedItems));

    // Dispatch cart update event
    const event = new CustomEvent('cartUpdated', {
      detail: { cartItems: updatedItems }
    });
    window.dispatchEvent(event);
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cartItems_v2');

    // Dispatch cart update event
    const event = new CustomEvent('cartUpdated', {
      detail: { cartItems: [] }
    });
    window.dispatchEvent(event);
  };

  if (!isOpen) return null;

  return (
    <div className="shopping-cart-overlay">
      <div className="shopping-cart">
        <div className="cart-header">
          <h2>Your Cart</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p>Your cart is empty</p>
            <button className="continue-shopping" onClick={onClose}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <img src={item.image} alt={item.item} className="item-image" />
                  <div className="item-details">
                    <h3>{item.item}</h3>
                    <p className="item-store">{item.store}</p>
                    <p className="item-price">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="quantity-controls">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="quantity-btn"
                    >
                      −
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="quantity-btn"
                    >
                      +
                    </button>
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="remove-item"
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            <div className="cart-footer">
              <div className="cart-total">
                <span>Total:</span>
                <span className="total-amount">${total.toFixed(2)}</span>
              </div>
              <div className="cart-actions">
                <button className="clear-cart" onClick={clearCart}>
                  Clear Cart
                </button>
                <button className="checkout">
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ShoppingCart; 