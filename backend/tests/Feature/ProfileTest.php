<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Members maintain their own company details, which is the one place a
 * customer can write to their own user record — so it is also the one place
 * a privilege escalation would hide.
 */
class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_member_can_correct_their_company_details(): void
    {
        $user = User::factory()->create([
            'status' => 'approved',
            'company' => 'Typo Evnets Ltd',
            'vat_number' => null,
        ]);
        Sanctum::actingAs($user);

        $this->patchJson('/api/me', [
            'name' => 'Maria Papadopoulou',
            'company' => 'Nova Events Ltd',
            'vat_number' => 'EL123456789',
        ])->assertOk()
            ->assertJsonPath('user.company', 'Nova Events Ltd')
            ->assertJsonPath('user.vat_number', 'EL123456789');

        $this->assertSame('Nova Events Ltd', $user->fresh()->company);
    }

    public function test_a_member_cannot_promote_themselves(): void
    {
        $user = User::factory()->create(['role' => 'customer', 'status' => 'pending']);
        Sanctum::actingAs($user);

        // The User model's fillable list includes role and status, so this is
        // only safe because the controller names the fields it accepts.
        $this->patchJson('/api/me', [
            'name' => 'Opportunist',
            'role' => 'admin',
            'status' => 'approved',
            'approved' => true,
        ])->assertOk();

        $fresh = $user->fresh();
        $this->assertSame('customer', $fresh->role);
        $this->assertSame('pending', $fresh->status);
        $this->assertFalse($fresh->isApproved());
    }

    public function test_a_member_cannot_change_their_email_or_password_here(): void
    {
        $user = User::factory()->create(['email' => 'real@example.com']);
        $original = $user->password;
        Sanctum::actingAs($user);

        $this->patchJson('/api/me', [
            'name' => 'Someone',
            'email' => 'attacker@example.com',
            'password' => 'new-password',
        ])->assertOk();

        $fresh = $user->fresh();
        $this->assertSame('real@example.com', $fresh->email);
        $this->assertSame($original, $fresh->password);
    }

    public function test_a_name_is_required(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->patchJson('/api/me', ['name' => ''])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_changing_a_password_requires_the_current_one(): void
    {
        // The caller already holds a valid token, but a leaked token must not
        // be enough to lock the real owner out of their own account.
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->patchJson('/api/me/password', [
            'current_password' => 'not-the-password',
            'password' => 'a-brand-new-password',
            'password_confirmation' => 'a-brand-new-password',
        ])->assertStatus(422)->assertJsonValidationErrors(['current_password']);

        $this->assertTrue(Hash::check('password', $user->fresh()->password));
    }

    public function test_a_password_change_revokes_other_sessions_but_not_this_one(): void
    {
        $user = User::factory()->create();
        $other = $user->createToken('another device')->accessToken;
        Sanctum::actingAs($user, ['*']);

        $this->patchJson('/api/me/password', [
            'current_password' => 'password',
            'password' => 'a-brand-new-password',
            'password_confirmation' => 'a-brand-new-password',
        ])->assertOk();

        $this->assertTrue(Hash::check('a-brand-new-password', $user->fresh()->password));

        // A session opened under the old password must not outlive it.
        $this->assertNull($other->fresh());
    }

    public function test_a_new_password_must_be_confirmed_and_different(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->patchJson('/api/me/password', [
            'current_password' => 'password',
            'password' => 'a-brand-new-password',
            'password_confirmation' => 'something-else',
        ])->assertStatus(422)->assertJsonValidationErrors(['password']);

        $this->patchJson('/api/me/password', [
            'current_password' => 'password',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertStatus(422)->assertJsonValidationErrors(['password']);
    }

    public function test_a_guest_cannot_update_a_profile(): void
    {
        $this->patchJson('/api/me', ['name' => 'Nobody'])->assertUnauthorized();
    }
}
