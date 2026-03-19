import React, { useState } from 'react';
import { X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

const AuthModal = ({ isOpen, onClose, defaultView = 'signin' }) => {
  const [view, setView] = useState(defaultView); // 'signin', 'signup', 'forgot', 'reset'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetToken, setResetToken] = useState('');
  
  const { signup, signin, forgotPassword, resetPassword } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      await signup(formData.name, formData.email, formData.password);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signin(formData.email, formData.password);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const response = await forgotPassword(formData.email);
      setSuccess(response.message);
      if (response.reset_token) {
        setResetToken(response.reset_token);
        setView('reset');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      await resetPassword(resetToken || formData.resetToken, formData.password);
      setSuccess('Password reset successful! You can now sign in.');
      setTimeout(() => {
        setView('signin');
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const renderSignIn = () => (
    <form onSubmit={handleSignIn} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="your@email.com"
          value={formData.email}
          onChange={handleChange}
          required
          data-testid="signin-email"
        />
      </div>
      
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
          data-testid="signin-password"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-cyan-600 hover:bg-cyan-700"
        disabled={loading}
        data-testid="signin-submit"
      >
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : 'Sign In'}
      </Button>
      
      <div className="text-center space-y-2">
        <button
          type="button"
          onClick={() => setView('forgot')}
          className="text-sm text-cyan-600 hover:underline"
          data-testid="forgot-password-link"
        >
          Forgot password?
        </button>
        <div className="text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => setView('signup')}
            className="text-cyan-600 hover:underline font-medium"
            data-testid="goto-signup"
          >
            Sign up
          </button>
        </div>
      </div>
    </form>
  );

  const renderSignUp = () => (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="John Doe"
          value={formData.name}
          onChange={handleChange}
          required
          data-testid="signup-name"
        />
      </div>
      
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="your@email.com"
          value={formData.email}
          onChange={handleChange}
          required
          data-testid="signup-email"
        />
      </div>
      
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={6}
          data-testid="signup-password"
        />
      </div>
      
      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          data-testid="signup-confirm-password"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-cyan-600 hover:bg-cyan-700"
        disabled={loading}
        data-testid="signup-submit"
      >
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : 'Sign Up'}
      </Button>
      
      <div className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => setView('signin')}
          className="text-cyan-600 hover:underline font-medium"
          data-testid="goto-signin"
        >
          Sign in
        </button>
      </div>
    </form>
  );

  const renderForgotPassword = () => (
    <form onSubmit={handleForgotPassword} className="space-y-4">
      <p className="text-sm text-gray-600">
        Enter your email address and we'll send you a password reset link.
      </p>
      
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="your@email.com"
          value={formData.email}
          onChange={handleChange}
          required
          data-testid="forgot-email"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-cyan-600 hover:bg-cyan-700"
        disabled={loading}
        data-testid="forgot-submit"
      >
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : 'Send Reset Link'}
      </Button>
      
      <div className="text-center text-sm text-gray-600">
        <button
          type="button"
          onClick={() => setView('signin')}
          className="text-cyan-600 hover:underline"
          data-testid="back-to-signin"
        >
          Back to sign in
        </button>
      </div>
    </form>
  );

  const renderResetPassword = () => (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <p className="text-sm text-gray-600">
        Enter your new password below.
      </p>
      
      {!resetToken && (
        <div>
          <Label htmlFor="resetToken">Reset Token</Label>
          <Input
            id="resetToken"
            name="resetToken"
            type="text"
            placeholder="Enter reset token from email"
            value={formData.resetToken}
            onChange={handleChange}
            required
            data-testid="reset-token"
          />
        </div>
      )}
      
      <div>
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={6}
          data-testid="reset-password"
        />
      </div>
      
      <div>
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          data-testid="reset-confirm-password"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-cyan-600 hover:bg-cyan-700"
        disabled={loading}
        data-testid="reset-submit"
      >
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Resetting...</> : 'Reset Password'}
      </Button>
    </form>
  );

  const titles = {
    signin: 'Sign In',
    signup: 'Create Account',
    forgot: 'Forgot Password',
    reset: 'Reset Password'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="auth-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">{titles[view]}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-900">{success}</AlertDescription>
            </Alert>
          )}
          
          {view === 'signin' && renderSignIn()}
          {view === 'signup' && renderSignUp()}
          {view === 'forgot' && renderForgotPassword()}
          {view === 'reset' && renderResetPassword()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
