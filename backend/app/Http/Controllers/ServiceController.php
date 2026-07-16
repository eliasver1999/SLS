<?php

namespace App\Http\Controllers;

class ServiceController extends Controller
{
    /**
     * The three SLS capabilities. Served from config so the frontend and
     * backend share one source of truth; move to a DB table if these ever
     * need to be edited without a deploy.
     */
    public function index()
    {
        return response()->json([
            'data' => [
                [
                    'slug' => 'sound',
                    'name' => 'Sound',
                    'description' => 'Professional audio systems and set-up for live events and venues.',
                ],
                [
                    'slug' => 'lights',
                    'name' => 'Lights',
                    'description' => 'Stage, architectural and event lighting that sets the mood.',
                ],
                [
                    'slug' => 'screens',
                    'name' => 'Screens',
                    'description' => 'LED screens and video walls — indoor and outdoor.',
                ],
            ],
        ]);
    }
}
