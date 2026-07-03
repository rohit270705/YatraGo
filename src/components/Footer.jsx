import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Download } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="custom-footer">
      <div className="footer-container">
        {/* Col 1: Brand Col */}
        <div className="brand-col">
          <div className="footer-logo">
            <h2>YatraGo</h2>
          </div>
          <p className="brand-desc">
            Your personal transit & travel companion across India. Offering seamless city rides, intercity bus tickets, driver hiring, vehicle rentals, reliable parcel delivery, and premium holiday packages.
          </p>
          <div className="company-details">
            <p>📍 Tech Park, Andheri East, Mumbai, Maharashtra 400093</p>
            <p>📞 +91 98765 43210 / Support: 1800-123-YATRA</p>
            <p>✉️ support@yatrago.com</p>
          </div>
          <div className="social-section">
            <p>Follow us</p>
            <div className="social-icons">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Col 2: Company */}
        <div className="footer-col">
          <h4>Company</h4>
          <ul>
            <li><Link to="#about">About Us</Link></li>
            <li><Link to="#careers">Careers</Link></li>
            <li><Link to="#press">Press & Media</Link></li>
            <li><Link to="#blog">Our Blog</Link></li>
            <li><Link to="#investors">Investor Relations</Link></li>
            <li><Link to="#contact">Contact Us</Link></li>
          </ul>
        </div>

        {/* Col 3: Services */}
        <div className="footer-col">
          <h4>Services</h4>
          <ul>
            <li><Link to="/search">Book a Ride</Link></li>
            <li><Link to="/search">Bus Tickets</Link></li>
            <li><Link to="/search">Hire a Driver</Link></li>
            <li><Link to="/rentals">Vehicle Rentals</Link></li>
            <li><Link to="/parcel">Parcel Delivery</Link></li>
            <li><Link to="/packages">Holiday Packages</Link></li>
          </ul>
        </div>

        {/* Col 4: Support & Legal */}
        <div className="footer-col">
          <h4>Support & Legal</h4>
          <ul>
            <li><Link to="/support">Help Center</Link></li>
            <li><Link to="#safety">Safety Guide</Link></li>
            <li><Link to="#terms">Terms of Service</Link></li>
            <li><Link to="#privacy">Privacy Policy</Link></li>
            <li><Link to="#refunds">Refund Policy</Link></li>
            <li><Link to="#cookies">Cookie Preferences</Link></li>
          </ul>
        </div>

        {/* Col 5: Get the App */}
        <div className="footer-col">
          <h4>Get the App</h4>
          <p style={{ fontSize: '13px', color: '#b5b6ba', marginBottom: '10px' }}>
            Experience seamless booking on the go with real-time tracking and exclusive mobile offers.
          </p>
          <div className="app-download">
            <a href="#app-store" className="app-btn" onClick={(e) => { e.preventDefault(); alert('Redirecting to Apple App Store...'); }}>
              <Smartphone size={18} />
              <div>
                <div style={{ fontSize: '9px', opacity: 0.8, textTransform: 'uppercase' }}>Download on the</div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>App Store</div>
              </div>
            </a>
            <a href="#play-store" className="app-btn" onClick={(e) => { e.preventDefault(); alert('Redirecting to Google Play Store...'); }}>
              <Download size={18} />
              <div>
                <div style={{ fontSize: '9px', opacity: 0.8, textTransform: 'uppercase' }}>GET IT ON</div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Google Play</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Copyright Bottom Bar */}
      <div className="footer-bottom">
        <p>© 2026 YatraGo Technologies Pvt. Ltd. All rights reserved. Made with ❤️ for Indian Travelers.</p>
      </div>
    </footer>
  );
}
