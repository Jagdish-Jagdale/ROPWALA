import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import Loader from "../../components/Loader";

export default function Login() {
  const { t, i18n } = useTranslation(['auth', 'validation', 'common']);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showErrorBorder, setShowErrorBorder] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const { user, isAdmin, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";
  const submittingRef = useRef(false);

  useEffect(() => {
    if (user && isAdmin && !loading && !authLoading) {
      navigate(from, { replace: true });
    }
  }, [user, isAdmin, loading, authLoading, navigate, from]);

  // Handle error auto-dismissal with animation
  useEffect(() => {
    if (error) {
      setIsExiting(false);
      const exitTimer = setTimeout(() => setIsExiting(true), 2700);
      const removeTimer = setTimeout(() => {
        setError("");
        setIsExiting(false);
        setShowErrorBorder(false);
      }, 3000);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [error]);

  const onSubmit = async (e) => {
    e.preventDefault();

    // Prevent double submission
    if (submittingRef.current || loading) {
      return;
    }

    if (!email || !password) {
      setError(t('validation:fill_all_fields'));
      return;
    }

    try {
      submittingRef.current = true;
      setError("");
      setLoading(true);

      await login(email, password);
      toast.success(t('auth:login_success'));
      navigate(from, { replace: true });
    } catch (e) {
      console.error(e);
      // Only show the error message if it's our custom inactive error
      const message = e.message.includes("Account Inactive")
        ? t('validation:account_inactive')
        : t('validation:invalid_credentials');

      setError(message);
      setShowErrorBorder(true);
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  if (authLoading) {
    return <Loader />;
  }

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
              <h1 className="text-5xl font-bold leading-tight font-playfair">
                {t('auth:hero.title')}
              </h1>
              <p className="mt-3 text-lg leading-relaxed text-white/90">
                {t('auth:hero.subtitle')}
              </p>
            </div>
          </div>

          <div className="relative flex-1 flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 sm:p-8">
            <div className="absolute -right-16 -top-16 hidden h-32 w-32 rounded-full bg-emerald-200/40 blur-2xl animate-pulse-slow lg:block" />

            <div
              className="mx-auto w-full max-w-sm"
            >
              {/* Error Message Container with Fixed Height */}
              <div className="h-12 mb-3" style={{ marginTop: "-12px" }}>
                {error && (
                  <div className={`rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700 text-center ${isExiting ? 'animate-slideUpOut' : 'animate-slideDown'}`}>
                    {error}
                  </div>
                )}
              </div>

              {/* Logo */}
              <div className="mb-3 flex justify-center">
                <div className="h-20 w-20 overflow-hidden rounded-full bg-white shadow-lg ring-2 ring-green-500/20">
                  <img
                    src="/RopWala.png"
                    alt={t('common:logo_alt')}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <h2 className="mb-2 text-center text-3xl font-bold text-slate-800 font-playfair">
                {t('auth:welcome')}
              </h2>
              <p className="mb-7 text-center text-base text-green-700">
                {t('auth:sign_in_desc')}
              </p>

              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {t('auth:email')}
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
                      style={{
                        paddingLeft: "2.5rem",
                        fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
                        fontWeight: "600",
                      }}
                      className={`h-12 w-full rounded-lg border pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 ${showErrorBorder
                        ? "border-red-500 animate-blinkBorder"
                        : "border-slate-300 bg-white"
                        }`}
                      placeholder={t('auth:email_placeholder')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {t('auth:password')}
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
                      style={{
                        paddingLeft: "2.5rem",
                        paddingRight: "2.5rem",
                        fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
                        fontWeight: "600",
                      }}
                      className={`h-12 w-full rounded-lg border text-sm outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 ${showErrorBorder
                        ? "border-red-500 animate-blinkBorder"
                        : "border-slate-300 bg-white"
                        }`}
                      placeholder={t('auth:password_placeholder')}
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
                  style={{ marginTop: "12px", borderRadius: "12px" }}
                  className="h-12 w-full bg-green-600 px-4 font-semibold text-base text-white shadow-md shadow-green-600/30 transition hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/40 disabled:opacity-60"
                >
                  {loading ? t('auth:logging_in') : t('auth:login')}
                </button>

                <div className="text-center mt-4">
                  <Link
                    to="/privacy-policy"
                    className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline transition"
                  >
                    Privacy Policy
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
