<?php

namespace App\Services;

use App\Mail\TemplatedMail;
use App\Models\EmailTemplate;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

/**
 * Renders and sends the admin-editable transactional emails declared in
 * config/emails.php.
 *
 * Admin copy is data, never code: placeholders are substituted from an
 * allowlist derived from the event definition, so an admin cannot reach
 * anything the event does not expose, and the copy is never evaluated as
 * Blade or PHP. Structural markup (tables, panels, buttons) stays in
 * resources/views/mail/templated.blade.php and is only switched on or off.
 */
class TransactionalMail
{
    /**
     * Resolve an event's subject, body and blocks with placeholders filled in.
     * Returns null when the event is unknown or an admin disabled the email.
     *
     * @param  array<string, mixed>  $vars
     * @return array{subject: string, body: string, blocks: array<int, string>}|null
     */
    public function render(string $event, array $vars): ?array
    {
        // Event keys contain dots, so index the array rather than using
        // config() dot notation (which would read them as nesting).
        $definition = config('emails.events')[$event] ?? null;

        if (! $definition) {
            return null;
        }

        $template = EmailTemplate::where('event', $event)->first();

        if ($template && ! $template->enabled) {
            return null;
        }

        $values = array_intersect_key(
            array_merge($this->globals(), $vars),
            array_flip($definition['placeholders']),
        );

        return [
            'subject' => $this->interpolate($template?->subject ?? $definition['default_subject'], $values),
            'body' => $this->interpolate($template?->body ?? $definition['default_body'], $values),
            'blocks' => array_values(array_intersect(
                $template?->blocks ?? $definition['default_blocks'],
                $definition['blocks'],
            )),
        ];
    }

    /**
     * Render and send an event. Returns false when nothing was sent because an
     * admin switched the email off.
     *
     * @param  array<string, mixed>  $vars
     * @param  array<int, array<string, mixed>>  $items
     */
    public function send(string $event, string $to, array $vars, array $items = []): bool
    {
        $rendered = $this->render($event, $vars);

        if (! $rendered) {
            return false;
        }

        Mail::to($to)->send(new TemplatedMail(
            subjectLine: $rendered['subject'],
            body: $rendered['body'],
            blocks: $rendered['blocks'],
            vars: array_merge($this->globals(), $vars),
            items: $items,
        ));

        return true;
    }

    /**
     * Business values every event may reference.
     *
     * @return array<string, mixed>
     */
    public function globals(): array
    {
        $deposit = (int) config('sls.deposit_percent');

        return [
            'sales_email' => config('sls.sales_email'),
            'iban' => config('sls.iban'),
            'bank_name' => config('sls.bank_name'),
            'account_name' => config('sls.account_name'),
            'deposit_percent' => $deposit,
            'balance_percent' => 100 - $deposit,
            'vat_percent' => (int) config('sls.vat_percent'),
            'app_url' => config('app.url'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function varsForOrder(Order $order, array $extra = []): array
    {
        return array_merge([
            'reference' => $order->reference,
            'type' => $order->type,
            'contact_name' => $order->contact_name,
            'company' => $order->company,
            'contact_email' => $order->contact_email,
            'total' => $order->total,
            'notes' => $order->notes,
            'status' => $order->status,
            'status_label' => static::statusLabel($order->status),
        ], $extra);
    }

    /**
     * @return array<string, mixed>
     */
    public static function varsForUser(User $user): array
    {
        return [
            'name' => $user->name,
            'company' => $user->company,
            'email' => $user->email,
        ];
    }

    public static function statusLabel(?string $status): string
    {
        return ucwords(str_replace('_', ' ', (string) $status));
    }

    /**
     * Placeholder values for the admin preview / test send, so an admin sees a
     * realistic email without touching real customer data.
     *
     * @return array<string, mixed>
     */
    public function sample(string $event): array
    {
        $isQuote = str_contains($event, 'quote');
        $status = str_starts_with($event, 'order.status.')
            ? substr($event, strlen('order.status.'))
            : 'pending';

        return [
            'name' => 'Maria Papadopoulou',
            'email' => 'maria@novaevents.gr',
            'reference' => $isQuote ? 'SLS-Q-2001' : 'SLS-O-2001',
            'type' => $isQuote ? 'quote' : 'order',
            'contact_name' => 'Maria Papadopoulou',
            'contact_email' => 'maria@novaevents.gr',
            'company' => 'Nova Events',
            'total' => '12,400.00 €',
            'notes' => 'Delivery to the venue loading bay before 08:00.',
            'status' => $status,
            'status_label' => static::statusLabel($status),
            'previous_status' => 'pending',
            'note' => 'Crew booked for the load-in on Friday.',
        ];
    }

    /**
     * Sample order items for the preview's items table.
     *
     * @return array<int, array<string, mixed>>
     */
    public function sampleItems(): array
    {
        return [
            ['name' => 'Aurora P2.6', 'qty' => 24, 'price' => '8,900.00 €'],
            ['name' => 'Halo Wash 300', 'qty' => 6, 'price' => '3,500.00 €'],
        ];
    }

    /**
     * Replace {{ placeholder }} tokens from the allowlist. Unknown tokens are
     * left as-is so a typo is visible in the admin preview instead of silently
     * vanishing from a customer's email.
     *
     * @param  array<string, mixed>  $values
     */
    public function interpolate(string $text, array $values): string
    {
        return preg_replace_callback(
            '/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/',
            fn (array $m) => array_key_exists($m[1], $values) ? (string) $values[$m[1]] : $m[0],
            $text,
        );
    }
}
