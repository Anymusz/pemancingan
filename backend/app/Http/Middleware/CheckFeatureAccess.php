<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckFeatureAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $featureSlug, string $permission = 'view'): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        if (!$user->hasFeatureAccess($featureSlug, $permission)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke fitur ini',
                'data' => [
                    'feature' => $featureSlug,
                    'permission' => $permission,
                ],
            ], 403);
        }

        return $next($request);
    }
}
