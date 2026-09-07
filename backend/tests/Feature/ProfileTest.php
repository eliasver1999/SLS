<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

    public function test_a_guest_cannot_update_a_profile(): void
    {
        $this->patchJson('/api/me', ['name' => 'Nobody'])->assertUnauthorized();
    }
}
