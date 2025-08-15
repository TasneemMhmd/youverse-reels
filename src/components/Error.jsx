import React from 'react';
import { motion } from 'framer-motion';

const Error = ({ message, onRetry }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4"
  >
    <div className="text-center text-white">
      <h2 className="text-xl font-bold mb-4">Oops! Something went wrong</h2>
      <p className="text-gray-300 mb-6">{message}</p>
      <button 
        onClick={onRetry}
        className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-full transition-colors"
      >
        Try Again
      </button>
    </div>
  </motion.div>
);

export default Error;