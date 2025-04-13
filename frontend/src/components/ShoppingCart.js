import React, { useState, useEffect, useRef } from 'react';
import './ShoppingCart.css';

function ShoppingCart({ isOpen, onClose }) {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [changingQuantity, setChangingQuantity] = useState(null);
  const cartRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Trigger visibility after a small delay to allow for animation
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleClickOutside = (event) => {
    if (cartRef.current && !cartRef.current.contains(event.target)) {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      onClose();
    }, 300);
  };

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
    
    // Set the changing quantity animation
    setChangingQuantity(itemId);
    setTimeout(() => setChangingQuantity(null), 200);

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
    <div className={`shopping-cart-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`shopping-cart ${isVisible ? 'visible' : ''}`} ref={cartRef} onClick={e => e.stopPropagation()}>
        <div className="cart-header">
          <h2>Your Cart</h2>
          <button className="close-button" onClick={handleClose} aria-label="Close cart">
            ✕
          </button>
        </div>
        
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p>Your cart is empty</p>
            <button className="continue-shopping" onClick={handleClose}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-details">
                    <h3>{item.item}</h3>
                    <p className="item-store">{item.store}</p>
                    <p className="item-price">${(item.price || 0).toFixed(2)}</p>
                  </div>
                  <div className="quantity-controls">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="quantity-btn"
                    >
                      −
                    </button>
                    <span className={`quantity ${changingQuantity === item.id ? 'changing' : ''}`}>
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="quantity-btn"
                    >
                      +
                    </button>
                  </div>
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