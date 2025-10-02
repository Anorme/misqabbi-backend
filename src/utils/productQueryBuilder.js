// Utility function to build a MongoDB query object based on provided filters
// Used in product search and count functions
export function buildProductQuery(filters = {}) {
  const query = { isPublished: true };

  // Text search
  if (filters.q && typeof filters.q === "string") {
    query.$text = { $search: filters.q };
  }

  // Category filter
  if (filters.category) {
    query.category = String(filters.category).toLowerCase();
  }

  // Price range
  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice && !isNaN(Number(filters.minPrice))) {
      query.price.$gte = Number(filters.minPrice);
    }
    if (filters.maxPrice && !isNaN(Number(filters.maxPrice))) {
      query.price.$lte = Number(filters.maxPrice);
    }
  }

  return query;
}
