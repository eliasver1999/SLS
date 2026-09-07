<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmailTemplateController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderDocumentController;
use App\Http\Controllers\PartnerApplicationController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// ── Public ────────────────────────────────────────────────────────
// Auth + public form submissions are throttled to curb brute-force / spam.
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

Route::get('/services', [ServiceController::class, 'index']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);

Route::post('/inquiries', [InquiryController::class, 'store'])->middleware('throttle:10,1');
Route::post('/partner-applications', [PartnerApplicationController::class, 'store'])->middleware('throttle:5,1');

// ── Authenticated (any signed-in user) ────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::patch('/me', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Orders / quotes — approved customers see their own and place new requests.
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);
    // Download is for the order's owner or an admin; the controller checks.
    Route::get('/orders/{order}/documents/{document}', [OrderDocumentController::class, 'show']);
});

// ── Admin only ────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);

    Route::get('/inquiries', [InquiryController::class, 'index']);
    Route::patch('/inquiries/{inquiry}', [InquiryController::class, 'update']);

    // Member (registration) approvals.
    Route::get('/users', [UserController::class, 'index']);
    Route::patch('/users/{user}', [UserController::class, 'update']);

    Route::get('/partner-applications', [PartnerApplicationController::class, 'index']);
    Route::patch('/partner-applications/{partnerApplication}', [PartnerApplicationController::class, 'update']);

    Route::patch('/orders/{order}', [OrderController::class, 'update']);
    Route::post('/orders/{order}/documents', [OrderDocumentController::class, 'store']);
    Route::delete('/orders/{order}/documents/{document}', [OrderDocumentController::class, 'destroy']);

    // Order reporting (values are ex VAT).
    Route::get('/reports/orders', [ReportController::class, 'orders']);

    // Transactional email templates (joining, new order, order progress).
    Route::get('/email-templates', [EmailTemplateController::class, 'index']);
    Route::put('/email-templates/{event}', [EmailTemplateController::class, 'update']);
    Route::delete('/email-templates/{event}', [EmailTemplateController::class, 'destroy']);
    Route::post('/email-templates/{event}/preview', [EmailTemplateController::class, 'preview']);
    Route::post('/email-templates/{event}/test', [EmailTemplateController::class, 'test'])->middleware('throttle:10,1');
});
