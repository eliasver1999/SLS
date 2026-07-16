<?php

namespace App\Http\Controllers;

use App\Mail\MemberApproved;
use App\Mail\MemberRejected;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

/**
 * Admin management of member (customer) accounts. Registration is admin-gated:
 * new accounts are `pending` and unlock pricing / cart / ordering only once an
 * admin sets them to `approved`.
 */
class UserController extends Controller
{
    /**
     * List customer accounts (optionally filtered by ?status=) with counts.
     */
    public function index(Request $request)
    {
        $query = User::query()->where('role', 'customer')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $counts = User::query()
            ->where('role', 'customer')
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $paginator = $query->paginate($request->integer('per_page', 15));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (User $u) => $this->payload($u)),
            'counts' => [
                'pending' => (int) ($counts['pending'] ?? 0),
                'approved' => (int) ($counts['approved'] ?? 0),
                'rejected' => (int) ($counts['rejected'] ?? 0),
            ],
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * Approve / reject / re-pend a member account.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'approved', 'rejected'])],
        ]);

        $previousStatus = $user->status;
        $user->update($validated);

        // Notify the member the first time their status changes to a decision
        // (approved / rejected), not on re-saves of the same status.
        if ($validated['status'] !== $previousStatus && $user->email) {
            $mailable = match ($validated['status']) {
                'approved' => new MemberApproved($user),
                'rejected' => new MemberRejected($user),
                default => null,
            };
            if ($mailable) {
                try {
                    Mail::to($user->email)->send($mailable);
                } catch (\Throwable $e) {
                    Log::error('Member status email failed', ['user_id' => $user->id, 'status' => $validated['status'], 'error' => $e->getMessage()]);
                }
            }
        }

        return response()->json(['data' => $this->payload($user)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'company' => $user->company,
            'status' => $user->status,
            'created_at' => $user->created_at,
        ];
    }
}
