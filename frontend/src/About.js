import React, { useState } from 'react';

function About() {
  const primaryColor = '#3198db'; 
  const textColor = '#2c3e50'; 
  const secondaryTextColor = '#7f8c8d'; 
  const sectionBackground = 'white'; 
  const shadowColor = 'rgba(0, 0, 0, 0.1)'; // Shadow color

  //hover effect
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section
      style={{
        maxWidth: '800px',
        margin: '40px auto',
        backgroundColor: sectionBackground,
        padding: '30px',
        borderRadius: '8px',
        boxShadow: isHovered ? `0 6px 16px ${shadowColor}` : `0 4px 12px ${shadowColor}`,
        textAlign: 'center',
        transition: 'transform 0.3s, box-shadow 0.3s',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: primaryColor, marginBottom: '20px' }}>
        About BreadBasket
      </h2>
      <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: textColor, marginBottom: '20px' }}>
        BreadBasket helps you find the best grocery deals in your area. Our mission is to make grocery shopping easier and more affordable for everyone. Whether you're a student on a budget or a family looking to save, BreadBasket is here to help you discover the best prices near you.
      </p>
      <p style={{ fontSize: '1rem', color: secondaryTextColor, fontStyle: 'italic', marginTop: '20px' }}>
        Developed by a passionate team of University of Florida students: Yaroslav Voryk, Kyle Miller, Jackson Schreiber, and Ahmed Eltabbakh. We’re excited to bring this app to life and help people save money while shopping for groceries. Thank you for using BreadBasket!
      </p>
    </section>
  );
}

export default About;