<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Support\Facades\Log;
use Throwable;
use Inertia\Inertia;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<Throwable>>
     */
    protected $dontReport = [];

    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register()
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    public function render($request, Throwable $exception)
    {
        // ── Explicit logging so this ALWAYS shows in Render's log tab (stderr),
        // regardless of what happens below. This runs before anything else.
        report($exception);

        // ── TEMP: custom error handling disabled to expose real errors ──
        // Original custom logic commented out below. Restore once the
        // underlying /admindashboard crash is diagnosed and fixed.
        return parent::render($request, $exception);

        /*
        // Let Laravel/Inertia handle validation and auth exceptions the normal way —
        // this is what produces the 422 response your frontend's onError expects.
        if (
            $exception instanceof \Illuminate\Validation\ValidationException
            || $exception instanceof \Illuminate\Auth\AuthenticationException
        ) {
            return parent::render($request, $exception);
        }

        $status = 500;
        if ($this->isHttpException($exception)) {
            $status = $exception->getStatusCode();
        }

        $messages = [
            404 => 'Page not found.',
            403 => 'Access denied.',
            500 => 'Internal server error.',
        ];

        $message = $messages[$status] ?? 'An unexpected error occurred.';

        if (config('app.debug')) {
            $message = $exception->getMessage() ?: $message;
        }

        if ($request->wantsJson() || $request->isJson()) {
            return response()->json(['message' => $message], $status);
        }

        try {
            return Inertia::render('Error', [
                'statusCode' => $status,
                'message' => $message,
            ])->toResponse($request)->setStatusCode($status);
        } catch (\Throwable $renderException) {
            report($renderException); // guarantees this at least hits the log
            return response($message, $status);
        }
        */
    }
}
