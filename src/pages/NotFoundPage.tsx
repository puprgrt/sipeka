import { Link } from "react-router-dom";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-8 mx-auto shadow-sm">
        <FileQuestion className="w-12 h-12" />
      </div>
      
      <h1 className="text-6xl font-black text-gray-900 mb-4 tracking-tight">404</h1>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Halaman Tidak Ditemukan</h2>
      
      <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg">
        Maaf, halaman yang Anda cari tidak ada, telah dipindahkan, atau Anda tidak memiliki akses ke halaman ini.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Kembali
        </button>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Home className="w-5 h-5 mr-2" />
          Ke Beranda
        </Link>
      </div>
    </div>
  );
}
