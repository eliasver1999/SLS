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
        // Indoor / outdoor only classifies screens; lighting and sound carry
        // their category here instead, so they simply do not match.
        if ($request->filled('placement')) {
            $query->where('placement_key', $request->string('placement'));
        }
        // A pitch range excludes anything with no pitch at all, which is the
        // honest answer for a lighting fixture.
        if ($request->filled('pitch_min')) {
            $query->where('pitch_mm', '>=', $request->float('pitch_min'));
        }
        if ($request->filled('pitch_max')) {
            $query->where('pitch_mm', '<=', $request->float('pitch_max'));
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
