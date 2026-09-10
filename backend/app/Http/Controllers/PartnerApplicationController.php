<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePartnerApplicationRequest;
use App\Http\Resources\PartnerApplicationResource;
use App\Models\PartnerApplication;
use App\Models\User;
use App\Services\TransactionalMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
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
     * Admin — approve or decline an application.
     *
     * Approving used to change a status column and nothing else. The
     * applicant was never told, and had no account to sign in to: they had
     * to work out on their own that registering was a separate step. So
     * approval now creates the account and emails a link to set a password,
     * and declining says so rather than leaving someone waiting.
     */
    public function update(Request $request, PartnerApplication $partnerApplication)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected', 'pending'])],
        ]);

        $previous = $partnerApplication->status;
        $partnerApplication->update($validated);

        // Only on the transition, so re-saving an already-approved
        // application cannot mint a second invitation.
        if ($validated['status'] !== $previous) {
            match ($validated['status']) {
                'approved' => $this->onboard($partnerApplication),
                'rejected' => $this->decline($partnerApplication),
                default => null,
            };
        }

        return new PartnerApplicationResource($partnerApplication);
    }

    /**
     * Give an approved applicant an account they can actually use.
     *
     * Someone who already has an account is approved in place rather than
     * duplicated — people apply with an address they registered with
     * earlier, and two rows for one person is worse than either outcome.
     */
    private function onboard(PartnerApplication $application): void
    {
        $existing = User::where('email', $application->email)->first();

        if ($existing) {
            $existing->update(['status' => 'approved']);

            $this->notify('member.approved', $existing->email, [
                'name' => $existing->name,
                'company' => $existing->company ?? $application->company,
                'email' => $existing->email,
            ]);

            return;
        }

        $user = User::create([
            'name' => $application->contact_name ?: $application->company,
            'email' => $application->email,
            'company' => $application->company,
            'vat_number' => $application->vat,
            'role' => 'customer',
            'status' => 'approved',
            // Unusable until they set one through the emailed link, and never
            // a known or guessable value: this account is approved for trade
            // pricing from the moment it exists.
            'password' => Str::random(48),
        ]);

        $this->notify('application.approved', $user->email, [
            'name' => $user->name,
            'company' => $user->company,
            'email' => $user->email,
            'set_password_url' => $this->setPasswordUrl($user),
        ]);
    }

    private function decline(PartnerApplication $application): void
    {
        $this->notify('application.rejected', $application->email, [
            'name' => $application->contact_name ?: $application->company,
            'company' => $application->company,
            'email' => $application->email,
        ]);
    }

    /**
     * The same link "forgot your password" sends, so there is one code path
     * that can set a password and one token format to keep valid.
     */
    private function setPasswordUrl(User $user): string
    {
        $token = Password::createToken($user);
        $frontend = rtrim((string) config('app.frontend_url'), '/');

        return $frontend.'/reset-password?token='.$token.'&email='.urlencode($user->email);
    }

    /**
     * @param  array<string, mixed>  $vars
     */
    private function notify(string $event, ?string $to, array $vars): void
    {
        // The column is NOT NULL, so this is belt and braces rather than a
        // case this route can reach.
        if (! $to) {
            return;
        }

        try {
            app(TransactionalMail::class)->send($event, $to, $vars);
        } catch (\Throwable $e) {
            // An approval must not fail because the mail server did.
            Log::error('Partner application email failed', [
                'event' => $event,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
