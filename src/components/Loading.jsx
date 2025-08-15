import React from 'react';
import { motion } from 'framer-motion';

const Loading = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black flex items-center justify-center z-50"
    >
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
        <div className="absolute mt-20 text-white text-sm">Loading...</div>
    </motion.div>
);

export default Loading;