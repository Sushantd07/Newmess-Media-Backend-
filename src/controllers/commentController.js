import Comment from '../models/Comment.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Create a new comment
const createComment = asyncHandler(async (req, res) => {
  const { userName, content, pageId, pageType } = req.body;
  
  if (!userName || !content || !pageId || !pageType) {
    throw new ApiError(400, "All fields are required");
  }

  // Validate pageType
  const validPageTypes = ['company', 'category', 'subcategory'];
  if (!validPageTypes.includes(pageType)) {
    throw new ApiError(400, "Invalid page type");
  }

  const images = [];
  
  // Handle image uploads if any
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      try {
        console.log('Processing file:', file.path);
        const cloudinaryResponse = await uploadOnCloudinary(file.path);
        
        if (cloudinaryResponse) {
          images.push({
            url: cloudinaryResponse.secure_url,
            publicId: cloudinaryResponse.public_id,
            filename: file.originalname
          });
          console.log('Image uploaded to Cloudinary successfully');
        } else {
          console.error('Failed to upload image to Cloudinary:', file.originalname);
        }
      } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        // Continue with other images even if one fails
      }
    }
  }

  const comment = await Comment.create({
    userName,
    content,
    images,
    pageId,
    pageType
  });

  res.status(201).json({
    success: true,
    message: "Comment created successfully",
    data: comment
  });
});

// Get comments for a specific page with pagination
const getComments = asyncHandler(async (req, res) => {
  const { pageId, pageType, page = 1, limit = 10 } = req.query;
  
  if (!pageId || !pageType) {
    throw new ApiError(400, "Page ID and page type are required");
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const comments = await Comment.find({ pageId, pageType })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const totalComments = await Comment.countDocuments({ pageId, pageType });
  const totalPages = Math.ceil(totalComments / parseInt(limit));

  res.status(200).json({
    success: true,
    data: comments,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalComments,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1
    }
  });
});

// Add a reply to a comment
const addReply = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { userName, content, isOfficial = false } = req.body;

  if (!userName || !content) {
    throw new ApiError(400, "User name and content are required");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  comment.replies.push({
    userName,
    content,
    isOfficial
  });

  await comment.save();

  res.status(200).json({
    success: true,
    message: "Reply added successfully",
    data: comment
  });
});

// Update like/dislike count
const updateReaction = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { type } = req.body; // 'like' or 'dislike'

  if (!['like', 'dislike'].includes(type)) {
    throw new ApiError(400, "Invalid reaction type");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (type === 'like') {
    comment.likes += 1;
  } else {
    comment.dislikes += 1;
  }

  await comment.save();

  res.status(200).json({
    success: true,
    message: `${type} updated successfully`,
    data: {
      likes: comment.likes,
      dislikes: comment.dislikes
    }
  });
});

// Delete a comment
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  // Delete images from Cloudinary if any
  if (comment.images && comment.images.length > 0) {
    for (const image of comment.images) {
      await deleteFromCloudinary(image.publicId);
    }
  }

  await Comment.findByIdAndDelete(commentId);

  res.status(200).json({
    success: true,
    message: "Comment deleted successfully"
  });
});

// Delete a reply from a comment
const deleteReply = asyncHandler(async (req, res) => {
  const { commentId, replyIndex } = req.params;

  if (!commentId || replyIndex === undefined) {
    throw new ApiError(400, "Comment ID and reply index are required");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const replyIndexNum = parseInt(replyIndex);
  if (replyIndexNum < 0 || replyIndexNum >= comment.replies.length) {
    throw new ApiError(400, "Invalid reply index");
  }

  // Remove the reply at the specified index
  comment.replies.splice(replyIndexNum, 1);
  await comment.save();

  res.status(200).json({
    success: true,
    message: "Reply deleted successfully",
    data: comment
  });
});

// Get comment statistics
const getCommentStats = asyncHandler(async (req, res) => {
  const { pageId, pageType } = req.query;

  if (!pageId || !pageType) {
    throw new ApiError(400, "Page ID and page type are required");
  }

  const stats = await Comment.aggregate([
    { $match: { pageId, pageType } },
    {
      $group: {
        _id: null,
        totalComments: { $sum: 1 },
        totalLikes: { $sum: "$likes" },
        totalDislikes: { $sum: "$dislikes" },
        totalReplies: { $sum: { $size: "$replies" } },
        commentsWithImages: {
          $sum: { $cond: [{ $gt: [{ $size: "$images" }, 0] }, 1, 0] }
        }
      }
    }
  ]);

  const result = stats[0] || {
    totalComments: 0,
    totalLikes: 0,
    totalDislikes: 0,
    totalReplies: 0,
    commentsWithImages: 0
  };

  res.status(200).json({
    success: true,
    data: result
  });
});

// Search comments
const searchComments = asyncHandler(async (req, res) => {
  const { pageId, pageType, query, page = 1, limit = 10 } = req.query;

  if (!pageId || !pageType || !query) {
    throw new ApiError(400, "Page ID, page type, and search query are required");
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const searchRegex = new RegExp(query, 'i');

  const comments = await Comment.find({
    pageId,
    pageType,
    $or: [
      { content: searchRegex },
      { userName: searchRegex },
      { 'replies.content': searchRegex },
      { 'replies.userName': searchRegex }
    ]
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const totalComments = await Comment.countDocuments({
    pageId,
    pageType,
    $or: [
      { content: searchRegex },
      { userName: searchRegex },
      { 'replies.content': searchRegex },
      { 'replies.userName': searchRegex }
    ]
  });

  const totalPages = Math.ceil(totalComments / parseInt(limit));

  res.status(200).json({
    success: true,
    data: comments,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalComments,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1
    }
  });
});

export {
  createComment,
  getComments,
  addReply,
  updateReaction,
  deleteComment,
  deleteReply,
  getCommentStats,
  searchComments
}; 