export function buildProductQuery(params) {
  const { q, category, minPrice, maxPrice } = params;

  const query = { isPublished: true };
  const projection = {};
  const sort = {};

  // Search filter
  if (q) {
    query.$text = { $search: q };
    projection.score = { $meta: "textScore" };
    sort.score = { $meta: "textScore" };
  } else {
    sort.createdAt = -1;
  }

  // Category filter
  if (category) {
    query.category = category;
  }

  // Price range
  if (minPrice || maxPrice) {
    query.price = query.price || {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  return { query, projection, sort };
}
