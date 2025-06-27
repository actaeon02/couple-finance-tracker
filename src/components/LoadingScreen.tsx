import { motion } from 'framer-motion';
import { Spinner } from '@/components/ui/spinner';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex flex-col items-center justify-center text-gray-100 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center space-y-6"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          {/* You can replace this with your app's logo or a more custom icon if desired */}
          <svg
            className="w-24 h-24 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v2m6-6a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m-6 6h6m-6 0v6m0-6H6m0 0a2 2 0 100 4m0-4a2 2 0 110 4m0 4v2m0-6V4m6 6v2m6 6a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            ></path>
          </svg>
        </motion.div>

        <Spinner size="xl" color="text-cyan-400" />
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
          Couple Finance
        </h1>
        <p className="text-sm sm:text-base text-gray-400 mt-2">Loading your financial journey...</p>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;