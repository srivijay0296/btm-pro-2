import React from 'react';
import { motion } from 'framer-motion';
import './Home.css'; // Import Tailwind CSS styles

const Home = () => {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-900">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ duration: 1 }}
                className="text-center">
                <h1 className="text-5xl font-bold text-gold-gradient">Welcome to Luxury</h1>
                <p className="mt-4 text-lg text-white">Experience the elegance and comfort of luxury living.</p>
                <motion.button 
                    whileHover={{ scale: 1.1 }} 
                    whileTap={{ scale: 0.9 }} 
                    className="mt-6 px-6 py-2 bg-yellow-500 text-white rounded-full">Get Started</motion.button>
            </motion.div>
        </div>
    );
};

export default Home;