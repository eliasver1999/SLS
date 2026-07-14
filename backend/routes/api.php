<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PartnerApplicationController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ServiceController;
use Illuminate\Support\Facades\Route;

// ── Public ────────────────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::get('/services', [ServiceController::class, 'index']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);

Route::post('/inquiries', [InquiryController::class, 'store']);
Route::post('/partner-applications', [PartnerApplicationController::class, 'store']);

// ── Authenticated (any signed-in user) ────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Orders / quotes / rentals — customers see their own, place new requests.
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
});

// ── Admin only ────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);

    Route::get('/inquiries', [InquiryController::class, 'index']);

    Route::get('/partner-applications', [PartnerApplicationController::class, 'index']);
    Route::patch('/partner-applications/{partnerApplication}', [PartnerApplicationController::class, 'update']);

    Route::patch('/orders/{order}', [OrderController::class, 'update']);
});
