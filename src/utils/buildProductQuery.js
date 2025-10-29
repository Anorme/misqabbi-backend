export function buildProductQuery(params) {
  const {
    q,
    category,
    minPrice,
    maxPrice,
    sort: sortParam,
    includeUnpublished,
    isPublished,
  } = params;

  const query = {};
  const projection = {};
  const sort = {};

  // Handle published filter
  // Public endpoints default to published only. Admin endpoints can pass
  // includeUnpublished=true and an optional boolean isPublished filter.
  if (!includeUnpublished) {
    query.isPublished = true;
  } else if (isPublished === true) {
    query.isPublished = true;
  } else if (isPublished === false) {
    query.isPublished = false;
  }

  // Handle sorting
  if (sortParam) {
    const sortMapping = {
      latest: { createdAt: -1 },
      "price-low-high": { price: 1 },
      "price-high-low": { price: -1 },
      "name-a-z": { name: 1 },
      "name-z-a": { name: -1 },
    };

    if (sortMapping[sortParam]) {
      Object.assign(sort, sortMapping[sortParam]);
    } else {
      // Invalid sort parameter, fall back to default
      sort.createdAt = -1;
    }
  } else {
    // Default sorting behavior
    if (q) {
      // For search queries, prioritize relevance
      query.$text = { $search: q };
      projection.score = { $meta: "textScore" };
      sort.score = { $meta: "textScore" };
    } else {
      // For non-search queries, sort by latest
      sort.createdAt = -1;
    }
  }

  // If we have a search query but custom sort is specified,
  // we need to handle both search and custom sorting
  if (q && sortParam && sortParam !== "latest") {
    query.$text = { $search: q };
    projection.score = { $meta: "textScore" };
    // Keep the custom sort but add search score as secondary sort
    sort.score = { $meta: "textScore" };
  } else if (q && !sortParam) {
    // Only add search when no custom sort is specified
    query.$text = { $search: q };
    projection.score = { $meta: "textScore" };
    sort.score = { $meta: "textScore" };
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
