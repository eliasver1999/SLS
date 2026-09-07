<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Order paperwork is commercial: a Scope of Work, a quote, an invoice. It
 * must not be reachable by anyone but the customer it belongs to and the
 * team, and it must not be servable straight off the filesystem.
 */
class OrderDocumentTest extends TestCase
{
    use RefreshDatabase;

    private function order(?User $owner = null): Order
    {
        $owner ??= User::factory()->create(['status' => 'approved']);

        return Order::create([
            'user_id' => $owner->id,
            'reference' => 'SLS-O-1000',
            'type' => 'order',
            'status' => 'confirmed',
            'contact_name' => $owner->name,
            'contact_email' => $owner->email,
            'company' => 'Nova Events',
            'items' => [],
            'status_history' => [],
        ]);
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    public function test_an_admin_can_attach_a_scope_of_work(): void
    {
        Storage::fake('local');
        $order = $this->order();
        Sanctum::actingAs($this->admin());

        $this->postJson("/api/orders/{$order->id}/documents", [
            'file' => UploadedFile::fake()->create('SOW signed.pdf', 120, 'application/pdf'),
            'kind' => 'sow',
        ])->assertCreated()
            ->assertJsonPath('data.kind', 'sow')
            ->assertJsonPath('data.name', 'SOW signed.pdf');

        $document = OrderDocument::firstOrFail();

        // Stored under a generated name on the private disk, with the
        // customer-facing name kept only as metadata.
        Storage::disk('local')->assertExists($document->path);
        $this->assertStringStartsWith("order-documents/{$order->id}/", $document->path);
        $this->assertStringNotContainsString('SOW signed', $document->path);
    }

    public function test_the_response_never_exposes_the_storage_path(): void
    {
        Storage::fake('local');
        $order = $this->order();
        Sanctum::actingAs($this->admin());

        $response = $this->postJson("/api/orders/{$order->id}/documents", [
            'file' => UploadedFile::fake()->create('quote.pdf', 10, 'application/pdf'),
        ])->assertCreated();

        $this->assertArrayNotHasKey('path', $response->json('data'));
    }

    public function test_a_customer_cannot_attach_anything_to_their_own_order(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create(['status' => 'approved']);
        $order = $this->order($owner);
        Sanctum::actingAs($owner);

        // Paperwork is the team's to issue, not the customer's to upload.
        $this->postJson("/api/orders/{$order->id}/documents", [
            'file' => UploadedFile::fake()->create('mine.pdf', 10, 'application/pdf'),
        ])->assertForbidden();

        $this->assertDatabaseCount('order_documents', 0);
    }

    public function test_the_customer_can_download_their_own_document(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create(['status' => 'approved']);
        $order = $this->order($owner);

        Sanctum::actingAs($this->admin());
        $this->postJson("/api/orders/{$order->id}/documents", [
            'file' => UploadedFile::fake()->create('invoice.pdf', 10, 'application/pdf'),
        ])->assertCreated();

        $document = OrderDocument::firstOrFail();

        Sanctum::actingAs($owner);
        $this->get("/api/orders/{$order->id}/documents/{$document->id}")
            ->assertOk()
            ->assertDownload('invoice.pdf');
    }

    public function test_another_customer_cannot_download_it(): void
    {
        Storage::fake('local');
        $order = $this->order();

        Sanctum::actingAs($this->admin());
        $this->postJson("/api/orders/{$order->id}/documents", [
            'file' => UploadedFile::fake()->create('invoice.pdf', 10, 'application/pdf'),
        ])->assertCreated();

        $document = OrderDocument::firstOrFail();

        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));
        $this->get("/api/orders/{$order->id}/documents/{$document->id}")->assertForbidden();
    }

    public function test_a_document_cannot_be_fetched_through_another_order(): void
    {
        Storage::fake('local');
        $theirs = $this->order();
        $mineOwner = User::factory()->create(['status' => 'approved']);
        $mine = Order::create([
            'user_id' => $mineOwner->id,
            'reference' => 'SLS-O-2000',
            'type' => 'order',
            'status' => 'pending',
            'items' => [],
            'status_history' => [],
        ]);

        Sanctum::actingAs($this->admin());
        $this->postJson("/api/orders/{$theirs->id}/documents", [
            'file' => UploadedFile::fake()->create('secret.pdf', 10, 'application/pdf'),
        ])->assertCreated();

        $document = OrderDocument::firstOrFail();

        // Their document id, addressed through an order I do own.
        Sanctum::actingAs($mineOwner);
        $this->get("/api/orders/{$mine->id}/documents/{$document->id}")->assertNotFound();
    }

    public function test_a_guest_cannot_download_anything(): void
    {
        Storage::fake('local');
        $order = $this->order();

        Sanctum::actingAs($this->admin());
        $this->postJson("/api/orders/{$order->id}/documents", [
            'file' => UploadedFile::fake()->create('invoice.pdf', 10, 'application/pdf'),
        ])->assertCreated();

        $document = OrderDocument::firstOrFail();

        $this->app['auth']->forgetGuards();
        $this->getJson("/api/orders/{$order->id}/documents/{$document->id}")->assertUnauthorized();
    }

    public function test_an_unauthenticated_request_gets_a_401_not_a_500(): void
    {
        // Without an Accept header the framework took an API call for a browser
        // navigation and tried to redirect to a named "login" route that does
        // not exist here, producing "Route [login] not defined" — a 500 with a
        // stack trace. Every getJson() test missed it by sending the header.
        $order = $this->order();

        $response = $this->get("/api/orders/{$order->id}/documents/1", ['Accept' => '*/*']);

        $response->assertUnauthorized();
        $this->assertSame('Unauthenticated.', $response->json('message'));
    }

    public function test_it_refuses_a_disallowed_file_type(): void
    {
        Storage::fake('local');
        $order = $this->order();
        Sanctum::actingAs($this->admin());

        $this->postJson("/api/orders/{$order->id}/documents", [
            'file' => UploadedFile::fake()->create('payload.php', 4, 'application/x-php'),
        ])->assertStatus(422)->assertJsonValidationErrors(['file']);

        $this->assertDatabaseCount('order_documents', 0);
    }

    public function test_it_refuses_a_file_over_the_size_cap(): void
    {
        Storage::fake('local');
        $order = $this->order();
        Sanctum::actingAs($this->admin());

        $this->postJson("/api/orders/{$order->id}/documents", [
            'file' => UploadedFile::fake()->create('huge.pdf', 20480, 'application/pdf'),
        ])->assertStatus(422)->assertJsonValidationErrors(['file']);
    }

    public function test_deleting_a_document_removes_the_file_too(): void
    {
        Storage::fake('local');
        $order = $this->order();
        Sanctum::actingAs($this->admin());

        $this->postJson("/api/orders/{$order->id}/documents", [
            'file' => UploadedFile::fake()->create('draft.pdf', 10, 'application/pdf'),
        ])->assertCreated();

        $document = OrderDocument::firstOrFail();
        $path = $document->path;

        $this->deleteJson("/api/orders/{$order->id}/documents/{$document->id}")->assertNoContent();

        Storage::disk('local')->assertMissing($path);
        $this->assertDatabaseCount('order_documents', 0);
    }
}
