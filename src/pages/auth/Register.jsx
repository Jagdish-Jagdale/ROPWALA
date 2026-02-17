import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Password Validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast.error("Password must be at least 8 chars with 1 uppercase, 1 lowercase & 1 number/symbol");
      return;
    }

    setLoading(true);
    try {
      await register(email, password, { name });
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (e) {
      console.error(e);
      let errorMsg = "Registration failed. Please try again.";
      if (e.code === 'auth/email-already-in-use') {
        errorMsg = "Email is already registered. Please login instead.";
      } else if (e.code === 'auth/weak-password') {
        errorMsg = "Password is too weak.";
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Background image with blur */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1597868165956-03a6827955b1?w=1600&auto=format&fit=crop&q=80')",
          filter: "blur(5px)",
          transform: "scale(1.1)",
        }}
      />

      {/* Green overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/70 via-emerald-800/60 to-teal-700/70" />

      {/* Animated blur orbs */}
      <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl animate-float" />
      <div className="absolute -left-32 -bottom-32 h-80 w-80 rounded-full bg-green-500/20 blur-3xl animate-float-delayed" />

      <div className="container mx-auto grid h-screen place-items-center p-4 font-sans">
        <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 flex flex-col lg:grid lg:grid-cols-[0.9fr_1fr] min-h-[520px] animate-fadeIn">
          <div className="relative hidden items-center justify-center bg-gradient-to-br from-green-600 to-green-500 p-8 lg:flex">
            <div className="absolute left-6 top-6 grid grid-cols-6 gap-2 opacity-60">
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-white/70"
                />
              ))}
            </div>
            <div className="absolute bottom-8 right-10 h-5 w-5 rounded-full bg-white/70" />

            <div className="pointer-events-none absolute inset-0 bg-[url('https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-soft-light opacity-60" />

            <div className="max-w-xs text-white">
              <h1 className="text-5xl font-bold leading-tight">
                ROPEWALA, Simplified
              </h1>
              <p className="mt-3 text-base leading-relaxed text-white/90">
                Manage your ROPEWALA inventory, track purchases, and grow your
                business with our all-in-one platform
              </p>
            </div>
          </div>

          <div className="relative flex-1 flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 sm:p-8">
            <div className="absolute -right-16 -top-16 hidden h-32 w-32 rounded-full bg-emerald-200/40 blur-2xl animate-pulse-slow lg:block" />

            <div className="mx-auto w-full max-w-sm">
              {/* Logo */}
              <div className="mb-3 flex justify-center">
                <div className="h-20 w-20 overflow-hidden rounded-full bg-white shadow-lg ring-2 ring-green-500/20">
                  <img
                    src="/RopeWala.png"
                    alt="ROPEWALA Logo"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <h2 className="mb-2 text-center text-3xl font-bold text-slate-800">
                Create Account
              </h2>
              <p className="mb-7 text-center text-base text-green-700">
                Join ROPEWALA to get started
              </p>

              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={{ paddingLeft: "2.5rem" }}
                      className="h-12 w-full rounded-lg border border-slate-300 bg-white pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.toLowerCase())}
                      required
                      style={{ paddingLeft: "2.5rem" }}
                      className="h-12 w-full rounded-lg border border-slate-300 bg-white pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
                      className="h-12 w-full rounded-lg border border-slate-300 bg-white text-sm outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  disabled={loading}
                  style={{ borderRadius: "12px" }}
                  className="mt-8 h-12 w-full bg-green-600 px-4 font-semibold text-base text-white shadow-md shadow-green-600/30 transition hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/40 disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>

                <p className="mt-3 text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    style={{ textDecoration: "none", color: "#16a34a" }}
                    className="font-semibold text-green-600 !no-underline hover:!text-green-700"
                  >
                    Login
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
