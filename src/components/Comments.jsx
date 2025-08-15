import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Send } from 'lucide-react';

const CommentsModal = ({ isOpen, onClose, videoTitle, comments, onAddComment }) => {
    const [newComment, setNewComment] = useState('');

    const handleSubmit = (e) => {
        e?.preventDefault?.();
        if (newComment.trim()) {
            onAddComment(newComment.trim());
            setNewComment('');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-end justify-center z-50"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 500 }}
                        className="bg-white rounded-t-3xl w-full max-w-lg h-2/3 flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 pb-0">
                            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
                            <h3 className="text-lg font-semibold mb-4">{videoTitle}</h3>
                        </div>

                        <div className="flex-1 px-6 overflow-y-auto">
                            <div className="space-y-4 pb-4">
                                {comments.map((comment, i) => (
                                    <div key={i} className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">
                                                {comment.author.split(' ').map(n => n[0]).join('')}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{comment.author}</div>
                                            <div className="text-gray-600 text-sm mt-1">{comment.text}</div>
                                            <div className="text-gray-400 text-xs mt-1">{comment.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 pt-2 border-t bg-white">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                                    <User size={16} className="text-white" />
                                </div>
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSubmit(e);
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleSubmit}
                                    disabled={!newComment.trim()}
                                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 rounded-full p-2 transition-colors"
                                >
                                    <Send size={16} className="text-white" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CommentsModal;