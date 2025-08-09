import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, Book } from 'lucide-react';
import { authManager } from '../utils/authManager';
import { User as UserType } from '../types';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    await new Promise(resolve => setTimeout(resolve, 1000));

    const result = authManager.login(username, password);
    if (result.success && result.user) {
      onLogin(result.user);
    } else {
      setError(result.error || 'Login failed');
    }

    setIsLoading(false);
  };

  return (
   <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4"
     style={{ backgroundImage: "url('class.jpg')" }}>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-900 rounded-full p-4 mb-4">
            <Book className="text-white w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-center text-blue-900 mb-1">
            Varitas Vision
          </h1>
          <p className="text-sm text-gray-600 text-center">
            Welcome back. Please log in to your account.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-100 text-red-700 text-sm px-4 py-2 rounded-md border border-red-300">
              {error}
            </div>
          )}

          {/* Show Password and Forgot Link */}
          <div className="flex justify-between items-center text-sm">
            <label className="flex items-center gap-1 text-gray-600">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              Show password
            </label>
            <a href="#" className="text-blue-600 hover:underline">Forget password?</a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition duration-200 disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-5 text-center">
          <a href="#" className="text-sm text-blue-700 hover:underline">
            View Demo Credentials
          </a>
        </div>
      </div>
    </div>
  );
};
