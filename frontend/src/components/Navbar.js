import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <div className="navbar-left">
            <Link to="/" className="navbar-logo navbar-link">
              Event Booking
            </Link>
            <Link to="/" className="navbar-link">
              Trang chủ
            </Link>
            {user && user.role === 'user' &&(
              <Link to="/my-bookings" className="navbar-link">
                Đặt vé của tôi
              </Link>
            )}
            {user && user.role === 'admin' && (
              <Link to="/admin" className="navbar-link">
                Quản lý
              </Link>
            )}
          </div>
          <div className="navbar-right">
            {user ? (
              <>
                <span>Xin chào, {user.full_name}</span>
                <button
                  onClick={handleLogout}
                  className="navbar-logout-btn"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="navbar-link">
                  Đăng nhập
                </Link>
                <Link to="/register" className="navbar-link">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;