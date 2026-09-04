<?php

namespace App\Http\Controllers;

use App\Mail\TemplatedMail;
use App\Models\EmailTemplate;
use App\Services\TransactionalMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

/**
 * Admin CRUD for the transactional emails declared in config/emails.php.
 *
 * An event with no saved row falls back to the registry defaults, so the list
 * always reflects what customers actually receive.
 */
class EmailTemplateController extends Controller
{
    public function __construct(private TransactionalMail $mail) {}

    /**
     * Every editable event, merged with any admin overrides.
     */
    public function index()
    {
        $saved = EmailTemplate::all()->keyBy('event');

        $events = collect(config('emails.events'))->map(function (array $definition, string $event) use ($saved) {
            $row = $saved->get($event);

            return [
                'event' => $event,
                'label' => $definition['label'],
                'group' => $definition['group'],
                'description' => $definition['description'],
                'audience' => $definition['audience'],
                'placeholders' => $definition['placeholders'],
                'available_blocks' => $definition['blocks'],
                'subject' => $row?->subject ?? $definition['default_subject'],
                'body' => $row?->body ?? $definition['default_body'],
                'blocks' => $row?->blocks ?? $definition['default_blocks'],
                'enabled' => $row?->enabled ?? true,
                'customised' => $row !== null,
                'default_subject' => $definition['default_subject'],
                'default_body' => $definition['default_body'],
                'default_blocks' => $definition['default_blocks'],
            ];
        })->values();

        return response()->json([
            'data' => $events,
            'blocks' => config('emails.blocks'),
        ]);
    }

    /**
     * Save an admin's copy for one event.
     */
    public function update(Request $request, string $event)
    {
        $definition = $this->definition($event);

        $data = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:20000'],
            'blocks' => ['present', 'array'],
            'blocks.*' => ['string', Rule::in($definition['blocks'])],
            'enabled' => ['boolean'],
        ]);

        $template = EmailTemplate::updateOrCreate(
            ['event' => $event],
            [
                'subject' => $data['subject'],
                'body' => $data['body'],
                'blocks' => array_values(array_unique($data['blocks'])),
                'enabled' => $data['enabled'] ?? true,
            ],
        );

        return response()->json([
            'data' => [
                'event' => $event,
                'subject' => $template->subject,
                'body' => $template->body,
                'blocks' => $template->blocks,
                'enabled' => $template->enabled,
                'customised' => true,
                'unknown_placeholders' => $this->unknownPlaceholders($data['subject'].' '.$data['body'], $definition),
            ],
        ]);
    }

    /**
     * Drop the override so the event falls back to the shipped default copy.
     */
    public function destroy(string $event)
    {
        $definition = $this->definition($event);

        EmailTemplate::where('event', $event)->delete();

        return response()->json([
            'data' => [
                'event' => $event,
                'subject' => $definition['default_subject'],
                'body' => $definition['default_body'],
                'blocks' => $definition['default_blocks'],
                'enabled' => true,
                'customised' => false,
            ],
        ]);
    }

    /**
     * Render the email exactly as it will be sent, using sample data. Accepts
     * unsaved subject/body so the editor can preview before saving.
     */
    public function preview(Request $request, string $event)
    {
        $definition = $this->definition($event);

        $data = $request->validate([
            'subject' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string', 'max:20000'],
            'blocks' => ['nullable', 'array'],
            'blocks.*' => ['string', Rule::in($definition['blocks'])],
        ]);

        $rendered = $this->renderDraft($event, $definition, $data);

        return response()->json([
            'data' => [
                'subject' => $rendered['subject'],
                'html' => (new TemplatedMail(
                    subjectLine: $rendered['subject'],
                    body: $rendered['body'],
                    blocks: $rendered['blocks'],
                    vars: $rendered['vars'],
                    items: $this->mail->sampleItems(),
                ))->render(),
                // After interpolation only unresolvable tokens remain literal,
                // so the rendered copy is itself the list of bad placeholders.
                'unknown_placeholders' => $this->unknownPlaceholders(
                    $rendered['subject'].' '.$rendered['body'],
                    $definition,
                ),
            ],
        ]);
    }

    /**
     * Send the sample email to the signed-in admin so they can check it in a
     * real inbox before it ever reaches a customer.
     */
    public function test(Request $request, string $event)
    {
        $definition = $this->definition($event);

        $data = $request->validate([
            'subject' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string', 'max:20000'],
            'blocks' => ['nullable', 'array'],
            'blocks.*' => ['string', Rule::in($definition['blocks'])],
            'to' => ['nullable', 'email'],
        ]);

        $to = $data['to'] ?? $request->user()->email;
        $rendered = $this->renderDraft($event, $definition, $data);

        try {
            Mail::to($to)->send(new TemplatedMail(
                subjectLine: '[TEST] '.$rendered['subject'],
                body: $rendered['body'],
                blocks: $rendered['blocks'],
                vars: $rendered['vars'],
                items: $this->mail->sampleItems(),
            ));
        } catch (\Throwable $e) {
            Log::error('Email template test send failed', ['event' => $event, 'error' => $e->getMessage()]);

            return response()->json(['message' => 'Could not send the test email: '.$e->getMessage()], 502);
        }

        return response()->json(['message' => "Test email sent to {$to}."]);
    }

    /**
     * Interpolate a draft (or the saved/default copy) against sample data.
     *
     * @param  array<string, mixed>  $definition
     * @param  array<string, mixed>  $data
     * @return array{subject: string, body: string, blocks: array<int, string>, vars: array<string, mixed>}
     */
    private function renderDraft(string $event, array $definition, array $data): array
    {
        $vars = array_merge($this->mail->globals(), $this->mail->sample($event));
        $allowed = array_intersect_key($vars, array_flip($definition['placeholders']));

        $saved = EmailTemplate::where('event', $event)->first();

        $subject = $data['subject'] ?? $saved?->subject ?? $definition['default_subject'];
        $body = $data['body'] ?? $saved?->body ?? $definition['default_body'];
        $blocks = $data['blocks'] ?? $saved?->blocks ?? $definition['default_blocks'];

        return [
            'subject' => $this->mail->interpolate($subject, $allowed),
            'body' => $this->mail->interpolate($body, $allowed),
            'blocks' => array_values(array_intersect($blocks, $definition['blocks'])),
            'vars' => $vars,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function definition(string $event): array
    {
        // Event keys contain dots, so index the array rather than using
        // config() dot notation (which would read them as nesting).
        $definition = config('emails.events')[$event] ?? null;

        abort_if(! $definition, 404, 'Unknown email event.');

        return $definition;
    }

    /**
     * Placeholders the copy references but the event does not provide — shown
     * to the admin so a typo does not silently ship to customers.
     *
     * @param  array<string, mixed>  $definition
     * @return array<int, string>
     */
    private function unknownPlaceholders(string $text, array $definition): array
    {
        preg_match_all('/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/', $text, $matches);

        return array_values(array_unique(array_diff($matches[1] ?? [], $definition['placeholders'])));
    }
}
