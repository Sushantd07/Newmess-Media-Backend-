import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, 'User name is required'],
    trim: true,
    maxlength: [50, 'User name cannot exceed 50 characters']
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    }
  }],
  likes: {
    type: Number,
    default: 0
  },
  dislikes: {
    type: Number,
    default: 0
  },
  replies: [{
    userName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'User name cannot exceed 50 characters']
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Reply cannot exceed 500 characters']
    },
    isOfficial: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  pageId: {
    type: String,
    required: [true, 'Page ID is required'],
    index: true // For faster queries
  },
  pageType: {
    type: String,
    enum: ['company', 'category', 'subcategory'],
    required: [true, 'Page type is required']
  }
}, {
  timestamps: true
});

// Indexes for better performance
commentSchema.index({ pageId: 1, createdAt: -1 });
commentSchema.index({ createdAt: -1 });
commentSchema.index({ pageId: 1, pageType: 1 });

// Virtual for formatted date
commentSchema.virtual('formattedDate').get(function() {
  const now = new Date();
  const diffInMs = now - this.createdAt;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

// Ensure virtuals are serialized
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment; 