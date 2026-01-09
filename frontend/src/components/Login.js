import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(username, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <div>
          <h2 className="form-title">
            Đăng nhập
          </h2>
        </div>
        <form className="form-group" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-input-container">
            <div>
              <input
                type="text"
                required
                className="form-input form-input-first"
                placeholder="Tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="form-input form-input-last"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="form-submit-btn"
            >
              Đăng nhập
            </button>
          </div>
          <div className="form-link">
            <a href="/register">Chưa có tài khoản? Đăng ký</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;