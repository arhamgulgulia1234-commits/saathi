import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthPage() {
  const { login, register, continueAsAnonymous } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    let res;
    if (isLogin) {
      res = await login(formData.email, formData.password);
    } else {
      res = await register(formData.username, formData.email, formData.password);
    }

    if (!res.success) {
      setError(res.error || "Something didn't quite work. Please try again gently.");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="welcome-glow" aria-hidden="true" />
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <div className="auth-logo">🌸</div>
          <h2>Saathi</h2>
          <p>Your safe space.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div 
                key="username"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="input-group"
              >
                <label>What should we call you?</label>
                <input 
                  type="text" 
                  name="username" 
                  value={formData.username} 
                  onChange={handleChange}
                  placeholder="Your preferred name"
                  disabled={loading}
                  required={!isLogin}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange}
              placeholder="hello@example.com"
              disabled={loading}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange}
              placeholder="Something secure"
              disabled={loading}
              required
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="soft-error"
            >
              {error}
            </motion.div>
          )}

          <button type="submit" className="btn-auth-main" disabled={loading}>
            {loading ? 'Just a moment...' : (isLogin ? 'Welcome back' : 'Create my safe space')}
          </button>
        </form>

        <div className="auth-toggle">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={() => setIsLogin(!isLogin)} disabled={loading}>
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button 
          type="button" 
          className="btn-anonymous" 
          onClick={continueAsAnonymous}
          disabled={loading}
        >
          Continue anonymously
        </button>
      </motion.div>
    </div>
  );
}
