<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Paperwork attached to an order — the Scope of Work, quote and invoice the
 * order emails promise.
 *
 * These are commercial documents, so they are written to the private disk
 * (storage/app/private) rather than anywhere the web server will hand out,
 * and every download goes through the ownership check below. The client never
 * sees a storage path: it asks for a document by id and either has the right
 * to it or does not.
 */
class OrderDocumentController extends Controller
{
    private const MAX_KILOBYTES = 10240; // 10 MB

    /**
     * Attach a document. Admin only: this is the team's paperwork, not
     * something a customer uploads to their own order.
     */
    public function store(Request $request, Order $order)
    {
        $data = $request->validate([
            'file' => [
                'required',
                'file',
                'max:'.self::MAX_KILOBYTES,
                // An allowlist, and mimes: checks the actual contents rather
                // than trusting the extension or the client's content type.
                'mimes:pdf,jpg,jpeg,png,webp,doc,docx,xls,xlsx,csv',
            ],
            'kind' => ['nullable', Rule::in(['sow', 'quote', 'invoice', 'other'])],
        ]);

        $file = $data['file'];

        // Generated name: the original is metadata only, so a crafted
        // filename cannot escape the directory or overwrite anything.
        $stored = $file->storeAs(
            "order-documents/{$order->id}",
            Str::uuid().'.'.strtolower($file->getClientOriginalExtension() ?: 'bin'),
            'local',
        );

        $document = $order->documents()->create([
            'uploaded_by' => $request->user()->id,
            'kind' => $data['kind'] ?? 'other',
            'original_name' => $file->getClientOriginalName(),
            'path' => $stored,
            'mime' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);

        return response()->json(['data' => $this->payload($document)], 201);
    }

    /**
     * Stream a document to the customer it belongs to, or to an admin.
     */
    public function show(Request $request, Order $order, OrderDocument $document): StreamedResponse
    {
        $this->authorizeRead($request, $order, $document);

        abort_unless(Storage::disk('local')->exists($document->path), 404, 'That file is no longer stored.');

        return Storage::disk('local')->download($document->path, $document->original_name);
    }

    public function destroy(Order $order, OrderDocument $document)
    {
        abort_if($document->order_id !== $order->id, 404);

        Storage::disk('local')->delete($document->path);
        $document->delete();

        return response()->noContent();
    }

    /**
     * A document is readable by an admin or by the customer whose order it is.
     */
    private function authorizeRead(Request $request, Order $order, OrderDocument $document): void
    {
        // Guard against a document id from one order being requested through
        // another order's URL.
        abort_if($document->order_id !== $order->id, 404);

        $user = $request->user();

        abort_if(! $user->isAdmin() && $order->user_id !== $user->id, 403, 'This document is not yours.');
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(OrderDocument $document): array
    {
        return [
            'id' => $document->id,
            'kind' => $document->kind,
            // Deliberately no path: the client addresses documents by id.
            'name' => $document->original_name,
            'mime' => $document->mime,
            'size' => $document->size,
            'created_at' => $document->created_at?->toIso8601String(),
        ];
    }
}
