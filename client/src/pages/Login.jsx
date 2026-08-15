import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import authService from '../services/authService';
import useAuthStore from '../store/authStore';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, isAuthenticated, isInitialized } = useAuthStore();

  React.useEffect(() => {
    if (isInitialized && isAuthenticated) {
      const from = location.state?.from || '/app';
      navigate(from, { replace: true });
    }
  }, [isInitialized, isAuthenticated, navigate, location]);

  const handleLogin = async (data) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await authService.loginUser(data);
      setUser(response.data.user);
      
      const from = location.state?.from || '/app';
      navigate(from, { replace: true });
    } catch (error) {
      if (error.message) {
        setServerError(error.message);
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Login to your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm 
            onSubmit={handleLogin} 
            isLoading={isLoading} 
            serverError={serverError} 
          />
          
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link to="/register" state={{ from: location.state?.from }} className="font-medium text-blue-600 hover:text-blue-500">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
