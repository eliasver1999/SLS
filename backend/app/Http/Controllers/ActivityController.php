<?php

namespace App\Http\Controllers;

use App\Services\ActivityFeed;
use Illuminate\Http\Request;

/**
 * The admin activity feed and its unread count.
 *
 * Admin only: this is the team's view of everything customers have done,
 * across every account.
 */
class ActivityController extends Controller
{
    public function __construct(private readonly ActivityFeed $feed) {}

    public function index(Request $request)
    {
        $seenAt = $request->user()->activity_seen_at;

        return response()->json([
            'data' => $this->feed->recent($seenAt),
            'unread_count' => $this->feed->unreadCount($seenAt),
            'seen_at' => $seenAt?->toIso8601String(),
        ]);
    }

    /**
     * Mark everything up to now as read for this admin.
     *
     * The watermark is a timestamp rather than a set of event ids, so it
     * covers events this admin has not even fetched yet. That is the correct
     * reading of "I have looked at the feed": anything that arrives after
     * this instant is genuinely new.
     */
    public function seen(Request $request)
    {
        $user = $request->user();
        $user->activity_seen_at = now();
        $user->save();

        return response()->json([
            'unread_count' => $this->feed->unreadCount($user->activity_seen_at),
            'seen_at' => $user->activity_seen_at->toIso8601String(),
        ]);
    }
}
