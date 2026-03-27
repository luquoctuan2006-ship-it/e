import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navigation.css";

const Navigation = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <h1 className="nav-logo">eventbooking</h1>
        <ul className="nav-menu">
          {(!isAuthenticated || user?.role === "user") && (
            <li className="nav-item">
              <Link to="/" className="nav-link">
                trang chủ
              </Link>
            </li>
          )}

          {isAuthenticated && user?.role !== "admin" && (
            <li className="nav-item">
              <Link to="/contact" className="nav-link">
                liên hệ
              </Link>
            </li>
          )}

          {isAuthenticated && (
            <>
              {user?.role === "user" && (
                <li className="nav-item">
                  <Link to="/bookings" className="nav-link">
                    Vé của tôi
                  </Link>
                </li>
              )}
              {user?.role === "admin" && (
                <li className="nav-item">
                  <Link to="/admin/dashboard" className="nav-link">
                    Bảng Điều Khiển
                  </Link>
                </li>
              )}
              {user?.role === "organizer" && (
                <>
                  <li className="nav-item">
                    <Link to="/organizer/events" className="nav-link">
                      Quản lý Sự kiện
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/organizer/bookings" className="nav-link">
                      Quản lý vé
                    </Link>
                  </li>
                </>
              )}

              <li className="nav-item">
                <span className="nav-user">
                  {user?.full_name || user?.username}
                  <span className={`user-role ${user?.role}`}>
                    {user?.role}
                  </span>
                </span>
              </li>

              <li className="nav-item">
                <button className="nav-logout" onClick={logout}>
                  Đăng xuất
                </button>
              </li>
            </>
          )}

          {!isAuthenticated && (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-link">
                  Đăng nhập
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-link nav-link-signup">
                  Đăng ký
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;