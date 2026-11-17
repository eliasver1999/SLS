<?php

namespace Tests\Feature;

use App\Models\PartnerApplication;
use App\Models\User;
use App\Services\TransactionalMail;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * What approving a partner application actually does.
 *
 * It used to change a status column and nothing else. The applicant was
 * never told, and had no account to sign in to — they had to work out on
 * their own that registering was a separate step. The form is the front
 * door of a trade supplier, so that was the one user journey in the app
 * that simply did not finish.
 */
class PartnerOnboardingTest extends TestCase
{
    use RefreshDatabase;

    private function application(array $attributes = []): PartnerApplication
    {
        return PartnerApplication::create([
            'reference' => 'SLS-P-'.fake()->unique()->numberBetween(1000, 9999),
            'company' => 'Aegean AV',
            'vat' => 'EL999888777',
            'contact_name' => 'Kostas Dimou',
            'email' => 'kostas@aegean-av.gr',
            'phone' => '+30 210 000 0000',
            'buys' => ['screens'],
            ...$attributes,
        ]);
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function approve(PartnerApplication $application, string $status = 'approved'): void
    {
        Sanctum::actingAs($this->admin());
        $this->patchJson("/api/partner-applications/{$application->id}", ['status' => $status])->assertOk();
    }

    public function test_approving_creates_an_account_the_applicant_can_use(): void
    {
        $application = $this->application();

        $this->approve($application);

        $user = User::where('email', 'kostas@aegean-av.gr')->first();
        $this->assertNotNull($user, 'Approval left the applicant with no account.');
        $this->assertSame('Kostas Dimou', $user->name);
        $this->assertSame('Aegean AV', $user->company);
        $this->assertSame('EL999888777', $user->vat_number);
        // Approved means approved: they see trade pricing on first sign-in.
        $this->assertTrue($user->isApproved());
        $this->assertSame('customer', $user->role);
    }

    public function test_the_new_account_has_no_usable_password(): void
    {
        // It is approved for trade pricing from the moment it exists, so it
        // must not be reachable with a known or guessable password.
        $this->approve($this->application());

        $user = User::where('email', 'kostas@aegean-av.gr')->sole();

        foreach (['', 'password', 'Aegean AV', 'kostas@aegean-av.gr'] as $guess) {
            $this->assertFalse(Hash::check($guess, $user->password));
        }

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])
            ->assertStatus(422);
    }

    /**
     * Approve, and return the set-password link from the email that went
     * out — the real one, not a token minted by the test.
     *
     * @return array<string, string>
     */
    private function approveAndCatchLink(): array
    {
        $vars = null;
        $this->mock(TransactionalMail::class, function ($mock) use (&$vars) {
            $mock->shouldReceive('send')->andReturnUsing(function ($event, $to, $v) use (&$vars) {
                if ($event === 'application.approved') {
                    $vars = $v;
                }

                return true;
            });
        });

        $this->approve($this->application());

        $this->assertNotNull($vars, 'No approval email was sent.');
        parse_str((string) parse_url($vars['set_password_url'], PHP_URL_QUERY), $query);

        return $query;
    }

    private function setPassword(array $link, string $password = 'a-brand-new-password')
    {
        return $this->postJson('/api/reset-password', [
            ...$link,
            'password' => $password,
            'password_confirmation' => $password,
        ]);
    }

    public function test_the_applicant_is_emailed_a_working_set_password_link(): void
    {
        $link = $this->approveAndCatchLink();

        $this->setPassword($link)->assertOk();

        $this->postJson('/api/login', [
            'email' => 'kostas@aegean-av.gr',
            'password' => 'a-brand-new-password',
        ])->assertOk()->assertJsonPath('user.approved', true);
    }

    public function test_the_set_password_link_still_works_the_next_day(): void
    {
        // It used the forgotten-password broker and died after an hour; an
        // approval email is often opened the next morning.
        $link = $this->approveAndCatchLink();

        $this->travel(30)->hours();

        $this->setPassword($link)->assertOk();
    }

    public function test_the_set_password_link_expires_after_a_week(): void
    {
        $link = $this->approveAndCatchLink();

        $this->travel(8)->days();

        $this->setPassword($link)->assertStatus(422);
    }

    public function test_a_forgotten_password_link_still_lasts_an_hour(): void
    {
        $user = User::factory()->create(['email' => 'nikos@stagepro.gr']);
        $token = Password::createToken($user);

        $this->travel(2)->hours();

        $this->setPassword(['token' => $token, 'email' => $user->email])->assertStatus(422);
    }

    public function test_a_reset_token_cannot_be_passed_off_as_an_invite(): void
    {
        // The two kinds of token are kept in separate tables, so flagging a
        // reset link as an invite cannot stretch it to a week.
        $user = User::factory()->create(['email' => 'nikos@stagepro.gr']);
        $token = Password::createToken($user);

        $this->travel(2)->hours();

        $this->setPassword(['token' => $token, 'email' => $user->email, 'invite' => '1'])
            ->assertStatus(422);
    }

    public function test_an_invite_token_only_works_as_an_invite(): void
    {
        $link = $this->approveAndCatchLink();
        unset($link['invite']);

        $this->setPassword($link)->assertStatus(422);
    }

    public function test_an_applicant_who_already_has_an_account_is_approved_not_duplicated(): void
    {
        // People apply with an address they registered with earlier. Two
        // rows for one person is worse than either outcome.
        $existing = User::factory()->create([
            'email' => 'kostas@aegean-av.gr',
            'status' => 'pending',
            'name' => 'Kostas Dimou',
        ]);

        $this->approve($this->application());

        $this->assertSame(1, User::where('email', 'kostas@aegean-av.gr')->count());
        $this->assertTrue($existing->fresh()->isApproved());
    }

    public function test_approving_twice_does_not_mint_a_second_account(): void
    {
        $application = $this->application();

        $this->approve($application);
        $this->approve($application->fresh(), 'approved');

        $this->assertSame(1, User::where('email', 'kostas@aegean-av.gr')->count());
    }

    public function test_declining_creates_no_account(): void
    {
        $this->approve($this->application(), 'rejected');

        $this->assertSame(0, User::where('email', 'kostas@aegean-av.gr')->count());
    }

    public function test_an_application_always_carries_an_email_to_reply_to(): void
    {
        // The onboarding email has to go somewhere. The schema guarantees
        // it does — the null check in the controller is belt and braces, not
        // a case this route can reach.
        $this->expectException(QueryException::class);

        $this->application(['email' => null]);
    }

    public function test_a_customer_cannot_approve_an_application(): void
    {
        $application = $this->application();
        Sanctum::actingAs(User::factory()->create(['status' => 'approved']));

        $this->patchJson("/api/partner-applications/{$application->id}", ['status' => 'approved'])
            ->assertForbidden();

        $this->assertSame(0, User::where('email', 'kostas@aegean-av.gr')->count());
    }
}
