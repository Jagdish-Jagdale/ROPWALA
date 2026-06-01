import { useNavigate } from "react-router-dom";
import { ArrowLeft, Share2 } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ROPWALA Privacy Policy",
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-emerald-700 px-4 py-3 text-white shadow-md">
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 hover:bg-emerald-800 p-2 rounded-full transition-colors"
          aria-label="Back to Login"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold tracking-wide flex-1 text-center">
          ROPWALA
        </h1>
        <button
          onClick={handleShare}
          className="hover:bg-emerald-800 p-2 rounded-full transition-colors"
          aria-label="Share Privacy Policy"
        >
          <Share2 size={20} />
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-10 border border-slate-200">
          <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 font-playfair">
                ROPWALA Privacy Policy
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Last updated: October 13, 2025
              </p>
            </div>
            <button
              onClick={handleShare}
              className="text-slate-400 hover:text-emerald-600 transition-colors p-2 rounded-lg hover:bg-slate-50 sm:flex hidden items-center gap-2 border border-slate-200"
            >
              <Share2 size={16} />
              <span className="text-xs font-semibold">Share</span>
            </button>
          </div>

          <div className="space-y-6 text-slate-600 leading-relaxed text-sm sm:text-base">
            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-800">
                Privacy Policy
              </h3>
              <p>
                This privacy policy applies to the ROPWALA app (hereby referred to as &quot;Application&quot;) for mobile and web devices that was created by ROPWALA (hereby referred to as &quot;Service Provider&quot;) as a Free service. This service is intended for use &quot;AS IS&quot;.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-800">
                Information Collection and Use
              </h3>
              <p>
                The Application collects information when you download and use it. This information may include information such as:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your device&apos;s Internet Protocol address (e.g. IP address)</li>
                <li>The pages of the Application that you visit, the time and date of your visit, the time spent on those pages</li>
                <li>The time spent on the Application</li>
                <li>The operating system you use on your mobile or web device</li>
              </ul>
              <p className="mt-2">
                The Application does not gather precise information about the location of your device.
              </p>
              <p className="mt-2">
                The Service Provider may use the information you provided to contact you from time to time to provide you with important information, required notices and marketing promotions.
              </p>
              <p className="mt-2">
                For a better experience, while using the Application, the Service Provider may require you to provide us with certain personally identifiable information, including but not limited to user credentials, email addresses, and contact details. The information that the Service Provider requests will be retained by them and used as described in this privacy policy.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-800">
                Third Party Access
              </h3>
              <p>
                Only aggregated, anonymized data is periodically transmitted to external services to aid the Service Provider in improving the Application and service quality. The Service Provider may share your information with third parties in the ways that are described in this privacy statement.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-800">
                Opt-out Rights
              </h3>
              <p>
                You can stop all collection of information by the Application easily by uninstalling or closing the Application. You may use the standard uninstall processes as may be available as part of your mobile device or via the mobile application marketplace or network.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-800">
                Data Retention Policy
              </h3>
              <p>
                The Service Provider will retain User Provided data for as long as you use the Application and for a reasonable time thereafter. If you would like them to delete User Provided Data that you have provided via the Application, please contact them and they will respond in a reasonable time.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-800">
                Security
              </h3>
              <p>
                The Service Provider is concerned about safeguarding the confidentiality of your information. The Service Provider provides physical, electronic, and procedural safeguards to protect information they process and maintain.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-800">
                Changes
              </h3>
              <p>
                This Privacy Policy may be updated from time to time for any reason. The Service Provider will notify you of any changes to the Privacy Policy by updating this page with the new Privacy Policy. You are advised to consult this Privacy Policy regularly for any changes, as continued use is deemed approval of all changes.
              </p>
            </section>

            <section className="space-y-3 border-t border-slate-100 pt-6">
              <h3 className="text-lg font-semibold text-slate-800">
                Contact Us
              </h3>
              <p>
                If you have any questions regarding privacy while using the Application, or have questions about the practices, please contact the Service Provider via email.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
