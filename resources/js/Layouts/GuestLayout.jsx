import ApplicationLogo from "@/Components/ApplicationLogo";
import { Link } from "@inertiajs/react";

export default function GuestLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100  pt-6 sm:justify-center sm:pt-0 relative">
      <img
        id="background"
        className="absolute inset-0 opacity-50 pointer-events-none"
        src="welcome.jpg"
      />
      <div className="relative">

          <ApplicationLogo className="h-20 w-20 fill-current text-gray-500" />

      </div>

      <div className="mt-6 relative w-full overflow-hidden bg-gradient-to-br from-yellow-50/80 via-yellow-100-50/60 to-orange-50/50 p-10 shadow-md sm:max-w-md sm:rounded-lg backdrop-blur-sm border border-white/20">
        {children}
      </div>
    </div>
  );
}
