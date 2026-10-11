<?php

namespace Database\Seeders;

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
        \App\Models\User::create([
            'name'     => 'Super Admin',
            'email'    => 'admin@dssaham.com',
            'password' => bcrypt('password123'),
            'role'     => 'admin',
        ]);

        \App\Models\User::create([
            'name'     => 'User Biasa',
            'email'    => 'user@dssaham.com',
            'password' => bcrypt('password123'),
            'role'     => 'user',
        ]);

        // 2. FIX: KriteriaSeeder wajib dijalankan agar tabel kriteria tidak kosong.
        //    Tanpa ini hitungPeringkat() menggunakan bobot 0 → semua skor = 0.
        $this->call([
            KriteriaSeeder::class,
        ]);
    }
}