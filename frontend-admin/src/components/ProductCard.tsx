import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

type Product = {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  category:
    | string
    | {
        _id: string;
        name: string;
      };
  images?: {
    url: string;
    publicId?: string;
  }[];
};

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  const autoRating = (4 + (product.name.length % 11) / 10).toFixed(1);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group bg-white rounded-lg sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-lg border border-zinc-100"
    >
      {/* Image */}
      <Link
        to={`/product/${product._id}`}
        className="block relative aspect-square overflow-hidden bg-zinc-50"
      >
        <img
          src={product.images?.[0]?.url || "/placeholder.jpg"}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Discount Badge */}
        {discount > 0 && (
          <span className="absolute top-1 right-1 sm:top-3 sm:right-3 bg-rose-600 text-white text-[6px] sm:text-xs px-1 py-0.5 rounded-full font-medium">
            -{discount}%
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-1.5 sm:p-5">
        {/* Category */}
        <div className="text-[7px] sm:text-xs uppercase tracking-wide text-zinc-500 line-clamp-1">
          {typeof product.category === "string"
            ? product.category
            : product.category?.name || "Uncategorized"}
        </div>

        {/* Product Name */}
        <Link
          to={`/product/${product._id}`}
          className="block mt-0.5"
        >
          <h3 className="font-medium text-[9px] sm:text-base leading-tight line-clamp-1 text-zinc-900 group-hover:text-rose-700">
            {product.name}
          </h3>
        </Link>

        {/* Rating + Price */}
        <div className="flex items-center justify-between mt-1 gap-1">
          {/* Rating */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Star
              size={8}
              className="text-amber-500 fill-current sm:w-3.5 sm:h-3.5"
            />
            <span className="text-[8px] sm:text-sm text-zinc-600">
              {product.rating || autoRating}
            </span>
          </div>

          {/* Price */}
          <div className="flex flex-col items-end leading-none">
            <span className="text-[10px] sm:text-2xl font-semibold text-zinc-900">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </span>

            {product.originalPrice && (
              <span className="text-[7px] sm:text-sm line-through text-zinc-400">
                ₹{Number(product.originalPrice).toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => {
            add(product);
            toast.success(`${product.name} added to cart`);
          }}
          className="mt-1.5 sm:mt-5 w-full bg-rose-600 hover:bg-rose-700 text-white text-[8px] sm:text-sm font-medium py-1 sm:py-3 rounded-md sm:rounded-2xl flex items-center justify-center gap-1"
        >
          <ShoppingCart size={8} className="sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Add to Cart</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>
    </motion.div>
  );
}