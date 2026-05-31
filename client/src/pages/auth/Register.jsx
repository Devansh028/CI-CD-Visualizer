import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { User, Mail, Lock, Eye, EyeOff, Loader2, Terminal } from "lucide-react";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState("");

  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  // Clear errors when mounting screen
  useEffect(() => {
    clearError();
  }, [clearError]);

  const validateForm = () => {
    if (!name || !email || !password || !confirmPassword) {
      setValidationError("All fields are required.");
      return false;
    }
    if (name.trim().length < 2) {
      setValidationError("Name must be at least 2 characters.");
      return false;
    }
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setValidationError("Please enter a valid email address.");
      return false;
    }
    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return false;
    }
    setValidationError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await register(name.trim(), email.trim(), password);
      navigate("/");
    } catch (err) {
      // Error is caught by Zustand store
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#07080d] px-4 text-white overflow-hidden">
      {/* Background Neon Effects */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-purple-600/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-blue-600/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Branding header */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-[0_0_25px_rgba(139,92,246,0.3)]">
            <Terminal className="h-7 w-7 text-white" />
          </div>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Get Started
          </h2>
          <p className="mt-2 text-sm text-gray-400 text-center font-light">
            Deploy, monitor, and scale in real-time
          </p>
        </div>

        {/* Register card */}
        <div className="rounded-2xl border border-white/5 bg-[#0e1017]/80 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Show Client/Server errors */}
            {(error || validationError) && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-xs font-medium text-red-400 tracking-wide">
                {validationError || error}
              </div>
            )}

            {/* Name field */}
            <div>
              <label htmlFor="name" className="block text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2.5 pl-10 pr-3 text-sm placeholder-gray-600 text-gray-200 focus:border-purple-500/80 focus:bg-[#151822] focus:outline-none focus:ring-1 focus:ring-purple-500/80 transition duration-300"
                  placeholder="Alex Mercer"
                  required
                />
              </div>
            </div>

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2.5 pl-10 pr-3 text-sm placeholder-gray-600 text-gray-200 focus:border-purple-500/80 focus:bg-[#151822] focus:outline-none focus:ring-1 focus:ring-purple-500/80 transition duration-300"
                  placeholder="alex@platform.com"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2.5 pl-10 pr-10 text-sm placeholder-gray-600 text-gray-200 focus:border-purple-500/80 focus:bg-[#151822] focus:outline-none focus:ring-1 focus:ring-purple-500/80 transition duration-300"
                  placeholder="Min 6 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 transition duration-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2.5 pl-10 pr-10 text-sm placeholder-gray-600 text-gray-200 focus:border-purple-500/80 focus:bg-[#151822] focus:outline-none focus:ring-1 focus:ring-purple-500/80 transition duration-300"
                  placeholder="Repeat your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 transition duration-200"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:brightness-110 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-purple-200" />
                  <span>Registering...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Navigation link to login */}
          <div className="mt-6 text-center text-xs text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-purple-400 hover:text-purple-300 hover:underline transition duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
