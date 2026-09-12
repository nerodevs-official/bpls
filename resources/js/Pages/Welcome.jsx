import { Head, Link } from "@inertiajs/react";

export default function Welcome({ auth }) {
  return (
    <>
    <div className="min-h-screen w-full bg-gray-50-200 flex justify-center items-center" >
        <div className="h-full flex flex-col justify-center items-center container max-w-screen-lg">
            {auth.user ? (
              <Link
                href={route("dashboard")}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition">
                Go to Dashboard
              </Link>
            ) : (
              <div className="space-x-3">
                <img
                  src="kanatoinilogo.png"
                  alt=""
                  srcset=""
                  className="w-32 h-32 hover:scale-150 hover:mb-20 transition-all duration-200"
                />
              </div>
            )}

            <h1 className="text-3xl font-bold my-10 animate-pulse">
                Subay App
            </h1>

            </div>  
    </div>

        

    </>
  );
}
