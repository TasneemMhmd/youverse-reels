import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Send, X } from 'lucide-react';

const Comments = ({ isOpen, onClose, videoTitle, comments, onAddComment }) => {
    const [newComment, setNewComment] = useState('');

    const handleSubmit = (e) => {
        e?.preventDefault?.();
        if (newComment.trim()) {
            onAddComment(newComment.trim());
            setNewComment('');
        }
    };

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-end justify-center"
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ 
                            type: "spring", 
                            damping: 25, 
                            stiffness: 500,
                            mass: 0.8
                        }}
                        className="bg-white rounded-t-3xl w-full max-w-lg h-2/3 flex flex-col shadow-2xl"
                        onClick={e => e.stopPropagation()}
                        style={{
                            maxHeight: '70vh',
                            minHeight: '400px'
                        }}
                    >
                        {/* Header */}
                        <div className="p-4 pb-2 border-b border-gray-100">
                            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 pr-4">
                                    {videoTitle || 'Comments'}
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                            </div>
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-4 space-y-4">
                                {comments.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="text-gray-400 text-sm">
                                            No comments yet. Be the first to comment!
                                        </div>
                                    </div>
                                ) : (
                                    comments.map((comment, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="flex items-start space-x-3"
                                        >
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-white text-xs font-bold">
                                                    {comment.author.split(' ').map(n => n[0]).join('')}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm text-gray-900">
                                                    {comment.author}
                                                </div>
                                                <div className="text-gray-700 text-sm mt-1 break-words">
                                                    {comment.text}
                                                </div>
                                                <div className="text-gray-400 text-xs mt-1">
                                                    {comment.time}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Comment Input */}
                        <div className="p-4 border-t border-gray-100 bg-white rounded-b-3xl">
                            <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User size={16} className="text-white" />
                                </div>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="w-full bg-gray-100 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                                        maxLength={500}
                                        autoComplete="off"
                                    />
                                    {newComment.length > 400 && (
                                        <div className="absolute -top-6 right-2 text-xs text-gray-400">
                                            {500 - newComment.length} remaining
                                        </div>
                                    )}
                                </div>
                                <motion.button
                                    type="submit"
                                    disabled={!newComment.trim()}
                                    whileTap={{ scale: 0.95 }}
                                    className={`rounded-full p-3 transition-all duration-200 ${
                                        newComment.trim()
                                            ? 'bg-blue-500 hover:bg-blue-600 shadow-lg'
                                            : 'bg-gray-300 cursor-not-allowed'
                                    }`}
                                >
                                    <Send 
                                        size={16} 
                                        className={newComment.trim() ? 'text-white' : 'text-gray-500'} 
                                    />
                                </motion.button>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Comments;