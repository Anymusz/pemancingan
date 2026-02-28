<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Issue monthly vouchers on the 1st of each month at 00:01
Schedule::command('vouchers:issue-monthly')->monthlyOn(1, '00:01');
