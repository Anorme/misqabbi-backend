import dotenvFlow from "dotenv-flow";

import path from "path";
import { fileURLToPath } from "url";

import mongoose from "mongoose";
import slugify from "slugify";

import Product from "../models/product.mongo.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenvFlow.config({
  path: path.resolve(__dirname, "../../"),
  node_env: "staging",
});

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    const products = await Product.find({ slug: { $exists: false } });

    console.log(`Found ${products.length} products missing slugs`);

    for (const product of products) {
      const generatedSlug = slugify(product.name, {
        lower: true,
        strict: true,
      });

      product.slug = generatedSlug;
      await product.save();

      console.log(`Updated product: ${product.name} → ${generatedSlug}`);
    }

    console.log("Slug update complete");
    process.exit(0);
  } catch (err) {
    console.error("Error updating slugs:", err);
    process.exit(1);
  }
};

run();
