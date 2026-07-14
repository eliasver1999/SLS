<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInquiryRequest;
use App\Http\Resources\InquiryResource;
use App\Models\Inquiry;
use Illuminate\Support\Facades\Log;

class InquiryController extends Controller
{
    /**
     * List inquiries, newest first. (Simple admin listing — protect behind
     * auth before exposing publicly in production.)
     */
    public function index()
    {
        return InquiryResource::collection(
            Inquiry::latest()->paginate(25)
        );
    }

    /**
     * Store a booking / contact enquiry from the marketing site.
     */
    public function store(StoreInquiryRequest $request)
    {
        $inquiry = Inquiry::create($request->validated());

        // Email notification is stubbed until SMTP credentials are provided.
        // Swap this for a Mailable/Notification once mail is configured.
        Log::info('New SLS inquiry received', [
            'id' => $inquiry->id,
            'name' => $inquiry->name,
            'email' => $inquiry->email,
            'event_type' => $inquiry->event_type,
        ]);

        return (new InquiryResource($inquiry))
            ->response()
            ->setStatusCode(201);
    }
}
