<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * List products. Optional filters: ?category=screens ?featured=1
     */
    public function index(Request $request)
    {
        $query = Product::query()->orderBy('sort');

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }
        if ($request->boolean('featured')) {
            $query->where('featured', true);
        }

        return ProductResource::collection(
            $query->paginate($request->integer('per_page', 24))
        );
    }

    public function show(string $slug)
    {
        $product = Product::where('slug', $slug)->firstOrFail();

        return new ProductResource($product);
    }

    // ── Admin (protected by auth:sanctum + admin) ──────────────────

    public function store(StoreProductRequest $request)
    {
        $product = Product::create($request->validated());

        return (new ProductResource($product))->response()->setStatusCode(201);
    }

    public function update(StoreProductRequest $request, Product $product)
    {
        $product->update($request->validated());

        return new ProductResource($product);
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json(['message' => 'Product deleted']);
    }
}
