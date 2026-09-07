<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        $token = $user->createToken('spa')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:180', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'company' => ['nullable', 'string', 'max:160'],
            // Needed on a B2B invoice, so ask while the customer is here
            // rather than chasing it later.
            'vat_number' => ['nullable', 'string', 'max:32'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'], // hashed via model cast
            'company' => $data['company'] ?? null,
            'vat_number' => $data['vat_number'] ?? null,
            'role' => 'customer',
            'status' => 'pending', // admin must approve before pricing/cart unlock
        ]);

        // Sign them in immediately, but as a pending member: the frontend keeps
        // pricing, cart and ordering locked until an admin approves the account.
        $token = $user->createToken('spa')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ], 201);
    }

    /**
     * Email a password-reset link. Always returns a generic message so the
     * endpoint can't be used to probe which emails have accounts.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);

        Password::sendResetLink($request->only('email'));

        return response()->json([
            'message' => 'If that email has an account, a reset link is on its way.',
        ]);
    }

    /**
     * Complete a password reset using the emailed token.
     */
    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $status = Password::reset($data, function (User $user, string $password) {
            // 'hashed' cast on the model hashes this on save.
            $user->forceFill(['password' => $password])->save();
            $user->tokens()->delete(); // revoke existing sessions
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => [__($status)]]);
        }

        return response()->json(['message' => 'Your password has been reset. You can now sign in.']);
    }

    public function me(Request $request)
    {
        return response()->json(['user' => $this->userPayload($request->user())]);
    }

    /**
     * A member maintains their own company details.
     *
     * Only the three fields below are read from the request. The User model's
     * fillable list includes role and status, so passing $request->all() here
     * would let any customer make themselves an approved admin — the fields
     * are named explicitly for that reason, and a test pins it.
     */
    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'company' => ['nullable', 'string', 'max:160'],
            'vat_number' => ['nullable', 'string', 'max:32'],
        ]);

        $user = $request->user();

        $user->update([
            'name' => $data['name'],
            'company' => $data['company'] ?? null,
            'vat_number' => $data['vat_number'] ?? null,
        ]);

        return response()->json(['user' => $this->userPayload($user->fresh())]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'company' => $user->company,
            'vat_number' => $user->vat_number,
            'status' => $user->status,
            'approved' => $user->isApproved(),
        ];
    }
}
