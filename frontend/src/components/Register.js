import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register(formData);
    if (result.success) {
      setSuccess(result.message);
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <div>
          <h2 className="form-title">
            Đăng ký tài khoản
          </h2>
        </div>
        <form className="form-group" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <div className="form-input-container">
            <div>
              <input
                type="text"
                name="username"
                required
                className="form-input form-input-first"
                placeholder="Tên đăng nhập"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                type="email"
                name="email"
                required
                className="form-input form-input-middle"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                type="password"
                name="password"
                required
                className="form-input form-input-middle"
                placeholder="Mật khẩu"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                type="text"
                name="full_name"
                required
                className="form-input form-input-middle"
                placeholder="Họ và tên"
                value={formData.full_name}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                type="tel"
                name="phone"
                required
                className="form-input form-input-last"
                placeholder="Số điện thoại"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="form-submit-btn"
            >
              Đăng ký
            </button>
          </div>
          <div className="form-link">
            <a href="/login">Đã có tài khoản? Đăng nhập</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;