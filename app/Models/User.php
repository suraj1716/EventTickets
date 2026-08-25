<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use SimonHamp\LaravelStripeConnect\Traits\Payable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles, Payable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'google_id',
        'avatar',
        'given_name',
        'family_name',
        'locale',
        'google_access_token',
        'google_refresh_token',
        'token_expires_at',
'email_verified_at',

'stripe_account_active'
    ];



    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'token_expires_at' => 'datetime',
    ];
    }

    // public function vendor():HasOne
    // {
    //     return $this->hasOne(Vendor::class,'user_id');
    // }

    public function vendor(): HasOne
    {
        return $this->hasOne(Vendor::class, 'user_id', 'id');
    }

    public function shippingAddresses()
    {
        return $this->hasMany(ShippingAddress::class);
    }
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}
