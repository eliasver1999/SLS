<?php

namespace App\Http\Controllers;

use App\Support\SystemChecks;

/**
 * Surfaces deployment problems to the admin who can act on them.
 *
 * Admin only — the details name configuration, which is nobody else's
 * business, and there is nothing here a customer could do about it.
 */
class SystemCheckController extends Controller
{
    public function index(SystemChecks $checks)
    {
        return response()->json([
            'data' => $checks->all(),
            'problems' => $checks->problems(),
            'passing' => $checks->passing(),
        ]);
    }
}
