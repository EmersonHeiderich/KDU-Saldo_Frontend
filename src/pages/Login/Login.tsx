// src/pages/Login/Login.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Correct path
import styles from './Login.module.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    if (!username.trim() || !password.trim()) {
      setError('Por favor, preencha o usuário e a senha.');
      return;
    }

    setLoading(true);
    try {
      const loginSuccess = await login(username, password);
      if (loginSuccess) {
        navigate('/', { replace: true }); // Navigate to home on success, replace history entry
      }
      // If login fails, the service/context throws an error caught below
    } catch (error: any) {
      console.error("Login page error:", error);
      // Display the specific error message from the service/API
      setError(error.message || 'Erro desconhecido ao tentar fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPageContainer}> {/* Changed class name */}
      <div className={styles.loginFormContainer}> {/* Changed class name */}
         {/* Header inside the container */}
         <header className={styles.loginPageHeader}>
             <i className={`fas fa-warehouse ${styles.logoIcon}`}></i> {/* Example Icon */}
             <h1>Consulta de Saldos</h1>
             <p className={styles.loginSubtitle}>Acesso ao sistema</p> {/* Changed class name */}
         </header>

        <div className={styles.loginCard}>
          {/* Removed redundant header */}
          <div className={styles.loginBody}>
            <form onSubmit={handleLogin}>
              <div className={styles.formGroup}>
                <label htmlFor="username">Usuário</label>
                <div className={styles.inputWithIcon}>
                  <i className="fas fa-user"></i>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Seu nome de usuário" // Updated placeholder
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading} // Disable input while loading
                    autoComplete="username"
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="password">Senha</label>
                <div className={styles.inputWithIcon}>
                  <i className="fas fa-lock"></i>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Sua senha" // Updated placeholder
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>
              </div>
              {error && (
                <div className={styles.loginError}>
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}
              <button
                 type="submit"
                 className={`btn primary ${styles.loginBtn}`} // Use base btn and primary
                 disabled={loading}
               >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span> Entrando...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt"></i>
                    <span> Entrar</span>
                  </>
                )}
              </button>
            </form>
          </div>
          {/* Optional Footer */}
          {/* <div className={styles.loginFooter}>
                <a href="#">Esqueceu a senha?</a>
          </div> */}
        </div>
         <p className={styles.footerText}>© {new Date().getFullYear()} Têxteis ABC</p> {/* Example footer */}
      </div>
    </div>
  );
};

export default Login;