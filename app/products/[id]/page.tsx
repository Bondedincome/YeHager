import Image from "next/image";
import AddToCartClient from "../../components/AddToCartClient";

async function fetchProduct(id: string) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const res = await fetch(`${base}/products/${id}`);
  if (!res.ok) throw new Error("Product not found");
  return res.json();
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full lg:w-1/2 bg-zinc-100 flex items-center justify-center p-4 rounded-3xl min-h-96">
          {product.imageUrl ? (
            <Image 
              src={product.imageUrl} 
              alt={product.name || product.title || "Product"} 
              width={300} 
              height={300} 
              className="max-h-96 w-auto object-contain"
            />
          ) : (
            <div className="text-zinc-400">No image</div>
          )}
        </div>
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <h1 className="text-2xl font-semibold">{product.name || product.title}</h1>
          <p className="text-zinc-600 mt-2">{product.description}</p>
          <div className="mt-4 text-xl font-bold">${product.price.toFixed(2)}</div>
          <AddToCartClient product={product} />
        </div>
      </div>
    </div>
  );
}
