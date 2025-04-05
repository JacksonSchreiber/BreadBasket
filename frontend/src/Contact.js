import React, { useState } from 'react';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [responseMessage, setResponseMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      setResponseMessage(data.message);
      setFormData({ name: '', email: '', message: '' }); // Reset form
    } catch (error) {
      setResponseMessage('Error sending message. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Inline styling for the entire section wrapper
  const sectionStyle = {
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0fff0, #f8f8ff)',
    padding: '40px 0',
  };

  // Inline styling for the card container
  const cardStyle = {
    backgroundColor: '#ffffff',
    width: '90%',
    maxWidth: '500px',
    borderRadius: '12px',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
    padding: '30px',
    margin: '0 20px',
    transition: 'transform 0.3s',
  };

  // Simple hover effect for the card
  const cardHoverStyle = {
    transform: 'translateY(-5px)',
  };

  // Inline styling for the heading
  const headingStyle = {
    textAlign: 'center',
    marginBottom: '10px',
    fontSize: '2rem',
    color: '#3498db',
  };

  // Inline styling for labels
  const labelStyle = {
    textAlign: 'left',
    fontWeight: 'bold',
    marginBottom: '8px',
    display: 'block',
    color: '#2c3e50',
  };

  // Inline styling for input fields and textarea
  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    borderRadius: '6px',
    border: '1px solid #bdc3c7',
    fontSize: '1rem',
    boxSizing: 'border-box',
    outline: 'none',
  };

  // Inline styling for the button
  const buttonStyle = {
    padding: '12px 24px',
    background: 'linear-gradient(to right, #34c759, #2ecc71)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1rem',
    transition: 'background 0.3s, transform 0.3s',
  };

  const buttonHoverStyle = {
    transform: 'translateY(-2px)',
  };

  // We can combine card and button hover effects via local state
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  return (
    <section style={sectionStyle}>
      <div
        style={{
          ...cardStyle,
          ...(isCardHovered ? cardHoverStyle : {}),
        }}
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={() => setIsCardHovered(false)}
      >
        <h2 style={headingStyle}>Contact Us</h2>
        <p style={{ textAlign: 'center', marginBottom: '30px', color: '#2c3e50' }}>
          Have questions or complaints? Fill out the form below.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="name" style={labelStyle}>Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            style={inputStyle}
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            required
          />

          <label htmlFor="email" style={labelStyle}>Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            style={inputStyle}
            value={formData.email}
            onChange={handleChange}
            placeholder="Your email"
            required
          />

          <label htmlFor="message" style={labelStyle}>Message:</label>
          <textarea
            id="message"
            name="message"
            style={{ ...inputStyle, height: '120px', resize: 'vertical' }}
            value={formData.message}
            onChange={handleChange}
            placeholder="Your message"
            required
          />

          <button
            type="submit"
            style={{
              ...buttonStyle,
              ...(isButtonHovered ? buttonHoverStyle : {}),
              marginTop: '10px',
            }}
            onMouseEnter={() => setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Submit'}
          </button>
        </form>

        {responseMessage && (
          <p
            style={{
              marginTop: '20px',
              textAlign: 'center',
              color: responseMessage.toLowerCase().includes('error') ? '#c0392b' : '#27ae60',
              fontWeight: '500',
            }}
          >
            {responseMessage}
          </p>
        )}
      </div>
    </section>
  );
}

export default Contact;
