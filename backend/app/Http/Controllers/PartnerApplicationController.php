<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePartnerApplicationRequest;
use App\Http\Resources\PartnerApplicationResource;
use App\Models\PartnerApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class PartnerApplicationController extends Controller
{
    /**
     * Admin listing. Optional ?status=pending. Includes status counts for the
     * admin KPI tiles.
     */
    public function index(Request $request)
    {
        $query = PartnerApplication::query()->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return response()->json([
            'data' => PartnerApplicationResource::collection($query->get()),
            'counts' => [
                'pending' => PartnerApplication::where('status', 'pending')->count(),
                'approved' => PartnerApplication::where('status', 'approved')->count(),
                'rejected' => PartnerApplication::where('status', 'rejected')->count(),
            ],
        ]);
    }

    /**
     * Public — the "Become a Partner" application form.
     */
    public function store(StorePartnerApplicationRequest $request)
    {
        $application = PartnerApplication::create(
            $request->validated() + ['reference' => uniqid('tmp-')]
        );
        $application->update(['reference' => 'SLS-APP-'.(20000 + $application->id)]);

        Log::info('New SLS partner application', [
            'id' => $application->id,
            'reference' => $application->reference,
            'company' => $application->company,
        ]);

        return (new PartnerApplicationResource($application))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Admin — approve or reject an application.
     * (Protect behind admin auth before production.)
     */
    public function update(Request $request, PartnerApplication $partnerApplication)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected', 'pending'])],
        ]);

        $partnerApplication->update($validated);

        return new PartnerApplicationResource($partnerApplication);
    }
}
