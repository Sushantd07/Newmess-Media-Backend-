// middleware/subcategoryMiddleware.js
import Category from '../models/Category.js';

export const incrementCategoryCount = async (subcategory) => {
  if (subcategory.parentCategory) {
    await Category.findByIdAndUpdate(subcategory.parentCategory, {
      $inc: { subcategoryCount: 1 },
    });
  }
};

export const decrementCategoryCount = async (subcategory) => {
  if (subcategory.parentCategory) {
    await Category.findByIdAndUpdate(subcategory.parentCategory, {
      $inc: { subcategoryCount: -1 },
    });
  }
};
