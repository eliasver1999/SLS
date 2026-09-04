<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInquiryRequest;
use App\Http\Resources\InquiryResource;
use App\Models\Inquiry;
use App\Services\TransactionalMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class InquiryController extends Controller
{
    /**
     * Admin listing, newest first, with counts per status for the tab badges.
     */
    public function index(Request $request)
    {
        $query = Inquiry::query()->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $paginator = $query->paginate(25);

        return InquiryResource::collection($paginator)->additional([
            'counts' => [
                'new' => Inquiry::where('status', 'new')->count(),
                'handled' => Inquiry::where('status', 'handled')->count(),
            ],
        ]);
    }

    /**
     * Store a booking / contact enquiry from the marketing site and tell sales.
     */
    public function store(StoreInquiryRequest $request)
    {
        $inquiry = Inquiry::create($request->validated());

        // A missed enquiry is a lost customer, so mail failures are logged but
        // never surfaced as a failed submission to the person who wrote in.
        try {
            app(TransactionalMail::class)->send(
                'inquiry.received',
                config('sls.sales_email'),
                [
                    'name' => $inquiry->name,
                    'email' => $inquiry->email,
                    'phone' => $inquiry->phone,
                    'event_type' => $inquiry->event_type,
                    'event_date' => $inquiry->event_date?->toDateString(),
                    'message' => $inquiry->message,
                ],
            );
        } catch (\Throwable $e) {
            Log::error('Inquiry email failed', ['id' => $inquiry->id, 'error' => $e->getMessage()]);
        }

        return (new InquiryResource($inquiry))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Mark an enquiry handled (or back to new) once sales has followed up.
     */
    public function update(Request $request, Inquiry $inquiry)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['new', 'handled'])],
        ]);

        $inquiry->update($data);

        return new InquiryResource($inquiry);
    }
}
