import React from 'react';

function StoreLogos() {
  return (
    <section className="store-logos-section">
      <div className="store-logos-container">
        <h3>Compare Prices At These Stores</h3>
        <div className="store-logos">
          <div className="store-logo-item">
            <img 
              src="/images/Kroger_logo.png" 
              alt="Kroger" 
              className="store-logo"
            />
          </div>
          <div className="store-logo-item">
            <img 
              src="/images/Publix_logo.png" 
              alt="Publix" 
              className="store-logo"
            />
          </div>
          <div className="store-logo-item">
            <img 
              src="/images/Aldi _logo.png" 
              alt="Aldi" 
              className="store-logo"
            />
          </div>
          <div className="store-logo-item">
            <img 
              src="/images/Walmart_logo.png" 
              alt="Walmart" 
              className="store-logo"
            />
          </div>
          <div className="store-logo-item">
            <img 
              src="/images/WholeFoods_logo.png" 
              alt="Whole Foods" 
              className="store-logo"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default StoreLogos; 