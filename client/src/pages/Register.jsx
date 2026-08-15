import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';
import authService from '../services/authService';

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (data) => {
    setIsLoading(true);
    setServerError(null);

    try {
      await authService.registerUser(data);
      // Backend returns HTTP 201 on success
      navigate('/onboarding', { 
        state: { message: 'Account created successfully.' },
        replace: true 
      });
    } catch (error) {
      if (error.statusCode === 409 || error.message === 'An account with this email already exists') {
        setServerError('An account with this email already exists.');
      } else if (error.message) {
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
          AI Developer Collaboration Platform
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <RegisterForm 
            onSubmit={handleRegister} 
            isLoading={isLoading} 
            serverError={serverError} 
          />
          
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
