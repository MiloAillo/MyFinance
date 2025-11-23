<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceJsonResponse
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Force the request to accept JSON responses
        $request->headers->set('Accept', 'application/json');

        $response = $next($request);

        // Ensure the response is in JSON format
        if (!$response->headers->get('Content-Type')) {
            $response->header('Content-Type', 'application/json');
        }
        
        return $response;
    }
}
