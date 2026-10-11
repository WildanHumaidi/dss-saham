<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. User default (admin & user biasa)
        User::create([
            'name' => 'Super Admin',
            'email' => env('ADMIN_INITIAL_EMAIL', 'admin@dssaham.com'),
            'password' => bcrypt(env('ADMIN_INITIAL_PASSWORD', 'password123')),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'User Biasa',
            'email' => env('USER_INITIAL_EMAIL', 'user@dssaham.com'),
            'password' => bcrypt(env('USER_INITIAL_PASSWORD', 'password123')),
            'role' => 'user',
        ]);

        // 2. FIX: KriteriaSeeder wajib dijalankan agar tabel kriteria tidak kosong.
        //    Tanpa ini hitungPeringkat() menggunakan bobot 0 → semua skor = 0.
        $this->call([
            KriteriaSeeder::class,
        ]);
    }
}
